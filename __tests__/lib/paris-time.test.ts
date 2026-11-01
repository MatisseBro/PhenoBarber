import { describe, expect, it } from 'vitest'
import { dateInParis, dayOfWeekInParis, monthInParis, tomorrowInParis } from '@/lib/paris-time'

describe('Paris cron calendar', () => {
  it('calcule demain depuis le jour parisien, pas depuis le jour UTC', () => {
    const lateInParis = new Date('2026-07-06T22:30:00.000Z') // mardi 00:30 à Paris
    expect(dateInParis(lateInParis)).toBe('2026-07-07')
    expect(tomorrowInParis(lateInParis)).toBe('2026-07-08')
    expect(dayOfWeekInParis(lateInParis)).toBe(2)
    expect(monthInParis(lateInParis)).toBe('2026-07')
  })

  it('reste correct aux changements d’heure été et hiver', () => {
    expect(tomorrowInParis(new Date('2026-03-28T23:30:00.000Z'))).toBe('2026-03-30')
    expect(tomorrowInParis(new Date('2026-10-24T22:30:00.000Z'))).toBe('2026-10-26')
  })
})
