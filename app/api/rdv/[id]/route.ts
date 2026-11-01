import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'
import type { RdvStatus } from '@/lib/rdv-types'

const VALID_STATUSES: RdvStatus[] = ['pending', 'confirmed', 'cancelled']

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
  }

  let body: { status?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 })
  }

  const { status } = body
  if (!VALID_STATUSES.includes(status as RdvStatus)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 422 })
  }

  const { error } = await getSupabase()
    .from('rdv_bookings')
    .update({ status })
    .eq('id', id)
  if (error) {
    console.error('Échec de mise à jour du statut du rendez-vous')
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
