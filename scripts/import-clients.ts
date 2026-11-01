/**
 * Import clients depuis un CSV dans Supabase
 *
 * Aperçu sans écriture :
 *   npx tsx scripts/import-clients.ts chemin/vers/clients.csv
 *
 * Application volontaire :
 *   PHENO_ALLOW_CLIENT_IMPORT=true npx tsx scripts/import-clients.ts chemin/vers/clients.csv --apply --target-ref=<project-ref>
 *
 * Format CSV attendu (première ligne = en-têtes) :
 *   nom,email,telephone
 *   ou : prenom,nom,email,tel
 *   ou : first_name,last_name,email,phone
 *
 * Les colonnes sont détectées automatiquement par nom (insensible à la casse).
 */

import fs from 'fs'
import readline from 'readline'
import { randomUUID } from 'crypto'
import { getSupabase } from '../lib/supabase'

const args = process.argv.slice(2)
const FILE = args.find(value => !value.startsWith('--'))
const apply = args.includes('--apply')
const targetRef = args.find(value => value.startsWith('--target-ref='))?.slice('--target-ref='.length)
if (!FILE) {
  console.error('❌  Usage : npx tsx scripts/import-clients.ts <fichier.csv>')
  process.exit(1)
}
const inputFile = FILE

if (apply && (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.error('❌  SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis pour appliquer un import.')
  process.exit(1)
}

let configuredRef = ''
if (apply) {
  try {
    configuredRef = new URL(process.env.SUPABASE_URL!).hostname.split('.')[0]
  } catch {
    console.error('❌  Cible Supabase invalide.')
    process.exit(1)
  }
}

if (apply && (process.env.PHENO_ALLOW_CLIENT_IMPORT !== 'true' || !targetRef || targetRef !== configuredRef)) {
  console.error('❌  Import refusé : --apply, PHENO_ALLOW_CLIENT_IMPORT=true et --target-ref exact sont requis.')
  process.exit(1)
}

const sb = apply ? getSupabase() : null

function normalize(headers: string[]): (row: string[]) => { nom: string; email: string; telephone: string } {
  const h = headers.map(h => h.toLowerCase().trim().replace(/[^a-z_]/g, ''))
  const idx = (names: string[]) => names.reduce((acc, n) => acc >= 0 ? acc : h.indexOf(n), -1)

  const nomIdx    = idx(['nom', 'name', 'last_name', 'lastname'])
  const prenomIdx = idx(['prenom', 'firstname', 'first_name', 'prénom'])
  const emailIdx  = idx(['email', 'mail', 'courriel'])
  const telIdx    = idx(['telephone', 'tel', 'phone', 'mobile', 'gsm', 'portable'])

  return (row) => {
    const nom = [
      prenomIdx >= 0 ? row[prenomIdx]?.trim() : '',
      nomIdx    >= 0 ? row[nomIdx]?.trim()    : '',
    ].filter(Boolean).join(' ') || row[0]?.trim() || 'Inconnu'
    return {
      nom,
      email:     emailIdx >= 0 ? (row[emailIdx]?.trim() ?? '') : '',
      telephone: telIdx   >= 0 ? (row[telIdx]?.trim()   ?? '') : '',
    }
  }
}

async function run() {
  const rl = readline.createInterface({ input: fs.createReadStream(inputFile), crlfDelay: Infinity })

  let headers: string[] = []
  let mapper: ReturnType<typeof normalize> | null = null
  let inserted = 0, skipped = 0, errors = 0

  for await (const line of rl) {
    if (!line.trim()) continue
    const row = line.split(/[,;]/).map(c => c.replace(/^"|"$/g, '').trim())

    if (!mapper) {
      headers = row
      mapper = normalize(headers)
      console.log(`📋 En-têtes détectés : ${headers.join(', ')}`)
      continue
    }

    const { nom, email, telephone } = mapper(row)
    if (!email && !telephone) { skipped++; continue }

    if (!apply) {
      inserted++
      continue
    }

    const { error } = await sb!.from('clients').upsert([{
      id: randomUUID(),
      nom,
      email: email || null,
      telephone: telephone || null,
      rdv_count: 0,
      location_count: 0,
    }], { onConflict: 'email', ignoreDuplicates: false })

    if (error) {
      console.warn('⚠️  Échec de l’import d’une fiche client')
      errors++
    } else {
      inserted++
      if (inserted % 50 === 0) console.log(`   … ${inserted} clients importés`)
    }
  }

  const mode = apply ? 'Import terminé' : 'Aperçu terminé sans écriture'
  console.log(`\n✅  ${mode} : ${inserted} valides / ${skipped} ignorés (sans contact) / ${errors} erreurs`)
}

run().catch(() => { console.error('❌  Erreur fatale lors de l’import client'); process.exit(1) })
