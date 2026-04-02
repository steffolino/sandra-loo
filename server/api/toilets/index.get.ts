import type { ToiletFilters } from '../../../shared/types/index'
import { getToilets } from '../../utils/store'
import { haversineKm } from '../../utils/helpers'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const filters: ToiletFilters = {
    city: query.city as string | undefined,
    is_accessible: query.is_accessible === 'true' ? true : query.is_accessible === 'false' ? false : undefined,
    is_free: query.is_free === 'true' ? true : query.is_free === 'false' ? false : undefined,
    type: query.type as ToiletFilters['type'],
    lat: query.lat ? Number(query.lat) : undefined,
    lng: query.lng ? Number(query.lng) : undefined,
    radius: query.radius ? Number(query.radius) : undefined,
  }

  let toilets = await getToilets()

  if (filters.city) {
    const city = filters.city.toLowerCase()
    toilets = toilets.filter(t => t.city.toLowerCase() === city)
  }
  if (filters.is_accessible !== undefined) {
    toilets = toilets.filter(t => t.is_accessible === filters.is_accessible)
  }
  if (filters.is_free !== undefined) {
    toilets = toilets.filter(t => t.is_free === filters.is_free)
  }
  if (filters.type) {
    toilets = toilets.filter(t => t.type === filters.type)
  }
  if (filters.lat !== undefined && filters.lng !== undefined && filters.radius) {
    toilets = toilets.filter(
      t => haversineKm(filters.lat!, filters.lng!, t.lat, t.lng) <= filters.radius!,
    )
  }

  return {
    data: toilets,
    meta: {
      total: toilets.length,
      hasData: toilets.length > 0,
    },
  }
})
