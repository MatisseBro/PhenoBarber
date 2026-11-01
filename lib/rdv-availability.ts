import { getSupabase } from '@/lib/supabase'

export interface RequestedRdvSlot {
  slot: string
  duration: number
}

export async function checkRdvAvailability(date: string, requested: RequestedRdvSlot[]) {
  type ConfigResult = { data: { open_days: number[]; slots: string[] } | null; error: unknown }
  type ClosureResult = { data: Array<{ date: string }> | null; error: unknown }
  type BlocksResult = { data: Array<{ slot: string }> | null; error: unknown }
  type BookingsResult = { data: Array<{ slot: string; total_duration: number }> | null; error: unknown }
  let results: [ConfigResult, ClosureResult, BlocksResult, BookingsResult]
  try {
    const supabase = getSupabase();
    results = await Promise.all([
      supabase.from('schedule_config').select('open_days, slots').eq('id', 'main').maybeSingle(),
      supabase.from('schedule_closures').select('date').eq('date', date),
      supabase.from('schedule_blocks').select('slot').eq('date', date),
      supabase.from('rdv_bookings').select('slot, total_duration').eq('date', date).neq('status', 'cancelled'),
    ]) as [ConfigResult, ClosureResult, BlocksResult, BookingsResult]
  } catch {
    return { ok: false as const, reason: 'error' as const }
  }

  const [configRes, closureRes, blocksRes, bookingsRes] = results

  if (configRes.error || !configRes.data || closureRes.error || blocksRes.error || bookingsRes.error) {
    return { ok: false as const, reason: 'error' as const }
  }

  const config = configRes.data
  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay()
  if (!(config.open_days as number[]).includes(dayOfWeek) || (closureRes.data ?? []).length > 0) {
    return { ok: false as const, reason: 'closed' as const }
  }

  const activeSlots = new Set(config.slots as string[])
  const blockedSlots = new Set((blocksRes.data ?? []).map(row => row.slot as string))
  const requestedRanges = requested.map(({ slot, duration }) => {
    const [hour, minute] = slot.split(':').map(Number)
    const start = hour * 60 + minute
    return { start, end: start + Math.max(30, Math.ceil(Math.max(duration, 30) / 30) * 30) }
  })

  for (const range of requestedRanges) {
    for (let minute = range.start; minute < range.end; minute += 30) {
      const slot = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`
      if (!activeSlots.has(slot) || blockedSlots.has(slot)) return { ok: false as const, reason: 'unavailable' as const }
    }
  }

  const bookings = bookingsRes.data ?? []
  const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }) => a.start < b.end && a.end > b.start
  for (let i = 0; i < requestedRanges.length; i++) {
    if (requestedRanges.slice(i + 1).some(range => overlaps(requestedRanges[i], range))) {
      return { ok: false as const, reason: 'unavailable' as const }
    }
    if (bookings.some(booking => {
      const [hour, minute] = (booking.slot as string).split(':').map(Number)
      const start = hour * 60 + minute
      const end = start + Math.max(30, Number(booking.total_duration) || 0)
      return overlaps(requestedRanges[i], { start, end })
    })) return { ok: false as const, reason: 'unavailable' as const }
  }

  return { ok: true as const }
}
