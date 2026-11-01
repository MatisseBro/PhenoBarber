import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted : variables accessibles dans les factories vi.mock (qui sont hoistées)
const {
  mockFrom, mockInsert, mockOrder, mockOr, mockEq, mockUpdate, mockSelect,
  mockLocationEmail, mockLocationSms, mockUpsertClient,
} = vi.hoisted(() => ({
  mockFrom:   vi.fn(),
  mockInsert: vi.fn(),
  mockOrder:  vi.fn(),
  mockOr:     vi.fn(),
  mockEq:     vi.fn(),
  mockUpdate: vi.fn(),
  mockSelect: vi.fn(),
  mockLocationEmail: vi.fn(),
  mockLocationSms: vi.fn(),
  mockUpsertClient: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
  isAdminAuthenticated: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/rate-limit', () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(true),
}))

vi.mock('@/lib/email', () => ({
  sendLocationEmails: mockLocationEmail,
}))

vi.mock('@/lib/sms', () => ({
  sendLocationSmsClient: mockLocationSms,
}))

vi.mock('@/lib/clients', () => ({
  upsertClientLocation: mockUpsertClient,
}))

vi.mock('@/lib/supabase', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/supabase')>()
  return { ...actual, getSupabase: () => ({ from: mockFrom }) }
})

import { POST, GET }         from '@/app/api/reservations/route'
import { PATCH }              from '@/app/api/reservations/[id]/route'
import { isAdminAuthenticated } from '@/lib/auth'
import type { Reservation }   from '@/lib/types'

// ── Fixture ────────────────────────────────────────────────────────────────

const reservation: Reservation = {
  id: 'test-uuid-001',
  createdAt: '2026-07-01T10:00:00Z',
  nom: 'Marie Martin',
  email: 'marie@test.fr',
  telephone: '0612345678',
  typeDuration: 'court',
  formule: 'journee',
  pack: 'essentiel',
  dateDebut: '2099-07-15',
  statutPro: 'auto-entrepreneur',
  experience: '3-5',
  specialites: ['barber'],
  totalHT: 85,
  tva: 17,
  totalTTC: 102,
  acompte: 51,
  status: 'pending',
  termsAcceptedAt: '2099-01-01T00:00:00Z',
  documentsCommittedAt: '2099-01-01T00:00:00Z',
}

const reservationRequest = {
  ...reservation,
  termsAccepted: true,
  documentsCommitment: true,
  marketingConsent: false,
}

// ── POST /api/reservations ─────────────────────────────────────────────────

describe('POST /api/reservations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFrom.mockReturnValue({ insert: mockInsert })
    mockInsert.mockResolvedValue({ error: null })
    mockLocationEmail.mockResolvedValue({ ok: true, deliveries: [] })
    mockLocationSms.mockResolvedValue({ ok: true, status: 'sent', retryable: false })
    mockUpsertClient.mockResolvedValue(undefined)
  })

  it('crée une réservation et retourne 201', async () => {
    const req = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationRequest),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect((await res.json()).ok).toBe(true)
  })

  it('retourne 500 si Supabase échoue', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB error' } })
    const req = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationRequest),
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBeDefined()
  })

  it('appelle supabase.from("reservations").insert avec les données', async () => {
    const req = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationRequest),
    })
    await POST(req)
    expect(mockFrom).toHaveBeenCalledWith('reservations')
    expect(mockInsert).toHaveBeenCalled()
  })

  it('ne crée et ne notifie qu’une fois deux requêtes concurrentes avec la même clé', async () => {
    const idempotencyKey = '123e4567-e89b-42d3-a456-426614174000'
    let stored: Record<string, unknown> | null = null
    const maybeSingle = vi.fn(async () => ({
      data: stored ? { request_fingerprint: stored.request_fingerprint } : null,
      error: null,
    }))
    const idempotencyEq = vi.fn(() => ({ maybeSingle }))
    const duplicateSelect = vi.fn(() => ({ eq: idempotencyEq }))
    mockInsert.mockImplementation(async (rows: Record<string, unknown>[]) => {
      if (stored) return { error: { code: '23505' } }
      stored = rows[0]
      return { error: null }
    })
    mockFrom.mockReturnValue({ insert: mockInsert, select: duplicateSelect })

    const makeRequest = () => new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify(reservationRequest),
    })
    const responses = await Promise.all([POST(makeRequest()), POST(makeRequest())])
    const bodies = await Promise.all(responses.map(response => response.json()))

    expect(responses.map(response => response.status).sort()).toEqual([200, 201])
    expect(bodies.some(body => body.duplicate === true)).toBe(true)
    expect(mockLocationEmail).toHaveBeenCalledTimes(1)
    expect(mockLocationSms).toHaveBeenCalledTimes(1)
    expect(mockUpsertClient).toHaveBeenCalledTimes(1)
  })

  it('refuse la réutilisation d’une clé pour une autre demande', async () => {
    mockInsert.mockResolvedValueOnce({ error: { code: '23505' } })
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { request_fingerprint: 'f'.repeat(64) }, error: null,
    })
    mockFrom.mockReturnValue({
      insert: mockInsert,
      select: vi.fn(() => ({ eq: vi.fn(() => ({ maybeSingle })) })),
    })
    const response = await POST(new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': '123e4567-e89b-42d3-a456-426614174000',
      },
      body: JSON.stringify(reservationRequest),
    }))

    expect(response.status).toBe(409)
    expect(mockLocationEmail).not.toHaveBeenCalled()
    expect(mockLocationSms).not.toHaveBeenCalled()
  })
})

