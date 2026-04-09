import type { H3Event } from 'h3'
import { createError, getRequestIP, setHeader } from 'h3'

interface PostProtectionOptions {
  routeKey: string
  rateLimitMax?: number
  rateLimitWindowMs?: number
  cooldownMs?: number
  honeypotField?: string
  minSubmitDelayMs?: number
}

const rateLimitBuckets = new Map<string, number[]>()
const cooldownBuckets = new Map<string, number>()

const DEFAULT_RATE_LIMIT_MAX = 10
const DEFAULT_RATE_LIMIT_WINDOW_MS = 60_000
const DEFAULT_COOLDOWN_MS = 3_000
const DEFAULT_HONEYPOT_FIELD = 'website'
const DEFAULT_MIN_SUBMIT_DELAY_MS = 1_200

export function enforcePostProtection(
  event: H3Event,
  body: unknown,
  options: PostProtectionOptions,
) {
  const payload = asRecord(body)
  const honeypotField = options.honeypotField ?? DEFAULT_HONEYPOT_FIELD
  const minSubmitDelayMs = options.minSubmitDelayMs ?? DEFAULT_MIN_SUBMIT_DELAY_MS
  const cooldownMs = options.cooldownMs ?? DEFAULT_COOLDOWN_MS
  const rateLimitMax = options.rateLimitMax ?? DEFAULT_RATE_LIMIT_MAX
  const rateLimitWindowMs = options.rateLimitWindowMs ?? DEFAULT_RATE_LIMIT_WINDOW_MS

  enforceHoneypot(payload, honeypotField)
  enforceMinSubmitDelay(payload, minSubmitDelayMs)

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

function enforceHoneypot(body: Record<string, unknown>, field: string) {
  const value = body[field]
  if (typeof value === 'string' && value.trim().length > 0) {
    throw createError({ statusCode: 400, message: 'Invalid request.' })
  }
}

function enforceMinSubmitDelay(body: Record<string, unknown>, minDelayMs: number) {
  if (minDelayMs <= 0) return

  const raw = body.form_started_at
  if (raw === undefined || raw === null) return

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
  if (ip) return ip
  return event.node.req.socket.remoteAddress ?? 'unknown'
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
