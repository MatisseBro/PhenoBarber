import { createHmac } from 'crypto'
import { getSupabase } from './supabase'

interface RateLimitOptions {
  namespace: string
  limit: number
  windowSeconds: number
}

const localWindows = new Map<string, { count: number; resetAt: number }>()

function firstHeaderAddress(value: string | null): string | null {
  const address = value?.split(',')[0]?.trim()
  if (!address || address.length > 64 || !/^[0-9a-fA-F:.]+$/.test(address)) return null
  return address
}

export function getClientAddress(request: Request): string {
  const platform = process.env.HOSTING_PLATFORM ?? 'none'
  const platformAddress = platform === 'vercel'
    ? firstHeaderAddress(request.headers.get('x-vercel-forwarded-for'))
    : platform === 'cloudflare'
      ? firstHeaderAddress(request.headers.get('cf-connecting-ip'))
      : platform === 'netlify'
        ? firstHeaderAddress(request.headers.get('x-nf-client-connection-ip'))
        : null

  if (platformAddress) return platformAddress
  if (process.env.TRUST_PROXY === 'true') {
    return firstHeaderAddress(request.headers.get('x-forwarded-for')) ?? 'unknown'
  }
  return 'unknown'
}

function boundedHeader(request: Request, name: string): string {
  return (request.headers.get(name) ?? '').slice(0, 160)
}

function opaqueKey(request: Request, namespace: string): string | null {
  const secret = process.env.RATE_LIMIT_SECRET
  if (!secret || secret.length < 32) return null
  const address = getClientAddress(request)
  // Ce fallback évite qu'une seule adresse « unknown » bloque tous les visiteurs.
  // Il est seulement défensif : une source IP approuvée reste obligatoire en production.
  const identity = address === 'unknown'
    ? `fallback:${boundedHeader(request, 'user-agent')}:${boundedHeader(request, 'accept-language')}:${boundedHeader(request, 'sec-ch-ua')}`
    : `ip:${address}`
  return createHmac('sha256', secret)
    .update(`${namespace}:${identity}`)
    .digest('hex')
}

function localRateLimit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now()
  const current = localWindows.get(key)
  if (!current || current.resetAt <= now) {
    localWindows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return true
  }
  if (current.count >= limit) return false
  current.count += 1
  return true
}

export async function enforceRateLimit(request: Request, options: RateLimitOptions): Promise<boolean> {
  const key = opaqueKey(request, options.namespace)
  if (!key) {
    return process.env.NODE_ENV === 'production'
      ? false
      : localRateLimit(`${options.namespace}:local`, options.limit, options.windowSeconds)
  }

  try {
    const { data, error } = await getSupabase().rpc('check_rate_limit', {
      p_key: key,
      p_limit: options.limit,
      p_window_seconds: options.windowSeconds,
    })
    if (!error) return data === true
  } catch {
    // La production échoue fermée ; le développement conserve un fallback local.
  }
  if (process.env.NODE_ENV === 'production') return false
  return localRateLimit(key, options.limit, options.windowSeconds)
}
