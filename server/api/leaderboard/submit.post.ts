import type { GameScore } from '../../../shared/types/index'
import { addScore } from '../../utils/store'
import { generateId, nowIso } from '../../utils/helpers'
import { enforcePostProtection } from '../../utils/post-protection'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  enforcePostProtection(event, body, {
    routeKey: 'leaderboard-submit',
    rateLimitMax: 8,
    rateLimitWindowMs: 60_000,
    cooldownMs: 5_000,
    minSubmitDelayMs: 1_000,
    requireHoneypotField: false,
    requireFormStartedAt: false,
  })

  if (typeof body.score !== 'number' || !Number.isFinite(body.score) || body.score < 0) {
    throw createError({ statusCode: 400, message: 'score must be a non-negative number' })
  }
  if (typeof body.steps_completed !== 'number' || !Number.isFinite(body.steps_completed) || body.steps_completed < 0) {
    throw createError({ statusCode: 400, message: 'steps_completed must be a non-negative number' })
  }
  if (body.user_id !== undefined && typeof body.user_id !== 'string') {
    throw createError({ statusCode: 400, message: 'user_id must be a string' })
  }
  if (typeof body.user_id === 'string' && body.user_id.length > 64) {
    throw createError({ statusCode: 400, message: 'user_id is too long' })
  }
  if (body.city_scope !== undefined && body.city_scope !== null && typeof body.city_scope !== 'string') {
    throw createError({ statusCode: 400, message: 'city_scope must be a string' })
  }
  if (typeof body.city_scope === 'string' && body.city_scope.length > 120) {
    throw createError({ statusCode: 400, message: 'city_scope is too long' })
  }

  const entry: GameScore = {
    id: generateId(),
    user_id: body.user_id ?? 'anonymous',
    score: body.score,
    steps_completed: body.steps_completed,
    leaderboard_scope: 'all-time',
    city_scope: body.city_scope ?? null,
    created_at: nowIso(),
  }

  addScore({ ...entry, leaderboard_scope: 'daily' })
  addScore(entry)

  setResponseStatus(event, 201)
  return { data: entry }
})
