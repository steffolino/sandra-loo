import type { Confirmation, Report, Review, Toilet, ToiletFilters, ToiletListItem } from '../../shared/types/index'
import { haversineKm } from './helpers'

const DAY_MS = 24 * 60 * 60 * 1000
const RECENT_CONFIRMATION_WINDOW_DAYS = 60

export function buildToiletList(
  toilets: Toilet[],
  reviews: Review[],
  reports: Report[],
  confirmations: Confirmation[],
  filters: ToiletFilters,
): ToiletListItem[] {
  const now = Date.now()
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

  const recentConfirmationMap = new Map<string, number>()
  for (const confirmation of confirmations) {
    const createdAt = Date.parse(confirmation.created_at)
    if (Number.isNaN(createdAt)) continue

    const ageDays = (now - createdAt) / DAY_MS
    if (ageDays <= RECENT_CONFIRMATION_WINDOW_DAYS) {
      recentConfirmationMap.set(
        confirmation.toilet_id,
        (recentConfirmationMap.get(confirmation.toilet_id) ?? 0) + 1,
      )
    }
  }

  let list: ToiletListItem[] = toilets.map((toilet) => {
    const reviewStats = reviewMap.get(toilet.id)
    const reportCount = reportMap.get(toilet.id) ?? 0
    const freshnessDays = getFreshnessDays(toilet.last_updated_at, now)
    const recentConfirmations = recentConfirmationMap.get(toilet.id) ?? 0
    const sourceConfidenceScore = getSourceConfidenceScore(toilet.source_name, toilet.source)
    const avgRating = reviewStats && reviewStats.count > 0
      ? Number((reviewStats.total / reviewStats.count).toFixed(1))
      : null

    const item: ToiletListItem = {
      ...toilet,
      avg_rating: avgRating,
      review_count: reviewStats?.count ?? 0,
      report_count: reportCount,
      has_reports: reportCount > 0,
      freshness_days: freshnessDays,
      freshness_label: getFreshnessLabel(freshnessDays),
      recent_confirmation_count: recentConfirmations,
      source_confidence_score: sourceConfidenceScore,
      source_confidence_level: getSourceConfidenceLevel(sourceConfidenceScore),
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
  if (filters.has_opening_hours !== undefined) {
    list = list.filter(t => Boolean(t.opening_hours) === filters.has_opening_hours)
  }
  if (filters.type) {
    list = list.filter(t => t.type === filters.type)
  }
  if (filters.source_kind) {
    list = list.filter((t) => {
      const combined = `${t.source} ${t.source_name}`.toLowerCase()
      if (filters.source_kind === 'city_open_data') {
        return combined.includes('open data') || combined.includes('opendata') || combined.includes('offenedaten')
      }
      if (filters.source_kind === 'institutional') {
        return combined.includes('institutional') || combined.includes('derived')
      }
      if (filters.source_kind === 'osm') {
        return combined.includes('openstreetmap') || combined.includes(' osm ')
      }
      return !(
        combined.includes('openstreetmap')
        || combined.includes(' osm ')
        || combined.includes('open data')
        || combined.includes('opendata')
        || combined.includes('offenedaten')
        || combined.includes('institutional')
        || combined.includes('derived')
      )
    })
  }
  if (filters.reported !== undefined) {
    list = list.filter(t => t.has_reports === filters.reported)
  }
  const minRating = filters.min_rating
  if (minRating !== undefined && Number.isFinite(minRating)) {
    list = list.filter(t => (t.avg_rating ?? 0) >= minRating)
  }
  const radius = filters.radius
  if (
    filters.lat !== undefined
    && filters.lng !== undefined
    && radius !== undefined
    && Number.isFinite(radius)
  ) {
    list = list.filter(t => (t.distance_km ?? Number.POSITIVE_INFINITY) <= radius)
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

function getFreshnessDays(lastUpdatedAt: string, nowMs: number): number {
  const updatedAtMs = Date.parse(lastUpdatedAt)
  if (Number.isNaN(updatedAtMs)) {
    return 9999
  }

  return Math.max(0, Math.floor((nowMs - updatedAtMs) / DAY_MS))
}

function getFreshnessLabel(days: number): ToiletListItem['freshness_label'] {
  if (days <= 30) return 'fresh'
  if (days <= 180) return 'aging'
  return 'stale'
}

function getSourceConfidenceScore(sourceName: string, source: string): number {
  const sourceNameLc = (sourceName ?? '').toLowerCase()
  const sourceLc = (source ?? '').toLowerCase()

  if (
    sourceNameLc.includes('open data')
    || sourceLc.includes('opendata')
    || sourceLc.includes('offenedaten')
  ) {
    return 90
  }
  if (
    sourceNameLc.includes('institutional')
    || sourceNameLc.includes('derived')
    || sourceLc.includes('institutional')
  ) {
    return 72
  }
  if (
    sourceNameLc.includes('openstreetmap')
    || sourceLc.includes('openstreetmap.org')
  ) {
    return 78
  }
  if (sourceLc.startsWith('http://') || sourceLc.startsWith('https://')) {
    return 65
  }
  return 50
}

function getSourceConfidenceLevel(score: number): ToiletListItem['source_confidence_level'] {
  if (score >= 85) return 'high'
  if (score >= 65) return 'medium'
  return 'low'
}
