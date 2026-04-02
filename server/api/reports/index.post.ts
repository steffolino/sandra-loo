import type { Report } from '../../../shared/types/index'
import { addReport } from '../../utils/store'
import { generateId, nowIso } from '../../utils/helpers'

const VALID_TYPES = ['closed', 'dirty', 'broken', 'unsafe', 'missing', 'other']

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.toilet_id || typeof body.toilet_id !== 'string') {
    throw createError({ statusCode: 400, message: 'toilet_id is required' })
  }
  if (!body.type || !VALID_TYPES.includes(body.type)) {
    throw createError({
      statusCode: 400,
      message: `type must be one of: ${VALID_TYPES.join(', ')}`,
    })
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
