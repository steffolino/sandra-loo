// ============================================================
// Core data types for Sandra Loo
// ALL data must come from verified sources – never hardcoded.
// Each record must include: source, source_name, last_updated_at
// ============================================================

export type ToiletType =
  | 'public'
  | 'cafe'
  | 'restaurant'
  | 'shopping_mall'
  | 'park'
  | 'petrol_station'
  | 'other'

export interface Toilet {
  id: string
  name: string | null
  type: ToiletType
  address: string | null
  city: string
  lat: number
  lng: number
  /** Data origin – MANDATORY */
  source: string
  /** Human-readable source label */
  source_name: string
  is_accessible: boolean
  is_free: boolean
  opening_hours: string | null
  notes: string | null
  created_at: string
  last_updated_at: string
}

export interface Review {
  id: string
  toilet_id: string
  user_id: string
  /** 1–5 */
  cleanliness: number
  /** 1–5 */
  lighting: number
  toilet_paper: boolean
  accessibility: boolean
  comment: string | null
  created_at: string
}

export type ReportType =
  | 'closed'
  | 'dirty'
  | 'broken'
  | 'unsafe'
  | 'missing'
  | 'other'

export type ReportStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed'

export interface Report {
  id: string
  toilet_id: string
  user_id: string
  type: ReportType
  status: ReportStatus
  description: string | null
  created_at: string
}

export type ConfirmationType = 'open' | 'clean' | 'accessible' | 'free'

export interface Confirmation {
  id: string
  toilet_id: string
  type: ConfirmationType
  created_at: string
}

export type LeaderboardScope = 'daily' | 'all-time'

export interface GameScore {
  id: string
  user_id: string
  score: number
  steps_completed: number
  leaderboard_scope: LeaderboardScope
  city_scope: string | null
  created_at: string
}

// ============================================================
// API response wrappers
// ============================================================

export interface ApiSuccess<T> {
  data: T
  meta?: Record<string, unknown>
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

// ============================================================
// Game types
// ============================================================

export type ToiletOptionType = 'public' | 'cafe' | 'park'

export interface ToiletOption {
  type: ToiletOptionType
  label: string
  probability: number
  bladderEffect: number
  igittEffect: number
  pointsBonus: number
}

export interface GameConfig {
  maxSteps: number
  pointsPerStep: number
  meterMax: number
  meterDangerThreshold: number
  toiletOptions: ToiletOption[]
  rewardsPerStep: number
}

export type RewardCategory = 'cosmetic' | 'bonus'

export interface Reward {
  id: string
  name: string
  description: string
  category: RewardCategory
  icon: string
}

export interface GameState {
  step: number
  score: number
  bladderMeter: number
  igittMeter: number
  isRunning: boolean
  isGameOver: boolean
  gameOverReason: 'bladder' | 'igitt' | null
  equippedRewards: Reward[]
}

// ============================================================
// Filter / query types
// ============================================================

export interface ToiletFilters {
  city?: string
  is_accessible?: boolean
  is_free?: boolean
  type?: ToiletType
  lat?: number
  lng?: number
  radius?: number
}
