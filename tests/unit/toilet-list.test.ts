import { describe, expect, it } from 'vitest'
import type { Report, Review, Toilet } from '../../shared/types/index'
import { buildToiletList } from '../../server/utils/toilet-list'

const baseToilets: Toilet[] = [
  {
    id: 't-1',
    name: 'A',
    type: 'public',
    address: null,
    city: 'Leipzig',
    lat: 51.3397,
    lng: 12.3731,
    source: 'https://example.com/1',
    source_name: 'Fixture',
    is_accessible: true,
    is_free: true,
    opening_hours: null,
    notes: null,
    created_at: '2024-01-01T00:00:00.000Z',
    last_updated_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 't-2',
    name: 'B',
    type: 'cafe',
    address: null,
    city: 'Leipzig',
    lat: 51.35,
    lng: 12.4,
    source: 'https://example.com/2',
    source_name: 'Fixture',
    is_accessible: false,
    is_free: false,
    opening_hours: null,
    notes: null,
    created_at: '2024-01-01T00:00:00.000Z',
    last_updated_at: '2024-02-01T00:00:00.000Z',
  },
  {
    id: 't-3',
    name: 'C',
    type: 'park',
    address: null,
    city: 'Frankfurt am Main',
    lat: 50.1109,
    lng: 8.6821,
    source: 'https://example.com/3',
    source_name: 'Fixture',
    is_accessible: false,
    is_free: true,
    opening_hours: null,
    notes: null,
    created_at: '2024-01-01T00:00:00.000Z',
    last_updated_at: '2024-03-01T00:00:00.000Z',
  },
]

const reviews: Review[] = [
  {
    id: 'r-1',
    toilet_id: 't-1',
    user_id: 'u',
    cleanliness: 4,
    lighting: 4,
    toilet_paper: true,
    accessibility: true,
    comment: null,
    created_at: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'r-2',
    toilet_id: 't-2',
    user_id: 'u',
    cleanliness: 2,
    lighting: 2,
    toilet_paper: false,
    accessibility: false,
    comment: null,
    created_at: '2024-01-01T00:00:00.000Z',
  },
]

const reports: Report[] = [
  {
    id: 'rp-1',
    toilet_id: 't-2',
    user_id: 'u',
    type: 'dirty',
    status: 'open',
    description: null,
    created_at: '2024-01-01T00:00:00.000Z',
  },
]

describe('buildToiletList', () => {
  it('adds derived rating/report metadata', () => {
    const list = buildToiletList(baseToilets, reviews, reports, {})
    const t1 = list.find(t => t.id === 't-1')
    const t2 = list.find(t => t.id === 't-2')

    expect(t1?.avg_rating).toBe(4)
    expect(t1?.report_count).toBe(0)
    expect(t2?.avg_rating).toBe(2)
    expect(t2?.has_reports).toBe(true)
  })

  it('filters by reported=true', () => {
    const list = buildToiletList(baseToilets, reviews, reports, { reported: true })
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('t-2')
  })

  it('filters by minimum rating', () => {
    const list = buildToiletList(baseToilets, reviews, reports, { min_rating: 3 })
    expect(list.map(t => t.id)).toContain('t-1')
    expect(list.map(t => t.id)).not.toContain('t-2')
  })

  it('sorts by nearest when lat/lng are provided', () => {
    const list = buildToiletList(baseToilets, reviews, reports, {
      lat: 51.3397,
      lng: 12.3731,
      sort: 'nearest',
    })
    expect(list[0].id).toBe('t-1')
    expect(list[0].distance_km).toBe(0)
  })

  it('filters by radius in km', () => {
    const list = buildToiletList(baseToilets, reviews, reports, {
      lat: 51.3397,
      lng: 12.3731,
      radius: 4,
    })
    expect(list.map(t => t.id)).toEqual(['t-2', 't-1'])
    expect(list.map(t => t.id)).not.toContain('t-3')
  })
})
