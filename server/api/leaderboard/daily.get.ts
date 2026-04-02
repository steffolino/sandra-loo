import { getDailyLeaderboard } from '../../utils/store'

export default defineEventHandler(() => {
  const entries = getDailyLeaderboard()
  return {
    data: entries,
    meta: {
      scope: 'daily',
      total: entries.length,
      hasData: entries.length > 0,
    },
  }
})
