import type { FormulaType, PackType, PricingResult } from './types'
import { isIsoDate } from './validation'

const BASE_RATES: Record<FormulaType, number> = { horaire: 10, 'demi-journee': 35, journee: 65, semaine: 60, mois: 55 }
const PACK_RATES: Record<PackType, number> = { aucun: 0, essentiel: 20, premium: 30 }

export interface LocationPricingResult extends PricingResult {
  baseHT: number; packHT: number; acompteTaux: number; acompteTTC: number; soldeTTC: number
  formuleLabel: string; packLabel: string; durationDetails: string; businessDays: number
}

function r2(n: number) { return Math.round(n * 100) / 100 }

function businessDaysBetween(start: string, end: string): number {
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const cursor = new Date(Date.UTC(sy, sm - 1, sd))
  const endDate = new Date(Date.UTC(ey, em - 1, ed))
  if (cursor > endDate) return 0
  let count = 0
  while (cursor <= endDate) {
    const day = cursor.getUTCDay()
    if (day !== 0 && day !== 1) count++
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return count
}

function hoursBetween(start: string, end: string): number {
  const timePattern = /^(?:0\d|1\d|2[0-3]):(?:00|30)$/
  if (!timePattern.test(start) || !timePattern.test(end)) return 0
  const [ah, am] = start.split(':').map(Number)
  const [bh, bm] = end.split(':').map(Number)
  if (ah < 10 || bh > 18) return 0
  return (bh * 60 + bm - ah * 60 - am) / 60
}

export function calculateLocationPrice(input: {
  typeDuration: 'court' | 'long'; formule: FormulaType; pack: PackType; dateDebut: string
  dateFin?: string; heureDebut?: string; heureFin?: string
}): LocationPricingResult | null {
  const { typeDuration, formule, pack, dateDebut, dateFin, heureDebut, heureFin } = input
  if (!isIsoDate(dateDebut) || !(formule in BASE_RATES) || !(pack in PACK_RATES)) return null
  const isLong = formule === 'semaine' || formule === 'mois'
  if ((typeDuration === 'long') !== isLong) return null
  if (isLong && !dateFin) return null
  const endDate = dateFin || dateDebut
  if (!isIsoDate(endDate) || endDate < dateDebut) return null
  const businessDays = businessDaysBetween(dateDebut, endDate)
  if (businessDays < 1) return null

  let baseHT = 0, formuleLabel = '', durationDetails = ''
  if (formule === 'horaire') {
    if (!heureDebut || !heureFin) return null
    const hours = hoursBetween(heureDebut, heureFin)
    if (hours <= 0 || hours > 8) return null
    baseHT = hours * BASE_RATES.horaire * businessDays
    formuleLabel = "À l'heure - 10 € HT"
    durationDetails = `${hours.toFixed(1)}h / jour sur ${businessDays} jour${businessDays > 1 ? 's' : ''} ouvré${businessDays > 1 ? 's' : ''}`
  } else if (formule === 'demi-journee') {
    baseHT = BASE_RATES[formule] * businessDays
    formuleLabel = 'Demi-journée (4h) - 35 € HT'
    durationDetails = `Demi-journée (4h) × ${businessDays} jour${businessDays > 1 ? 's' : ''} ouvré${businessDays > 1 ? 's' : ''}`
  } else if (formule === 'journee') {
    baseHT = BASE_RATES[formule] * businessDays
    formuleLabel = 'Journée - 65 € HT'
    durationDetails = `${businessDays} jour${businessDays > 1 ? 's' : ''} ouvré${businessDays > 1 ? 's' : ''}`
  } else {
    baseHT = BASE_RATES[formule] * businessDays
    formuleLabel = formule === 'semaine' ? 'Semaine - 60 € HT / jour' : 'Mensuel - 55 € HT / jour'
    durationDetails = `${businessDays} jour${businessDays > 1 ? 's' : ''} ouvré${businessDays > 1 ? 's' : ''} (Tarif ${formule === 'semaine' ? 'Semaine' : 'Mensuel'})`
  }

  const packHT = PACK_RATES[pack] * businessDays
  const packLabel = pack === 'aucun' ? 'Aucun - 0 €' : pack === 'essentiel' ? 'Pack Essentiel - 20 € HT / jour' : 'Pack Premium - 30 € HT / jour'
  const totalHT = r2(baseHT + packHT), tva = r2(totalHT * 0.2), totalTTC = r2(totalHT + tva)
  const acompteTaux = typeDuration === 'court' ? 0.5 : 0.25
  const acompteTTC = r2(totalTTC * acompteTaux), soldeTTC = r2(totalTTC - acompteTTC)
  return { baseHT: r2(baseHT), packHT: r2(packHT), totalHT, tva, totalTTC, acompte: acompteTTC, acompteTaux, acompteTTC, soldeTTC, formuleLabel, packLabel, durationDetails, businessDays, nbJours: businessDays }
}

export function calculatePrice(
  formule: FormulaType,
  pack: PackType,
  dateDebut: string,
  dateFin?: string,
  heureDebut?: string,
  heureFin?: string,
): PricingResult | null {
  return calculateLocationPrice({
    typeDuration: formule === 'semaine' || formule === 'mois' ? 'long' : 'court',
    formule, pack, dateDebut, dateFin, heureDebut, heureFin,
  })
}
