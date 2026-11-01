import { describe, expect, it } from 'vitest'
import { normalizePhone } from '@/lib/validation'

describe('normalizePhone', () => {
  it.each([
    ['0612345678', '+33612345678'],
    ['33612345678', '+33612345678'],
    ['+33612345678', '+33612345678'],
    ['0033612345678', '+33612345678'],
    ['06 12 34 56 78', '+33612345678'],
  ])('normalise %s en %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it('rejette les entrées non prises en charge', () => {
    expect(normalizePhone('06 12 xx 34 56')).toBeNull()
    expect(normalizePhone('123')).toBeNull()
  })
})
