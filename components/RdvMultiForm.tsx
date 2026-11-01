'use client'

import { useState, useMemo, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'

/* ────────────────────────────────────────────
   DATA
──────────────────────────────────────────── */
import { SVCS, DEGS, OPTS, FIDELE_PRIX, type Cat } from '@/lib/rdv-catalog'
import { minimumBookingDateTime } from '@/lib/booking-time'
const SLOTS = ['10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','16:00','16:30','17:00','17:30']
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const CAT_LABELS: Record<Cat, string> = { homme: 'Homme', femme: 'Femme', enfant: 'Enfant 2–16 ans' }
const LENGTHS = [
  { id: 'tres-courts', label: 'Très courts' },
  { id: 'courts', label: 'Courts' },
  { id: 'mi-longs', label: 'Mi-longs' },
  { id: 'longs', label: 'Longs' },
  { id: 'tres-longs', label: 'Très longs' },
]
const OBJECTIVES = [
  { id: 'conserver', label: 'Conserver la longueur' },
  { id: 'raccourcir', label: 'Raccourcir' },
  { id: 'pointes', label: 'Couper les pointes' },
  { id: 'restructurer', label: 'Restructurer la coupe' },
  { id: 'sur-place', label: 'À voir sur place' },
]
const NATURES = [
  { id: 'lisses', label: 'Lisses' }, { id: 'ondules', label: 'Ondulés' },
  { id: 'boucles', label: 'Bouclés' }, { id: 'frises', label: 'Frisés' },
  { id: 'crepus', label: 'Crépus' }, { id: 'tresses', label: 'Tresses' },
  { id: 'attaches', label: 'Attachés' }, { id: 'locks-courts', label: 'Locks courtes' },
  { id: 'locks-longs', label: 'Locks longues' },
]
const HAIR_STATES = [
  { id: 'demeles', label: 'Démêlés' }, { id: 'ademeler', label: 'À démêler (+5 € minimum)' },
  { id: 'pas-demelage', label: 'Pas de démêlage nécessaire' }, { id: 'secs', label: 'Secs / déshydratés' },
  { id: 'soin', label: 'Besoin d’un soin' }, { id: 'nsp', label: 'Je ne sais pas' },
]

function fmtD(m: number) {
  if (m <= 0) return ''
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60), r = m % 60
  return r > 0 ? `${h}h${r < 10 ? '0' : ''}${r}` : `${h}h`
}

function pad(n: number) { return n < 10 ? '0' + n : '' + n }

/* ────────────────────────────────────────────
   STEP INDICATOR
──────────────────────────────────────────── */
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="rdv-si">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1
        const cls = n < current ? 'done' : n === current ? 'active' : ''
        return (
          <span key={n} style={{ display: 'contents' }}>
            <span className={`rdv-sdot ${cls}`}>{n < current ? '✓' : n}</span>
            {i < total - 1 && <span className={`rdv-sline ${n < current ? 'done' : ''}`} />}
          </span>
        )
      })}
    </div>
  )
}

/* ────────────────────────────────────────────
   WHATSAPP SVG
──────────────────────────────────────────── */
function WaIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

