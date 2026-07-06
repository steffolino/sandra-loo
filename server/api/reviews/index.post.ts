import type { Review } from '../../../shared/types/index'
import { addReview } from '../../utils/store'
import { enforcePostProtection } from '../../utils/post-protection'
import { generateId, nowIso } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  enforcePostProtection(event, body, { routeKey: 'reviews' })

  const toiletId = String(body.toilet_id ?? '').trim()
  if (!toiletId) {
    throw createError({ statusCode: 400, message: 'Missing toilet id' })
  }

  const review: Review = {
    id: generateId(),
    toilet_id: toiletId,
    user_id: String(body.user_id ?? 'anonymous'),
    cleanliness: Number(body.cleanliness ?? 0),
    lighting: Number(body.lighting ?? 0),
    toilet_paper: Boolean(body.toilet_paper),
    accessibility: Boolean(body.accessibility),
    comment: body.comment ? String(body.comment) : null,
    created_at: nowIso(),
  }

  addReview(review)
  return { data: review }
})
