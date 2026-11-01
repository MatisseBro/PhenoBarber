'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { calculateLocationPrice } from '@/lib/pricing'
import type { FormulaType, PackType } from '@/lib/types'
import './location.css'

const TIME_SLOTS: string[] = []
for (let h = 10; h <= 18; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`)
  if (h < 18) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`)
}

function getTomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

/* ── Mappings vers les types Supabase ── */
const FORMULE_MAP: Record<string, string> = {
  heure: 'horaire', demi: 'demi-journee', journee: 'journee',
  semaine: 'semaine', mensuel: 'mois',
}
const STATUT_MAP: Record<string, string> = {
  auto: 'auto-entrepreneur', societe: 'societe', creation: 'en-cours',
}
const SPECIALITE_MAP: Record<string, string> = {
  'Coiffeur mixte (H/F)': 'mixte',
  'Barbier': 'barber',
  'Spécialité afro (tresses, locks, vanilles, etc.)': 'afro',
  'Coloriste (mèches, balayage, déco)': 'coloriste',
  'Design & finitions (contours, dessins, rasage, etc.)': 'design',
}

function getCalendarLink(title: string, details: string, startDate: string, endDate: string, startTime: string, endTime: string) {
  const start = new Date(`${startDate}T${startTime}:00`)
  const end = new Date(`${endDate || startDate}T${endTime}:00`)
  const fmt = (d: Date) => d.toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z'
  const url = new URL('https://www.google.com/calendar/render')
  url.searchParams.append('action', 'TEMPLATE')
  url.searchParams.append('text', title)
  url.searchParams.append('details', details)
  url.searchParams.append('dates', `${fmt(start)}/${fmt(end)}`)
  url.searchParams.append('location', 'PHENO&CO, Montpellier')
  return url.toString()
}

