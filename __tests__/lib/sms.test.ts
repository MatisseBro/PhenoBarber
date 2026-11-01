import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadSmsModule() {
  vi.resetModules()
  process.env.TWILIO_ACCOUNT_SID = 'AC00000000000000000000000000000000'
  process.env.TWILIO_AUTH_TOKEN = 'fictitious_auth_token'
  process.env.TWILIO_FROM_NUMBER = '+33900000000'
  return import('@/lib/sms')
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.TWILIO_ACCOUNT_SID
  delete process.env.TWILIO_AUTH_TOKEN
  delete process.env.TWILIO_FROM_NUMBER
  vi.restoreAllMocks()
  vi.resetModules()
})

const reminder = {
  nom: 'Client Test', telephone: '0612345678', date: '2099-01-06',
  slot: '10:00', prestationLabel: 'Coupe test',
}

describe('Twilio delivery results', () => {
  it('traite un 429 explicite comme un échec retentable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429 })))
    const { sendRdvReminderSms } = await loadSmsModule()
    await expect(sendRdvReminderSms(reminder)).resolves.toMatchObject({
      ok: false, status: 'failed', retryable: true, errorCode: 'http_429',
    })
  })

  it('ne retente pas automatiquement un résultat Twilio incertain', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })))
    const { sendRdvReminderSms } = await loadSmsModule()
    await expect(sendRdvReminderSms(reminder)).resolves.toMatchObject({
      ok: false, status: 'uncertain', retryable: false, errorCode: 'http_503',
    })
  })
})
