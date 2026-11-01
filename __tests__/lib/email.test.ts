import { afterEach, describe, expect, it, vi } from 'vitest'

async function loadEmailModule() {
  vi.resetModules()
  process.env.RESEND_API_KEY = 're_test_key_never_sent'
  process.env.EMAIL_FROM = 'PHENO TEST <noreply@pheno.example.test>'
  return import('@/lib/email')
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.RESEND_API_KEY
  delete process.env.EMAIL_FROM
  vi.restoreAllMocks()
  vi.resetModules()
})

describe('Resend delivery results', () => {
  it('transmet une clé d’idempotence et remonte l’identifiant fournisseur', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ id: 'email_fictitious_123' }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    ))
    vi.stubGlobal('fetch', fetchMock)
    const { sendContactEmail } = await loadEmailModule()

    const result = await sendContactEmail({
      nom: 'Client Test', email: 'client@example.test', message: 'Message fictif',
    }, 'contact:test-key')

    expect(result).toMatchObject({ ok: true, status: 'sent', providerMessageId: 'email_fictitious_123' })
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(new Headers(options.headers).get('Idempotency-Key')).toBe('contact:test-key')
  })

  it('ne compte pas un refus Resend comme un succès et rend un 429 retentable', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 429 })))
    const { sendContactEmail } = await loadEmailModule()

    await expect(sendContactEmail({
      nom: 'Client Test', email: 'client@example.test', message: 'Message fictif',
    }, 'contact:rate-limited')).resolves.toMatchObject({
      ok: false, status: 'failed', retryable: true, errorCode: 'http_429',
    })
  })

  it('classe un timeout réseau comme incertain et ne journalise pas le destinataire', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network timeout')))
    const { sendClientMagicLink } = await loadEmailModule()

    const result = await sendClientMagicLink({
      email: 'private-client@example.test',
      link: 'https://pheno.example.test/espace-client#token=fictitious',
      idempotencyKey: 'client-magic:fictitious',
    })

    expect(result).toMatchObject({ ok: false, status: 'uncertain', retryable: true })
    expect(JSON.stringify(log.mock.calls)).not.toContain('private-client@example.test')
    expect(JSON.stringify(log.mock.calls)).not.toContain('token=fictitious')
  })
})
