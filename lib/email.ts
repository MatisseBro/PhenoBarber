// ── Config ──────────────────────────────────────────────────
import type { DeliveryBatchResult, DeliveryResult } from './delivery'
import { safeDeliveryLog } from './delivery'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.EMAIL_FROM ?? 'PHENO&CO <noreply@phenoandco.fr>'
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? 'location.phenoandco@gmail.com'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://phenoandco.fr'

// ── Security ─────────────────────────────────────────────────
function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// ── Low-level send ───────────────────────────────────────────
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  idempotencyKey?: string,
): Promise<DeliveryResult> {
  if (!RESEND_API_KEY) {
    return { ok: false, status: 'disabled', retryable: false, errorCode: 'provider_not_configured' }
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey.slice(0, 256) } : {}),
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    })
    if (!res.ok) {
      return {
        ok: false,
        status: 'failed',
        retryable: res.status === 429 || res.status >= 500,
        errorCode: `http_${res.status}`,
      }
    }
    const response = await res.json().catch(() => null) as { id?: unknown } | null
    return {
      ok: true,
      status: 'sent',
      retryable: false,
      providerMessageId: typeof response?.id === 'string' ? response.id : undefined,
    }
  } catch {
    return { ok: false, status: 'uncertain', retryable: Boolean(idempotencyKey), errorCode: 'network_error' }
  }
}

// ── HTML helpers ─────────────────────────────────────────────
function layout(content: string): string {
  return `<!DOCTYPE html><html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>PHENO&amp;CO</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#e5e5e5">
<div style="max-width:600px;margin:0 auto;padding:40px 20px">
  <div style="text-align:center;padding-bottom:28px;border-bottom:1px solid rgba(253,224,71,.2);margin-bottom:28px">
    <div style="font-size:30px;font-weight:900;letter-spacing:.2em;color:#FDE047">PHENO<span style="color:#fff">&amp;CO</span></div>
    <p style="margin-top:6px;font-size:12px;color:rgba(255,255,255,.4)">Barbershop · 18 rue d'Alger, Saint-Roch · Montpellier</p>
  </div>
  ${content}
  <div style="text-align:center;padding-top:28px;border-top:1px solid rgba(255,255,255,.06);color:rgba(255,255,255,.35);font-size:12px;line-height:1.9;margin-top:32px">
    <p>PHENO&amp;CO - Barbershop &amp; Coworking · Montpellier</p>
    <p>18 rue d'Alger, Saint-Roch · 34000 Montpellier</p>
    <p><a href="https://wa.me/33769432605" style="color:#FDE047;text-decoration:none">WhatsApp : +33 7 69 43 26 05</a></p>
    <p style="margin-top:12px;font-size:10px;color:rgba(255,255,255,.2)">Cet email a été envoyé automatiquement - ne pas répondre directement.</p>
  </div>
</div></body></html>`
}

function card(content: string): string {
  return `<div style="background:#111;border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:24px;margin-bottom:16px">${content}</div>`
}

function row(label: string, value: string, highlight = false): string {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">
    <span style="color:rgba(255,255,255,.5);font-size:13px">${label}</span>
    <span style="font-weight:${highlight ? '700' : '500'};font-size:13px;color:${highlight ? '#FDE047' : '#fff'}">${value}</span>
  </div>`
}

function btn(href: string, text: string, primary = true): string {
  const bg = primary ? '#FDE047' : '#1a1a1a'
  const color = primary ? '#000' : '#fff'
  const border = primary ? '' : 'border:1px solid rgba(255,255,255,.2);'
  return `<a href="${href}" style="display:inline-block;background:${bg};color:${color};${border}font-weight:700;text-decoration:none;padding:12px 24px;border-radius:8px;margin:6px 4px;font-size:14px">${text}</a>`
}

function gcalLink(date: string, slot: string, durationMin: number, title: string): string {
  const [y, m, d] = date.split('-')
  const [hh, mm] = slot.split(':').map(Number)
  const dur = Math.max(durationMin, 30)
  const endTotalMin = hh * 60 + mm + dur
  const endH = Math.floor(endTotalMin / 60)
  const endM = endTotalMin % 60
  const start = `${y}${m}${d}T${String(hh).padStart(2, '0')}${String(mm).padStart(2, '0')}00`
  const end = `${y}${m}${d}T${String(endH).padStart(2, '0')}${String(endM).padStart(2, '0')}00`
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${start}/${end}&location=${encodeURIComponent("18 Rue d'Alger, 34000 Montpellier")}`
}

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function fmtDur(min: number): string {
  if (min <= 0) return 'Sur devis'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), r = min % 60
  return r > 0 ? `${h}h${String(r).padStart(2, '0')}` : `${h}h`
}

