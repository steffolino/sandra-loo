import type { Report, Review, Toilet, ToiletFilters, ToiletListItem } from '../../shared/types/index'
import { haversineKm } from './helpers'

export function buildToiletList(
  toilets: Toilet[],
  reviews: Review[],
  reports: Report[],
  filters: ToiletFilters,
): ToiletListItem[] {
  const reviewMap = new Map<string, { total: number, count: number }>()
  for (const review of reviews) {
    const current = reviewMap.get(review.toilet_id) ?? { total: 0, count: 0 }
    const rating = (review.cleanliness + review.lighting) / 2
    current.total += rating
    current.count += 1
    reviewMap.set(review.toilet_id, current)
  }

  const reportMap = new Map<string, number>()
  for (const report of reports) {
    reportMap.set(report.toilet_id, (reportMap.get(report.toilet_id) ?? 0) + 1)
  }

  let list: ToiletListItem[] = toilets.map((toilet) => {
    const reviewStats = reviewMap.get(toilet.id)
    const reportCount = reportMap.get(toilet.id) ?? 0
    const avgRating = reviewStats && reviewStats.count > 0
      ? Number((reviewStats.total / reviewStats.count).toFixed(1))
      : null

    const item: ToiletListItem = {
      ...toilet,
      avg_rating: avgRating,
      review_count: reviewStats?.count ?? 0,
      report_count: reportCount,
      has_reports: reportCount > 0,
    }

    if (filters.lat !== undefined && filters.lng !== undefined) {
      item.distance_km = Number(
        haversineKm(filters.lat, filters.lng, toilet.lat, toilet.lng).toFixed(2),
      )
    }

    return item
  })

  if (filters.city) {
    const city = filters.city.toLowerCase()
    list = list.filter(t => t.city.toLowerCase() === city)
  }
  if (filters.is_accessible !== undefined) {
    list = list.filter(t => t.is_accessible === filters.is_accessible)
  }
  if (filters.is_free !== undefined) {
    list = list.filter(t => t.is_free === filters.is_free)
  }
  if (filters.type) {
    list = list.filter(t => t.type === filters.type)
  }
  if (filters.reported !== undefined) {
    list = list.filter(t => t.has_reports === filters.reported)
  }
  if (filters.min_rating !== undefined && Number.isFinite(filters.min_rating)) {
    list = list.filter(t => (t.avg_rating ?? 0) >= filters.min_rating)
  }
  if (
    filters.lat !== undefined
    && filters.lng !== undefined
    && filters.radius !== undefined
    && Number.isFinite(filters.radius)
  ) {
    list = list.filter(t => (t.distance_km ?? Number.POSITIVE_INFINITY) <= filters.radius)
  }

  if (filters.sort === 'nearest' && filters.lat !== undefined && filters.lng !== undefined) {
    list = list.sort((a, b) => (a.distance_km ?? Number.POSITIVE_INFINITY) - (b.distance_km ?? Number.POSITIVE_INFINITY))
  }
  else if (filters.sort === 'rating') {
    list = list.sort((a, b) => (b.avg_rating ?? -1) - (a.avg_rating ?? -1))
  }
  else {
    list = list.sort((a, b) => Date.parse(b.last_updated_at) - Date.parse(a.last_updated_at))
  }

  return list
}
