/**
 * Lightweight in-process data store.
 *
 * MVP implementation uses JSON files under data/imports/.
 * Replace with a real database adapter (SQLite / Postgres) in production.
 *
 * The store is intentionally READ-ONLY for toilets (data comes from
 * import scripts), while reviews/reports/confirmations/scores are
 * written at runtime into an in-memory store for the MVP.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type {
  Confirmation,
  GameScore,
  Report,
  Review,
  Toilet,
} from '../../shared/types/index'

// ---------------------------------------------------------------------------
// Toilet store  (read from import files)
// ---------------------------------------------------------------------------

let toiletCache: Toilet[] | null = null

export async function getToilets(): Promise<Toilet[]> {
  if (toiletCache !== null) return toiletCache

  const dataDir = join(process.cwd(), 'data', 'imports')
  const files = ['osm.json', 'leipzig.json', 'frankfurt.json']
  const all: Toilet[] = []

  for (const file of files) {
    try {
      const raw = await readFile(join(dataDir, file), 'utf-8')
      const parsed: Toilet[] = JSON.parse(raw)
      all.push(...parsed)
    }
    catch {
      // File does not exist yet – that is fine; show empty state.
    }
  }

  toiletCache = all
  return all
}

export async function getToiletById(id: string): Promise<Toilet | null> {
  const all = await getToilets()
  return all.find(t => t.id === id) ?? null
}

/** Invalidate the toilet cache (call after a successful import). */
export function invalidateToiletCache() {
  toiletCache = null
}

// ---------------------------------------------------------------------------
// In-memory runtime stores  (MVP only – replace with DB for production)
// ---------------------------------------------------------------------------

const reviews: Review[] = []
const reports: Report[] = []
const confirmations: Confirmation[] = []
const scores: GameScore[] = []

// --- Reviews ---

export function addReview(review: Review) {
  reviews.push(review)
}

export function getReviewsForToilet(toiletId: string): Review[] {
  return reviews.filter(r => r.toilet_id === toiletId)
}

export function getAllReviews(): Review[] {
  return [...reviews]
}

// --- Reports ---

export function addReport(report: Report) {
  reports.push(report)
}

export function getReportsForToilet(toiletId: string): Report[] {
  return reports.filter(r => r.toilet_id === toiletId)
}

export function getAllReports(): Report[] {
  return [...reports]
}

// --- Confirmations ---

export function addConfirmation(confirmation: Confirmation) {
  confirmations.push(confirmation)
}

export function getConfirmationsForToilet(toiletId: string): Confirmation[] {
  return confirmations.filter(c => c.toilet_id === toiletId)
}

// --- Game scores ---

export function addScore(score: GameScore) {
  scores.push(score)
}

export function getDailyLeaderboard(): GameScore[] {
  const today = new Date().toISOString().slice(0, 10)
  return scores
    .filter(s => s.created_at.startsWith(today))
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)
}

export function getAllTimeLeaderboard(): GameScore[] {
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)
}
