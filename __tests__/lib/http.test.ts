import { describe, expect, it } from 'vitest'
import { readJsonBody, RequestBodyError } from '@/lib/http'

describe('bounded JSON body reader', () => {
  it('lit un JSON valide sous la limite', async () => {
    const request = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ ok: true }) })
    await expect(readJsonBody(request, 64)).resolves.toEqual({ ok: true })
  })

  it('rejette une taille déclarée excessive avant la lecture', async () => {
    const request = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Length': '128' },
      body: '{}',
    })
    await expect(readJsonBody(request, 32)).rejects.toMatchObject({ status: 413 })
  })

  it('borne aussi les flux dont Content-Length est absent ou faux', async () => {
    const request = new Request('http://localhost', { method: 'POST', body: 'x'.repeat(128) })
    try {
      await readJsonBody(request, 32)
      throw new Error('La taille aurait dû être rejetée')
    } catch (error) {
      expect(error).toBeInstanceOf(RequestBodyError)
      expect((error as RequestBodyError).status).toBe(413)
    }
  })
})
