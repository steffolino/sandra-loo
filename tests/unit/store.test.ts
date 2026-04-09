import { describe, it, expect } from 'vitest'
import {
  addReview,
  getReviewsForToilet,
  addReport,
  getReportsForToilet,
  addConfirmation,
  getConfirmationsForToilet,
  addScore,
  getAllTimeLeaderboard,
  normalizeAndMergeToilets,
} from '../../server/utils/store'
import {
  FIXTURE_REVIEW_1,
  FIXTURE_REPORT_1,
  FIXTURE_CONFIRMATION_1,
  FIXTURE_SCORE_1,
} from '../fixtures/index'

// Note: the in-memory store accumulates across tests in the same process.
// We use unique IDs per test to avoid cross-test contamination.

describe('store – reviews', () => {
  it('adds and retrieves a review', () => {
    const review = { ...FIXTURE_REVIEW_1, id: 'rv-test-1', toilet_id: 'tp-store-1' }
    addReview(review)
    const results = getReviewsForToilet('tp-store-1')
    expect(results).toHaveLength(1)
    expect(results[0].id).toBe('rv-test-1')
  })

  it('filters reviews by toilet_id', () => {
    const r1 = { ...FIXTURE_REVIEW_1, id: 'rv-test-2a', toilet_id: 'tp-store-2' }
    const r2 = { ...FIXTURE_REVIEW_1, id: 'rv-test-2b', toilet_id: 'tp-store-3' }
    addReview(r1)
    addReview(r2)
    expect(getReviewsForToilet('tp-store-2')).toHaveLength(1)
    expect(getReviewsForToilet('tp-store-3')).toHaveLength(1)
  })
})

describe('store – reports', () => {
  it('adds and retrieves a report', () => {
    const report = { ...FIXTURE_REPORT_1, id: 'rp-test-1', toilet_id: 'tp-store-4' }
    addReport(report)
    expect(getReportsForToilet('tp-store-4')).toHaveLength(1)
  })
})

describe('store – confirmations', () => {
  it('adds and retrieves a confirmation', () => {
    const conf = { ...FIXTURE_CONFIRMATION_1, id: 'cf-test-1', toilet_id: 'tp-store-5' }
    addConfirmation(conf)
    expect(getConfirmationsForToilet('tp-store-5')).toHaveLength(1)
  })
})

describe('store – leaderboard', () => {
  it('adds a score and it appears in all-time leaderboard', () => {
    const score = { ...FIXTURE_SCORE_1, id: 'sc-test-1', user_id: 'test-lb-user' }
    addScore(score)
    const lb = getAllTimeLeaderboard()
    expect(lb.some(s => s.id === 'sc-test-1')).toBe(true)
  })

  it('all-time leaderboard is sorted descending by score', () => {
    addScore({ ...FIXTURE_SCORE_1, id: 'sc-sort-1', score: 100 })
    addScore({ ...FIXTURE_SCORE_1, id: 'sc-sort-2', score: 500 })
    addScore({ ...FIXTURE_SCORE_1, id: 'sc-sort-3', score: 300 })
    const lb = getAllTimeLeaderboard()
    for (let i = 1; i < lb.length; i++) {
      expect(lb[i - 1].score).toBeGreaterThanOrEqual(lb[i].score)
    }
  })
})

describe('store – import merge quality', () => {
  it('merges likely duplicate toilets across sources', () => {
    const now = '2026-01-01T00:00:00.000Z'
    const inputs = [
      {
        id: 'osm-node-1',
        name: 'WC Main Station',
        type: 'public' as const,
        address: 'Hauptbahnhof, Leipzig',
        city: 'Leipzig',
        lat: 51.345,
        lng: 12.381,
        source: 'https://openstreetmap.org/node/1',
        source_name: 'OpenStreetMap',
        source_url: 'https://openstreetmap.org/node/1',
        is_accessible: false,
        is_free: true,
        opening_hours: null,
        notes: null,
        created_at: now,
        last_updated_at: now,
      },
      {
        id: 'leipzig-77',
        name: 'WC Main Station',
        type: 'public' as const,
        address: 'Hauptbahnhof, Leipzig',
        city: 'Leipzig',
        lat: 51.34502,
        lng: 12.38101,
        source: 'https://opendata.leipzig.de',
        source_name: 'Leipzig Open Data',
        source_url: 'https://opendata.leipzig.de',
        is_accessible: true,
        is_free: false,
        opening_hours: 'Mo-Su 06:00-22:00',
        notes: 'City maintained',
        created_at: now,
        last_updated_at: '2026-01-02T00:00:00.000Z',
      },
    ]

    const merged = normalizeAndMergeToilets(inputs)
    expect(merged).toHaveLength(1)
    expect(merged[0].id).toBe('leipzig-77')
    expect(merged[0].is_accessible).toBe(true)
    expect(merged[0].is_free).toBe(false)
  })
})
