import type { Confirmation } from '../../../shared/types/index'
import { addConfirmation } from '../../utils/store'
import { generateId, nowIso } from '../../utils/helpers'

const VALID_TYPES = ['open', 'clean', 'accessible', 'free']

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
