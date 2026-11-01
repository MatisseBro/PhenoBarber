import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migration003 = readFileSync('supabase/migrations/003_security_hardening.sql', 'utf8')
const migration004 = readFileSync('supabase/migrations/004_phone_and_client_search_fixes.sql', 'utf8')

describe('Supabase migration regression safeguards', () => {
  it.each([
    ['003', migration003],
    ['004', migration004],
  ])('contrôle les collisions téléphone avant la mise à jour (%s)', (_name, sql) => {
    const collisionCheck = sql.indexOf('raise exception')
    const phoneUpdate = sql.indexOf('update public.clients')

    expect(collisionCheck).toBeGreaterThanOrEqual(0)
    expect(phoneUpdate).toBeGreaterThan(collisionCheck)
    expect(sql).toContain("regexp_replace(telephone, '[^0-9]', '', 'g')")
    expect(sql).toContain("'33' || substring(digits from 2)")
  })

  it('retourne une ligne de comptage même si la page SQL est vide', () => {
    expect(migration003).toContain('from counted left join page on true')
    expect(migration004).toContain('from counted left join page on true')
  })

  it('conserve 004 transactionnelle, non destructive et idempotente', () => {
    expect(migration004.trimStart()).toMatch(/^--[\s\S]*\bbegin;/i)
    expect(migration004.trimEnd()).toMatch(/commit;$/i)
    expect(migration004).not.toMatch(/\b(?:delete\s+from|truncate|drop\s+table|drop\s+column)\b/i)
    expect(migration004).toContain('drop index if exists public.clients_telephone_normalized_unique')
    expect(migration004).toContain('create unique index clients_telephone_normalized_unique')
    expect(migration004.indexOf('update public.clients')).toBeLessThan(
      migration004.indexOf('create unique index clients_telephone_normalized_unique'),
    )
  })

  it('restreint la RPC de recherche au rôle serveur après son remplacement', () => {
    expect(migration004).toContain('language sql\nstable\nsecurity definer')
    expect(migration004).toContain('set search_path = public, pg_temp')
    expect(migration004).toContain(
      'revoke all on function public.search_clients_admin(text, text, text, integer, integer) from public, anon, authenticated',
    )
    expect(migration004).toContain(
      'grant execute on function public.search_clients_admin(text, text, text, integer, integer) to service_role',
    )
  })
})
