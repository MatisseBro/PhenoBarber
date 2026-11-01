import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import nextEnvironment from '@next/env'

nextEnvironment.loadEnvConfig(process.cwd())

const git = (args, options = {}) => execFileSync('git', args, {
  cwd: process.cwd(),
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
  ...options,
})

const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const pathsFor = value => [...value].sort().join(',') || 'none'

const sensitiveNames = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'ADMIN_SECRET',
  'RATE_LIMIT_SECRET',
  'MARKETING_UNSUBSCRIBE_SECRET',
  'CRON_SECRET',
  'RESEND_API_KEY',
  'TWILIO_AUTH_TOKEN',
]

const configuredSecrets = new Map(
  sensitiveNames
    .map(name => [name, process.env[name]?.trim() ?? ''])
    .filter(([, value]) => value.length >= 10),
)

const adminPassword = process.env.ADMIN_PASSWORD?.trim() ?? ''
const adminLiteralPattern = adminPassword
  ? new RegExp(`ADMIN_(?:CODE|PASSWORD)\\s*[=:]\\s*['"]${escapeRegExp(adminPassword)}['"]`)
  : null

const objectPaths = new Map()
for (const line of git(['rev-list', '--objects', '--all']).split(/\r?\n/)) {
  const separator = line.indexOf(' ')
  if (separator < 0) continue
  const oid = line.slice(0, separator)
  const path = line.slice(separator + 1)
  const paths = objectPaths.get(oid) ?? new Set()
  paths.add(path)
  objectPaths.set(oid, paths)
}

const historyAdmin = { objects: 0, paths: new Set() }
const historyExact = new Map(
  [...configuredSecrets.keys()].map(name => [name, { objects: 0, paths: new Set() }]),
)
const historyJwt = new Map()
const historyAssignments = new Map()

const jwtPattern = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}/g
const assignmentPattern = /(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ANON_KEY|RESEND_API_KEY|TWILIO_AUTH_TOKEN|ADMIN_SECRET|CRON_SECRET|RATE_LIMIT_SECRET)\s*[=:]\s*['"]?([^\s'";]{16,})/g
const providerSecretPatterns = [
  ['JWT', /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}/],
  ['SUPABASE_SECRET_KEY', /sb_secret_[A-Za-z0-9_-]{20,}/],
  ['RESEND_API_KEY', /re_[A-Za-z0-9_-]{20,}/],
  ['PRIVATE_KEY', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
]
const genericAdminLiteralPattern = /ADMIN_(?:CODE|PASSWORD)\s*[=:]\s*['"]([^'"]+)['"]/g

for (const [oid, paths] of objectPaths) {
  let contents
  try {
    contents = git(['cat-file', '-p', oid], { maxBuffer: 10 * 1024 * 1024 })
  } catch {
    continue
  }

  if (adminLiteralPattern?.test(contents)) {
    historyAdmin.objects += 1
    paths.forEach(path => historyAdmin.paths.add(path))
  }

  for (const [name, secret] of configuredSecrets) {
    if (!contents.includes(secret)) continue
    const finding = historyExact.get(name)
    finding.objects += 1
    paths.forEach(path => finding.paths.add(path))
  }

  for (const match of contents.matchAll(jwtPattern)) {
    let role = 'unknown'
    try {
      role = JSON.parse(Buffer.from(match[0].split('.')[1], 'base64url')).role ?? role
    } catch {
      // A malformed JWT-looking value remains categorized as unknown.
    }
    const finding = historyJwt.get(role) ?? { objects: 0, paths: new Set() }
    finding.objects += 1
    paths.forEach(path => finding.paths.add(path))
    historyJwt.set(role, finding)
  }

  for (const match of contents.matchAll(assignmentPattern)) {
    const assignmentName = match[0].split(/[=:]/, 1)[0].trim()
    const value = match[1]
    if (/change|example|placeholder|your_|xxx|process\.env/i.test(value)) continue
    const finding = historyAssignments.get(assignmentName) ?? new Set()
    paths.forEach(path => finding.add(path))
    historyAssignments.set(assignmentName, finding)
  }
}

console.log(`HISTORY_ADMIN_LITERAL_OBJECTS=${historyAdmin.objects}`)
console.log(`HISTORY_ADMIN_LITERAL_PATHS=${pathsFor(historyAdmin.paths)}`)
for (const [name, finding] of historyExact) {
  console.log(`HISTORY_EXACT_${name}=${finding.objects};paths=${pathsFor(finding.paths)}`)
}
for (const [role, finding] of historyJwt) {
  console.log(`HISTORY_JWT_ROLE_${role.toUpperCase()}=${finding.objects};paths=${pathsFor(finding.paths)}`)
}
for (const [name, paths] of historyAssignments) {
  console.log(`HISTORY_SUSPECT_ASSIGNMENT_${name}=paths=${pathsFor(paths)}`)
}

const trackedFiles = git(['ls-files', '-z']).split('\0').filter(Boolean)
const currentFindings = []
for (const file of trackedFiles) {
  let contents
  try {
    contents = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  if (adminLiteralPattern?.test(contents)) currentFindings.push(`ADMIN_PASSWORD:${file}`)
  for (const [name, secret] of configuredSecrets) {
    if (contents.includes(secret)) currentFindings.push(`${name}:${file}`)
  }
  for (const [kind, pattern] of providerSecretPatterns) {
    if (pattern.test(contents)) currentFindings.push(`${kind}:${file}`)
  }
  for (const match of contents.matchAll(genericAdminLiteralPattern)) {
    if (!/example|exemple|placeholder|change|inactif|pas_utiliser|not_a_real/i.test(match[1])) {
      currentFindings.push(`ADMIN_LITERAL:${file}`)
    }
  }
}

console.log(`CURRENT_TRACKED_SECRET_FINDINGS=${currentFindings.length}`)
for (const finding of currentFindings.sort()) console.log(`CURRENT_FINDING=${finding}`)

if (currentFindings.length > 0) process.exitCode = 1