export default function LocationPage() {
  const tomorrow = getTomorrow()
  const router = useRouter()

  const [duree, setDuree] = useState<'courte' | 'longue'>('courte')
  const [formuleCourte, setFormuleCourte] = useState('heure')
  const [formuleLongue, setFormuleLongue] = useState('semaine')
  const [packMateriel, setPackMateriel] = useState('aucun')
  const [dateDebut, setDateDebut] = useState(tomorrow)
  const [dateFin, setDateFin] = useState('')
  const [heureDebut, setHeureDebut] = useState('10:00')
  const [heureFin, setHeureFin] = useState('11:00')

  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [statut, setStatut] = useState('auto')
  const [experience, setExperience] = useState('0-3')
  const [specialites, setSpecialites] = useState<string[]>([])

  const [certif3ans, setCertif3ans] = useState(false)
  const [certifDiplome, setCertifDiplome] = useState(false)
  const [certifDocs, setCertifDocs] = useState(false)
  const [cgv, setCgv] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)

  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState<{ title: string; msg: string; err: boolean } | null>(null)
  const idempotencyRef = useRef<{ key: string; payload: string } | null>(null)

  /* ── Time constraints ── */
  const getConstrainedTimes = useCallback(() => {
    if (duree === 'longue') return { debutDisabled: false, finDisabled: false, debutVal: heureDebut, finVal: heureFin }
    if (formuleCourte === 'journee') return { debutDisabled: true, finDisabled: true, debutVal: '10:00', finVal: '18:00' }
    if (formuleCourte === 'demi') {
      const [h] = heureDebut.split(':').map(Number)
      const endH = Math.min(h + 4, 18)
      const finVal = `${String(endH).padStart(2, '0')}:00`
      return { debutDisabled: false, finDisabled: true, debutVal: heureDebut, finVal }
    }
    return { debutDisabled: false, finDisabled: false, debutVal: heureDebut, finVal: heureFin }
  }, [duree, formuleCourte, heureDebut, heureFin])

  useEffect(() => {
    const { debutVal, finVal } = getConstrainedTimes()
    if (debutVal !== heureDebut) setHeureDebut(debutVal)
    if (finVal !== heureFin) setHeureFin(finVal)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duree, formuleCourte])

  const { debutDisabled, finDisabled } = getConstrainedTimes()

  /* ── Price ── */
  const selectedFormula = FORMULE_MAP[duree === 'courte' ? formuleCourte : formuleLongue] as FormulaType
  const price = calculateLocationPrice({
    typeDuration: duree === 'courte' ? 'court' : 'long',
    formule: selectedFormula,
    pack: packMateriel as PackType,
    dateDebut,
    dateFin: dateFin || undefined,
    heureDebut,
    heureFin,
  })

  /* ── Date validation ── */
  function validateDate(val: string, setter: (v: string) => void) {
    if (!val) { setter(''); return }
    const day = new Date(val).getDay()
    if (day === 0 || day === 1) {
      showToast('Jour de fermeture', 'Le salon est fermé le dimanche et le lundi. Merci de choisir une autre date.', true)
      setter('')
    } else {
      setter(val)
    }
  }

  function showToast(title: string, msg: string, err = false) {
    setToast({ title, msg, err })
    setTimeout(() => setToast(null), 5000)
  }

  function toggleSpecialite(val: string) {
    setSpecialites(prev => prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val])
  }

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cgv || !certifDocs) {
      showToast('Champs requis', 'Veuillez accepter les CGV et vous engager à fournir les documents.', true)
      return
    }
    if (specialites.length === 0) {
      showToast('Champs requis', 'Veuillez sélectionner au moins une spécialité.', true)
      return
    }
    setSending(true)

    const endDate = dateFin || dateDebut
    const calLink = getCalendarLink(
      'Location Fauteuil - PHENO&CO',
      `Réservation de fauteuil.\nFormule: ${price?.formuleLabel}\nTotal TTC: ${price?.totalTTC.toFixed(2)}€`,
      dateDebut, endDate, heureDebut, heureFin
    )

    /* ── Sauvegarde Supabase ── */
    const formule = duree === 'courte' ? FORMULE_MAP[formuleCourte] : FORMULE_MAP[formuleLongue]
    const reservationPayload = {
      nom, email, telephone,
      typeDuration: duree === 'courte' ? 'court' : 'long',
      formule,
      pack: packMateriel,
      dateDebut,
      dateFin: dateFin || undefined,
      heureDebut: heureDebut || undefined,
      heureFin: heureFin || undefined,
      statutPro: STATUT_MAP[statut],
      experience,
      specialites: specialites.map(s => SPECIALITE_MAP[s]).filter(Boolean),
      totalHT: price?.totalHT ?? 0,
      tva: price?.tva ?? 0,
      totalTTC: price?.totalTTC ?? 0,
      acompte: price?.acompteTTC ?? 0,
      notes: commentaire || undefined,
      termsAccepted: cgv,
      documentsCommitment: certifDocs,
      marketingConsent,
    }
    try {
      const serializedPayload = JSON.stringify(reservationPayload)
      if (!idempotencyRef.current || idempotencyRef.current.payload !== serializedPayload) {
        idempotencyRef.current = { key: crypto.randomUUID(), payload: serializedPayload }
      }
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyRef.current.key,
        },
        body: serializedPayload,
      })
      if (!res.ok) throw new Error()
      const json = await res.json().catch(() => ({}))

      setSending(false)

      /* ── Redirection vers la page de confirmation ── */
      sessionStorage.setItem('phenoConfirmation', JSON.stringify({
        nom, email, telephone,
        formuleLabel: price?.formuleLabel,
        packLabel: price?.packLabel,
        durationDetails: price?.durationDetails,
        dateDebut, dateFin: endDate, heureDebut, heureFin,
        totalHT: price?.totalHT, tva: price?.tva, totalTTC: price?.totalTTC,
        acompteTaux: price?.acompteTaux, acompteTTC: price?.acompteTTC, soldeTTC: price?.soldeTTC,
        calLink, emailError: json.emailSent === false,
      }))
    } catch {
      setSending(false)
      showToast('Erreur', 'Impossible d\'enregistrer votre demande. Veuillez réessayer ou nous contacter par WhatsApp.', true)
      return
    }
    router.push('/location/confirmation')
  }

  return (
    <div className="loc-page">

      {/* ── HERO ── */}
      <section className="loc-hero-section">
        <div className="loc-hero-inner">
          <p className="loc-hero-tag">Barbershop Premium · Montpellier</p>
          <h1 className="loc-hero-title">
            Louer un<br /><span className="loc-hero-title-yellow">fauteuil</span>
          </h1>
          <p className="loc-hero-sub">Espace professionnel - 18 rue d&apos;Alger, Saint-Roch</p>
          <div className="loc-hero-btns">
            <button onClick={() => document.getElementById('reservation')?.scrollIntoView({ behavior: 'smooth' })} className="loc-hero-btn loc-btn-yellow">
              Réserver un fauteuil
            </button>
            <Link href="/rdv" className="loc-hero-btn loc-btn-dark">
              Prendre RDV Coiffure
            </Link>
            <a href="https://wa.me/33769432605" target="_blank" rel="noopener noreferrer" className="loc-hero-btn loc-btn-whatsapp">
              WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ── MAIN ── */}
      <section id="reservation" className="loc-main">
        <div className="loc-container">

          <header className="loc-header">
            <h2 className="loc-header-title">Réserver un <span>fauteuil</span></h2>
            <p className="loc-header-sub">
              Choisissez vos dates, votre formule et vos options.<br />
              La réservation est confirmée après paiement de l&apos;acompte.
            </p>
          </header>

          <div className="loc-layout">

            {/* ══════════════ LEFT - FORMULAIRE ══════════════ */}
            <form onSubmit={handleSubmit} className="loc-form-col" id="reservation-form">

              {/* TYPE DE LOCATION */}
              <div className="loc-fcard">
                <div className="loc-fcard-header"><span>⏱</span><h3>Type de location</h3></div>

                <div className="loc-form-group">
                  <span className="loc-form-label" id="location-duration-label">Durée de location *</span>
                  <div className="loc-radio-cards" role="radiogroup" aria-labelledby="location-duration-label">
                    {([['courte', 'Courte durée', 'Heure, journée\nAcompte 50%'], ['longue', 'Semaine & Mensuel', 'Semaine ou Mois\nAcompte 25%']] as const).map(([val, title, desc]) => (
                      <label key={val} className={`loc-radio-card${duree === val ? ' selected' : ''}`} onClick={() => setDuree(val)}>
                        <input type="radio" name="duree" value={val} checked={duree === val} onChange={() => setDuree(val)} />
                        <div>
                          <span className="loc-rc-title">{title}</span>
                          <span className="loc-rc-desc">{desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="loc-form-row">
                  <div className="loc-form-group">
                    <label className="loc-form-label" htmlFor="location-formula">{duree === 'courte' ? 'Formule courte *' : 'Formule longue *'}</label>
                    {duree === 'courte' ? (
                      <select id="location-formula" className="loc-form-select" value={formuleCourte} onChange={e => setFormuleCourte(e.target.value)}>
                        <option value="heure">À l&apos;heure - 10 € HT</option>
                        <option value="demi">Demi-journée (4h) - 35 € HT</option>
                        <option value="journee">Journée - 65 € HT</option>
                      </select>
                    ) : (
                      <select id="location-formula" className="loc-form-select" value={formuleLongue} onChange={e => setFormuleLongue(e.target.value)}>
                        <option value="semaine">Semaine - 60 € HT / jour</option>
                        <option value="mensuel">Mensuel - 55 € HT / jour</option>
                      </select>
                    )}
                  </div>
                  <div className="loc-form-group">
                    <label className="loc-form-label" htmlFor="location-pack">Pack Matériel</label>
                    <select id="location-pack" className="loc-form-select" value={packMateriel} onChange={e => setPackMateriel(e.target.value)}>
                      <option value="aucun">Aucun - 0 €</option>
                      <option value="essentiel">Pack Essentiel - 20 € HT / j</option>
                      <option value="premium">Pack Premium - 30 € HT / j</option>
                    </select>
                  </div>
                </div>

                <div className="loc-info-box">
                  <p><strong>Pack Essentiel :</strong> 20 € HT/jour (tondeuse, finition, serviettes, cape, poste équipé).</p>
                  <p><strong>Pack Premium :</strong> 30 € HT/jour (Essentiel + shaver + serviettes en plus).</p>
                </div>
                <div className="loc-warning-box">
                  <span>⚠️</span>
                  <p>Montants indicatifs. Le calcul final se fera au prorata selon la grille tarifaire.</p>
                </div>
              </div>

              {/* DATES & HORAIRES */}
              <div className="loc-fcard">
                <div className="loc-fcard-header"><span>📅</span><h3>Dates &amp; Horaires</h3></div>

                <div className="loc-form-row">
                  <div className="loc-form-group">
                    <label className="loc-form-label" htmlFor="location-start-date">Date de début *</label>
                    <input id="location-start-date" type="date" className="loc-form-input" required min={tomorrow} value={dateDebut}
                      onChange={e => validateDate(e.target.value, setDateDebut)} />
                  </div>
                  <div className="loc-form-group">
                    <label className="loc-form-label" htmlFor="location-end-date">Date de fin {duree === 'longue' ? '*' : '(optionnel)'}</label>
                    <input id="location-end-date" type="date" className="loc-form-input" required={duree === 'longue'} min={dateDebut || tomorrow} value={dateFin}
                      onChange={e => validateDate(e.target.value, setDateFin)} />
                  </div>
                </div>

                <div className="loc-form-row">
                  <div className="loc-form-group">
                    <label className="loc-form-label" htmlFor="location-start-time">Heure de début *</label>
                    <select id="location-start-time" className="loc-form-select" value={heureDebut} disabled={debutDisabled}
                      onChange={e => setHeureDebut(e.target.value)}>
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="loc-form-group">
                    <label className="loc-form-label" htmlFor="location-end-time">Heure de fin *</label>
                    <select id="location-end-time" className="loc-form-select" value={heureFin} disabled={finDisabled}
                      onChange={e => setHeureFin(e.target.value)}>
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* INFOS PERSONNELLES */}
              <div className="loc-fcard">
                <div className="loc-fcard-header"><span>👤</span><h3>Vos informations</h3></div>

                <div className="loc-form-row">
                  <div className="loc-form-group">
                    <label className="loc-form-label" htmlFor="location-name">Nom / prénom *</label>
                    <input id="location-name" type="text" className="loc-form-input" placeholder="Votre nom" required value={nom} onChange={e => setNom(e.target.value)} />
                  </div>
                  <div className="loc-form-group">
                    <label className="loc-form-label" htmlFor="location-email">Email *</label>
                    <input id="location-email" type="email" className="loc-form-input" placeholder="votre@email.com" required value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                </div>

                <div className="loc-form-group">
                  <label className="loc-form-label" htmlFor="location-phone">Téléphone / WhatsApp *</label>
                  <input id="location-phone" type="tel" className="loc-form-input" placeholder="06 00 00 00 00" required value={telephone} onChange={e => setTelephone(e.target.value)} />
                </div>
              </div>

              {/* PROFIL PRO */}
              <div className="loc-fcard">
                <div className="loc-fcard-header"><span>💼</span><h3>Profil Professionnel</h3></div>

                <div className="loc-form-group">
                  <span className="loc-form-label" id="location-status-label">Statut *</span>
                  <div className="loc-radio-group" role="radiogroup" aria-labelledby="location-status-label">
                    {[['auto', 'Auto-entrepreneur / Micro'], ['societe', 'Société'], ['creation', 'En cours de création']].map(([val, label]) => (
                      <label key={val} className="loc-radio-item">
                        <input type="radio" name="statut" value={val} checked={statut === val} onChange={() => setStatut(val)} />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="loc-form-group">
                  <label className="loc-form-label" htmlFor="location-experience">Expérience *</label>
                  <select id="location-experience" className="loc-form-select" value={experience} onChange={e => setExperience(e.target.value)}>
                    <option value="0-3">0–3 ans</option>
                    <option value="3-5">3–5 ans</option>
                    <option value="5-10">5–10 ans</option>
                    <option value="10+">10+ ans</option>
                  </select>
                </div>

                <div className="loc-form-group">
                  <div className="loc-specialites-header">
                    <span className="loc-form-label" style={{ margin: 0 }}>Compétences &amp; Spécialités</span>
                    <span className="loc-specialites-hint">(Plusieurs choix possibles)</span>
                  </div>
                  <div className="loc-checkbox-list">
                    {[
                      'Coiffeur mixte (H/F)', 'Barbier',
                      'Spécialité afro (tresses, locks, vanilles, etc.)',
                      'Coloriste (mèches, balayage, déco)',
                      'Design & finitions (contours, dessins, rasage, etc.)',
                    ].map(spec => (
                      <label key={spec} className="loc-checkbox-item">
                        <input type="checkbox" checked={specialites.includes(spec)} onChange={() => toggleSpecialite(spec)} />
                        <span>{spec}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="loc-engagement-box">
                  <h4 className="loc-engagement-title">✓ Engagement</h4>
                  <div className="loc-checkbox-list">
                    <label className="loc-checkbox-item">
                      <input type="checkbox" checked={certif3ans} onChange={e => setCertif3ans(e.target.checked)} />
                      <span>Je certifie avoir au moins 3 ans d&apos;expérience.</span>
                    </label>
                    <label className="loc-checkbox-item">
                      <input type="checkbox" checked={certifDiplome} onChange={e => setCertifDiplome(e.target.checked)} />
                      <span>Je possède un diplôme reconnu (CAP / BP ou équivalent).</span>
                    </label>
                    <label className="loc-checkbox-item">
                      <input type="checkbox" required checked={certifDocs} onChange={e => setCertifDocs(e.target.checked)} />
                      <span>Je m&apos;engage à fournir les documents justificatifs avant le début de la location.</span>
                    </label>
                    <label className="loc-checkbox-item">
                      <input type="checkbox" required checked={cgv} onChange={e => setCgv(e.target.checked)} />
                      <span>J&apos;ai lu et j&apos;accepte les <Link href="/cgv-location" target="_blank" rel="noopener noreferrer" style={{ color: '#FDE047', textDecoration: 'underline' }}>CGV &amp; Contrat de location</Link> PHENO&amp;CO.</span>
                    </label>
                    <label className="loc-checkbox-item">
                      <input type="checkbox" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)} />
                      <span>J&apos;accepte de recevoir occasionnellement les offres PHENO&amp;CO. Facultatif, révocable à tout moment.</span>
                    </label>
                  </div>
                </div>

                <div className="loc-form-group" style={{ marginTop: '1.5rem' }}>
                  <label className="loc-form-label" htmlFor="location-comment">Commentaire (optionnel)</label>
                  <textarea id="location-comment" className="loc-form-textarea" placeholder="Précisez vos jours de présence souhaités, vos besoins…" value={commentaire} onChange={e => setCommentaire(e.target.value)} />
                </div>

                <button type="submit" className="loc-submit-btn" disabled={sending}>
                  {sending ? 'Envoi en cours…' : 'Envoyer ma demande →'}
                </button>
              </div>

            </form>

            {/* ══════════════ RIGHT - PRIX + PAIEMENT ══════════════ */}
            <div className="loc-summary-col">
              <div className="loc-sticky-wrap">

                {/* Récapitulatif prix */}
                <div className="loc-fcard">
                  <div className="loc-fcard-header"><span>💶</span><h3>Récapitulatif</h3></div>

                  {price ? (
                    <>
                      <div className="loc-summary-rows">
                        <div className="loc-summary-row">
                          <span className="label">Formule</span>
                          <span className="value">{price.formuleLabel}</span>
                        </div>
                        <div className="loc-summary-row">
                          <span className="label">Durée</span>
                          <span className="value">{price.durationDetails}</span>
                        </div>
                        {packMateriel !== 'aucun' && (
                          <div className="loc-summary-row">
                            <span className="label">Pack</span>
                            <span className="value">{price.packLabel}</span>
                          </div>
                        )}
                        {dateDebut && (
                          <div className="loc-summary-row">
                            <span className="label">Période</span>
                            <span className="value">{dateDebut}{dateFin && dateFin !== dateDebut ? ` → ${dateFin}` : ''}</span>
                          </div>
                        )}
                      </div>

                      <div className="loc-summary-divider" />

                      <div className="loc-price-lines">
                        <div className="loc-price-row">
                          <span>Base HT</span><span>{price.baseHT.toFixed(2)} €</span>
                        </div>
                        {price.packHT > 0 && (
                          <div className="loc-price-row">
                            <span>Pack HT</span><span>{price.packHT.toFixed(2)} €</span>
                          </div>
                        )}
                        <div className="loc-price-row">
                          <span>Total HT</span><span>{price.totalHT.toFixed(2)} €</span>
                        </div>
                        <div className="loc-price-row muted">
                          <span>TVA (20%)</span><span>{price.tva.toFixed(2)} €</span>
                        </div>
                      </div>

                      <div className="loc-total-ttc">
                        <span>TOTAL TTC</span>
                        <span>{price.totalTTC.toFixed(2)} €</span>
                      </div>

                      <div className="loc-acompte-block">
                        <div className="loc-acompte-row">
                          <span>Acompte à régler <em>({(price.acompteTaux * 100).toFixed(0)}%)</em></span>
                          <span className="loc-acompte-amount">{price.acompteTTC.toFixed(2)} €</span>
                        </div>
                        <div className="loc-solde-row">
                          <span>Solde restant</span>
                          <span>{price.soldeTTC.toFixed(2)} €</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="loc-price-placeholder">Sélectionnez une date pour voir l&apos;estimation.</p>
                  )}
                </div>

                {/* Étapes de paiement */}
                <div className="loc-fcard loc-steps-card">
                  <div className="loc-fcard-header"><span>🔒</span><h3>Comment ça marche</h3></div>

                  <ol className="loc-steps">
                    <li className="loc-step">
                      <div className="loc-step-num">1</div>
                      <div className="loc-step-body">
                        <strong>Envoyez votre demande</strong>
                        <span>Le formulaire est envoyé par email avec votre récapitulatif complet.</span>
                      </div>
                    </li>
                    <li className="loc-step">
                      <div className="loc-step-num">2</div>
                      <div className="loc-step-body">
                        <strong>Envoyez vos documents</strong>
                        <span>Pièce d&apos;identité, CAP/BP, SIREN/URSSAF, RC Pro à <a href="mailto:location.phenoandco@gmail.com">location.phenoandco@gmail.com</a></span>
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
                        <span>Votre créneau est bloqué définitivement. À bientôt chez PHENO&amp;CO 👊</span>
                      </div>
                    </li>
                  </ol>

                  <div className="loc-contact-block">
                    <p>Une question ?</p>
                    <a href="https://wa.me/33769432605" target="_blank" rel="noopener noreferrer" className="loc-wa-btn">
                      💬 Nous écrire sur WhatsApp
                    </a>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* À propos */}
          <div className="loc-about">
            <div className="loc-fcard">
              <div className="loc-fcard-header"><span>✨</span><h3>À propos</h3></div>
              <p>PHENO&amp;CO, plus qu&apos;un salon : un espace fondé sur le respect, la bienveillance et l&apos;exigence.</p>
              <p>On partage l&apos;énergie et la passion du métier. Chaque coiffeur arrive avec son histoire, son style et son talent.</p>
              <p>Que vous soyez de passage ou en longue collaboration, l&apos;essentiel reste le même : passion, sérieux et bonne vibe.</p>
              <p className="loc-about-cta">À bientôt.</p>
            </div>
          </div>

        </div>
      </section>

      <footer className="loc-footer">
        <p>PHENO&amp;CO - Barbershop &amp; Coworking · Montpellier</p>
      </footer>

      {toast && (
        <div className={`loc-toast${toast.err ? ' error' : ''}`}>
          <h4>{toast.title}</h4>
          <p>{toast.msg}</p>
        </div>
      )}

    </div>
  )
}
