import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { isIsoDate } from '@/lib/validation'
import { enforceRateLimit } from '@/lib/rate-limit'
import { getBookingMinLeadMinutes, minimumBookingDateTime } from '@/lib/booking-time'

export async function GET(req: Request) {
  if (!await enforceRateLimit(req, { namespace: 'rdv-slots', limit: 120, windowSeconds: 60 })) {
    return NextResponse.json({ bookings: [] }, { status: 429 })
  }
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')

  if (!isIsoDate(date)) {
    return NextResponse.json({ bookings: [] })
  }

  const { data, error } = await getSupabase()
    .from('rdv_bookings')
    .select('slot, total_duration')
    .eq('date', date)
    .neq('status', 'cancelled')

  if (error) return NextResponse.json({ bookings: [] })

  return NextResponse.json({
    bookings: (data ?? []).map(r => ({
      slot:     r.slot as string,
      duration: Number(r.total_duration),
    })),
    minimumBookingDateTime: minimumBookingDateTime(),
    minLeadMinutes: getBookingMinLeadMinutes(),
  })
}
