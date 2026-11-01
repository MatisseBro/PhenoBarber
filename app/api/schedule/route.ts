import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'
import { ALL_SLOTS } from '@/lib/schedule-types'
import { readJsonBody } from '@/lib/http'

const DEFAULT_CONFIG = {
  open_days: [2, 3, 4, 5, 6],
  slots: ['10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','16:00','16:30','17:00','17:30'],
}

export async function GET() {
  const sb = getSupabase()
  const [cfgRes, closRes, blkRes] = await Promise.all([
    sb.from('schedule_config').select('*').eq('id', 'main').single(),
    sb.from('schedule_closures').select('*').order('date'),
    sb.from('schedule_blocks').select('*').order('date'),
  ])

  const cfg = cfgRes.data ?? { ...DEFAULT_CONFIG, updated_at: new Date().toISOString() }

  return NextResponse.json({
    config: {
      openDays:  cfg.open_days,
      slots:     cfg.slots,
      updatedAt: cfg.updated_at,
    },
    closures: (closRes.data ?? []).map((r: { date: string; reason: string }) => ({ date: r.date, reason: r.reason ?? '' })),
    blocks:   (blkRes.data ?? []).map((r: { id: string; date: string; slot: string; reason: string }) => ({ id: r.id, date: r.date, slot: r.slot, reason: r.reason ?? '' })),
  })
}

export async function PUT(req: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  let body: { openDays?: unknown; slots?: unknown }
  try { body = await readJsonBody(req, 8_192) } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const { openDays, slots } = body

  if (
    !Array.isArray(openDays) || openDays.length > 7 ||
    !openDays.every((d: unknown) => typeof d === 'number' && d >= 0 && d <= 6) ||
    new Set(openDays).size !== openDays.length ||
    !Array.isArray(slots) || slots.length === 0 || slots.length > 50 ||
    !slots.every((s: unknown) => typeof s === 'string' && ALL_SLOTS.includes(s)) ||
    new Set(slots).size !== slots.length
  ) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }

  const { error } = await getSupabase()
    .from('schedule_config')
    .upsert({ id: 'main', open_days: openDays, slots, updated_at: new Date().toISOString() })

  if (error) {
    console.error('Échec de mise à jour des horaires')
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