// ── RDV emails ───────────────────────────────────────────────

interface RdvData {
  nom: string; email: string; telephone: string
  date: string; slot: string
  prestationLabel: string; degradeLabel?: string
  optionsLabels: string[]; totalPrice: number; totalDuration: number
  categorie: string
}

function rdvClientHtml(d: RdvData): string {
  const cal = gcalLink(d.date, d.slot, d.totalDuration, `RDV PHENO&CO - ${d.prestationLabel}`)
  const options = d.optionsLabels.length > 0 ? d.optionsLabels.map(escHtml).join(', ') : 'Aucune'
  return layout(`
    <h1 style="font-size:22px;font-weight:800;margin:0 0 4px;color:#fff">Votre RDV est confirmé ✓</h1>
    <p style="color:rgba(255,255,255,.55);font-size:14px;margin:0 0 24px">Bonjour <strong style="color:#fff">${escHtml(d.nom)}</strong>, votre rendez-vous chez PHENO&amp;CO est bien enregistré.</p>
    ${card(`
      <h3 style="margin:0 0 16px;font-size:15px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.1em">Récapitulatif</h3>
      ${row('Date', fmtDate(d.date))}
      ${row('Heure', d.slot)}
      ${row('Prestation', escHtml(d.prestationLabel))}
      ${d.degradeLabel ? row('Type de dégradé', escHtml(d.degradeLabel)) : ''}
      ${row('Options', options)}
      ${row('Durée estimée', fmtDur(d.totalDuration))}
      ${row('Prix estimé', d.totalPrice > 0 ? `${d.totalPrice} €` : 'Sur devis', true)}
    `)}
    ${card(`
      <h3 style="margin:0 0 12px;font-size:15px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.1em">Adresse</h3>
      <p style="font-size:14px;line-height:1.7;margin:0">📍 <strong>18 rue d'Alger</strong>, Saint-Roch<br>34000 Montpellier<br><br>
      <a href="https://maps.google.com/?q=18+rue+d'Alger+Montpellier" style="color:#FDE047;text-decoration:none">Voir sur Google Maps →</a></p>
    `)}
    <div style="text-align:center;margin:20px 0">
      ${btn(cal, '📅 Ajouter à mon agenda')}
      ${btn(`https://wa.me/33769432605?text=${encodeURIComponent(`Bonjour, j'ai un RDV le ${fmtDate(d.date)} à ${d.slot} pour ${d.prestationLabel}. Je souhaite modifier/annuler.`)}`, '💬 Modifier / Annuler', false)}
    </div>
    <p style="font-size:12px;color:rgba(255,255,255,.3);text-align:center;margin-top:8px">Pour annuler ou modifier, contactez-nous au moins 24h à l'avance via WhatsApp.</p>
  `)
}

function rdvAdminHtml(d: RdvData): string {
  const options = d.optionsLabels.length > 0 ? d.optionsLabels.map(escHtml).join(', ') : 'Aucune'
  return layout(`
    <h1 style="font-size:20px;font-weight:800;margin:0 0 4px;color:#FDE047">Nouveau RDV</h1>
    <p style="color:rgba(255,255,255,.55);font-size:14px;margin:0 0 24px">${escHtml(d.nom)} - ${fmtDate(d.date)} à ${d.slot}</p>
    ${card(`
      ${row('Client', escHtml(d.nom))}
      ${row('Email', escHtml(d.email))}
      ${row('Téléphone', escHtml(d.telephone))}
      ${row('Profil', escHtml(d.categorie))}
      ${row('Prestation', escHtml(d.prestationLabel))}
      ${d.degradeLabel ? row('Dégradé', escHtml(d.degradeLabel)) : ''}
      ${row('Options', options)}
      ${row('Date', fmtDate(d.date))}
      ${row('Heure', d.slot)}
      ${row('Durée', fmtDur(d.totalDuration))}
      ${row('Prix', d.totalPrice > 0 ? `${d.totalPrice} €` : 'Sur devis', true)}
    `)}
    <div style="text-align:center;margin:20px 0">
      ${btn(`${SITE_URL}/admin`, '⚙ Ouvrir le dashboard')}
      ${btn(`https://wa.me/33${d.telephone.replace(/\D/g, '').replace(/^0/, '')}`, `💬 Appeler ${escHtml(d.nom)}`, false)}
    </div>
  `)
}

// ── Location emails ──────────────────────────────────────────

interface LocationData {
  nom: string; email: string; telephone: string
  formuleLabel: string; packLabel: string; durationDetails: string
  dateDebut: string; dateFin?: string; heureDebut: string; heureFin: string
  totalHT: number; tva: number; totalTTC: number
  acompteTaux: number; acompteTTC: number; soldeTTC: number
}

function locationClientHtml(d: LocationData): string {
  const end = d.dateFin && d.dateFin !== d.dateDebut ? d.dateFin : d.dateDebut
  const cal = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Location Fauteuil - PHENO&CO')}&dates=${d.dateDebut.replace(/-/g, '')}T${d.heureDebut.replace(':', '')}00/${end.replace(/-/g, '')}T${d.heureFin.replace(':', '')}00&location=${encodeURIComponent("18 Rue d'Alger, 34000 Montpellier")}`
  const periode = d.dateFin && d.dateFin !== d.dateDebut ? `${fmtDate(d.dateDebut)} → ${fmtDate(d.dateFin)}` : fmtDate(d.dateDebut)
  return layout(`
    <h1 style="font-size:22px;font-weight:800;margin:0 0 4px;color:#fff">Demande reçue ✓</h1>
    <p style="color:rgba(255,255,255,.55);font-size:14px;margin:0 0 24px">Bonjour <strong style="color:#fff">${escHtml(d.nom)}</strong>, votre demande de location de fauteuil a bien été enregistrée. Nous vous contactons sous 48h.</p>
    ${card(`
      <h3 style="margin:0 0 16px;font-size:15px;color:rgba(255,255,255,.5);text-transform:uppercase;letter-spacing:.1em">Récapitulatif</h3>
      ${row('Formule', d.formuleLabel)}
      ${row('Durée', d.durationDetails)}
      ${d.packLabel !== 'Aucun - 0 €' ? row('Pack matériel', d.packLabel) : ''}
      ${row('Période', periode)}
      ${row('Horaires', `${d.heureDebut} – ${d.heureFin}`)}
    `)}
    ${card(`
      ${row('Total HT', `${d.totalHT.toFixed(2)} €`)}
      ${row('TVA (20%)', `${d.tva.toFixed(2)} €`)}
      ${row('Total TTC', `${d.totalTTC.toFixed(2)} €`, true)}
      <div style="margin-top:12px;padding:12px;background:rgba(253,224,71,.06);border:1px solid rgba(253,224,71,.2);border-radius:8px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px">Acompte à régler (${(d.acompteTaux * 100).toFixed(0)}%)</span>
        <span style="font-weight:800;font-size:17px;color:#FDE047">${d.acompteTTC.toFixed(2)} €</span>
      </div>
    `)}
    ${card(`
      <h3 style="margin:0 0 12px;font-size:14px;color:rgba(255,255,255,.5)">PROCHAINES ÉTAPES</h3>
      <ol style="padding-left:20px;margin:0;color:rgba(255,255,255,.7);font-size:13px;line-height:2">
        <li>Envoyez vos documents à <a href="mailto:location.phenoandco@gmail.com" style="color:#FDE047">location.phenoandco@gmail.com</a><br>
          <span style="font-size:11px;color:rgba(255,255,255,.4)">(Pièce d'identité, CAP/BP, SIREN/URSSAF, RC Pro)</span></li>
        <li>Validation de votre dossier par l'équipe (sous 48h)</li>
        <li>Réception du lien de paiement de l'acompte</li>
        <li>Confirmation définitive 🎉</li>
      </ol>
    `)}
    <div style="text-align:center;margin:20px 0">
      ${btn(cal, '📅 Ajouter à mon agenda')}
      ${btn('mailto:location.phenoandco@gmail.com', '📎 Envoyer mes documents', false)}
    </div>
  `)
}

function locationAdminHtml(d: LocationData): string {
  const periode = d.dateFin && d.dateFin !== d.dateDebut ? `${fmtDate(d.dateDebut)} → ${fmtDate(d.dateFin)}` : fmtDate(d.dateDebut)
  return layout(`
    <h1 style="font-size:20px;font-weight:800;margin:0 0 4px;color:#FDE047">Nouvelle demande de location</h1>
    <p style="color:rgba(255,255,255,.55);font-size:14px;margin:0 0 24px">${escHtml(d.nom)} - ${periode}</p>
    ${card(`
      ${row('Client', escHtml(d.nom))}
      ${row('Email', escHtml(d.email))}
      ${row('Téléphone', escHtml(d.telephone))}
      ${row('Formule', d.formuleLabel)}
      ${row('Pack', d.packLabel)}
      ${row('Période', periode)}
      ${row('Horaires', `${d.heureDebut} – ${d.heureFin}`)}
      ${row('Total TTC', `${d.totalTTC.toFixed(2)} €`)}
      ${row('Acompte', `${d.acompteTTC.toFixed(2)} €`, true)}
    `)}
    <div style="text-align:center;margin:20px 0">
      ${btn(`${SITE_URL}/admin`, '⚙ Ouvrir le dashboard')}
    </div>
  `)
}

// ── Contact email ────────────────────────────────────────────

interface ContactData {
  nom: string; email: string; telephone?: string; message: string
}

function contactAdminHtml(d: ContactData): string {
  return layout(`
    <h1 style="font-size:20px;font-weight:800;margin:0 0 4px;color:#FDE047">Nouveau message</h1>
    <p style="color:rgba(255,255,255,.55);font-size:14px;margin:0 0 24px">Via le formulaire de contact du site</p>
    ${card(`
      ${row('De', escHtml(d.nom))}
      ${row('Email', escHtml(d.email))}
      ${d.telephone ? row('Téléphone', escHtml(d.telephone)) : ''}
    `)}
    ${card(`
      <h3 style="margin:0 0 10px;font-size:13px;color:rgba(255,255,255,.5)">MESSAGE</h3>
      <p style="font-size:14px;line-height:1.7;color:rgba(255,255,255,.8);white-space:pre-wrap;margin:0">${escHtml(d.message)}</p>
    `)}
    <div style="text-align:center;margin:20px 0">
      ${btn(`mailto:${escHtml(d.email)}`, `Répondre à ${escHtml(d.nom)}`, false)}
    </div>
  `)
}

// ── Reminder email ───────────────────────────────────────────

function rdvReminderHtml(d: RdvData): string {
  const cal = gcalLink(d.date, d.slot, d.totalDuration, `RDV PHENO&CO - ${d.prestationLabel}`)
  return layout(`
    <h1 style="font-size:22px;font-weight:800;margin:0 0 4px;color:#FDE047">Rappel : votre RDV demain ⏰</h1>
    <p style="color:rgba(255,255,255,.55);font-size:14px;margin:0 0 24px">Bonjour <strong style="color:#fff">${escHtml(d.nom)}</strong>, on vous attend demain chez PHENO&amp;CO !</p>
    ${card(`
      ${row('Date', fmtDate(d.date))}
      ${row('Heure', d.slot)}
      ${row('Prestation', escHtml(d.prestationLabel))}
      ${d.degradeLabel ? row('Type de dégradé', escHtml(d.degradeLabel)) : ''}
      ${row('Durée estimée', fmtDur(d.totalDuration))}
      ${row('Prix estimé', d.totalPrice > 0 ? `${d.totalPrice} €` : 'Sur devis', true)}
    `)}
    ${card(`
      <p style="font-size:14px;line-height:1.7;margin:0">📍 <strong>18 rue d'Alger</strong>, Saint-Roch - 34000 Montpellier<br>
      <a href="https://maps.google.com/?q=18+rue+d'Alger+Montpellier" style="color:#FDE047;text-decoration:none">Voir sur Google Maps →</a></p>
    `)}
    <div style="text-align:center;margin:20px 0">
      ${btn(cal, '📅 Voir dans mon agenda')}
      ${btn(`https://wa.me/33769432605?text=${encodeURIComponent(`Bonjour, j'ai un RDV demain ${fmtDate(d.date)} à ${d.slot}. Je souhaite annuler.`)}`, '❌ Annuler mon RDV', false)}
    </div>
    <p style="font-size:12px;color:rgba(255,255,255,.3);text-align:center">Pour annuler, merci de nous prévenir le plus tôt possible.</p>
  `)
}

// ── Relance email ────────────────────────────────────────────

interface ClientData {
  nom: string; email: string; lastRdvAt?: string
}

function relanceHtml(d: ClientData, unsubscribeUrl: string): string {
  return layout(`
    <h1 style="font-size:22px;font-weight:800;margin:0 0 4px;color:#fff">Ça fait un moment, ${escHtml(d.nom.split(' ')[0])} 👋</h1>
    <p style="color:rgba(255,255,255,.55);font-size:14px;margin:0 0 24px">Votre dernière visite remonte à quelques semaines - on espère vous revoir bientôt !</p>
    ${card(`
      <p style="font-size:14px;line-height:1.8;margin:0;color:rgba(255,255,255,.75)">PHENO&amp;CO vous accueille du <strong style="color:#fff">mardi au samedi</strong>, de 10h à 18h.<br>Prenez rendez-vous en ligne en 2 minutes.</p>
    `)}
    <div style="text-align:center;margin:24px 0">
      ${btn(`${SITE_URL}/rdv`, '✂️ Prendre rendez-vous')}
    </div>
    <p style="font-size:11px;color:rgba(255,255,255,.2);text-align:center;margin-top:8px">
      Vous ne souhaitez plus recevoir ces emails ? <a href="${unsubscribeUrl}" style="color:#FDE047">Se désinscrire</a>.
    </p>
  `)
}

// ── Public API ───────────────────────────────────────────────

function batchResult(operation: string, deliveries: DeliveryResult[]): DeliveryBatchResult {
  for (const result of deliveries) safeDeliveryLog('resend', operation, result)
  return { ok: deliveries.every(result => result.ok), deliveries }
}

export async function sendRdvEmails(data: RdvData, eventKey: string): Promise<DeliveryBatchResult> {
  const deliveries = await Promise.all([
    sendEmail(data.email, `Votre RDV est confirmé - PHENO&CO`, rdvClientHtml(data), `${eventKey}:client`),
    sendEmail(ADMIN_EMAIL, `Nouveau RDV : ${data.nom} - ${fmtDate(data.date)} à ${data.slot}`, rdvAdminHtml(data), `${eventKey}:admin`),
  ])
  return batchResult('rdv_confirmation', deliveries)
}

export async function sendLocationEmails(data: LocationData, eventKey: string): Promise<DeliveryBatchResult> {
  const deliveries = await Promise.all([
    sendEmail(data.email, `Votre demande de location a été reçue - PHENO&CO`, locationClientHtml(data), `${eventKey}:client`),
    sendEmail(ADMIN_EMAIL, `Nouvelle location : ${data.nom} - ${fmtDate(data.dateDebut)}`, locationAdminHtml(data), `${eventKey}:admin`),
  ])
  return batchResult('location_confirmation', deliveries)
}

export async function sendContactEmail(data: ContactData, eventKey: string): Promise<DeliveryResult> {
  const result = await sendEmail(ADMIN_EMAIL, `Message de ${data.nom} via le site`, contactAdminHtml(data), eventKey)
  safeDeliveryLog('resend', 'contact', result)
  return result
}

export async function sendRdvReminder(data: RdvData, idempotencyKey: string): Promise<DeliveryResult> {
  const result = await sendEmail(data.email, `Rappel - Votre RDV demain chez PHENO&CO`, rdvReminderHtml(data), idempotencyKey)
  safeDeliveryLog('resend', 'rdv_reminder', result)
  return result
}

export async function sendRelance(data: ClientData, idempotencyKey: string): Promise<DeliveryResult> {
  try {
    const { createUnsubscribeToken } = await import('./marketing-consent')
    const token = createUnsubscribeToken(data.email)
    const unsubscribeUrl = `${SITE_URL}/desinscription#token=${token}`
    const result = await sendEmail(data.email, `On vous attend chez PHENO&CO 👋`, relanceHtml(data, unsubscribeUrl), idempotencyKey)
    safeDeliveryLog('resend', 'marketing_reactivation', result)
    return result
  } catch {
    const result: DeliveryResult = { ok: false, status: 'failed', retryable: false, errorCode: 'unsubscribe_token_error' }
    safeDeliveryLog('resend', 'marketing_reactivation', result)
    return result
  }
}

export async function sendClientMagicLink(data: { email: string; link: string; idempotencyKey: string }): Promise<DeliveryResult> {
  const html = layout(`
    <h1 style="font-size:22px;font-weight:800;margin:0 0 4px;color:#fff">Votre espace client 🔑</h1>
    <p style="color:rgba(255,255,255,.55);font-size:14px;margin:0 0 24px">Cliquez sur le bouton ci-dessous pour accéder à vos réservations.</p>
    ${card(`
      <p style="font-size:14px;line-height:1.7;margin:0 0 12px;color:rgba(255,255,255,.7)">Ce lien est valable <strong style="color:#fff">30 minutes</strong> et ne peut être utilisé qu'une seule fois.</p>
      <div style="text-align:center;margin:16px 0">
        ${btn(data.link, '🔑 Accéder à mon espace client')}
      </div>
    `)}
    <p style="font-size:12px;color:rgba(255,255,255,.3);text-align:center">Si vous n'avez pas demandé ce lien, ignorez cet email.</p>
  `)
  const result = await sendEmail(data.email, `Votre lien de connexion - PHENO&CO`, html, data.idempotencyKey)
  safeDeliveryLog('resend', 'client_magic_link', result)
  return result
}
