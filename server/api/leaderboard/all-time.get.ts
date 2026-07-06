import { getAllTimeLeaderboard } from '../../utils/store'

export default defineEventHandler(() => ({
  data: getAllTimeLeaderboard(),
  meta: { hasData: getAllTimeLeaderboard().length > 0 },
}))
