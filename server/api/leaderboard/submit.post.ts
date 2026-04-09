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
  })

  if (typeof body.score !== 'number' || body.score < 0) {
    throw createError({ statusCode: 400, message: 'score must be a non-negative number' })
  }
  if (typeof body.steps_completed !== 'number' || body.steps_completed < 0) {
    throw createError({ statusCode: 400, message: 'steps_completed must be a non-negative number' })
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
