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
 * Data source: © OpenStreetMap contributors – ODbL license
 * https://www.openstreetmap.org/copyright
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Toilet } from '../../shared/types/index'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const CITIES = (process.env.CITIES ?? 'Leipzig,Frankfurt am Main')
  .split(',')
  .map(c => c.trim())

const OVERPASS_API = process.env.OVERPASS_API ?? 'https://overpass-api.de/api/interpreter'

const OUTPUT_FILE = join(process.cwd(), 'data', 'imports', 'osm.json')

// ---------------------------------------------------------------------------
// Overpass QL query builder
// ---------------------------------------------------------------------------

function buildQuery(city: string): string {
  return `
[out:json][timeout:30];
area["name"="${city}"]["boundary"="administrative"]->.searchArea;
(
  node["amenity"="toilets"](area.searchArea);
  way["amenity"="toilets"](area.searchArea);
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
  console.log(`  Fetching OSM toilets for: ${city}…`)

  const query = buildQuery(city)
  const response = await fetch(OVERPASS_API, {
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

  console.log(`  → ${records.length} records for ${city}`)
  return records
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🚻 Sandra Loo – OSM Import')
  console.log(`Cities: ${CITIES.join(', ')}`)
  console.log(`Overpass API: ${OVERPASS_API}\n`)

  const all: Toilet[] = []
  for (const city of CITIES) {
    const records = await fetchCity(city)
    all.push(...records)
  }

  // Deduplicate by id
  const deduped = [...new Map(all.map(t => [t.id, t])).values()]
  console.log(`\n✅ Total records: ${deduped.length} (after deduplication)`)

  await mkdir(join(process.cwd(), 'data', 'imports'), { recursive: true })
  await writeFile(OUTPUT_FILE, JSON.stringify(deduped, null, 2), 'utf-8')
  console.log(`✅ Written to: ${OUTPUT_FILE}`)
}

main().catch((err) => {
  console.error('❌ Import failed:', err)
  process.exit(1)
})
