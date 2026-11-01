import { describe, expect, it } from 'vitest'
import { resolveRdvSelection } from '@/lib/rdv-catalog'

describe('authoritative appointment catalog', () => {
  it('calcule prix et durée uniquement depuis les identifiants reconnus', () => {
    const selection = resolveRdvSelection({
      categorie: 'homme', prestation: 'degrade', degrade: 'skin', options: ['sham'], loyal: false,
    })
    expect(selection?.totalPrice).toBe(35)
    expect(selection?.totalDuration).toBe(40)
  })

  it('rejette une option appartenant à une autre catégorie et les doublons ne sont comptés qu’une fois', () => {
    expect(resolveRdvSelection({ categorie: 'enfant', prestation: 'coupe-e', options: ['soin'] })).toBeNull()
    const selection = resolveRdvSelection({ categorie: 'homme', prestation: 'buzz', options: ['sham', 'sham'] })
    expect(selection?.totalPrice).toBe(35)
    expect(selection?.totalDuration).toBe(35)
  })

  it('applique le tarif fidélité décidé côté serveur', () => {
    const selection = resolveRdvSelection({ categorie: 'homme', prestation: 'buzz', options: [], loyal: true })
    expect(selection?.totalPrice).toBe(22)
  })
})
