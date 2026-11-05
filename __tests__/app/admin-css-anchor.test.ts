import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Régression : commit 1eeb438 avait retiré import './admin-dashboard.css' de
 * AdminDashboardClient.tsx. Sur Netlify + @netlify/plugin-nextjs, le plugin peut
 * ne pas inclure le chunk CSS du layout pour les routes entièrement ssr:false,
 * laissant la sidebar et le contenu transparents (seule la topbar restait visible
 * car son background est codé en dur). L'import dans AdminDashboardClient.tsx
 * ancre ce chunk dans le client bundle et garantit son chargement.
 */
describe('admin dashboard CSS loading', () => {
  it('AdminDashboardClient.tsx doit importer admin-dashboard.css (ancrage Netlify)', () => {
    const src = readFileSync(
      resolve('app/admin/AdminDashboardClient.tsx'),
      'utf8',
    )
    expect(src).toContain("import './admin-dashboard.css'")
  })

  it('app/admin/layout.tsx doit importer admin-dashboard.css (ancrage SSR)', () => {
    const src = readFileSync(
      resolve('app/admin/layout.tsx'),
      'utf8',
    )
    expect(src).toContain("import './admin-dashboard.css'")
  })
})
