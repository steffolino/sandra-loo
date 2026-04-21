import type { Confirmation } from '../../../shared/types/index'
import { addConfirmation } from '../../utils/store'
import { generateId, nowIso } from '../../utils/helpers'
import { enforcePostProtection } from '../../utils/post-protection'

const VALID_TYPES = ['open', 'clean', 'accessible', 'free']

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  enforcePostProtection(event, body, {
    routeKey: 'confirmations',
    rateLimitMax: 20,
    rateLimitWindowMs: 60_000,
    cooldownMs: 3_000,
    minSubmitDelayMs: 0,
    requireFormStartedAt: false,
  })

  if (!body.toilet_id || typeof body.toilet_id !== 'string') {
    throw createError({ statusCode: 400, message: 'toilet_id is required' })
  }
  if (body.toilet_id.length > 128) {
    throw createError({ statusCode: 400, message: 'toilet_id is too long' })
  }
  if (!body.type || typeof body.type !== 'string' || !VALID_TYPES.includes(body.type)) {
    throw createError({
      statusCode: 400,
      message: `type must be one of: ${VALID_TYPES.join(', ')}`,
    })
  }

  const confirmation: Confirmation = {
    id: generateId(),
    toilet_id: body.toilet_id,
    type: body.type,
    created_at: nowIso(),
  }

  addConfirmation(confirmation)

  setResponseStatus(event, 201)
  return { data: confirmation }
})
