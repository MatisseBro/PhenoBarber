import type { RdvCat } from './rdv-types'

export type Cat = RdvCat

export interface Svc {
  id: string
  label: string
  price: number
  dur: number
  hasSub?: boolean
  from?: boolean
  wa?: boolean
}

export interface Opt {
  id: string
  label: string
  price: number
  dur: number
  cats: Cat[]
}

export const SVCS: Record<Cat, Svc[]> = {
  homme: [
    { id: 'degrade', label: 'Dégradé', price: 25, dur: 30, hasSub: true },
    { id: 'coupe-barbe-r', label: 'Coupe + barbe rapide', price: 30, dur: 45 },
    { id: 'coupe-barbe-c', label: 'Coupe + barbe complète', price: 35, dur: 60 },
    { id: 'buzz', label: 'Buzz Cut', price: 25, dur: 25 },
    { id: 'waves', label: 'Waves', price: 30, dur: 60, from: true },
    { id: 'forfait-soin', label: 'Forfait complet - Coupe + shampoing + coiffage', price: 45, dur: 60, from: true },
    { id: 'forfait-curly', label: 'Forfait Curly / Boucles', price: 55, dur: 75, from: true },
    { id: 'color-caramel', label: 'Highlights / Mèches', price: 45, dur: 90, from: true, wa: true },
    { id: 'coloration', label: 'Coloration totale', price: 50, dur: 90, from: true, wa: true },
    { id: 'decoloration', label: 'Blanc polaire / Décoloration', price: 80, dur: 120, from: true, wa: true },
    { id: 'tresses-h', label: 'Tresses plaquées', price: 30, dur: 90, from: true, wa: true },
    { id: 'produits-h', label: 'Apportez vos produits', price: 25, dur: 45, from: true },
    { id: 'autre-h', label: 'Autre - sur devis', price: 0, dur: 0, wa: true },
  ],
  femme: [
    { id: 'big-chop', label: 'Big Chop', price: 35, dur: 45 },
    { id: 'buzz-f', label: 'Buzz Cut classique', price: 25, dur: 25 },
    { id: 'big-chop-s', label: 'Big Chop + shampoing + coupe', price: 55, dur: 75 },
    { id: 'forfait-f', label: 'Forfait complet - Coupe + shampoing + soin + coiffage', price: 55, dur: 75, from: true },
    { id: 'forfait-f-curl', label: 'Forfait Curly / Boucles', price: 65, dur: 90, from: true },
    { id: 'color-f', label: 'Highlights / Mèches', price: 55, dur: 90, from: true, wa: true },
    { id: 'blond-patine', label: 'Blond avec patine', price: 85, dur: 120, from: true, wa: true },
    { id: 'blanc-polaire-f', label: 'Blanc polaire / Décoloration', price: 95, dur: 150, from: true, wa: true },
    { id: 'tresses-f', label: 'Tresses plaquées', price: 30, dur: 90, from: true, wa: true },
    { id: 'produits-f', label: 'Apportez vos produits', price: 25, dur: 45, from: true },
    { id: 'autre-f', label: 'Autre - sur devis', price: 0, dur: 0, wa: true },
  ],
  enfant: [
    { id: 'coupe-e', label: 'Coupe enfant - 2 à 16 ans', price: 18, dur: 25 },
    { id: 'degrade-e', label: 'Dégradé enfant', price: 20, dur: 30 },
    { id: 'tresses-e', label: 'Tresses plaquées', price: 30, dur: 60, from: true, wa: true },
    { id: 'autre-e', label: 'Autre - sur demande', price: 0, dur: 0, wa: true },
  ],
}

export const DEGS = [
  { id: 'uniforme', label: 'Coupe simple / uniforme', desc: 'Même longueur partout, contours propres' },
  { id: 'classique', label: 'Dégradé classique', desc: 'Dégradé simple et naturel' },
  { id: 'skin', label: 'Skin fade', desc: 'Dégradé descendant à blanc - low, mid ou high' },
  { id: 'taper', label: 'Taper / tempes-nuque', desc: 'Dégradé léger aux tempes et nuque' },
  { id: 'low', label: 'Low fade', desc: 'Dégradé bas' },
  { id: 'mid', label: 'Mid fade', desc: 'Dégradé moyen' },
  { id: 'high', label: 'High fade', desc: 'Dégradé haut' },
  { id: 'burst', label: 'Burst fade', desc: "Dégradé arrondi autour de l'oreille" },
  { id: 'hightop', label: 'High top', desc: 'Coupe afro haute structurée' },
  { id: 'nsp', label: 'À voir sur place', desc: 'Conseil personnalisé au salon' },
] as const

export const OPTS: Opt[] = [
  { id: 'sham', label: 'Shampoing', price: 10, dur: 10, cats: ['homme', 'femme', 'enfant'] },
  { id: 'pointes', label: 'Coupe des pointes', price: 10, dur: 10, cats: ['femme'] },
  { id: 'soin', label: 'Soin / retour des boucles', price: 20, dur: 20, cats: ['homme', 'femme'] },
  { id: 'twist', label: 'Twist éponge', price: 5, dur: 10, cats: ['homme'] },
  { id: 'design-s', label: 'Design simple', price: 5, dur: 5, cats: ['homme'] },
  { id: 'design-c', label: 'Design complexe', price: 10, dur: 10, cats: ['homme'] },
  { id: 'design-x', label: 'Design complet', price: 25, dur: 20, cats: ['homme'] },
  { id: 'sc', label: 'Shampoing + coiffage', price: 15, dur: 20, cats: ['femme'] },
  { id: 'ssc', label: 'Shampoing + soin + coiffage', price: 25, dur: 30, cats: ['femme'] },
  { id: 'contour', label: 'Contour + dégradé barbe', price: 8, dur: 10, cats: ['homme'] },
]

export const FIDELE_PRIX: Record<string, number> = { degrade: 22, buzz: 22, 'buzz-f': 22, 'coupe-e': 15 }

export function resolveRdvSelection(input: {
  categorie: unknown
  prestation: unknown
  degrade?: unknown
  options?: unknown
  detangling?: boolean
  loyal?: boolean
}) {
  if (!['homme', 'femme', 'enfant'].includes(String(input.categorie))) return null
  const categorie = input.categorie as Cat
  if (typeof input.prestation !== 'string') return null
  const service = SVCS[categorie].find(item => item.id === input.prestation)
  if (!service) return null

  const degrade = typeof input.degrade === 'string' ? DEGS.find(item => item.id === input.degrade) : undefined
  if (service.hasSub && !degrade) return null
  if (!Array.isArray(input.options) || input.options.length > 10 || !input.options.every(id => typeof id === 'string')) return null
  const uniqueOptions = [...new Set(input.options)]
  const options = uniqueOptions.map(id => OPTS.find(item => item.id === id && item.cats.includes(categorie)))
  if (options.some(item => !item)) return null
  const validOptions = options.filter((item): item is Opt => Boolean(item))

  const basePrice = input.loyal && FIDELE_PRIX[service.id] !== undefined ? FIDELE_PRIX[service.id] : service.price
  const detangleExtra = input.detangling ? 5 : 0
  return {
    categorie,
    service,
    degrade,
    options: validOptions,
    totalPrice: basePrice + validOptions.reduce((sum, item) => sum + item.price, 0) + detangleExtra,
    totalDuration: service.dur + validOptions.reduce((sum, item) => sum + item.dur, 0) + detangleExtra,
  }
}
