import type { Review } from '../../../shared/types/index'
import { addReview } from '../../utils/store'
import { generateId, inRange, nowIso } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.toilet_id || typeof body.toilet_id !== 'string') {
    throw createError({ statusCode: 400, message: 'toilet_id is required' })
  }
  if (!inRange(body.cleanliness, 1, 5)) {
    throw createError({ statusCode: 400, message: 'cleanliness must be 1–5' })
  }
  if (!inRange(body.lighting, 1, 5)) {
    throw createError({ statusCode: 400, message: 'lighting must be 1–5' })
  }

  const review: Review = {
    id: generateId(),
    toilet_id: body.toilet_id,
    user_id: body.user_id ?? 'anonymous',
    cleanliness: body.cleanliness,
    lighting: body.lighting,
    toilet_paper: Boolean(body.toilet_paper),
    accessibility: Boolean(body.accessibility),
    comment: body.comment ?? null,
    created_at: nowIso(),
  }

  addReview(review)

  setResponseStatus(event, 201)
  return { data: review }
})
