import { describe, it, expect } from 'vitest'
import { fmt, formatDate, formatPhone, whatsappLink } from '@/lib/utils'

describe('fmt', () => {
  it('formate un entier', () => {
    expect(fmt(100)).toBe('100,00 €')
  })
  it('formate un décimal', () => {
    expect(fmt(12.5)).toBe('12,50 €')
  })
  it('formate zéro', () => {
    expect(fmt(0)).toBe('0,00 €')
  })
  it('formate un grand nombre', () => {
    expect(fmt(3060)).toBe('3060,00 €')
  })
})

describe('formatPhone', () => {
  it('formate un numéro 10 chiffres bruts', () => {
    expect(formatPhone('0769432605')).toBe('07 69 43 26 05')
  })
  it('formate avec des points', () => {
    expect(formatPhone('06.12.34.56.78')).toBe('06 12 34 56 78')
  })
  it('formate avec des espaces', () => {
    expect(formatPhone('06 12 34 56 78')).toBe('06 12 34 56 78')
  })
  it('tronque à 10 chiffres', () => {
    expect(formatPhone('07694326051234')).toBe('07 69 43 26 05')
  })
  it('retourne vide sur chaîne vide', () => {
    expect(formatPhone('')).toBe('')
  })
})

describe('whatsappLink', () => {
  it('convertit un numéro français 0X en +33X', () => {
    const link = whatsappLink('0769432605', 'Bonjour')
    expect(link).toBe('https://wa.me/33769432605?text=Bonjour')
  })
  it('garde un numéro déjà en 33', () => {
    const link = whatsappLink('33769432605', 'Test')
    expect(link).toBe('https://wa.me/33769432605?text=Test')
  })
  it('encode les caractères spéciaux du message', () => {
    const link = whatsappLink('0769432605', 'Bonjour ça va ?')
    expect(link).toContain('wa.me/33769432605')
    expect(link).toContain(encodeURIComponent('Bonjour ça va ?'))
  })
  it('encode les sauts de ligne', () => {
    const link = whatsappLink('0769432605', 'ligne 1\nligne 2')
    expect(link).toContain(encodeURIComponent('ligne 1\nligne 2'))
  })
})

describe('formatDate', () => {
  it('formate une date ISO en DD/MM/YYYY', () => {
    const result = formatDate('2026-07-10')
    expect(result).toBe('10/07/2026')
  })
})
