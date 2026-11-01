import { describe, expect, it } from 'vitest'
import {
  DEFAULT_BOOKING_MIN_LEAD_MINUTES,
  getBookingMinLeadMinutes,
  isBookingStartAllowed,
  minimumBookingDateTime,
} from '@/lib/booking-time'

describe('booking time in Europe/Paris', () => {
  it('applique 60 minutes par défaut et valide la configuration', () => {
    expect(getBookingMinLeadMinutes(undefined)).toBe(DEFAULT_BOOKING_MIN_LEAD_MINUTES)
    expect(getBookingMinLeadMinutes('90')).toBe(90)
    expect(getBookingMinLeadMinutes('-1')).toBe(DEFAULT_BOOKING_MIN_LEAD_MINUTES)
    expect(getBookingMinLeadMinutes('not-a-number')).toBe(DEFAULT_BOOKING_MIN_LEAD_MINUTES)
  })

  it('rejette le passé et les créneaux trop proches en hiver', () => {
    const now = new Date('2026-01-15T08:30:00.000Z') // 09:30 à Paris
    expect(minimumBookingDateTime(now, 60)).toBe('2026-01-15T10:30')
    expect(isBookingStartAllowed('2026-01-15', '10:00', now, 60)).toBe(false)
    expect(isBookingStartAllowed('2026-01-15', '10:30', now, 60)).toBe(true)
    expect(isBookingStartAllowed('2026-01-14', '17:30', now, 0)).toBe(false)
    expect(isBookingStartAllowed('2026-01-16', '10:00', now, 60)).toBe(true)
  })

  it('utilise UTC+2 en été', () => {
    const now = new Date('2026-07-15T07:30:00.000Z') // 09:30 à Paris
    expect(minimumBookingDateTime(now, 60)).toBe('2026-07-15T10:30')
  })

  it("traverse correctement le passage à l'heure d'été", () => {
    const beforeJump = new Date('2026-03-29T00:30:00.000Z') // 01:30 CET
    expect(minimumBookingDateTime(beforeJump, 120)).toBe('2026-03-29T04:30')
  })

  it("traverse correctement le passage à l'heure d'hiver", () => {
    const beforeRepeat = new Date('2026-10-25T00:30:00.000Z') // 02:30 CEST
    expect(minimumBookingDateTime(beforeRepeat, 120)).toBe('2026-10-25T03:30')
  })
})
