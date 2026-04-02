import { getAllTimeLeaderboard } from '../../utils/store'

export default defineEventHandler(() => {
  const entries = getAllTimeLeaderboard()
  return {
    data: entries,
    meta: {
      scope: 'all-time',
      total: entries.length,
      hasData: entries.length > 0,
    },
  }
})
