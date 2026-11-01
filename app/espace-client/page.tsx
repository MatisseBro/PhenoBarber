'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import './espace-client.css'

interface Booking {
  id: string
  date: string
  slot: string
  prestation_label: string
  degrade_label?: string
  options_labels?: string[]
  total_price?: number
  total_duration?: number
  status: string
  created_at: string
  person_label?: string
  group_id?: string
}

interface AuthData {
  ok: boolean
  email: string
  upcoming: Booking[]
  past: Booking[]
}

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function fmtDur(min?: number): string {
  if (!min) return ''
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`
}

function BookingCard({ b, isUpcoming }: { b: Booking; isUpcoming: boolean }) {
  return (
    <div className={`ec-booking-card${isUpcoming ? ' upcoming' : ' past'}`}>
      <div className="ec-booking-date">{fmtDate(b.date)} à {b.slot}</div>
      <div className="ec-booking-svc">
        {b.person_label ? `${b.person_label} - ` : ''}{b.prestation_label}
      </div>
      <div className="ec-booking-details">
        {b.degrade_label && <span className="ec-booking-badge">{b.degrade_label}</span>}
        {b.options_labels?.map((o, i) => <span key={i} className="ec-booking-badge">{o}</span>)}
        {b.total_duration && <span>{fmtDur(b.total_duration)}</span>}
        {b.total_price ? <span>{b.total_price} €</span> : null}
      </div>
      {isUpcoming && (
        <Link href="/rdv" className="ec-rebook-btn">Modifier / Nouveau RDV</Link>
      )}
    </div>
  )
}

function EspaceClientInner() {
  const searchParams = useSearchParams()
  const tokenConsumedRef = useRef(false)
  const [hasTokenInUrl, setHasTokenInUrl] = useState(false)
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [sendError, setSendError] = useState('')

  const [authState, setAuthState] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [authData, setAuthData] = useState<AuthData | null>(null)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? searchParams.get('token')
    if (!token) return
    if (tokenConsumedRef.current) return
    tokenConsumedRef.current = true
    setHasTokenInUrl(true)
    setAuthState('loading')
    // Le fragment n'est pas envoyé au serveur et est retiré avant tout autre appel réseau.
    window.history.replaceState(null, '', '/espace-client')
    fetch('/api/client-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(r => r.json())
      .then((data) => {
        if (data.ok) {
          setAuthData(data)
          setAuthState('ok')
        } else {
          setAuthError(data.error ?? 'Lien invalide ou expiré.')
          setAuthState('error')
        }
      })
      .catch(() => {
        setAuthError('Erreur réseau. Réessayez.')
        setAuthState('error')
      })
  }, [searchParams])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    setSendError('')
    try {
      const r = await fetch('/api/client-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (r.status === 429) {
        const d = await r.json()
        setSendError(d.error ?? 'Trop de tentatives.')
      } else {
        setSent(true)
      }
    } catch {
      setSendError('Erreur réseau. Réessayez.')
    } finally {
      setSending(false)
    }
  }

  // Token en cours de validation
  if (hasTokenInUrl && authState === 'loading') {
    return (
      <div className="ec-loading" role="status" aria-live="polite">
        <div className="ec-spinner" />
        Connexion en cours…
      </div>
    )
  }

  // Erreur de token
  if (authState === 'error') {
    return (
      <div className="ec-token-error" role="alert">
        <div className="ec-token-error-title">Lien invalide</div>
        <div className="ec-token-error-desc">{authError}</div>
        <button className="ec-btn-retry" onClick={() => { setAuthState('idle'); setAuthError('') }}>
          Demander un nouveau lien
        </button>
      </div>
    )
  }

  // Portail authentifié
  if (authState === 'ok' && authData) {
    return (
      <div className="ec-portal">
        <div className="ec-portal-header">
          <div className="ec-portal-title">Mes réservations</div>
          <div className="ec-portal-email">{authData.email}</div>
        </div>

        {authData.upcoming.length > 0 && (
          <>
            <div className="ec-section-label">À venir</div>
            {authData.upcoming.map(b => <BookingCard key={b.id} b={b} isUpcoming />)}
          </>
        )}

        <div className="ec-section-label">Historique</div>
        {authData.past.length > 0
          ? authData.past.map(b => <BookingCard key={b.id} b={b} isUpcoming={false} />)
          : <div className="ec-empty">Aucun rendez-vous passé.</div>
        }

        {authData.upcoming.length === 0 && authData.past.length === 0 && (
          <div className="ec-empty">Aucun rendez-vous trouvé pour cet email.</div>
        )}

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <Link href="/rdv" className="ec-rebook-btn" style={{ fontSize: '.9rem', padding: '.5rem 1.4rem' }}>
            Prendre un nouveau RDV →
          </Link>
        </div>
      </div>
    )
  }

  // Formulaire de demande
  if (sent) {
    return (
      <div className="ec-sent-box" role="status" aria-live="polite">
        <div className="ec-sent-icon">📬</div>
        <div className="ec-sent-title">Lien envoyé !</div>
        <div className="ec-sent-desc">
          Si un compte est associé à <strong>{email}</strong>, vous recevrez un email avec votre lien de connexion dans quelques secondes.
          <br /><br />
          Le lien est valable <strong>30 minutes</strong>.
        </div>
      </div>
    )
  }

  return (
    <div className="ec-form-wrap">
      {sendError && <div className="ec-msg error" role="alert">{sendError}</div>}
      <form onSubmit={handleSend} noValidate>
        <div className="ec-input-row">
          <label htmlFor="client-email" className="sr-only">Adresse e-mail</label>
          <input
            id="client-email"
            className="ec-input"
            type="email"
            placeholder="votre@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            required
          />
          <button className="ec-btn-send" type="submit" disabled={sending || !email.trim()}>
            {sending ? '…' : 'Envoyer'}
          </button>
        </div>
      </form>
      <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.6 }}>
        Vous recevrez un lien de connexion par email valable 30 minutes.
      </p>
    </div>
  )
}

export default function EspaceClientPage() {
  return (
    <main className="ec-page">
      <Link href="/" className="ec-back">← Accueil</Link>
      <div className="ec-logo">PHENO&amp;CO</div>
      <h1 className="ec-heading">Espace client</h1>
      <p className="ec-sub">Accédez à vos réservations passées et à venir en toute sécurité.</p>
      <Suspense fallback={<div className="ec-loading"><div className="ec-spinner" /></div>}>
        <EspaceClientInner />
      </Suspense>
    </main>
  )
}
