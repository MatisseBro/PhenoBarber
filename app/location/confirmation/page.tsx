'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import '../location.css'

interface ConfirmData {
  nom: string
  email: string
  telephone: string
  formuleLabel: string
  packLabel: string
  durationDetails: string
  dateDebut: string
  dateFin: string
  heureDebut: string
  heureFin: string
  totalHT: number
  tva: number
  totalTTC: number
  acompteTaux: number
  acompteTTC: number
  soldeTTC: number
  calLink: string
  emailError: boolean
}

export default function ConfirmationPage() {
  const [data, setData] = useState<ConfirmData | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('phenoConfirmation')
    if (raw) {
      setData(JSON.parse(raw))
      sessionStorage.removeItem('phenoConfirmation')
    }
  }, [])

  if (!data) {
    return (
      <div className="loc-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1.5rem' }}>
        <p style={{ color: '#aaa' }}>Aucune réservation trouvée.</p>
        <Link href="/location" className="loc-hero-btn loc-btn-yellow" style={{ textDecoration: 'none' }}>
          ← Retour au formulaire
        </Link>
      </div>
    )
  }

  const periodLabel = data.dateFin && data.dateFin !== data.dateDebut
    ? `${data.dateDebut} → ${data.dateFin}`
    : data.dateDebut

  return (
    <div className="loc-page">

      {/* Hero */}
      <section className="loc-hero-section">
        <div className="loc-hero-inner">
          <p className="loc-hero-tag">Confirmation de demande</p>
          <h1 className="loc-hero-title">
            Demande<br /><span className="loc-hero-title-yellow">envoyée</span>
          </h1>
        </div>
      </section>

      {/* Confirmation */}
      <section className="loc-main">
        <div className="loc-container" style={{ maxWidth: '700px', margin: '0 auto' }}>

          {/* Bannière succès */}
          <div style={{
            background: '#0e0e0e',
            border: '1px solid rgba(253,224,71,.25)',
            borderRadius: '14px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            marginBottom: '1.5rem',
          }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(253,224,71,.1)', border: '2px solid #FDE047', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '1.6rem', color: '#FDE047' }}>✓</div>
            <h2 style={{ fontFamily: 'var(--font-bebas, "Bebas Neue", sans-serif)', color: '#fff', fontSize: '1.8rem', letterSpacing: '.06em', margin: '0 0 .5rem', fontWeight: 400 }}>
              Demande envoyée !
            </h2>
            <p style={{ color: 'rgba(255,255,255,.45)', margin: 0, fontSize: '.9rem', lineHeight: 1.6 }}>
              Merci <strong style={{ color: '#fff' }}>{data.nom}</strong>, votre demande de location a bien été reçue.<br />
              Un email de confirmation vous a été envoyé à <strong style={{ color: '#FDE047' }}>{data.email}</strong>.
            </p>
            {data.emailError && (
              <p style={{ color: '#FDE047', marginTop: '.75rem', fontSize: '.8rem', opacity: .75 }}>
                ⚠️ L&apos;email n&apos;a pas pu être envoyé, mais votre demande a bien été enregistrée.
              </p>
            )}
          </div>

          {/* Récapitulatif */}
          <div className="loc-fcard" style={{ marginBottom: '1.5rem' }}>
            <div className="loc-fcard-header"><span>📋</span><h3>Récapitulatif de votre demande</h3></div>

            <div className="loc-summary-rows">
              <div className="loc-summary-row">
                <span className="label">Formule</span>
                <span className="value">{data.formuleLabel}</span>
              </div>
              <div className="loc-summary-row">
                <span className="label">Durée</span>
                <span className="value">{data.durationDetails}</span>
              </div>
              {data.packLabel !== 'Aucun - 0 €' && (
                <div className="loc-summary-row">
                  <span className="label">Pack</span>
                  <span className="value">{data.packLabel}</span>
                </div>
              )}
              <div className="loc-summary-row">
                <span className="label">Période</span>
                <span className="value">{periodLabel}</span>
              </div>
              <div className="loc-summary-row">
                <span className="label">Horaires</span>
                <span className="value">{data.heureDebut} – {data.heureFin}</span>
              </div>
            </div>

            <div className="loc-summary-divider" />

            <div className="loc-price-lines">
              <div className="loc-price-row">
                <span>Total HT</span><span>{Number(data.totalHT).toFixed(2)} €</span>
              </div>
              <div className="loc-price-row muted">
                <span>TVA (20%)</span><span>{Number(data.tva).toFixed(2)} €</span>
              </div>
            </div>

            <div className="loc-total-ttc">
              <span>TOTAL TTC</span>
              <span>{Number(data.totalTTC).toFixed(2)} €</span>
            </div>

            <div className="loc-acompte-block">
              <div className="loc-acompte-row">
                <span>Acompte à régler <em>({(Number(data.acompteTaux) * 100).toFixed(0)}%)</em></span>
                <span className="loc-acompte-amount">{Number(data.acompteTTC).toFixed(2)} €</span>
              </div>
              <div className="loc-solde-row">
                <span>Solde restant</span>
                <span>{Number(data.soldeTTC).toFixed(2)} €</span>
              </div>
            </div>
          </div>

          {/* Prochaines étapes */}
          <div className="loc-fcard loc-steps-card" style={{ marginBottom: '1.5rem' }}>
            <div className="loc-fcard-header"><span>🔒</span><h3>Prochaines étapes</h3></div>
            <ol className="loc-steps">
              <li className="loc-step">
                <div className="loc-step-num">1</div>
                <div className="loc-step-body">
                  <strong>Envoyez vos documents</strong>
                  <span>Pièce d&apos;identité, CAP/BP, SIREN/URSSAF et RC Pro à <a href="mailto:location.phenoandco@gmail.com">location.phenoandco@gmail.com</a></span>
                </div>
              </li>
              <li className="loc-step">
                <div className="loc-step-num">2</div>
                <div className="loc-step-body">
                  <strong>Validation par l&apos;équipe</strong>
                  <span>Nous examinons votre dossier et vous contactons sous 48h.</span>
                </div>
              </li>
              <li className="loc-step">
                <div className="loc-step-num">3</div>
                <div className="loc-step-body">
                  <strong>Réglez l&apos;acompte</strong>
                  <span>Après validation de vos docs, vous recevez un lien de paiement sécurisé.</span>
                </div>
              </li>
              <li className="loc-step">
                <div className="loc-step-num">4</div>
                <div className="loc-step-body">
                  <strong>C&apos;est confirmé !</strong>
                  <span>Votre créneau est bloqué. À bientôt chez PHENO&amp;CO 👊</span>
                </div>
              </li>
            </ol>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            <a
              href={data.calLink}
              target="_blank"
              rel="noopener noreferrer"
              className="loc-hero-btn loc-btn-yellow"
              style={{ textDecoration: 'none', textAlign: 'center' }}
            >
              📅 Ajouter à Google Agenda
            </a>
            <a
              href="mailto:location.phenoandco@gmail.com"
              className="loc-hero-btn loc-btn-dark"
              style={{ textDecoration: 'none', textAlign: 'center' }}
            >
              📧 Envoyer mes documents
            </a>
            <Link
              href="/"
              className="loc-hero-btn loc-btn-dark"
              style={{ textDecoration: 'none', textAlign: 'center' }}
            >
              ← Retour à l&apos;accueil
            </Link>
          </div>

        </div>
      </section>

      <footer className="loc-footer">
        <p>PHENO&amp;CO - Barbershop &amp; Coworking · Montpellier</p>
      </footer>

    </div>
  )
}
