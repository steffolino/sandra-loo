import type { H3Event } from 'h3'
import { createError, getRequestIP, setHeader } from 'h3'
import { createHash } from 'node:crypto'

interface PostProtectionOptions {
  routeKey: string
  rateLimitMax?: number
  rateLimitWindowMs?: number
  cooldownMs?: number
  honeypotField?: string
  requireHoneypotField?: boolean
  minSubmitDelayMs?: number
  requireFormStartedAt?: boolean
}

const rateLimitBuckets = new Map<string, number[]>()
const cooldownBuckets = new Map<string, number>()

const DEFAULT_RATE_LIMIT_MAX = 10
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000
const DEFAULT_COOLDOWN_MS = 3_000
const DEFAULT_HONEYPOT_FIELD = 'website'
const DEFAULT_MIN_SUBMIT_DELAY_MS = 1_200
const MAX_BUCKET_KEYS = 5_000

export function enforcePostProtection(
  event: H3Event,
  body: unknown,
  options: PostProtectionOptions,
) {
  const payload = asRecord(body)
  const honeypotField = options.honeypotField ?? DEFAULT_HONEYPOT_FIELD
  const requireHoneypotField = options.requireHoneypotField ?? true
  const minSubmitDelayMs = options.minSubmitDelayMs ?? DEFAULT_MIN_SUBMIT_DELAY_MS
  const requireFormStartedAt = options.requireFormStartedAt ?? (minSubmitDelayMs > 0)
  const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS
  const rateLimitMax = options.rateLimitMax ?? DEFAULT_RATE_LIMIT_MAX
  const rateLimitWindowMs = options.rateLimitWindowMs ?? DEFAULT_RATE_LIMIT_WINDOW_MS

  cleanupBuckets(rateLimitWindowMs, cooldownMs)
  enforceHoneypot(payload, honeypotField, requireHoneypotField)
  enforceMinSubmitDelay(payload, minSubmitDelayMs, requireFormStartedAt)

  const clientKey = `${options.routeKey}:${getClientIdentifier(event)}`
  enforceRateLimit(event, clientKey, rateLimitMax, rateLimitWindowMs)
  enforceCooldown(event, clientKey, cooldownMs)
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>
  }
  return {}
}

function enforceHoneypot(body: Record<string, unknown>, field: string, required: boolean) {
  const value = body[field]
  if (required && value === undefined) {
    throw createError({ statusCode: 400, message: 'Invalid request.' })
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    throw createError({ statusCode: 400, message: 'Invalid request.' })
  }
}

function enforceMinSubmitDelay(
  body: Record<string, unknown>,
  minDelayMs: number,
  required: boolean,
) {
  if (minDelayMs <= 0) return

  const raw = body.form_started_at
  if (raw === undefined || raw === null) {
    if (required) {
      throw createError({ statusCode: 400, message: 'Invalid request timing.' })
    }
    return
  }

  const startedAt = toTimestamp(raw)
  if (startedAt === null) {
    throw createError({ statusCode: 400, message: 'Invalid request timing.' })
  }

  if (Date.now() - startedAt < minDelayMs) {
    throw createError({
      statusCode: 429,
      message: 'Please wait a moment before submitting.',
    })
  }
}

function toTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return null
}

function getClientIdentifier(event: H3Event): string {
  const ip = getRequestIP(event, { xForwardedFor: true })
  const ua = String(event.node.req.headers['user-agent'] ?? '').trim().toLowerCase()
  const remote = ip ?? event.node.req.socket.remoteAddress ?? 'unknown'
  // Hash to keep key length stable and avoid storing raw UA data in memory keys.
  const uaHash = ua ? createHash('sha1').update(ua).digest('hex').slice(0, 10) : 'noua'
  return `${remote}:${uaHash}`
}

function enforceRateLimit(event: H3Event, key: string, max: number, windowMs: number) {
  const now = Date.now()
  const windowStart = now - windowMs
  const recent = (rateLimitBuckets.get(key) ?? []).filter(ts => ts > windowStart)

  if (recent.length >= max) {
    const retryAfterSeconds = Math.ceil((recent[0] + windowMs - now) / 1000)
    setHeader(event, 'Retry-After', String(Math.max(1, retryAfterSeconds)))
    throw createError({
      statusCode: 429,
      message: 'Too many requests. Please try again shortly.',
    })
  }

  recent.push(now)
  rateLimitBuckets.set(key, recent)
}

function enforceCooldown(event: H3Event, key: string, cooldownMs: number) {
  if (cooldownMs <= 0) return

  const now = Date.now()
  const last = cooldownBuckets.get(key)
  if (last !== undefined && now - last < cooldownMs) {
    const retryAfterSeconds = Math.ceil((cooldownMs - (now - last)) / 1000)
    setHeader(event, 'Retry-After', String(Math.max(1, retryAfterSeconds)))
    throw createError({
      statusCode: 429,
      message: 'Please wait before submitting again.',
    })
  }

  cooldownBuckets.set(key, now)
}

function cleanupBuckets(rateLimitWindowMs: number, cooldownMs: number) {
  if (rateLimitBuckets.size > MAX_BUCKET_KEYS) {
    const now = Date.now()
    for (const [key, timestamps] of rateLimitBuckets.entries()) {
      const fresh = timestamps.filter(ts => ts > now - rateLimitWindowMs)
      if (fresh.length === 0) {
        rateLimitBuckets.delete(key)
      }
      else {
        rateLimitBuckets.set(key, fresh)
      }
    }
  }

  if (cooldownBuckets.size > MAX_BUCKET_KEYS) {
    const now = Date.now()
    for (const [key, timestamp] of cooldownBuckets.entries()) {
      if (now - timestamp > cooldownMs * 3) {
        cooldownBuckets.delete(key)
      }
    }
  }
}
