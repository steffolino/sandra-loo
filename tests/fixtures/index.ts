/**
 * Synthetic test fixtures for unit tests.
 *
 * ⚠️  These are SYNTHETIC records for testing only.
 *     They must NEVER be used as real data in the application.
 */

import type { Toilet, Review, Report, Confirmation, GameScore } from '../../shared/types/index'

export const FIXTURE_TOILET_1: Toilet = {
  id: 'test-toilet-1',
  name: 'Test Toilet A',
  type: 'public',
  address: 'Teststraße 1, 04109 Leipzig',
  city: 'Leipzig',
  lat: 51.3397,
  lng: 12.3731,
  source: 'https://test.example.com/toilet/1',
  source_name: 'Test Fixture',
  is_accessible: true,
  is_free: true,
  opening_hours: 'Mo-Su 08:00-22:00',
  notes: null,
  created_at: '2024-01-01T00:00:00.000Z',
  last_updated_at: '2024-01-01T00:00:00.000Z',
}

export const FIXTURE_TOILET_2: Toilet = {
  id: 'test-toilet-2',
  name: 'Test Café WC',
  type: 'cafe',
  address: 'Musterweg 5, 60311 Frankfurt am Main',
  city: 'Frankfurt am Main',
  lat: 50.1109,
  lng: 8.6821,
  source: 'https://test.example.com/toilet/2',
  source_name: 'Test Fixture',
  is_accessible: false,
  is_free: false,
  opening_hours: null,
  notes: null,
  created_at: '2024-01-01T00:00:00.000Z',
  last_updated_at: '2024-01-01T00:00:00.000Z',
}

export const FIXTURE_REVIEW_1: Review = {
  id: 'test-review-1',
  toilet_id: 'test-toilet-1',
  user_id: 'test-user-1',
  cleanliness: 4,
  lighting: 3,
  toilet_paper: true,
  accessibility: true,
  comment: 'Pretty clean!',
  created_at: '2024-01-02T10:00:00.000Z',
}

export const FIXTURE_REPORT_1: Report = {
  id: 'test-report-1',
  toilet_id: 'test-toilet-1',
  user_id: 'test-user-2',
  type: 'dirty',
  status: 'open',
  description: null,
  created_at: '2024-01-03T12:00:00.000Z',
}

export const FIXTURE_CONFIRMATION_1: Confirmation = {
  id: 'test-confirmation-1',
  toilet_id: 'test-toilet-1',
  type: 'open',
  created_at: '2024-01-04T09:00:00.000Z',
}

export const FIXTURE_SCORE_1: GameScore = {
  id: 'test-score-1',
  user_id: 'test-user-1',
  score: 850,
  steps_completed: 8,
  leaderboard_scope: 'all-time',
  city_scope: null,
  created_at: '2024-01-05T15:00:00.000Z',
}
