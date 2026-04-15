#!/usr/bin/env tsx
/**
 * Import public toilet data from OpenStreetMap (Overpass API).
 *
 * Usage:
 *   npm run import:osm
 *   # Or with custom cities:
 *   CITIES="Leipzig,Dresden" npm run import:osm
 *
 * Output: data/imports/osm.json
 *
 * Data source: OpenStreetMap contributors (ODbL)
 * https://www.openstreetmap.org/copyright
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Toilet } from '../../shared/types/index'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CITIES = (process.env.CITIES ?? 'Leipzig,Frankfurt am Main')
  .split(',')
  .map(c => c.trim())

const OVERPASS_APIS = (process.env.OVERPASS_APIS
  ?? process.env.OVERPASS_API
  ?? 'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean)

const OUTPUT_FILE = join(process.cwd(), 'data', 'imports', 'osm.json')
const ALLOW_STALE = process.env.OSM_IMPORT_ALLOW_STALE === 'true'

// ---------------------------------------------------------------------------
// Overpass QL query builder
// ---------------------------------------------------------------------------

function buildQuery(city: string, kinds: Array<'node' | 'way'> = ['node', 'way']): string {
  const parts: string[] = []
  if (kinds.includes('node')) {
    parts.push('  node["amenity"="toilets"](area.searchArea);')
  }
  if (kinds.includes('way')) {
    parts.push('  way["amenity"="toilets"](area.searchArea);')
  }

  return `
[out:json][timeout:60];
area["name"="${city}"]["boundary"="administrative"]->.searchArea;
(
${parts.join('\n')}
);
out center tags;
`.trim()
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

interface OverpassElement {
  type: 'node' | 'way'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number, lon: number }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements: OverpassElement[]
}

function normalizeElement(el: OverpassElement, city: string): Toilet | null {
  const lat = el.lat ?? el.center?.lat
  const lng = el.lon ?? el.center?.lon
  if (!lat || !lng) return null

  const tags = el.tags ?? {}
  const now = new Date().toISOString()

  return {
    id: `osm-${el.type}-${el.id}`,
    name: tags.name ?? tags['name:de'] ?? null,
    type: 'public',
    address: buildAddress(tags),
    city,
    lat,
    lng,
    source: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    source_name: 'OpenStreetMap',
    source_url: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    is_accessible: tags.wheelchair === 'yes' || tags.wheelchair === 'designated',
    is_free: tags.fee !== 'yes',
    opening_hours: tags.opening_hours ?? null,
    notes: tags.description ?? null,
    created_at: now,
    last_updated_at: now,
  }
}

function buildAddress(tags: Record<string, string>): string | null {
  const parts: string[] = []
  if (tags['addr:street']) {
    parts.push(tags['addr:street'])
    if (tags['addr:housenumber']) parts[0] += ` ${tags['addr:housenumber']}`
  }
  if (tags['addr:postcode']) parts.push(tags['addr:postcode'])
  if (tags['addr:city']) parts.push(tags['addr:city'])
  return parts.length > 0 ? parts.join(', ') : null
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchCity(city: string): Promise<Toilet[]> {
  console.log(`  Fetching OSM toilets for: ${city}...`)
  let lastError: unknown
  const queryPlans: Array<{ label: string, kinds: Array<'node' | 'way'> }> = [
    { label: 'node+way', kinds: ['node', 'way'] },
    { label: 'node-only', kinds: ['node'] },
    { label: 'way-only', kinds: ['way'] },
  ]

  for (const apiUrl of OVERPASS_APIS) {
    const host = (() => {
      try { return new URL(apiUrl).hostname } catch { return apiUrl }
    })()

    for (const plan of queryPlans) {
      const query = buildQuery(city, plan.kinds)

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `data=${encodeURIComponent(query)}`,
          })

          if (!response.ok) {
            throw new Error(`Overpass API error: ${response.status} ${response.statusText}`)
          }

          const json = (await response.json()) as OverpassResponse
          const records = json.elements
            .map(el => normalizeElement(el, city))
            .filter((t): t is Toilet => t !== null)

          console.log(`  [${host} ${plan.label} attempt ${attempt}/3] -> ${records.length} records for ${city}`)
          return records
        }
        catch (err) {
          lastError = err
          console.warn(`  [${host} ${plan.label} attempt ${attempt}/3] failed: ${err}`)
          await sleep(1500 * attempt)
        }
      }
    }
  }

  throw new Error(`All Overpass endpoints failed for ${city}: ${String(lastError)}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Sandra Loo - OSM Import')
  console.log(`Cities: ${CITIES.join(', ')}`)
  console.log(`Overpass APIs: ${OVERPASS_APIS.join(', ')}\n`)

  const existing = await readExistingSnapshot()
  const all: Toilet[] = []
  const staleCities: string[] = []

  for (const city of CITIES) {
    try {
      const records = await fetchCity(city)
      all.push(...records)
    }
    catch (error) {
      if (!ALLOW_STALE) throw error

      const fallback = existing.filter(toilet => toilet.city === city)
      if (fallback.length === 0) throw error

      staleCities.push(city)
      all.push(...fallback)
      console.warn(`  Using stale cached OSM data for ${city} (${fallback.length} records).`)
    }
  }

  // Deduplicate by id.
  const deduped = [...new Map(all.map(t => [t.id, t])).values()]
  console.log(`\nTotal records: ${deduped.length} (after deduplication)`)
  if (staleCities.length > 0) {
    console.log(`Stale fallback applied for: ${staleCities.join(', ')}`)
  }

  await mkdir(join(process.cwd(), 'data', 'imports'), { recursive: true })
  await writeFile(OUTPUT_FILE, JSON.stringify(deduped, null, 2), 'utf-8')
  console.log(`Written to: ${OUTPUT_FILE}`)
}

async function readExistingSnapshot(): Promise<Toilet[]> {
  try {
    const raw = await readFile(OUTPUT_FILE, 'utf-8')
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as Toilet[]
  }
  catch {
    return []
  }
}

main().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
