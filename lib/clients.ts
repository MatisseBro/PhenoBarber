import { getSupabase } from './supabase'
import { normalizeEmail, normalizePhone } from './validation'

export interface Client {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  lastRdvAt: string | null
  rdvCount: number
  locationCount: number
}

function fromRow(r: Record<string, unknown>): Client {
  return {
    id:            r.id as string,
    nom:           r.nom as string,
    email:         r.email as string | null,
    telephone:     r.telephone as string | null,
    lastRdvAt:     r.last_rdv_at as string | null,
    rdvCount:      Number(r.rdv_count ?? 0),
    locationCount: Number(r.location_count ?? 0),
  }
}

export async function upsertClientRdv(data: {
  nom: string; email: string; telephone: string; marketingConsent?: boolean
}): Promise<void> {
  try {
    const email = normalizeEmail(data.email)
    const telephoneNormalized = normalizePhone(data.telephone)
    if (!email || !telephoneNormalized) return
    const sb = getSupabase()
    const { error } = await sb.rpc('upsert_client_activity', {
      p_nom: data.nom.trim(),
      p_email: email,
      p_telephone: data.telephone.trim(),
      p_telephone_normalized: telephoneNormalized,
      p_activity: 'rdv',
      p_marketing_consent: data.marketingConsent ?? null,
    })
    if (error) throw error
  } catch {
    console.error('[clients] Échec de mise à jour du client après rendez-vous')
  }
}

export async function upsertClientLocation(data: {
  nom: string; email: string; telephone: string; marketingConsent?: boolean
}): Promise<void> {
  try {
    const email = normalizeEmail(data.email)
    const telephoneNormalized = normalizePhone(data.telephone)
    if (!email || !telephoneNormalized) return
    const sb = getSupabase()
    const { error } = await sb.rpc('upsert_client_activity', {
      p_nom: data.nom.trim(),
      p_email: email,
      p_telephone: data.telephone.trim(),
      p_telephone_normalized: telephoneNormalized,
      p_activity: 'location',
      p_marketing_consent: data.marketingConsent ?? null,
    })
    if (error) throw error
  } catch {
    console.error('[clients] Échec de mise à jour du client après demande de location')
  }
}

export async function lookupClient(emailValue: string, phoneValue: string): Promise<Client | null> {
  const email = normalizeEmail(emailValue)
  const telephone = normalizePhone(phoneValue)
  if (!email || !telephone) return null
  const sb = getSupabase()
  const { data, error } = await sb
    .from('clients')
    .select('*')
    .eq('email', email)
    .eq('telephone_normalized', telephone)
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data ? fromRow(data as Record<string, unknown>) : null
}

export async function isReturningClient(emailValue: string, phoneValue: string): Promise<boolean> {
  const email = normalizeEmail(emailValue)
  const telephone = normalizePhone(phoneValue)
  if (!email || !telephone) return false
  const sb = getSupabase()
  const result = await sb
    .from('clients')
    .select('id, rdv_count')
    .eq('email', email)
    .eq('telephone_normalized', telephone)
    .limit(1)
    .maybeSingle()
  if (result.error) throw result.error
  return Number(result.data?.rdv_count ?? 0) > 0
}

export async function getInactiveClients(daysInactive: number): Promise<Client[]> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - daysInactive)
  const sb = getSupabase()
  const { data, error } = await sb
    .from('clients')
    .select('*')
    .not('email', 'is', null)
    .eq('marketing_consent', true)
    .lt('last_rdv_at', cutoff.toISOString())
    .order('last_rdv_at', { ascending: true })
    .limit(100)
  if (error) throw error
  return (data ?? []).map(r => fromRow(r as Record<string, unknown>))
}
