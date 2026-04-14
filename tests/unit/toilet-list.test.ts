import { describe, expect, it } from 'vitest'
import type { Confirmation, Report, Review, Toilet } from '../../shared/types/index'
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
    source_url: 'https://example.com/1',
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
    source_url: 'https://example.com/2',
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
    source_url: 'https://example.com/3',
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

const confirmations: Confirmation[] = [
  {
    id: 'c-1',
    toilet_id: 't-1',
    type: 'open',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c-2',
    toilet_id: 't-1',
    type: 'clean',
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'c-3',
    toilet_id: 't-2',
    type: 'open',
    created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

describe('buildToiletList', () => {
  it('adds derived rating/report metadata', () => {
    const list = buildToiletList(baseToilets, reviews, reports, confirmations, {})
    const t1 = list.find(t => t.id === 't-1')
    const t2 = list.find(t => t.id === 't-2')

    expect(t1?.avg_rating).toBe(4)
    expect(t1?.report_count).toBe(0)
    expect(t1?.recent_confirmation_count).toBe(2)
    expect(t2?.avg_rating).toBe(2)
    expect(t2?.has_reports).toBe(true)
    expect(t2?.recent_confirmation_count).toBe(0)
    expect(t1?.freshness_label).toBeTypeOf('string')
    expect(t1?.source_confidence_score).toBeTypeOf('number')
  })

  it('filters by reported=true', () => {
    const list = buildToiletList(baseToilets, reviews, reports, confirmations, { reported: true })
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('t-2')
  })

  it('filters by minimum rating', () => {
    const list = buildToiletList(baseToilets, reviews, reports, confirmations, { min_rating: 3 })
    expect(list.map(t => t.id)).toContain('t-1')
    expect(list.map(t => t.id)).not.toContain('t-2')
  })

  it('filters by opening hours availability', () => {
    const list = buildToiletList([
      { ...baseToilets[0], opening_hours: 'Mo-Fr 08:00-18:00' },
      { ...baseToilets[1], opening_hours: null },
    ], reviews, reports, confirmations, { has_opening_hours: true })

    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('t-1')
  })

  it('sorts by nearest when lat/lng are provided', () => {
    const list = buildToiletList(baseToilets, reviews, reports, confirmations, {
      lat: 51.3397,
      lng: 12.3731,
      sort: 'nearest',
    })
    expect(list[0].id).toBe('t-1')
    expect(list[0].distance_km).toBe(0)
  })

  it('filters by radius in km', () => {
    const list = buildToiletList(baseToilets, reviews, reports, confirmations, {
      lat: 51.3397,
      lng: 12.3731,
      radius: 4,
    })
    expect(list.map(t => t.id)).toEqual(['t-2', 't-1'])
    expect(list.map(t => t.id)).not.toContain('t-3')
  })

  it('assigns higher source confidence to city open data than generic sources', () => {
    const list = buildToiletList(baseToilets, reviews, reports, confirmations, {})
    const t1 = list.find(t => t.id === 't-1')
    const t2 = list.find(t => t.id === 't-2')

    expect(t1?.source_confidence_score).toBe(65)
    expect(t2?.source_confidence_level).toBe('medium')
  })

  it('classifies institutional sources separately', () => {
    const list = buildToiletList([
      {
        ...baseToilets[0],
        source: 'https://www.openstreetmap.org/node/1',
        source_name: 'Institutional layer (OSM-derived)',
        source_url: 'https://www.openstreetmap.org/node/1',
      },
    ], reviews, reports, confirmations, { source_kind: 'institutional' })

    expect(list).toHaveLength(1)
    expect(list[0].source_confidence_score).toBe(72)
    expect(list[0].source_confidence_level).toBe('medium')
  })

  it('filters by source kind', () => {
    const list = buildToiletList([
      { ...baseToilets[0], source: 'https://www.openstreetmap.org/node/1', source_name: 'OpenStreetMap', source_url: 'https://www.openstreetmap.org/node/1' },
      { ...baseToilets[1], source: 'https://opendata.leipzig.de/resource/abc', source_name: 'Leipzig Open Data', source_url: 'https://opendata.leipzig.de/dataset/offentliche-toiletten-stadt-leipzig1' },
      { ...baseToilets[2], source: 'https://example.com/3', source_name: 'Fixture', source_url: 'https://example.com/3' },
    ], reviews, reports, confirmations, { source_kind: 'city_open_data' })

    expect(list).toHaveLength(1)
    expect(list[0].id).toBe('t-2')
  })
})
