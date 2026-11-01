export type RdvStatus = 'pending' | 'confirmed' | 'cancelled'
export type RdvCat = 'homme' | 'femme' | 'enfant'

export interface RdvBooking {
  id: string
  createdAt: string
  nom: string
  email: string
  telephone: string
  categorie: RdvCat
  prestation: string
  prestationLabel: string
  degrade?: string
  degradeLabel?: string
  options: string[]
  optionsLabels: string[]
  totalPrice: number
  totalDuration: number
  date: string
  slot: string
  status: RdvStatus
  notes?: string
  groupId?: string
  personLabel?: string
}
