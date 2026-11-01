const parisDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function dateInParis(now = new Date()): string {
  return parisDateFormatter.format(now)
}
export function tomorrowInParis(now = new Date()): string {
  const [year, month, day] = dateInParis(now).split('-').map(Number)
  const tomorrow = new Date(Date.UTC(year, month - 1, day + 1))
  return tomorrow.toISOString().slice(0, 10)
}

export function dayOfWeekInParis(now = new Date()): number {
  const [year, month, day] = dateInParis(now).split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

export function monthInParis(now = new Date()): string {
  return dateInParis(now).slice(0, 7)
}
