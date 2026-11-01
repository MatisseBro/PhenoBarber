import type { DeliveryResult } from './delivery'
import { safeDeliveryLog } from './delivery'

const TWILIO_SID   = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH  = process.env.TWILIO_AUTH_TOKEN
const TWILIO_FROM  = process.env.TWILIO_FROM_NUMBER

function formatFR(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('33')) return `+${digits}`
  if (digits.startsWith('0') && digits.length === 10) return `+33${digits.slice(1)}`
  return `+${digits}`
}

async function sendSMS(to: string, body: string): Promise<DeliveryResult> {
  if (!TWILIO_SID || !TWILIO_AUTH || !TWILIO_FROM) {
    return { ok: false, status: 'disabled', retryable: false, errorCode: 'provider_not_configured' }
  }
  const toFormatted = formatFR(to)
  const credentials = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH}`).toString('base64')
  const form = new URLSearchParams({ To: toFormatted, From: TWILIO_FROM, Body: body })
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
      }
    )
    if (!res.ok) {
      if (res.status >= 500) {
        // Sans clé d'idempotence Twilio, un 5xx est traité comme indéterminé :
        // une relance automatique pourrait produire un doublon.
        return { ok: false, status: 'uncertain', retryable: false, errorCode: `http_${res.status}` }
      }
      return {
        ok: false,
        status: 'failed',
        retryable: res.status === 429,
        errorCode: `http_${res.status}`,
      }
    }
    const response = await res.json().catch(() => null) as { sid?: unknown } | null
    return {
      ok: true,
      status: 'sent',
      retryable: false,
      providerMessageId: typeof response?.sid === 'string' ? response.sid : undefined,
    }
  } catch {
    // Twilio Messages ne fournit pas de clé d'idempotence de création : un timeout
    // peut cacher un envoi accepté. Ce résultat ne doit pas être retenté automatiquement.
    return { ok: false, status: 'uncertain', retryable: false, errorCode: 'network_error' }
  }
}

// ── Messages ─────────────────────────────────────────────────

export async function sendRdvSmsClient(data: {
  nom: string; telephone: string; date: string; slot: string; prestationLabel: string
}): Promise<DeliveryResult> {
  const [y, m, d] = data.date.split('-')
  const dateStr = `${d}/${m}/${y}`
  const msg = `✂️ PHENO&CO - RDV confirmé !\n${data.prestationLabel}\n📅 ${dateStr} à ${data.slot}\n📍 18 rue d'Alger, Montpellier\n❌ Annulation : wa.me/33769432605`
  const result = await sendSMS(data.telephone, msg)
  safeDeliveryLog('twilio', 'rdv_confirmation', result)
  return result
}

export async function sendLocationSmsClient(data: {
  nom: string; telephone: string; dateDebut: string; formuleLabel: string
}): Promise<DeliveryResult> {
  const [y, m, d] = data.dateDebut.split('-')
  const dateStr = `${d}/${m}/${y}`
  const msg = `🪑 PHENO&CO - Demande de location reçue !\n${data.formuleLabel}\n📅 À partir du ${dateStr}\nNous vous contactons sous 48h.\n📞 wa.me/33769432605`
  const result = await sendSMS(data.telephone, msg)
  safeDeliveryLog('twilio', 'location_confirmation', result)
  return result
}

export async function sendRdvReminderSms(data: {
  nom: string; telephone: string; date: string; slot: string; prestationLabel: string
}): Promise<DeliveryResult> {
  const [y, m, d] = data.date.split('-')
  const dateStr = `${d}/${m}/${y}`
  const msg = `⏰ PHENO&CO - Rappel RDV demain !\n${data.prestationLabel}\n📅 ${dateStr} à ${data.slot}\n📍 18 rue d'Alger, Montpellier\nAnnuler : wa.me/33769432605`
  const result = await sendSMS(data.telephone, msg)
  safeDeliveryLog('twilio', 'rdv_reminder', result)
  return result
}
