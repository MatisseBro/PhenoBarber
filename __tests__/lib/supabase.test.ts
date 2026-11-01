import { describe, it, expect } from 'vitest'

import { toRow, fromRow, getSupabase } from '@/lib/supabase'
import type { Reservation } from '@/lib/types'

const mockReservation: Reservation = {
  id: 'abc-123',
  createdAt: '2026-07-01T10:00:00Z',
  nom: 'Jean Dupont',
  email: 'jean@test.fr',
  telephone: '0769432605',
  typeDuration: 'court',
  formule: 'journee',
  pack: 'essentiel',
  dateDebut: '2026-07-10',
  dateFin: undefined,
  heureDebut: undefined,
  heureFin: undefined,
  statutPro: 'auto-entrepreneur',
  experience: '3-5',
  specialites: ['barber', 'mixte'],
  totalHT: 85,
  tva: 17,
  totalTTC: 102,
  acompte: 51,
  status: 'pending',
  notes: undefined,
}

describe('toRow', () => {
  it('convertit une réservation en ligne DB', () => {
    const row = toRow(mockReservation)
    expect(row.id).toBe('abc-123')
    expect(row.nom).toBe('Jean Dupont')
    expect(row.email).toBe('jean@test.fr')
    expect(row.formule).toBe('journee')
    expect(row.pack).toBe('essentiel')
    expect(row.type_duration).toBe('court')
    expect(row.statut_pro).toBe('auto-entrepreneur')
    expect(row.total_ht).toBe(85)
    expect(row.tva).toBe(17)
    expect(row.total_ttc).toBe(102)
    expect(row.acompte).toBe(51)
    expect(row.status).toBe('pending')
  })

  it('met les champs optionnels à null si absents', () => {
    const row = toRow(mockReservation)
    expect(row.date_fin).toBeNull()
    expect(row.heure_debut).toBeNull()
    expect(row.heure_fin).toBeNull()
    expect(row.notes).toBeNull()
  })

  it('passe les champs optionnels quand présents', () => {
    const withOptional: Reservation = {
      ...mockReservation,
      formule: 'horaire',
      dateFin: '2026-07-11',
      heureDebut: '10:00',
      heureFin: '12:00',
      notes: 'Demande spéciale',
    }
    const row = toRow(withOptional)
    expect(row.date_fin).toBe('2026-07-11')
    expect(row.heure_debut).toBe('10:00')
    expect(row.heure_fin).toBe('12:00')
    expect(row.notes).toBe('Demande spéciale')
  })
})

describe('runtime Supabase Node', () => {
  it('construit le client REST sans initialiser Realtime/WebSocket', () => {
    const previousUrl = process.env.SUPABASE_URL
    const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-placeholder'
    expect(() => getSupabase()).not.toThrow()
    if (previousUrl === undefined) delete process.env.SUPABASE_URL
    else process.env.SUPABASE_URL = previousUrl
    if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
    else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey
  })
})

describe('fromRow', () => {
  it('convertit une ligne DB en réservation', () => {
    const dbRow = {
      id: 'abc-123',
      created_at: '2026-07-01T10:00:00Z',
      nom: 'Jean Dupont',
      email: 'jean@test.fr',
      telephone: '0769432605',
      type_duration: 'court',
      formule: 'journee',
      pack: 'essentiel',
      date_debut: '2026-07-10',
      date_fin: null,
      heure_debut: null,
      heure_fin: null,
      statut_pro: 'auto-entrepreneur',
      experience: '3-5',
      specialites: ['barber', 'mixte'],
      total_ht: '85.00',
      tva: '17.00',
      total_ttc: '102.00',
      acompte: '51.00',
      status: 'pending',
      notes: null,
    }
    const r = fromRow(dbRow)
    expect(r.id).toBe('abc-123')
    expect(r.nom).toBe('Jean Dupont')
    expect(r.formule).toBe('journee')
    expect(r.totalHT).toBe(85)
    expect(r.totalTTC).toBe(102)
    expect(r.acompte).toBe(51)
    expect(r.dateFin).toBeUndefined()
    expect(r.notes).toBeUndefined()
  })

  it('parse les valeurs numériques depuis strings DB', () => {
    const dbRow = {
      id: 'x', created_at: '', nom: '', email: '', telephone: '',
      type_duration: 'court', formule: 'journee', pack: 'aucun',
      date_debut: '', date_fin: null, heure_debut: null, heure_fin: null,
      statut_pro: 'auto-entrepreneur', experience: '0-3',
      specialites: [], total_ht: '100.00', tva: '20.00',
      total_ttc: '120.00', acompte: '60.00', status: 'pending', notes: null,
    }
    const r = fromRow(dbRow)
    expect(typeof r.totalHT).toBe('number')
    expect(r.totalHT).toBe(100)
    expect(r.tva).toBe(20)
    expect(r.totalTTC).toBe(120)
    expect(r.acompte).toBe(60)
  })

  it('toRow → fromRow est idempotent', () => {
    const row = toRow(mockReservation)
    // Simuler ce que Supabase renverrait (numeric → string)
    const dbRow = { ...row, total_ht: String(row.total_ht), tva: String(row.tva), total_ttc: String(row.total_ttc), acompte: String(row.acompte) }
    const restored = fromRow(dbRow)
    expect(restored.id).toBe(mockReservation.id)
    expect(restored.totalHT).toBe(mockReservation.totalHT)
    expect(restored.totalTTC).toBe(mockReservation.totalTTC)
    expect(restored.specialites).toEqual(mockReservation.specialites)
  })
})