/* ────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────── */
export default function RdvMultiForm() {
  const [cat, setCat] = useState<Cat | null>(null)
  const [svcId, setSvcId] = useState<string | null>(null)
  const [degId, setDegId] = useState<string | null>(null)
  const [opts, setOpts] = useState<string[]>([])
  const [lon, setLon] = useState('')
  const [obj, setObj] = useState('')
  const [nature, setNature] = useState('')
  const [etats, setEtats] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [calY, setCalY] = useState(() => new Date().getFullYear())
  const [calM, setCalM] = useState(() => new Date().getMonth())
  const [date, setDate] = useState<string | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [nom, setNom] = useState('')
  const [tel, setTel] = useState('')
  const [email, setEmail] = useState('')
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [step, setStep] = useState(1)
  const [bookedSlots, setBookedSlots] = useState<{ slot: string; duration: number }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const [emailError, setEmailError] = useState(false)
  const [clientKnown, setClientKnown] = useState(false)
  const [openDays, setOpenDays] = useState<number[]>([2, 3, 4, 5, 6])
  const [activeSlots, setActiveSlots] = useState<string[]>(SLOTS)
  const [closedDates, setClosedDates] = useState<string[]>([])
  const [manualBlocks, setManualBlocks] = useState<{ date: string; slot: string }[]>([])
  const [minimumBookingStart, setMinimumBookingStart] = useState<string | null>(null)
  const [minimumLeadMinutes, setMinimumLeadMinutes] = useState(60)
  const [slotAvailabilityLoaded, setSlotAvailabilityLoaded] = useState(false)
  const [bookingClock, setBookingClock] = useState(() => Date.now())

  const svc = useMemo(() => cat ? SVCS[cat].find(s => s.id === svcId) ?? null : null, [cat, svcId])

  /* steps: 1=cat 2=svc 3=deg(if needed) 4=hair 5=opts 6=recap 7=cal 8=coords 9=confirm */
  const hasDegStep = svc?.hasSub === true
  const totalDisplaySteps = hasDegStep ? 8 : 7

  function displayStep(s: number) {
    if (!hasDegStep && s >= 3) return s - 1
    return s
  }

  const basePrice = svc ? (clientKnown && FIDELE_PRIX[svc.id] !== undefined ? FIDELE_PRIX[svc.id] : svc.price) : 0
  const baseDur = svc?.dur ?? 0
  const extraPrice = opts.reduce((acc, id) => {
    const o = OPTS.find(o => o.id === id)
    return acc + (o?.price ?? 0)
  }, 0)
  const extraDur = opts.reduce((acc, id) => {
    const o = OPTS.find(o => o.id === id)
    return acc + (o?.dur ?? 0)
  }, 0)
  const detangleExtra = etats.includes('ademeler') ? 5 : 0
  const totalPrice = basePrice + extraPrice + detangleExtra
  const totalDur = baseDur + extraDur + (etats.includes('ademeler') ? 5 : 0)
  const objectiveRequired = ['mi-longs', 'longs', 'tres-longs'].includes(lon)
  const hairComplete = Boolean(lon && nature && etats.length > 0 && (!objectiveRequired || obj))

  function toggleOpt(id: string) {
    setOpts(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function toggleHairState(id: string) {
    setEtats(prev => prev.includes(id) ? prev.filter(value => value !== id) : [...prev, id])
  }

  /* ── Restore form state and identity for the current browser tab ── */
  useEffect(() => {
    let sessionRestored = false
    try {
      const saved = sessionStorage.getItem('rdv_form')
      if (saved) {
        const s = JSON.parse(saved)
        if (s.step && s.step < 9) {
          if (s.cat) setCat(s.cat)
          if (s.svcId) setSvcId(s.svcId)
          if (s.degId) setDegId(s.degId)
          if (Array.isArray(s.opts)) setOpts(s.opts)
          if (s.lon) setLon(s.lon)
          if (s.obj) setObj(s.obj)
          if (s.nature) setNature(s.nature)
          if (Array.isArray(s.etats)) setEtats(s.etats)
          if (s.message) setMessage(s.message)
          if (s.date) setDate(s.date)
          if (s.slot) setSlot(s.slot)
          if (s.nom) setNom(s.nom)
          if (s.tel) setTel(s.tel)
          if (s.email) setEmail(s.email)
          if (s.calY) setCalY(s.calY)
          if (s.calM !== undefined) setCalM(s.calM)
          setStep(s.step)
          sessionRestored = true
        }
      }
    } catch {}
    if (!sessionRestored) {
      try {
        const saved = sessionStorage.getItem('rdv_user')
        if (saved) {
          const stored = JSON.parse(saved)
          if (typeof stored.expiresAt !== 'number' || stored.expiresAt <= Date.now()) {
            sessionStorage.removeItem('rdv_user')
          } else {
            const u = stored.data ?? {}
            if (u.nom) setNom(u.nom)
            if (u.tel) setTel(u.tel)
            if (u.email) setEmail(u.email)
          }
        }
      } catch {}
    }
    // Supprime l’ancienne copie persistante utilisée par les versions précédentes.
    try { localStorage.removeItem('rdv_user') } catch {}
  }, [])

  /* ── Keep user identity only for the current tab, for at most eight hours ── */
  useEffect(() => {
    if (!nom && !tel && !email) return
    try {
      sessionStorage.setItem('rdv_user', JSON.stringify({
        expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        data: { nom, tel, email },
      }))
    } catch {}
  }, [nom, tel, email])

  /* ── Persist form state to sessionStorage ── */
  useEffect(() => {
    if (step === 9) { sessionStorage.removeItem('rdv_form'); return }
    try {
      sessionStorage.setItem('rdv_form', JSON.stringify({ step, cat, svcId, degId, opts, lon, obj, nature, etats, message, date, slot, nom, tel, email, calY, calM }))
    } catch {}
  }, [step, cat, svcId, degId, opts, lon, obj, nature, etats, message, date, slot, nom, tel, email, calY, calM])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const title = document.querySelector<HTMLElement>('.rdv-card-title')
      if (title) {
        title.tabIndex = -1
        title.focus()
      }
    })
    return () => window.cancelAnimationFrame(frame)
  }, [step])

  /* ── Fetch schedule config on mount ── */
  useEffect(() => {
    fetch('/api/schedule')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return
        setOpenDays(d.config.openDays)
        setActiveSlots(d.config.slots)
        setClosedDates(d.closures.map((c: { date: string }) => c.date))
        setManualBlocks(d.blocks.map((b: { date: string; slot: string }) => ({ date: b.date, slot: b.slot })))
      })
      .catch(() => {})
  }, [])

  /* ── Fetch booked slots when date changes ── */
  useEffect(() => {
    if (!date) {
      setBookedSlots([])
      setMinimumBookingStart(null)
      setSlotAvailabilityLoaded(false)
      return
    }
    const controller = new AbortController()
    setSlotAvailabilityLoaded(false)
    fetch(`/api/rdv/slots?date=${date}`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject(new Error('slots unavailable')))
      .then(d => {
        setBookedSlots(d.bookings ?? [])
        setMinimumBookingStart(typeof d.minimumBookingDateTime === 'string' ? d.minimumBookingDateTime : null)
        setMinimumLeadMinutes(Number.isInteger(d.minLeadMinutes) ? d.minLeadMinutes : 60)
        setSlotAvailabilityLoaded(typeof d.minimumBookingDateTime === 'string')
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setBookedSlots([])
        setMinimumBookingStart(null)
        setSlotAvailabilityLoaded(false)
      })
    return () => controller.abort()
  }, [date])

  useEffect(() => {
    if (!date) return
    setBookingClock(Date.now())
    const timer = window.setInterval(() => setBookingClock(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [date])

  /* ── Slot availability ── */
  function toMin(s: string) {
    const [h, m] = s.split(':').map(Number)
    return h * 60 + m
  }
  function isSlotBooked(s: string) {
    const sMin = toMin(s)
    const sEnd = sMin + Math.max(totalDur, 30)
    return bookedSlots.some(b => {
      const bMin = toMin(b.slot)
      const bEnd = bMin + Math.max(b.duration, 30)
      return sMin < bEnd && sEnd > bMin
    })
  }

  function isSlotTooSoon(s: string) {
    if (!date || !minimumBookingStart) return false
    const currentMinimum = minimumBookingDateTime(new Date(bookingClock), minimumLeadMinutes)
    const effectiveMinimum = currentMinimum > minimumBookingStart ? currentMinimum : minimumBookingStart
    return `${date}T${s}` < effectiveMinimum
  }

  /* ── Submit reservation ── */
  async function handleSubmit() {
    if (!cat || !svcId || !svc || !date || !slot) return
    setSubmitting(true)
    setSubmitError(false)
    const deg = degId ? DEGS.find(d => d.id === degId) : null
    const selectedOpts = opts.map(id => OPTS.find(o => o.id === id)).filter(Boolean) as typeof OPTS
    const hairNotes = [
      `Longueur : ${LENGTHS.find(item => item.id === lon)?.label ?? lon}`,
      obj ? `Objectif : ${OBJECTIVES.find(item => item.id === obj)?.label ?? obj}` : '',
      `Nature : ${NATURES.find(item => item.id === nature)?.label ?? nature}`,
      `État : ${etats.map(id => HAIR_STATES.find(item => item.id === id)?.label ?? id).join(', ')}`,
      message.trim() ? `Message : ${message.trim()}` : '',
    ].filter(Boolean).join('\n')
    const booking = {
      nom: nom.trim(),
      email: email.trim(),
      telephone: tel.trim(),
      categorie: cat,
      prestation: svcId,
      prestationLabel: svc.label,
      degrade: degId ?? undefined,
      degradeLabel: deg?.label ?? undefined,
      options: selectedOpts.map(o => o.id),
      optionsLabels: selectedOpts.map(o => o.label),
      hairStates: etats,
      totalPrice,
      totalDuration: totalDur,
      date,
      slot,
      notes: hairNotes,
      marketingConsent,
    }
    try {
      const res = await fetch('/api/rdv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      })
      if (res.status === 409) {
        setSlot(null)
        setStep(7)
        return
      }
      if (!res.ok) throw new Error()

      const json = await res.json().catch(() => ({}))
      setEmailError(json.emailSent === false)
      setStep(9)
    } catch {
      setSubmitError(true)
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Calendar ── */
  function prevM() { if (calM === 0) { setCalM(11); setCalY(y => y - 1) } else { setCalM(m => m - 1) } }
  function nextM() { if (calM === 11) { setCalM(0); setCalY(y => y + 1) } else { setCalM(m => m + 1) } }

  function buildCalDays() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const first = new Date(calY, calM, 1).getDay()
    const off = (first + 6) % 7 // Monday = 0
    const dim = new Date(calY, calM + 1, 0).getDate()
    const days = []
    for (let e = 0; e < off; e++) days.push({ n: 0, cls: 'rdv-cd off', ds: '' })
    for (let n = 1; n <= dim; n++) {
      const dt = new Date(calY, calM, n)
      const ds = `${calY}-${pad(calM + 1)}-${pad(n)}`
      const isPast = dt < today
      const dow = dt.getDay()
      const isClosed = !openDays.includes(dow) || closedDates.includes(ds)
      let cls = 'rdv-cd'
      if (isPast || isClosed) cls += ' off'
      else if (date === ds) cls += ' csel'
      else cls += ' avail'
      days.push({ n, cls, ds })
    }
    return days
  }

  /* ── Confirmation text ── */
  const dateLabel = date ? date.split('-').reverse().join('/') : '--'

  /* ── Google Calendar link ── */
  function gCalLink() {
    if (!date || !slot) return '#'
    const [hh, mm] = slot.split(':').map(Number)
    const dur = Math.max(totalDur, 30)
    const start = date.replace(/-/g, '') + 'T' + pad(hh) + pad(mm) + '00'
    const endDate = new Date(calY, calM, parseInt(date.split('-')[2]), hh, mm + dur)
    const end = `${endDate.getFullYear()}${pad(endDate.getMonth()+1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`
    const title = encodeURIComponent(`RDV PHENO&CO - ${svc?.label ?? ''}`)
    const loc = encodeURIComponent('18 Rue d\'Alger, 34000 Montpellier')
    return `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${loc}`
  }

  /* ── WhatsApp message ── */
  function waMsg() {
    const svcLabel = svc?.label ?? 'Prestation'
    const msg = `Bonjour PHENO&CO,\nJe voudrais prendre un rendez-vous pour : ${svcLabel}.\nDate souhaitée : ${dateLabel} à ${slot ?? '--'}.\nNom : ${nom}\nTél : ${tel}\nEmail : ${email}`
    return `https://wa.me/33769432605?text=${encodeURIComponent(msg)}`
  }

  /* ── Back logic ── */
  function goBack() {
    if (step === 1) return
    if (step === 3 && !hasDegStep) { setStep(2); return }
    if (step === 4 && !hasDegStep) { setStep(2); return }
    setStep(s => s - 1)
  }

  /* ────────────────────────────────────────────
     RENDER STEPS
  ──────────────────────────────────────────── */
  const filteredOpts = cat ? OPTS.filter(o => o.cats.includes(cat)) : []
  const calDays = buildCalDays()

  const progPct = step >= 9 ? 100 : Math.round((displayStep(step) / totalDisplaySteps) * 100)

  return (
    <div className="rdv-wrap">
      {/* Progress bar */}
      <div className="rdv-prog">
        <div className="rdv-prog-fill" style={{ width: `${progPct}%` }} />
      </div>

      {/* Top bar */}
      <div className="rdv-top">
        {step > 1 && step < 9 ? (
          <button className="rdv-back-btn" onClick={goBack}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
        ) : (
          <span className="rdv-top-right" />
        )}
        <Link href="/" className="rdv-top-brand">PHENO&CO</Link>
        <div className="rdv-top-right">
          {step < 9 && (
            <Link href="/" className="rdv-quit-btn">Quitter</Link>
          )}
        </div>
      </div>

      {/* Step header */}
      <div className="rdv-sh">
        <span className="rdv-sh-sub">BARBERSHOP MONTPELLIER</span>
      </div>

      {/* Step indicator (not on confirmation) */}
      {step < 9 && (
        <StepIndicator
          current={displayStep(step)}
          total={totalDisplaySteps}
        />
      )}

      {/* ── STEP 1 : CATÉGORIE ── */}
      {step === 1 && (
        <>
          <div className="rdv-main">
            <div className="rdv-card">
              <div className="rdv-card-title">Je suis…</div>
              <div className="rdv-card-sub">Votre sélection nous permet d&apos;afficher les prestations et prix adaptés.</div>
              <div className="rdv-cat-grid">
                {([
                  { id: 'homme',  label: 'Homme',  desc: 'Coupe, barbe, dégradé', img: '/rdv-homme.png'  },
                  { id: 'femme',  label: 'Femme',  desc: 'Big Chop, couleur',     img: '/rdv-femme.png'  },
                  { id: 'enfant', label: 'Enfant', desc: 'De 2 à 16 ans',         img: '/rdv-enfant.png' },
                ] as { id: Cat; label: string; desc: string; img: string }[]).map(c => (
                  <div
                    key={c.id}
                    className={`rdv-cat-card ${cat === c.id ? 'sel' : ''}`}
                    role="button"
                    tabIndex={0}
                    aria-pressed={cat === c.id}
                    onClick={() => setCat(c.id)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setCat(c.id) }
                    }}
                  >
                    <Image
                      src={c.img}
                      alt={c.label}
                      width={160}
                      height={130}
                      className="rdv-cat-img"
                    />
                    <div className="rdv-cat-div" />
                    <div className="rdv-cat-name">{c.label}</div>
                    <div className="rdv-cat-desc">{c.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="rdv-sticky">
            <div className="rdv-sticky-in">
              <div className="rdv-nav-btns">
                <button className="rdv-btn-next" disabled={!cat} onClick={() => setStep(2)}>
                  Continuer →
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 2 : PRESTATION ── */}
      {step === 2 && cat && (
        <>
          <div className="rdv-main-wide">
            <div className="rdv-card">
              <div className="rdv-card-title">Que souhaitez-vous faire ?</div>
              <div className="rdv-card-sub">Sélectionnez une prestation principale.</div>
              <div className="rdv-grid-2">
                {SVCS[cat].map(s => (
                  <button
                    key={s.id}
                    className={`rdv-cbtn-svc ${svcId === s.id ? 'sel' : ''}`}
                    onClick={() => {
                      setSvcId(s.id); setDegId(null); setOpts([])
                      setLon(''); setObj(''); setNature(''); setEtats([])
                    }}
                  >
                    <div className="rdv-svc-name">{s.label}</div>
                    <div className="rdv-svc-price">
                      {s.price > 0 ? (
                        <>{s.from && <span className="rdv-svc-from">dès </span>}{s.price} €</>
                      ) : 'Sur devis'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rdv-sticky rdv-sticky-wide">
            <div className="rdv-sticky-in">
              {svcId && svc && svc.price > 0 && (
                <div className="rdv-price-bar">
                  <div>
                    <div className="rdv-pb-lbl">Prestation</div>
                    <div className="rdv-pb-tot">{svc.from ? 'À partir de ' : ''}{svc.price} €</div>
                  </div>
                  <div className="rdv-pb-dur">{fmtD(svc.dur)}</div>
                </div>
              )}
              <div className="rdv-nav-btns">
                <button className="rdv-btn-back" onClick={goBack}>← Retour</button>
                <button
                  className="rdv-btn-next"
                  disabled={!svcId}
                  onClick={() => {
                    if (!svc) return
                    if (svc.wa && !svc.hasSub) { setStep(3); return }
                    if (svc.hasSub) { setStep(3); return }
                    setStep(4)
                  }}
                >
                  Continuer →
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 3a : DÉGRADÉ (if hasSub) ── */}
      {step === 3 && svc?.hasSub && (
        <>
          <div className="rdv-main-wide">
            <div className="rdv-card">
              <div className="rdv-card-title">Type de dégradé</div>
              <div className="rdv-card-sub">Précisez le style souhaité.</div>
              <div className="rdv-grid-2">
                {DEGS.map(d => (
                  <button
                    key={d.id}
                    className={`rdv-cbtn-deg ${degId === d.id ? 'sel' : ''}`}
                    onClick={() => setDegId(d.id)}
                  >
                    <div className="rdv-deg-name">{d.label}</div>
                    <div className="rdv-deg-desc">{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="rdv-sticky rdv-sticky-wide">
            <div className="rdv-sticky-in">
              <div className="rdv-nav-btns">
                <button className="rdv-btn-back" onClick={goBack}>← Retour</button>
                <button className="rdv-btn-next" disabled={!degId} onClick={() => setStep(4)}>
                  Continuer →
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 3b : WHATSAPP (if wa and no hasSub) ── */}
      {step === 3 && svc?.wa && !svc.hasSub && (
        <>
          <div className="rdv-main">
            <div className="rdv-card">
              <div className="rdv-card-title">Diagnostic préalable</div>
              <div className="rdv-card-sub">Cette prestation nécessite une confirmation avant réservation.</div>
              <div className="rdv-wa-block">
                <p>
                  Pour cette prestation, un diagnostic peut être nécessaire. Merci de nous envoyer un message WhatsApp
                  afin de confirmer la faisabilité, la durée et le tarif.
                </p>
                <a className="rdv-wa-btn" href="https://wa.me/33769432605" target="_blank" rel="noopener noreferrer">
                  <WaIcon /> Envoyer un message WhatsApp
                </a>
              </div>
            </div>
          </div>
          <div className="rdv-sticky">
            <div className="rdv-sticky-in">
              <div className="rdv-nav-btns">
                <button className="rdv-btn-back" onClick={goBack}>← Retour</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 4 : CHEVEUX ── */}
      {step === 4 && (
        <>
          <div className="rdv-main-wide">
            <div className="rdv-card">
              <div className="rdv-card-title">Parlons de vos cheveux</div>
              <div className="rdv-card-sub">Ces quelques précisions nous permettent de prévoir le bon temps et de vous conseiller au mieux.</div>

              <div className="rdv-hair-group">
                <div className="rdv-sec-lbl">Quelle est votre longueur actuelle ?</div>
                <div className="rdv-hair-grid rdv-hair-grid-5">
                  {LENGTHS.map(item => (
                    <button key={item.id} type="button" className={`rdv-hair-choice${lon === item.id ? ' sel' : ''}`} onClick={() => { setLon(item.id); if (!['mi-longs', 'longs', 'tres-longs'].includes(item.id)) setObj('') }}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {objectiveRequired && (
                <div className="rdv-hair-group">
                  <div className="rdv-sec-lbl">Quel est votre objectif ?</div>
                  <div className="rdv-hair-grid">
                    {OBJECTIVES.map(item => (
                      <button key={item.id} type="button" className={`rdv-hair-choice${obj === item.id ? ' sel' : ''}`} onClick={() => setObj(item.id)}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="rdv-hair-group">
                <div className="rdv-sec-lbl">Quelle est la nature de vos cheveux ?</div>
                <div className="rdv-hair-grid rdv-hair-grid-3">
                  {NATURES.map(item => (
                    <button key={item.id} type="button" className={`rdv-hair-choice${nature === item.id ? ' sel' : ''}`} onClick={() => setNature(item.id)}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rdv-hair-group">
                <div className="rdv-sec-lbl">Dans quel état sont-ils aujourd&apos;hui ?</div>
                <div className="rdv-hair-grid rdv-hair-grid-3">
                  {HAIR_STATES.map(item => (
                    <button key={item.id} type="button" className={`rdv-hair-choice rdv-hair-multi${etats.includes(item.id) ? ' sel' : ''}`} onClick={() => toggleHairState(item.id)}>
                      <span className="rdv-hair-check" aria-hidden="true">{etats.includes(item.id) ? '✓' : ''}</span>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {['ondules', 'boucles', 'frises'].includes(nature) && (
                <div className="rdv-hair-tip">
                  <strong>Conseil boucles</strong>
                  Pour un résultat optimal, le forfait Curly / Boucles permet de travailler la forme, le soin et la définition.
                </div>
              )}
            </div>
          </div>
          <div className="rdv-sticky rdv-sticky-wide">
            <div className="rdv-sticky-in">
              {etats.includes('ademeler') && (
                <div className="rdv-price-bar">
                  <div><div className="rdv-pb-lbl">Supplément démêlage</div><div className="rdv-pb-tot">+5 € minimum</div></div>
                  <div className="rdv-pb-dur">+5 min</div>
                </div>
              )}
              <div className="rdv-nav-btns">
                <button className="rdv-btn-back" onClick={goBack}>← Retour</button>
                <button className="rdv-btn-next" disabled={!hairComplete} onClick={() => setStep(5)}>Continuer →</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 5 : OPTIONS ── */}
      {step === 5 && (
        <>
          <div className="rdv-main-wide">
            <div className="rdv-card">
              <div className="rdv-card-title">Options complémentaires</div>
              <div className="rdv-card-sub">Chaque option s&apos;ajoute à la prestation et compte dans la durée.</div>
              {filteredOpts.length === 0 && (
                <p style={{ color: 'rgba(240,235,225,.4)', fontSize: '.9rem' }}>Aucune option disponible pour cette prestation.</p>
              )}
              <div className="rdv-grid-2">
                {filteredOpts.map(o => {
                  const sel = opts.includes(o.id)
                  return (
                    <div
                      key={o.id}
                      className={`rdv-opt-grid-row ${sel ? 'sel' : ''}`}
                      role="checkbox"
                      tabIndex={0}
                      aria-checked={sel}
                      onClick={() => toggleOpt(o.id)}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleOpt(o.id) }
                      }}
                    >
                      <div className="rdv-opt-grid-info">
                        <div className="rdv-opt-grid-name">{o.label}</div>
                        <div className="rdv-opt-grid-price">+{o.price} € · {fmtD(o.dur)}</div>
                      </div>
                      <div className="rdv-tog-sm" />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          <div className="rdv-sticky rdv-sticky-wide">
            <div className="rdv-sticky-in">
              <div className="rdv-price-bar">
                <div>
                  <div className="rdv-pb-lbl">Total estimé</div>
                  <div className="rdv-pb-tot">{totalPrice > 0 ? `${totalPrice} €` : 'Sur devis'}</div>
                </div>
                <div className="rdv-pb-dur">{fmtD(totalDur)}</div>
              </div>
              <div className="rdv-nav-btns">
                <button className="rdv-btn-back" onClick={goBack}>← Retour</button>
                <button className="rdv-btn-next" onClick={() => setStep(6)}>
                  Récapitulatif →
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 6 : RÉCAP ── */}
      {step === 6 && (
        <>
          <div className="rdv-main">
            <div className="rdv-card">
              <div className="rdv-card-title">Récapitulatif</div>
              <div className="rdv-card-sub">Vérifiez votre sélection avant de choisir un créneau.</div>
              <div className="rdv-rl">
                <span className="rdv-rl-k">Profil</span>
                <span className="rdv-rl-v">{cat ? CAT_LABELS[cat] : '--'}</span>
              </div>
              <div className="rdv-rl">
                <span className="rdv-rl-k">Prestation</span>
                <span className="rdv-rl-v">{svc?.label ?? '--'}</span>
              </div>
              {degId && (
                <div className="rdv-rl">
                  <span className="rdv-rl-k">Type de dégradé</span>
                  <span className="rdv-rl-v">{DEGS.find(d => d.id === degId)?.label ?? '--'}</span>
                </div>
              )}
              <div className="rdv-rl">
                <span className="rdv-rl-k">Cheveux</span>
                <span className="rdv-rl-v">
                  {LENGTHS.find(item => item.id === lon)?.label} · {NATURES.find(item => item.id === nature)?.label}
                </span>
              </div>
              {obj && (
                <div className="rdv-rl">
                  <span className="rdv-rl-k">Objectif</span>
                  <span className="rdv-rl-v">{OBJECTIVES.find(item => item.id === obj)?.label}</span>
                </div>
              )}
              <div className="rdv-rl">
                <span className="rdv-rl-k">État</span>
                <span className="rdv-rl-v">{etats.map(id => HAIR_STATES.find(item => item.id === id)?.label).filter(Boolean).join(', ')}</span>
              </div>
              {opts.length > 0 && (
                <div className="rdv-rl">
                  <span className="rdv-rl-k">Options</span>
                  <span className="rdv-rl-v">{opts.map(id => OPTS.find(o => o.id === id)?.label).filter(Boolean).join(', ')}</span>
                </div>
              )}
              <div className="rdv-rl">
                <span className="rdv-rl-k">Durée estimée</span>
                <span className="rdv-rl-v">{totalDur > 0 ? fmtD(totalDur) : '--'}</span>
              </div>
              <div className="rdv-recap-tot">
                <span className="rdv-rl-k">Total estimé</span>
                <span className="rdv-rl-v">{totalPrice > 0 ? `${totalPrice} €` : 'Sur devis'}</span>
              </div>
              <div className="rdv-recap-note">
                Tarif indicatif basé sur vos sélections. Le prix final est confirmé à votre arrivée au salon.
              </div>
            </div>
          </div>
          <div className="rdv-sticky">
            <div className="rdv-sticky-in">
              <div className="rdv-nav-btns">
                <button className="rdv-btn-back" onClick={goBack}>← Modifier</button>
                <button className="rdv-btn-next" onClick={() => setStep(7)}>
                  Choisir un créneau →
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 7 : CALENDRIER ── */}
      {step === 7 && (
        <>
          <div className="rdv-main">
            <div className="rdv-card">
              <div className="rdv-card-title">Choisissez votre créneau</div>
              <div className="rdv-card-sub">Sélectionnez une date puis l&apos;heure souhaitée.</div>

              {/* Calendar nav */}
              <div className="rdv-cal-nav">
                <button className="rdv-cal-nav-btn" onClick={prevM} aria-label="Mois précédent">‹</button>
                <div className="rdv-cal-month">{MONTHS[calM]} {calY}</div>
                <button className="rdv-cal-nav-btn" onClick={nextM} aria-label="Mois suivant">›</button>
              </div>

              {/* Day headers */}
              <div className="rdv-cal-grid">
                {['Lu','Ma','Me','Je','Ve','Sa','Di'].map(d => (
                  <div key={d} className="rdv-cdh">{d}</div>
                ))}
                {calDays.map((day, i) => (
                  <div
                    key={i}
                    className={day.cls}
                    role={day.n ? 'button' : undefined}
                    tabIndex={day.n && (day.cls.includes('avail') || day.cls.includes('csel')) ? 0 : -1}
                    aria-label={day.n ? `${day.n} ${MONTHS[calM]} ${calY}` : undefined}
                    aria-pressed={day.n ? day.ds === date : undefined}
                    aria-disabled={day.n ? !(day.cls.includes('avail') || day.cls.includes('csel')) : undefined}
                    onClick={() => {
                      if (!day.cls.includes('avail') && !day.cls.includes('csel')) return
                      setDate(day.ds)
                      setSlot(null)
                    }}
                    onKeyDown={event => {
                      if ((event.key === 'Enter' || event.key === ' ') && (day.cls.includes('avail') || day.cls.includes('csel'))) {
                        event.preventDefault()
                        setDate(day.ds)
                        setSlot(null)
                      }
                    }}
                  >
                    {day.n || ''}
                  </div>
                ))}
              </div>

              {/* Time slots */}
              {date && (
                <>
                  <div className="rdv-sec-lbl">Créneaux disponibles</div>
                  <div className="rdv-slots-grid">
                    {activeSlots.map(s => {
                      const manuallyBlocked = manualBlocks.some(b => b.date === date && b.slot === s)
                      const tooSoon = isSlotTooSoon(s)
                      const booked = !slotAvailabilityLoaded || manuallyBlocked || isSlotBooked(s) || tooSoon
                      return (
                        <button
                          key={s}
                          className={`rdv-slot ${slot === s ? 'ssel' : ''} ${booked ? 'rdv-slot-full' : ''}`}
                          disabled={booked}
                          onClick={() => !booked && setSlot(s)}
                        >
                          {booked ? <span style={{ fontSize: '.7rem', opacity: .6 }}>{!slotAvailabilityLoaded ? 'Indisponible' : tooSoon ? 'Délai dépassé' : 'Complet'}</span> : s}
                        </button>
                      )
                    })}
                  </div>
                  <div className="rdv-info-box">Pause 15h–16h non disponible.</div>
                </>
              )}
            </div>
          </div>
          <div className="rdv-sticky">
            <div className="rdv-sticky-in">
              <div className="rdv-nav-btns">
                <button className="rdv-btn-back" onClick={goBack}>← Retour</button>
                <button className="rdv-btn-next" disabled={!date || !slot} onClick={() => setStep(8)}>
                  Confirmer ce créneau →
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 8 : COORDONNÉES ── */}
      {step === 8 && (
        <>
          <div className="rdv-main">
            <div className="rdv-card">
              <div className="rdv-card-title">Vos coordonnées</div>
              <div className="rdv-card-sub">Pour recevoir votre confirmation par e-mail et SMS.</div>
              {clientKnown && (
                <div className="rdv-loyalty">
                  <strong>Bon retour chez PHENO&amp;CO !</strong>
                  Votre fiche client a été reconnue{svc && FIDELE_PRIX[svc.id] !== undefined ? ' et votre tarif fidélité est appliqué.' : '.'}
                </div>
              )}
              <div className="rdv-fg">
                <label className="rdv-flbl" htmlFor="rdv-name">Nom et prénom</label>
                <input
                  id="rdv-name"
                  className="rdv-finput"
                  type="text"
                  placeholder="Ex : Jean Dupont"
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                />
              </div>
              <div className="rdv-fg">
                <label className="rdv-flbl" htmlFor="rdv-phone">Téléphone / WhatsApp</label>
                <input
                  id="rdv-phone"
                  className="rdv-finput"
                  type="tel"
                  placeholder="06 00 00 00 00"
                  value={tel}
                  onChange={e => { setTel(e.target.value); setClientKnown(false) }}
                />
              </div>
              <div className="rdv-fg">
                <label className="rdv-flbl" htmlFor="rdv-email">Adresse e-mail</label>
                <input
                  id="rdv-email"
                  className="rdv-finput"
                  type="email"
                  placeholder="exemple@mail.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setClientKnown(false) }}
                  onBlur={async e => {
                    if (!e.target.value.includes('@') || tel.replace(/\D/g, '').length < 8) return
                    try {
                      const res = await fetch('/api/clients/lookup', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: e.target.value, telephone: tel }),
                      })
                      if (res.ok) {
                        const client = await res.json()
                        setClientKnown(client?.loyaltyEligible === true)
                      }
                    } catch {}
                  }}
                />
              </div>
              <div className="rdv-fg">
                <label className="rdv-flbl" htmlFor="rdv-message">Message (facultatif)</label>
                <textarea
                  id="rdv-message"
                  className="rdv-finput rdv-ftextarea"
                  placeholder="Une précision pour votre rendez-vous…"
                  maxLength={500}
                  rows={4}
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
                <span className="rdv-char-count">{message.length}/500</span>
              </div>
              <div className="rdv-fg">
                <label className="rdv-flbl" style={{ display: 'flex', gap: '.6rem', alignItems: 'flex-start' }}>
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={event => setMarketingConsent(event.target.checked)}
                  />
                  <span>J&apos;accepte de recevoir occasionnellement les offres PHENO&amp;CO. Facultatif, révocable à tout moment.</span>
                </label>
              </div>
            </div>
          </div>
          <div className="rdv-sticky">
            <div className="rdv-sticky-in">
              {submitError && (
                <div role="alert" style={{ color: '#f66', fontSize: '.8rem', textAlign: 'center', marginBottom: '.5rem' }}>
                  ⚠ Une erreur est survenue. Réessayez ou contactez-nous par WhatsApp.
                </div>
              )}
              <div className="rdv-nav-btns">
                <button className="rdv-btn-back" onClick={goBack} disabled={submitting}>← Retour</button>
                <button
                  className="rdv-btn-next"
                  disabled={!nom.trim() || !tel.trim() || !email.includes('@') || submitting}
                  onClick={handleSubmit}
                >
                  {submitting ? 'Envoi…' : 'Confirmer ma réservation →'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── STEP 9 : CONFIRMATION ── */}
      {step === 9 && (
        <div className="rdv-main" style={{ paddingBottom: '2rem' }}>
          <div className="rdv-card" style={{ textAlign: 'center', padding: '2rem 1.4rem' }}>
            <div className="rdv-conf-icon">✓</div>
            <div className="rdv-conf-title">Réservation confirmée !</div>
            <div className="rdv-gold-div" />
            <div className="rdv-conf-sub">
              Bonjour <strong>{nom}</strong>,<br /><br />
              Votre rendez-vous du <strong>{dateLabel} à {slot}</strong> est confirmé.<br />
              {emailError
                ? <>Un souci d&apos;envoi est survenu - contactez-nous par WhatsApp si besoin.</>
                : <>Un e-mail de confirmation a été envoyé à <strong>{email}</strong>.</>
              }
            </div>

            <div className="rdv-cal-add-btns">
              <a className="rdv-cal-add-btn" href={gCalLink()} target="_blank" rel="noopener noreferrer">
                📅 Ajouter à Google Agenda
              </a>
              <a className="rdv-cal-add-btn" href={waMsg()} target="_blank" rel="noopener noreferrer">
                <WaIcon /> Confirmer par WhatsApp
              </a>
              <button
                className="rdv-cal-add-btn"
                style={{ background: 'rgba(201,168,76,.1)', borderColor: '#C9A84C', color: '#C9A84C', fontWeight: 700 }}
                onClick={() => {
                  setCat(null); setSvcId(null); setDegId(null); setOpts([])
                  setLon(''); setObj(''); setNature(''); setEtats([]); setMessage(''); setClientKnown(false)
                  setDate(null); setSlot(null); setNom(''); setTel(''); setEmail('')
                  setStep(1)
                }}
              >
                Nouvelle réservation
              </button>
            </div>

            <div className="rdv-conf-address">
              PHENO&CO Barbershop<br />
              18 rue d&apos;Alger - Saint-Roch, Montpellier<br />
              07 69 43 26 05
            </div>

            <Link
              href="/"
              style={{
                display: 'inline-block',
                marginTop: '1.25rem',
                padding: '.5rem 1.25rem',
                border: '1.5px solid rgba(201,168,76,.5)',
                borderRadius: '8px',
                color: '#C9A84C',
                fontWeight: 600,
                fontSize: '.85rem',
                textDecoration: 'none',
                transition: 'background .15s, border-color .15s',
              }}
            >
              ← Retour à l&apos;accueil
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
