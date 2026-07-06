import type { GameScore } from '../../../shared/types/index'
import { addScore } from '../../utils/store'
import { enforcePostProtection } from '../../utils/post-protection'
import { generateId, nowIso } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  enforcePostProtection(event, body, { routeKey: 'leaderboard-submit' })

  const score: GameScore = {
    id: generateId(),
    user_id: String(body.user_id ?? 'anonymous'),
    score: Number(body.score ?? 0),
    steps_completed: Number(body.steps_completed ?? 0),
    leaderboard_scope: (body.leaderboard_scope ?? 'daily') as GameScore['leaderboard_scope'],
    city_scope: body.city_scope ? String(body.city_scope) : null,
    created_at: nowIso(),
  }

  addScore(score)
  return { data: score }
})
