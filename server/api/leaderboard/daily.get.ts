import { getDailyLeaderboard } from '../../utils/store'

export default defineEventHandler(() => ({
  data: getDailyLeaderboard(),
  meta: { hasData: getDailyLeaderboard().length > 0 },
}))
