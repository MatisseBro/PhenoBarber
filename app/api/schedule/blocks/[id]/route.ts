import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { isAdminAuthenticated } from '@/lib/auth'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  const { id } = await params
  if (!id || id.length > 100 || !/^[a-zA-Z0-9-]+$/.test(id)) {
    return NextResponse.json({ error: 'ID invalide' }, { status: 422 })
  }
  const { error } = await getSupabase()
    .from('schedule_blocks')
    .delete()
    .eq('id', id)
  if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
