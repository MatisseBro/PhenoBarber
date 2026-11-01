import nextEnvironment from '@next/env'

nextEnvironment.loadEnvConfig(process.cwd(), process.env.NODE_ENV !== 'production')

const isPlaceholder = value => /(?:xxxx|change[-_ ]?me|placeholder|example|exemple|remplacer|ton-mot|une-cha[iî]ne)/i.test(value)
const isStrongValue = (value, minimum) => value.length >= minimum && !isPlaceholder(value)
const isSupabaseServiceKey = value => {
  if (!isStrongValue(value, 20)) return false
  if (/^sb_secret_[A-Za-z0-9_-]{20,}$/.test(value)) return true
  if (!/^eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value)) return false
  try {
    return JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString('utf8')).role === 'service_role'
  } catch {
    return false
  }
}

const required = [
  ['SUPABASE_URL', value => /^https:\/\/[^\s]+$/.test(value)],
  ['SUPABASE_SERVICE_ROLE_KEY', isSupabaseServiceKey],
  ['ADMIN_PASSWORD', value => isStrongValue(value, 12)],
  ['ADMIN_SECRET', value => isStrongValue(value, 32)],
  ['ADMIN_SESSION_VERSION', value => /^[1-9][0-9]*$/.test(value)],
  ['RATE_LIMIT_SECRET', value => isStrongValue(value, 32)],
  ['MARKETING_UNSUBSCRIBE_SECRET', value => isStrongValue(value, 32)],
  ['CRON_SECRET', value => isStrongValue(value, 24)],
  ['RESEND_API_KEY', value => isStrongValue(value, 10) && /^re_[A-Za-z0-9_-]+$/.test(value)],
  ['EMAIL_FROM', value => /^(?:[^<>\r\n]+\s*)?<[^<>\s@]+@[^<>\s@]+>|^[^\s@]+@[^\s@]+$/.test(value)],
  ['NEXT_PUBLIC_SITE_URL', value => /^https:\/\/[^\s]+$/.test(value)],
  ['TRUST_PROXY', value => value === 'true' || value === 'false'],
  ['HOSTING_PLATFORM', value => ['none', 'vercel', 'cloudflare', 'netlify'].includes(value)],
]

const invalid = required
  .filter(([name, validate]) => {
    const value = process.env[name]?.trim() ?? ''
    return !validate(value)
  })
  .map(([name]) => name)

const bookingLead = process.env.BOOKING_MIN_LEAD_MINUTES?.trim()
if (bookingLead) {
  const parsed = Number(bookingLead)
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 7 * 24 * 60) {
    invalid.push('BOOKING_MIN_LEAD_MINUTES')
  }
}

const twilio = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER']
const configuredTwilio = twilio.filter(name => Boolean(process.env[name]?.trim()))
if (configuredTwilio.length > 0 && configuredTwilio.length !== twilio.length) invalid.push('TWILIO_* (configuration partielle)')
if (configuredTwilio.length === twilio.length) {
  const sid = process.env.TWILIO_ACCOUNT_SID?.trim() ?? ''
  const token = process.env.TWILIO_AUTH_TOKEN?.trim() ?? ''
  const from = process.env.TWILIO_FROM_NUMBER?.trim() ?? ''
  if (!/^AC[a-f0-9]{32}$/i.test(sid) || !isStrongValue(token, 20) || !/^\+[1-9][0-9]{6,14}$/.test(from)) {
    invalid.push('TWILIO_* (format invalide)')
  }
}

const distinctSecrets = ['ADMIN_SECRET', 'RATE_LIMIT_SECRET', 'MARKETING_UNSUBSCRIBE_SECRET', 'CRON_SECRET']
  .map(name => process.env[name]?.trim() ?? '')
  .filter(Boolean)
if (new Set(distinctSecrets).size !== distinctSecrets.length) invalid.push('*_SECRET (valeurs non distinctes)')

if (invalid.length > 0) {
  console.error(`Configuration de production invalide. Variables absentes ou incorrectes : ${invalid.join(', ')}`)
  process.exit(1)
}

console.log('Configuration de production validée.')
