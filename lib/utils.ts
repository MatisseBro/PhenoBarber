export function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',') + ' €'
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 10)
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim()
}

export function whatsappLink(phone: string, message: string): string {
  const num = phone.replace(/\D/g, '')
  const intl = num.startsWith('0') ? '33' + num.slice(1) : num
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`
}
