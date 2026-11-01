import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { getSupabase } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { normalizeEmail, normalizePhone } from '@/lib/validation'
import { RequestBodyError, readTextBody } from '@/lib/http'

const MAX_CSV_BYTES = 1_000_000
const MAX_CSV_ROWS = 1000

function cleanHeader(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

function splitCsvLine(line: string, delimiter: string) {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    const char = line[index]
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { cell += '"'; index++ }
      else quoted = !quoted
    } else if (char === delimiter && !quoted) {
      cells.push(cell.trim()); cell = ''
    } else cell += char
  }
  cells.push(cell.trim())
  return cells
}

function detectDelimiter(line: string) {
  const candidates = [';', ',', '\t']
  return candidates.sort((a, b) => splitCsvLine(line, b).length - splitCsvLine(line, a).length)[0]
}

function findColumn(headers: string[], aliases: string[]) {
  return headers.findIndex(header => aliases.includes(header))
}

function safeCount(value: string | undefined, fallback = 0) {
  if (value === undefined || value.trim() === '') return fallback
  const parsed = Number.parseInt(value.replace(/[^0-9-]/g, ''), 10)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, 100000)) : fallback
}

function readableDatabaseError(message: string) {
  if (/fetch failed|failed to fetch|network/i.test(message)) {
    return 'Connexion à la base clients impossible. Vérifiez la connexion internet et la configuration Supabase.'
  }
  if (/duplicate key|unique constraint/i.test(message)) {
    return 'Un e-mail ou un téléphone existe déjà sur un autre client. Corrigez le doublon dans le CSV puis réessayez.'
  }
  return message
}

export async function GET(req: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10))
  const activity = ['all', 'rdv', 'location', 'inactive'].includes(searchParams.get('activity') ?? '') ? searchParams.get('activity')! : 'all'
  const sort = ['recent', 'name', 'rdv'].includes(searchParams.get('sort') ?? '') ? searchParams.get('sort')! : 'recent'
  const PER_PAGE = 30

  const safeQuery = q.length >= 2 ? q.slice(0, 80) : ''
  const { data, error } = await getSupabase().rpc('search_clients_admin', {
    p_query: safeQuery,
    p_activity: activity,
    p_sort: sort,
    p_offset: page * PER_PAGE,
    p_limit: PER_PAGE,
  })
  if (error) return NextResponse.json({ error: readableDatabaseError(error.message) }, { status: 500 })
  const rows = (data ?? []) as Array<Record<string, unknown>>
  const total = Number(rows[0]?.total_count ?? 0)
  return NextResponse.json({
    clients: rows.filter(row => row.id !== null && row.id !== undefined).map(row => {
      const client = { ...row }
      delete client.total_count
      return client
    }),
    total,
    page,
    perPage: PER_PAGE,
  })
}

