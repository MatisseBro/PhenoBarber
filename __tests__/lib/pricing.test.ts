import { describe, it, expect } from 'vitest'
import { calculatePrice } from '@/lib/pricing'

describe('calculatePrice', () => {

  // ── Cas invalides ──────────────────────────────────────────────────────────

  it('retourne null si dateDebut vide', () => {
    expect(calculatePrice('journee', 'aucun', '')).toBeNull()
  })

  it('retourne null pour horaire sans heures', () => {
    expect(calculatePrice('horaire', 'aucun', '2026-07-10')).toBeNull()
  })

  it('retourne null pour semaine sans dateFin', () => {
    expect(calculatePrice('semaine', 'aucun', '2026-07-07')).toBeNull()
  })

  it('retourne null pour mois sans dateFin', () => {
    expect(calculatePrice('mois', 'aucun', '2026-07-01')).toBeNull()
  })

  // ── Horaire ────────────────────────────────────────────────────────────────

  it('horaire 1h sans pack → 10 HT / 12 TTC / 6 acompte', () => {
    const r = calculatePrice('horaire', 'aucun', '2026-07-10', undefined, '10:00', '11:00')
    expect(r).not.toBeNull()
    expect(r!.totalHT).toBe(10)
    expect(r!.tva).toBe(2)
    expect(r!.totalTTC).toBe(12)
    expect(r!.acompte).toBe(6)   // 50% pour courte durée
  })

  it('horaire 2h → 20 HT / 24 TTC', () => {
    const r = calculatePrice('horaire', 'aucun', '2026-07-10', undefined, '10:00', '12:00')
    expect(r!.totalHT).toBe(20)
    expect(r!.totalTTC).toBe(24)
  })

  it('horaire 2h30 → 25 HT', () => {
    const r = calculatePrice('horaire', 'aucun', '2026-07-10', undefined, '10:00', '12:30')
    expect(r!.totalHT).toBe(25)
  })

  // ── Demi-journée ───────────────────────────────────────────────────────────

  it('demi-journée sans pack → 35 HT / 42 TTC / 21 acompte', () => {
    const r = calculatePrice('demi-journee', 'aucun', '2026-07-10')
    expect(r!.totalHT).toBe(35)
    expect(r!.totalTTC).toBe(42)
    expect(r!.acompte).toBe(21)
  })

  it('demi-journée pack essentiel → 55 HT', () => {
    const r = calculatePrice('demi-journee', 'essentiel', '2026-07-10')
    expect(r!.totalHT).toBe(55) // 35 + 20
  })

  it('demi-journée pack premium → 65 HT', () => {
    const r = calculatePrice('demi-journee', 'premium', '2026-07-10')
    expect(r!.totalHT).toBe(65) // 35 + 30
  })

  // ── Journée ────────────────────────────────────────────────────────────────

  it('journée sans pack → 65 HT / 78 TTC / 39 acompte', () => {
    const r = calculatePrice('journee', 'aucun', '2026-07-10')
    expect(r!.totalHT).toBe(65)
    expect(r!.tva).toBe(13)
    expect(r!.totalTTC).toBe(78)
    expect(r!.acompte).toBe(39)
  })

  it('journée pack essentiel → 85 HT', () => {
    const r = calculatePrice('journee', 'essentiel', '2026-07-10')
    expect(r!.totalHT).toBe(85) // 65 + 20
  })

  it('journée pack premium → 95 HT', () => {
    const r = calculatePrice('journee', 'premium', '2026-07-10')
    expect(r!.totalHT).toBe(95) // 65 + 30
  })

  // ── Semaine ────────────────────────────────────────────────────────────────

  it('semaine 5 jours sans pack → 300 HT / 25% acompte', () => {
    const r = calculatePrice('semaine', 'aucun', '2026-07-07', '2026-07-11')
    expect(r!.nbJours).toBe(5)
    expect(r!.totalHT).toBe(300)         // 5 × 60
    expect(r!.totalTTC).toBe(360)
    expect(r!.acompte).toBe(90)          // 25% de 360
  })

  it('semaine 5 jours pack essentiel → 400 HT', () => {
    const r = calculatePrice('semaine', 'essentiel', '2026-07-07', '2026-07-11')
    expect(r!.totalHT).toBe(400)         // 5×60 + 5×20
  })

  it('semaine 1 jour (même date debut=fin) → 1 jour minimum', () => {
    const r = calculatePrice('semaine', 'aucun', '2026-07-07', '2026-07-07')
    expect(r!.nbJours).toBe(1)
    expect(r!.totalHT).toBe(60)
  })

  // ── Mois ───────────────────────────────────────────────────────────────────

  it('mois sur 30 jours calendaires facture les 22 jours ouvrés', () => {
    const r = calculatePrice('mois', 'aucun', '2026-07-01', '2026-07-30')
    expect(r!.nbJours).toBe(22)
    expect(r!.totalHT).toBe(1210)        // 22 × 55
    expect(r!.acompte).toBeCloseTo(r!.totalTTC * 0.25, 2)
  })

  it('mois sur 30 jours avec pack premium facture les 22 jours ouvrés', () => {
    const r = calculatePrice('mois', 'premium', '2026-07-01', '2026-07-30')
    expect(r!.totalHT).toBe(1870)        // 22×55 + 22×30
  })

  // ── Arrondi r2 ────────────────────────────────────────────────────────────

  it('rejette les horaires hors des créneaux de 30 minutes', () => {
    const r = calculatePrice('horaire', 'aucun', '2026-07-10', undefined, '10:00', '11:20')
    expect(r).toBeNull()
  })

})
