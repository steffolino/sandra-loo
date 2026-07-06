import type { Confirmation } from '../../../shared/types/index'
import { addConfirmation } from '../../utils/store'
import { enforcePostProtection } from '../../utils/post-protection'
import { generateId, nowIso } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  enforcePostProtection(event, body, { routeKey: 'confirmations' })

  const toiletId = String(body.toilet_id ?? '').trim()
  if (!toiletId) {
    throw createError({ statusCode: 400, message: 'Missing toilet id' })
  }

  const confirmation: Confirmation = {
    id: generateId(),
    toilet_id: toiletId,
    type: (body.type ?? 'open') as Confirmation['type'],
    created_at: nowIso(),
  }

  addConfirmation(confirmation)
  return { data: confirmation }
})