// ── GET /api/reservations ──────────────────────────────────────────────────

const dbRows = [{
  id: 'row-1', created_at: '2026-07-01T10:00:00Z', nom: 'Test', email: 't@t.fr',
  telephone: '0600000000', type_duration: 'court', formule: 'journee', pack: 'aucun',
  date_debut: '2026-07-15', date_fin: null, heure_debut: null, heure_fin: null,
  statut_pro: 'auto-entrepreneur', experience: '0-3', specialites: [],
  total_ht: '65', tva: '13', total_ttc: '78', acompte: '39', status: 'pending', notes: null,
}]

describe('GET /api/reservations', () => {
  beforeEach(() => {
    mockFrom.mockReturnValue({ select: mockSelect })
    mockSelect.mockReturnValue({ order: mockOrder })
    mockOrder.mockReturnValue({ or: mockOr })
    mockOr.mockResolvedValue({ data: dbRows, error: null })
    vi.mocked(isAdminAuthenticated).mockResolvedValue(true)
  })

  it('retourne 200 avec la liste pour un admin', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json).toHaveLength(1)
    expect(json[0].id).toBe('row-1')
    expect(json[0].totalTTC).toBe(78)
  })

  it('retourne 401 si non admin', async () => {
    vi.mocked(isAdminAuthenticated).mockResolvedValueOnce(false)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('retourne 500 si Supabase échoue', async () => {
    mockOr.mockResolvedValueOnce({ data: null, error: { message: 'DB error' } })
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

// ── PATCH /api/reservations/[id] ───────────────────────────────────────────

describe('PATCH /api/reservations/[id]', () => {
  beforeEach(() => {
    mockEq.mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ update: mockUpdate })
    vi.mocked(isAdminAuthenticated).mockResolvedValue(true)
  })

  it('met à jour le statut et retourne ok', async () => {
    const req = new Request('http://localhost/api/reservations/test-uuid-001', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'test-uuid-001' }) })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
  })

  it('retourne 401 si non admin', async () => {
    vi.mocked(isAdminAuthenticated).mockResolvedValueOnce(false)
    const req = new Request('http://localhost/api/reservations/x', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'x' }) })
    expect(res.status).toBe(401)
  })

  it('retourne 500 si Supabase échoue', async () => {
    mockEq.mockResolvedValueOnce({ error: { message: 'DB error' } })
    const req = new Request('http://localhost/api/reservations/x', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'x' }) })
    expect(res.status).toBe(500)
  })

  it('appelle .update({ status }).eq("id", id)', async () => {
    const req = new Request('http://localhost/api/reservations/abc-42', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'confirmed' }),
    })
    await PATCH(req, { params: Promise.resolve({ id: 'abc-42' }) })
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'confirmed' })
    expect(mockEq).toHaveBeenCalledWith('id', 'abc-42')
  })
})
