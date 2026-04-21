import type { Report } from '../../../shared/types/index'
import { addReport } from '../../utils/store'
import { generateId, nowIso } from '../../utils/helpers'
import { enforcePostProtection } from '../../utils/post-protection'

const VALID_TYPES = ['closed', 'dirty', 'broken', 'unsafe', 'missing', 'other']

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  enforcePostProtection(event, body, {
    routeKey: 'reports',
    rateLimitMax: 6,
    rateLimitWindowMs: 60_000,
    cooldownMs: 10_000,
    minSubmitDelayMs: 1_500,
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
  if (body.user_id !== undefined && typeof body.user_id !== 'string') {
    throw createError({ statusCode: 400, message: 'user_id must be a string' })
  }
  if (typeof body.user_id === 'string' && body.user_id.length > 64) {
    throw createError({ statusCode: 400, message: 'user_id is too long' })
  }
  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    throw createError({ statusCode: 400, message: 'description must be a string' })
  }
  if (typeof body.description === 'string' && body.description.length > 500) {
    throw createError({ statusCode: 400, message: 'description is too long' })
  }

  const report: Report = {
    id: generateId(),
    toilet_id: body.toilet_id,
    user_id: body.user_id ?? 'anonymous',
    type: body.type,
    status: 'open',
    description: body.description ?? null,
    created_at: nowIso(),
  }

  addReport(report)

  setResponseStatus(event, 201)
  return { data: report }
})
