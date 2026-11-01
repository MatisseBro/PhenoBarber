import { describe, expect, it } from 'vitest'
import { buildCsv, escapeCsvCell } from '@/lib/csv'

describe('CSV export security', () => {
  it.each(['=1+1', '+cmd', '-2+3', '@SUM(A1:A2)', '  =HYPERLINK("x")'])('neutralise une formule : %s', value => {
    expect(escapeCsvCell(value)).toMatch(/^"'/)
  })

  it('double les guillemets et conserve les accents', () => {
    expect(escapeCsvCell('Élodie "test"')).toBe('"Élodie ""test"""')
  })

  it('utilise le séparateur Excel français et CRLF', () => {
    expect(buildCsv([['Nom', 'Note'], ['Élodie', 'ok']])).toBe('"Nom";"Note"\r\n"Élodie";"ok"')
  })
})
