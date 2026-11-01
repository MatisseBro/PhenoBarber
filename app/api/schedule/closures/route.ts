import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'
import { readJsonBody } from '@/lib/http'
import { isIsoDate, isSafePlainText } from '@/lib/validation'

export async function POST(req: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  let body: { date?: unknown; reason?: unknown }
  try { body = await readJsonBody(req, 4_096) } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }
  const { date, reason } = body
  if (!isIsoDate(date) || (reason !== undefined && !isSafePlainText(reason, 0, 200))) {
    return NextResponse.json({ error: 'Date invalide' }, { status: 422 })
  }
  const { error } = await getSupabase()
    .from('schedule_closures')
    .upsert({ date, reason: typeof reason === 'string' ? reason.trim() : '' })
  if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  return NextResponse.json({ ok: true }, { status: 201 })
}