export async function POST(req: Request) {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }
  let raw: string
  try {
    raw = (await readTextBody(req, MAX_CSV_BYTES)).replace(/^\uFEFF/, '')
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400
    return NextResponse.json({ error: status === 413 ? 'Le fichier dépasse 1 Mo.' : 'Fichier CSV invalide.' }, { status })
  }
  if (!raw.trim()) return NextResponse.json({ error: 'Fichier CSV vide.' }, { status: 400 })
  const lines = raw.split(/\r?\n/).filter(line => line.trim())
  if (lines.length < 2) return NextResponse.json({ error: 'Le CSV doit contenir un en-tête et au moins un client.' }, { status: 400 })
  if (lines.length - 1 > MAX_CSV_ROWS) return NextResponse.json({ error: `Maximum ${MAX_CSV_ROWS} clients par import.` }, { status: 413 })

  const delimiter = detectDelimiter(lines[0])
  const headers = splitCsvLine(lines[0], delimiter).map(cleanHeader)
  const fullNameIndex = findColumn(headers, ['nom complet', 'nom et prenom', 'client', 'full name', 'name'])
  const firstNameIndex = findColumn(headers, ['prenom', 'first name'])
  const lastNameIndex = findColumn(headers, ['nom', 'nom de famille', 'last name', 'surname'])
  const emailIndex = findColumn(headers, ['email', 'e mail', 'mail', 'adresse email'])
  const phoneIndex = findColumn(headers, ['telephone', 'tel', 'phone', 'mobile', 'numero de telephone'])
  const rdvIndex = findColumn(headers, ['rdv', 'rdv count', 'nombre rdv', 'nombre de rdv', 'rendez vous'])
  const locationIndex = findColumn(headers, ['locations', 'location count', 'nombre locations', 'nombre de locations'])
  const lastVisitIndex = findColumn(headers, ['dernier rdv', 'derniere visite', 'last rdv', 'last visit'])

  if (fullNameIndex < 0 && firstNameIndex < 0 && lastNameIndex < 0) {
    return NextResponse.json({ error: 'Colonne de nom introuvable. Utilisez « Nom complet » ou « Prénom » et « Nom ».' }, { status: 422 })
  }
  if (emailIndex < 0 && phoneIndex < 0) {
    return NextResponse.json({ error: 'Ajoutez une colonne « Email » ou « Téléphone » pour identifier les clients.' }, { status: 422 })
  }

  const parsed: Array<{ line: number; nom: string; email: string | null; telephone: string | null; rdvCount?: number; locationCount?: number; lastRdvAt?: string | null }> = []
  const errors: Array<{ line: number; message: string }> = []
  for (let index = 1; index < lines.length; index++) {
    const cells = splitCsvLine(lines[index], delimiter)
    const fullName = fullNameIndex >= 0 ? cells[fullNameIndex]?.trim() : ''
    const nom = (fullName || [firstNameIndex >= 0 ? cells[firstNameIndex] : '', lastNameIndex >= 0 ? cells[lastNameIndex] : ''].filter(Boolean).join(' ')).trim().replace(/\s+/g, ' ')
    const emailRaw = emailIndex >= 0 ? cells[emailIndex]?.trim().toLowerCase() : ''
    const phoneRaw = phoneIndex >= 0 ? cells[phoneIndex]?.trim() : ''
    const email = normalizeEmail(emailRaw)
    const telephoneNormalized = normalizePhone(phoneRaw)
    const telephone = telephoneNormalized ? phoneRaw.slice(0, 30) : null
    if (nom.length < 2 || nom.length > 100) { errors.push({ line: index + 1, message: 'Nom invalide' }); continue }
    if (!email && !telephone) { errors.push({ line: index + 1, message: 'Email ou téléphone valide requis' }); continue }
    let lastRdvAt: string | null | undefined
    if (lastVisitIndex >= 0 && cells[lastVisitIndex]?.trim()) {
      const parsedDate = new Date(cells[lastVisitIndex].trim())
      lastRdvAt = Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate.toISOString()
    }
    parsed.push({
      line: index + 1, nom, email, telephone,
      rdvCount: rdvIndex >= 0 ? safeCount(cells[rdvIndex]) : undefined,
      locationCount: locationIndex >= 0 ? safeCount(cells[locationIndex]) : undefined,
      lastRdvAt,
    })
  }
  if (!parsed.length) return NextResponse.json({ error: 'Aucune ligne valide à importer.', skipped: errors.length, errors: errors.slice(0, 20) }, { status: 422 })

  const sb = getSupabase()
  const { data: existing, error: existingError } = await sb
    .from('clients')
    .select('id, email, telephone, rdv_count, location_count, last_rdv_at')
    .limit(10000)
  if (existingError) return NextResponse.json({ error: readableDatabaseError(existingError.message) }, { status: 500 })

  const byEmail = new Map<string, Record<string, unknown>>()
  const byPhone = new Map<string, Record<string, unknown>>()
  for (const client of existing ?? []) {
    if (client.email) byEmail.set(String(client.email).toLowerCase(), client)
    const normalized = normalizePhone(client.telephone)
    if (normalized) byPhone.set(normalized, client)
  }

  const now = new Date().toISOString()
  const records = new Map<string, Record<string, unknown>>()
  let imported = 0
  let updated = 0
  for (const row of parsed) {
    const normalizedPhone = normalizePhone(row.telephone)
    const match = (row.email ? byEmail.get(row.email) : undefined) ?? (normalizedPhone ? byPhone.get(normalizedPhone) : undefined)
    const id = match ? String(match.id) : randomUUID()
    const record = {
      id,
      nom: row.nom,
      email: row.email,
      telephone: row.telephone,
      telephone_normalized: normalizedPhone,
      rdv_count: row.rdvCount ?? Number(match?.rdv_count ?? 0),
      location_count: row.locationCount ?? Number(match?.location_count ?? 0),
      last_rdv_at: row.lastRdvAt ?? match?.last_rdv_at ?? null,
      updated_at: now,
    }
    records.set(id, record)
    if (match) updated++
    else {
      imported++
      if (row.email) byEmail.set(row.email, record)
      if (normalizedPhone) byPhone.set(normalizedPhone, record)
    }
  }

  const allRecords = [...records.values()]
  for (let index = 0; index < allRecords.length; index += 200) {
    const { error } = await sb.from('clients').upsert(allRecords.slice(index, index + 200), { onConflict: 'id' })
    if (error) return NextResponse.json({ error: readableDatabaseError(error.message) }, { status: 500 })
  }

  return NextResponse.json({ ok: true, imported, updated, skipped: errors.length, errors: errors.slice(0, 20) })
}
