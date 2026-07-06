import type { Report } from '../../../shared/types/index'
import { addReport } from '../../utils/store'
import { enforcePostProtection } from '../../utils/post-protection'
import { generateId, nowIso } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  enforcePostProtection(event, body, { routeKey: 'reports' })

  const toiletId = String(body.toilet_id ?? '').trim()
  if (!toiletId) {
    throw createError({ statusCode: 400, message: 'Missing toilet id' })
  }

  const report: Report = {
    id: generateId(),
    toilet_id: toiletId,
    user_id: String(body.user_id ?? 'anonymous'),
    type: (body.type ?? 'other') as Report['type'],
    status: 'open' as Report['status'],
    description: body.description ? String(body.description) : null,
    created_at: nowIso(),
  }

  addReport(report)
  return { data: report }
})
