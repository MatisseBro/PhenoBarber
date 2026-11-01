import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const startedAt = Date.now()
  try {
    const { error } = await getSupabase()
      .from('schedule_config')
      .select('id')
      .eq('id', 'main')
      .limit(1)
    if (error) throw error
    return NextResponse.json({ status: 'ok', database: 'ok', latencyMs: Date.now() - startedAt })
  } catch {
    return NextResponse.json({ status: 'degraded', database: 'unavailable' }, { status: 503 })
  }
}
