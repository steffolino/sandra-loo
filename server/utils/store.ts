/**
 * Lightweight in-process data store.
 *
 * MVP implementation uses JSON files under data/imports/.
 * Runtime user submissions are persisted to JSON under data/runtime/.
 * Replace with a real database adapter (SQLite / Postgres) in production.
 *
 * Toilets are loaded from import snapshots and normalized/merged before use.
 */

import { readFile } from 'node:fs/promises'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type {
  Confirmation,
  GameScore,
  Report,
  Review,
  Toilet,
} from '../../shared/types/index'
import { haversineKm } from './helpers'

// ---------------------------------------------------------------------------
// Toilet store  (read from import files)
// ---------------------------------------------------------------------------

let toiletCache: Toilet[] | null = null

export async function getToilets(): Promise<Toilet[]> {
  if (toiletCache !== null) return toiletCache

  const dataDir = join(process.cwd(), 'data', 'imports')
  const files = ['osm.json', 'institutional.json', 'leipzig-institutional.json', 'leipzig.json', 'frankfurt.json']
  const all: Toilet[] = []

  for (const file of files) {
    try {
      const raw = await readFile(join(dataDir, file), 'utf-8')
      const parsed: Toilet[] = JSON.parse(raw)
      all.push(...parsed.map((toilet) => ({
        ...toilet,
        source_url: toilet.source_url || toilet.source,
      })))
    }
    catch {
      // File does not exist yet – that is fine; show empty state.
    }
  }

  toiletCache = normalizeAndMergeToilets(all)
  return toiletCache
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
// Runtime stores persisted to local JSON (MVP only – replace with DB)
// ---------------------------------------------------------------------------

interface RuntimeStoreData {
  reviews: Review[]
  reports: Report[]
  confirmations: Confirmation[]
  scores: GameScore[]
}

const RUNTIME_DIR = join(process.cwd(), 'data', 'runtime')
const RUNTIME_FILE = join(RUNTIME_DIR, 'store.json')

const runtimeData = loadRuntimeStore()
const reviews: Review[] = runtimeData.reviews
const reports: Report[] = runtimeData.reports
const confirmations: Confirmation[] = runtimeData.confirmations
const scores: GameScore[] = runtimeData.scores

// --- Reviews ---

export function addReview(review: Review) {
  reviews.push(review)
  persistRuntimeStore()
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
  persistRuntimeStore()
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
  persistRuntimeStore()
}

export function getConfirmationsForToilet(toiletId: string): Confirmation[] {
  return confirmations.filter(c => c.toilet_id === toiletId)
}

export function getAllConfirmations(): Confirmation[] {
  return [...confirmations]
}

// --- Game scores ---

export function addScore(score: GameScore) {
  scores.push(score)
  persistRuntimeStore()
}

export function getDailyLeaderboard(): GameScore[] {
  const today = new Date().toISOString().slice(0, 10)
  return scores
    .filter(s => s.created_at.startsWith(today))
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)
}

export function getAllTimeLeaderboard(): GameScore[] {
  return [...scores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 100)
}

