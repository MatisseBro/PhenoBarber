export type CsvValue = string | number | boolean | null | undefined

export function escapeCsvCell(value: CsvValue): string {
  let text = value == null ? '' : String(value)
  if (/^[\u0000-\u0020]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text)) {
    text = `'${text}`
  }
  return `"${text.replace(/"/g, '""')}"`
}

export function buildCsv(rows: CsvValue[][]): string {
  return rows.map(row => row.map(escapeCsvCell).join(';')).join('\r\n')
}
