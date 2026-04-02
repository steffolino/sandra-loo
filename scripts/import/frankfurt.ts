#!/usr/bin/env tsx
/**
 * Import public toilet data from Frankfurt am Main Open Data portal.
 *
 * Data source: Frankfurt am Main Open Data – dl-de/by-2-0
 * https://offenedaten.frankfurt.de
 *
 * Dataset: "Öffentliche Toiletten Frankfurt am Main"
 * WFS / GeoJSON endpoint: configured via FRANKFURT_WFS_URL env var
 *
 * Usage:
 *   npm run import:frankfurt
 *
 * Output: data/imports/frankfurt.json
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Toilet } from '../../shared/types/index'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// GeoJSON or WFS URL for Frankfurt public toilets.
// Find at: https://offenedaten.frankfurt.de
const WFS_URL = process.env.FRANKFURT_WFS_URL ?? ''
const OUTPUT_FILE = join(process.cwd(), 'data', 'imports', 'frankfurt.json')
const CITY = 'Frankfurt am Main'

// ---------------------------------------------------------------------------
// GeoJSON types
// ---------------------------------------------------------------------------

interface GeoJSONPoint {
  type: 'Point'
  coordinates: [number, number]
}

interface GeoJSONFeature {
  type: 'Feature'
  id?: string | number
  geometry: GeoJSONPoint
  properties: Record<string, unknown>
}

interface GeoJSONCollection {
  type: 'FeatureCollection'
  features: GeoJSONFeature[]
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalizeFeature(feature: GeoJSONFeature, index: number): Toilet | null {
  const coords = feature.geometry?.coordinates
  if (!coords || coords.length < 2) {
    console.warn(`  Skipping feature ${index}: missing coordinates`)
    return null
  }

  const [lng, lat] = coords
  const props = feature.properties ?? {}
  const now = new Date().toISOString()

  return {
    id: `frankfurt-${feature.id ?? index}`,
    name: String(props.name ?? props.Name ?? props.bezeichnung ?? 'Öffentliche Toilette'),
    type: 'public',
    address: buildAddress(props),
    city: CITY,
    lat,
    lng,
    source: WFS_URL,
    source_name: 'Frankfurt am Main Open Data',
    is_accessible: Boolean(props.rollstuhl ?? props.wheelchair ?? props.barrierefrei ?? false),
    is_free: !(props.kostenpflichtig ?? props.gebuehr ?? false),
    opening_hours: String(props.oeffnungszeiten ?? props.opening_hours ?? '') || null,
    notes: String(props.hinweise ?? props.notes ?? '') || null,
    created_at: now,
    last_updated_at: now,
  }
}

function buildAddress(props: Record<string, unknown>): string | null {
  const parts: string[] = []
  const street = props.strasse ?? props.street ?? props.adresse
  const number = props.hausnummer ?? props.house_number
  if (street) parts.push(number ? `${street} ${number}` : String(street))
  const postcode = props.plz ?? props.postleitzahl
  if (postcode) parts.push(String(postcode))
  parts.push(CITY)
  return parts.join(', ')
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchAll(): Promise<Toilet[]> {
  if (!WFS_URL) {
    console.warn('⚠️  FRANKFURT_WFS_URL is not set.')
    console.warn('   Find the dataset at: https://offenedaten.frankfurt.de')
    console.warn('   Set the FRANKFURT_WFS_URL env var and re-run: npm run import:frankfurt')
    return []
  }

  console.log(`  Fetching ${WFS_URL}…`)
  const response = await fetch(WFS_URL)
  if (!response.ok) {
    throw new Error(`Frankfurt API error: ${response.status} ${response.statusText}`)
  }

  const json = (await response.json()) as GeoJSONCollection
  if (json.type !== 'FeatureCollection' || !Array.isArray(json.features)) {
    throw new Error('Expected a GeoJSON FeatureCollection')
  }

  return json.features
    .map((f, i) => normalizeFeature(f, i))
    .filter((t): t is Toilet => t !== null)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🚻 Sandra Loo – Frankfurt am Main Open Data Import')
  console.log(`URL: ${WFS_URL || '(not set)'}\n`)

  const records = await fetchAll()
  console.log(`\n✅ Total records: ${records.length}`)

  await mkdir(join(process.cwd(), 'data', 'imports'), { recursive: true })
  await writeFile(OUTPUT_FILE, JSON.stringify(records, null, 2), 'utf-8')
  console.log(`✅ Written to: ${OUTPUT_FILE}`)
}

main().catch((err) => {
  console.error('❌ Import failed:', err)
  process.exit(1)
})
