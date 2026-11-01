export type FormulaType = 'horaire' | 'demi-journee' | 'journee' | 'semaine' | 'mois'
export type PackType = 'aucun' | 'essentiel' | 'premium'
export type StatusType = 'pending' | 'confirmed' | 'cancelled'
export type StatutPro = 'auto-entrepreneur' | 'societe' | 'en-cours'
export type ExperienceType = '0-3' | '3-5' | '5-10' | '10+'
export type SpecialiteType = 'mixte' | 'barber' | 'afro' | 'coloriste' | 'design'

export interface Reservation {
  id: string
  createdAt: string
  nom: string
  email: string
  telephone: string
  typeDuration: 'court' | 'long'
  formule: FormulaType
  pack: PackType
  dateDebut: string
  dateFin?: string
  heureDebut?: string
  heureFin?: string
  statutPro: StatutPro
  experience: ExperienceType
  specialites: SpecialiteType[]
  totalHT: number
  tva: number
  totalTTC: number
  acompte: number
  status: StatusType
  notes?: string
  termsAcceptedAt?: string
  documentsCommittedAt?: string
  marketingConsent?: boolean
}

export interface PricingResult {
  totalHT: number
  tva: number
  totalTTC: number
  acompte: number
  nbJours: number
}