function loadRuntimeStore(): RuntimeStoreData {
  const empty: RuntimeStoreData = {
    reviews: [],
    reports: [],
    confirmations: [],
    scores: [],
  }

  // Keep tests isolated and deterministic.
  if (process.env.NODE_ENV === 'test') {
    return empty
  }

  try {
    if (!existsSync(RUNTIME_FILE)) {
      return empty
    }

    const raw = readFileSync(RUNTIME_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<RuntimeStoreData>
    return {
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews : [],
      reports: Array.isArray(parsed.reports) ? parsed.reports : [],
      confirmations: Array.isArray(parsed.confirmations) ? parsed.confirmations : [],
      scores: Array.isArray(parsed.scores) ? parsed.scores : [],
    }
  }
  catch {
    return empty
  }
}

function persistRuntimeStore() {
  if (process.env.NODE_ENV === 'test') return

  mkdirSync(RUNTIME_DIR, { recursive: true })
  const payload: RuntimeStoreData = {
    reviews: [...reviews],
    reports: [...reports],
    confirmations: [...confirmations],
    scores: [...scores],
  }
  writeFileSync(RUNTIME_FILE, JSON.stringify(payload, null, 2), 'utf-8')
}

export function normalizeAndMergeToilets(toilets: Toilet[]): Toilet[] {
  const uniqueById = [...new Map(toilets.map(t => [t.id, t])).values()]
  const valid = uniqueById.filter(isWithinGermanyBounds)

  const mergedByCity = new Map<string, Toilet[]>()
  const sorted = [...valid].sort((a, b) => compareToiletPriority(a, b))

  for (const toilet of sorted) {
    const cityKey = (toilet.city ?? '').trim().toLowerCase()
    const cityList = mergedByCity.get(cityKey) ?? []
    let merged = false

    for (let i = 0; i < cityList.length; i++) {
      if (areLikelySameToilet(cityList[i], toilet)) {
        cityList[i] = mergeToiletPair(cityList[i], toilet)
        merged = true
        break
      }
    }

    if (!merged) {
      cityList.push(toilet)
    }

    mergedByCity.set(cityKey, cityList)
  }

  return [...mergedByCity.values()].flat()
}

function isWithinGermanyBounds(toilet: Toilet): boolean {
  // Rough Germany bounding box.
  return toilet.lat >= 47 && toilet.lat <= 55.3 && toilet.lng >= 5.5 && toilet.lng <= 15.6
}

function areLikelySameToilet(a: Toilet, b: Toilet): boolean {
  const distanceKm = haversineKm(a.lat, a.lng, b.lat, b.lng)
  if (distanceKm > 0.08) {
    return false
  }

  const aAddress = normalizeText(a.address)
  const bAddress = normalizeText(b.address)
  if (aAddress && bAddress && aAddress === bAddress) {
    return true
  }

  const aName = normalizeText(a.name)
  const bName = normalizeText(b.name)
  if (aName && bName && aName === bName) {
    return true
  }

  // When one source misses naming/address details, small distance is good enough.
  if ((!aName || !bName) && distanceKm <= 0.03) {
    return true
  }

  return a.type === b.type && distanceKm <= 0.02
}

function normalizeText(value: string | null): string {
  if (!value) return ''
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function compareToiletPriority(a: Toilet, b: Toilet): number {
  const sourceDiff = sourcePriority(b) - sourcePriority(a)
  if (sourceDiff !== 0) {
    return sourceDiff
  }

  const updatedDiff = parseDateSafe(b.last_updated_at) - parseDateSafe(a.last_updated_at)
  if (updatedDiff !== 0) {
    return updatedDiff
  }

  const completenessDiff = completenessScore(b) - completenessScore(a)
  if (completenessDiff !== 0) {
    return completenessDiff
  }

  return a.id.localeCompare(b.id)
}

function sourcePriority(toilet: Toilet): number {
  const sourceName = toilet.source_name.toLowerCase()
  if (sourceName.includes('open data') && !sourceName.includes('fallback')) return 4
  if (sourceName.includes('openstreetmap') && !sourceName.includes('fallback')) return 3
  if (sourceName.includes('institutional')) return 2
  return 1
}

function completenessScore(toilet: Toilet): number {
  let score = 0
  if (toilet.name) score += 1
  if (toilet.address) score += 1
  if (toilet.opening_hours) score += 1
  if (toilet.notes) score += 1
  return score
}

function parseDateSafe(value: string): number {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function mergeToiletPair(a: Toilet, b: Toilet): Toilet {
  const preferred = compareToiletPriority(a, b) <= 0 ? a : b
  const secondary = preferred.id === a.id ? b : a

  return {
    ...preferred,
    name: preferred.name ?? secondary.name,
    address: preferred.address ?? secondary.address,
    is_accessible: preferred.is_accessible || secondary.is_accessible,
    // Be conservative: if one source says paid, keep paid.
    is_free: preferred.is_free && secondary.is_free,
    opening_hours: pickLonger(preferred.opening_hours, secondary.opening_hours),
    notes: combineNotes(preferred.notes, secondary.notes),
    source_url: preferred.source_url || secondary.source_url,
    created_at: minIso(preferred.created_at, secondary.created_at),
    last_updated_at: maxIso(preferred.last_updated_at, secondary.last_updated_at),
  }
}

function pickLonger(a: string | null, b: string | null): string | null {
  if (!a) return b
  if (!b) return a
  return a.length >= b.length ? a : b
}

function combineNotes(a: string | null, b: string | null): string | null {
  if (!a) return b
  if (!b) return a
  if (a === b) return a
  return `${a} | ${b}`
}

function minIso(a: string, b: string): string {
  return parseDateSafe(a) <= parseDateSafe(b) ? a : b
}

function maxIso(a: string, b: string): string {
  return parseDateSafe(a) >= parseDateSafe(b) ? a : b
}
