const PARIS_TIME_ZONE = 'Europe/Paris'
export const DEFAULT_BOOKING_MIN_LEAD_MINUTES = 60

const parisDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: PARIS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function parisDateTimeKey(date: Date): string {
  const values = Object.fromEntries(
    parisDateTimeFormatter
      .formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, part.value]),
  )
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}
export function getBookingMinLeadMinutes(value = process.env.BOOKING_MIN_LEAD_MINUTES): number {
  if (value === undefined || value.trim() === '') return DEFAULT_BOOKING_MIN_LEAD_MINUTES
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 7 * 24 * 60
    ? parsed
    : DEFAULT_BOOKING_MIN_LEAD_MINUTES
}

export function minimumBookingDateTime(
  now = new Date(),
  minLeadMinutes = getBookingMinLeadMinutes(),
): string {
  return parisDateTimeKey(new Date(now.getTime() + minLeadMinutes * 60_000))
}

export function isBookingStartAllowed(
  date: string,
  slot: string,
  now = new Date(),
  minLeadMinutes = getBookingMinLeadMinutes(),
): boolean {
  return `${date}T${slot}` >= minimumBookingDateTime(now, minLeadMinutes)
}
