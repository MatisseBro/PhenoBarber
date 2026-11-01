import { PostgrestClient } from '@supabase/postgrest-js'
import type {
  Reservation, FormulaType, PackType,
  StatutPro, ExperienceType, SpecialiteType, StatusType,
} from './types'

export function getSupabase() {
  const url = process.env.SUPABASE_URL?.trim()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceRoleKey) {
    throw new Error('Configuration Supabase serveur incomplète')
  }
  return new PostgrestClient(`${url.replace(/\/$/, '')}/rest/v1`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  })
}

export function toRow(r: Reservation): Record<string, unknown> {
  return {
    id:            r.id,
    created_at:    r.createdAt,
    nom:           r.nom,
    email:         r.email,
    telephone:     r.telephone,
    type_duration: r.typeDuration,
    formule:       r.formule,
    pack:          r.pack,
    date_debut:    r.dateDebut,
    date_fin:      r.dateFin    ?? null,
    heure_debut:   r.heureDebut ?? null,
    heure_fin:     r.heureFin   ?? null,
    statut_pro:    r.statutPro,
    experience:    r.experience,
    specialites:   r.specialites,
    total_ht:      r.totalHT,
    tva:           r.tva,
    total_ttc:     r.totalTTC,
    acompte:       r.acompte,
    status:        r.status,
    notes:         r.notes ?? null,
    terms_accepted_at: r.termsAcceptedAt ?? null,
    documents_committed_at: r.documentsCommittedAt ?? null,
    marketing_consent: r.marketingConsent ?? false,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromRow(row: any): Reservation {
  return {
    id:           row.id,
    createdAt:    row.created_at,
    nom:          row.nom,
    email:        row.email,
    telephone:    row.telephone,
    typeDuration: row.type_duration as 'court' | 'long',
    formule:      row.formule      as FormulaType,
    pack:         row.pack         as PackType,
    dateDebut:    row.date_debut,
    dateFin:      row.date_fin    ?? undefined,
    heureDebut:   row.heure_debut ?? undefined,
    heureFin:     row.heure_fin   ?? undefined,
    statutPro:    row.statut_pro  as StatutPro,
    experience:   row.experience  as ExperienceType,
    specialites:  row.specialites as SpecialiteType[],
    totalHT:      Number(row.total_ht),
    tva:          Number(row.tva),
    totalTTC:     Number(row.total_ttc),
    acompte:      Number(row.acompte),
    status:       row.status as StatusType,
    notes:        row.notes ?? undefined,
    termsAcceptedAt: row.terms_accepted_at ?? undefined,
    documentsCommittedAt: row.documents_committed_at ?? undefined,
    marketingConsent: Boolean(row.marketing_consent),
  }
}
