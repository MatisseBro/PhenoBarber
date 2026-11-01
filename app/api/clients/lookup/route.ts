import { NextResponse } from 'next/server'
import { lookupClient } from '@/lib/clients'
import { normalizeEmail, normalizePhone } from '@/lib/validation'
import { RequestBodyError, readJsonBody } from '@/lib/http'
import { enforceRateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  if (!await enforceRateLimit(req, { namespace: 'client-lookup', limit: 5, windowSeconds: 5 * 60 })) {
    return NextResponse.json(null, { status: 429 })
  }

  let body: { email?: unknown; telephone?: unknown }
  try {
    body = await readJsonBody(req, 2_048)
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400
    return NextResponse.json(null, { status })
  }

  const email = normalizeEmail(body.email)
  const telephone = normalizePhone(body.telephone)
  if (!email || !telephone) return NextResponse.json({ known: false, loyaltyEligible: false })

  const client = await lookupClient(email, telephone)
  if (!client) return NextResponse.json({ known: false, loyaltyEligible: false })
  return NextResponse.json({
    known: true,
    loyaltyEligible: client.rdvCount > 0,
  })
}
