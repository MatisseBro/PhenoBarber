import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'
import { randomUUID } from 'crypto'
import { ALL_SLOTS } from '@/lib/schedule-types'
import { readJsonBody } from '@/lib/http'
import { isIsoDate, isSafePlainText } from '@/lib/validation'

export async function POST(req: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  let body: { date?: unknown; slot?: unknown; reason?: unknown }
  try { body = await readJsonBody(req, 4_096) } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
  const { date, slot, reason } = body
  if (
    !isIsoDate(date) || typeof slot !== 'string' || !ALL_SLOTS.includes(slot) ||
    (reason !== undefined && !isSafePlainText(reason, 0, 200))
  ) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 422 })
  }
  const { error } = await getSupabase()
    .from('schedule_blocks')
    .upsert({ id: randomUUID(), date, slot, reason: typeof reason === 'string' ? reason.trim() : '' }, { onConflict: 'date,slot' })
  if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
