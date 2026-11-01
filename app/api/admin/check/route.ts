import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET() {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
  return NextResponse.json({ authenticated: true })
}
