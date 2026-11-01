// Never let automated tests inherit credentials for the future production project.
// Individual tests may install explicit fictitious values after this file runs.
for (const name of [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_FROM_NUMBER',
  'ADMIN_PASSWORD',
  'ADMIN_SECRET',
  'RATE_LIMIT_SECRET',
  'MARKETING_UNSUBSCRIBE_SECRET',
  'CRON_SECRET',
]) {
  delete process.env[name]
}

process.env.NEXT_PUBLIC_SITE_URL = 'https://pheno.example.test'
process.env.NEXT_PUBLIC_ADMIN_EMAIL = 'admin@pheno.example.test'
process.env.TRUST_PROXY = 'false'
process.env.HOSTING_PLATFORM = 'none'
