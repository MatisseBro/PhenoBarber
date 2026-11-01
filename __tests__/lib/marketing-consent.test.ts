import { afterEach, describe, expect, it } from 'vitest'
import { createUnsubscribeToken, verifyUnsubscribeToken } from '@/lib/marketing-consent'

const originalSecret = process.env.MARKETING_UNSUBSCRIBE_SECRET

afterEach(() => {
  if (originalSecret === undefined) delete process.env.MARKETING_UNSUBSCRIBE_SECRET
  else process.env.MARKETING_UNSUBSCRIBE_SECRET = originalSecret
})

describe('marketing unsubscribe tokens', () => {
  it('signe une adresse normalisée et détecte toute altération', () => {
    process.env.MARKETING_UNSUBSCRIBE_SECRET = 'a-marketing-secret-longer-than-thirty-two-characters'
    const token = createUnsubscribeToken('Client@Example.test')
    expect(verifyUnsubscribeToken(token)).toBe('client@example.test')
    expect(verifyUnsubscribeToken(`${token.slice(0, -1)}x`)).toBeNull()
  })

  it('refuse de créer un lien sans secret dédié', () => {
    delete process.env.MARKETING_UNSUBSCRIBE_SECRET
    expect(() => createUnsubscribeToken('client@example.test')).toThrow()
  })
})
