#!/usr/bin/env tsx
/**
 * Import public toilet data from Frankfurt am Main Open Data portal.
 *
 * Data source: Frankfurt am Main Open Data – dl-de/by-2-0
 * https://www.offenedaten.frankfurt.de
 *
 * Dataset: "Öffentliche Toiletten Frankfurt am Main"
 * Dataset page: https://www.offenedaten.frankfurt.de/dataset/oeffentliche-wc-anlagen
 *
 * Discovery: if FRANKFURT_WFS_URL is not set the script calls the DKAN /api/3
 * (CKAN-compatible) package_show endpoint to locate the first GeoJSON or CSV
 * resource automatically.  Set FRANKFURT_DATASET_ID to override the dataset
 * slug used for discovery.
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
// Leave unset to auto-discover via the DKAN/CKAN package_show endpoint.
const WFS_URL = process.env.FRANKFURT_WFS_URL ?? ''
const BASE_URL = process.env.FRANKFURT_API_URL ?? 'https://www.offenedaten.frankfurt.de/api/3/action'
const DATASET_ID = process.env.FRANKFURT_DATASET_ID ?? 'oeffentliche-wc-anlagen'
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
// DKAN/CKAN discovery types
// ---------------------------------------------------------------------------

interface DKANResource {
  id: string
  url: string
  format: string
  datastore_active?: boolean
}

interface DKANPackageResponse {
  success?: boolean
  result?: {
    resources?: DKANResource[]
  }
}

// ---------------------------------------------------------------------------
// CSV helpers (shared with Leipzig pattern)
// ---------------------------------------------------------------------------

function splitCsvLine(line: string, sep: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped double-quote: add one literal " and skip both characters.
        current += '"'
        i += 2
        continue
      }
      inQuotes = !inQuotes
    }
    else if (char === sep && !inQuotes) {
      fields.push(current.trim())
      current = ''
    }
    else {
      current += char
    }
    i++
  }
  fields.push(current.trim())
  return fields
}

function parseCsvAsGeoJSON(text: string): GeoJSONCollection {
  const clean = text.replace(/^\uFEFF/, '')
  const lines = clean.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { type: 'FeatureCollection', features: [] }

  const sep = lines[0].split(';').length > lines[0].split(',').length ? ';' : ','
  const fields = splitCsvLine(lines[0], sep).map(f => f.toLowerCase().replace(/^["']|["']$/g, ''))

  const features: GeoJSONFeature[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i], sep)
    const props: Record<string, string> = {}
    fields.forEach((f, idx) => { props[f] = values[idx] ?? '' })

    // Try to find lat/lng columns (handle German decimal comma)
    const latRaw = props.lat ?? props.latitude ?? props.y ?? ''
    const lngRaw = props.lon ?? props.lng ?? props.longitude ?? props.x ?? ''
    const lat = parseFloat(latRaw.replace(',', '.'))
    const lng = parseFloat(lngRaw.replace(',', '.'))

    if (Number.isNaN(lat) || Number.isNaN(lng)) continue

    features.push({
      type: 'Feature',
      id: i,
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: props,
    })
  }

  return { type: 'FeatureCollection', features }
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
    source: WFS_URL || `${BASE_URL}/package_show?id=${DATASET_ID}`,
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
// Auto-discovery via DKAN/CKAN package_show
// ---------------------------------------------------------------------------

async function discoverResource(): Promise<DKANResource | null> {
  const url = `${BASE_URL}/package_show?id=${encodeURIComponent(DATASET_ID)}`
  console.log(`  Discovering dataset resources from: ${url}`)

  let response: Response
  try {
    response = await fetch(url)
  }
  catch (err) {
    console.warn(`  Could not reach Frankfurt Open Data portal: ${err}`)
    return null
  }

  if (!response.ok) {
    console.warn(`  package_show returned ${response.status} – skipping auto-discovery`)
    return null
  }

  const json = (await response.json()) as DKANPackageResponse
  const resources = json.result?.resources
  if (!Array.isArray(resources)) {
    console.warn('  Unexpected package_show response shape')
    return null
  }

  // Prefer GeoJSON, then JSON, then CSV
  const formats = ['GEOJSON', 'JSON', 'CSV']
  for (const fmt of formats) {
    const r = resources.find(res => res.format?.toUpperCase() === fmt)
    if (r) {
      console.log(`  Found ${fmt} resource: ${r.id} → ${r.url}`)
      return r
    }
  }

  console.warn('  No usable GeoJSON, JSON or CSV resource found in package')
  return null
}

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

async function fetchFromUrl(resourceUrl: string, format: string): Promise<GeoJSONCollection> {
  console.log(`  Fetching ${resourceUrl}…`)
  const response = await fetch(resourceUrl)
  if (!response.ok) {
    throw new Error(`Frankfurt data error: ${response.status} ${response.statusText}`)
  }

  const upperFormat = format.toUpperCase()

  if (upperFormat === 'CSV') {
    const text = await response.text()
    console.log(`  Downloaded ${text.length} bytes (CSV)`)
    return parseCsvAsGeoJSON(text)
  }

  // GeoJSON or generic JSON
  const json = (await response.json()) as GeoJSONCollection | GeoJSONFeature
  if ('features' in json && Array.isArray(json.features)) {
    return json as GeoJSONCollection
  }
  // Single feature wrapped as collection
  if ('geometry' in json) {
    return { type: 'FeatureCollection', features: [json as GeoJSONFeature] }
  }

  throw new Error('Expected a GeoJSON FeatureCollection or Feature')
}

async function fetchAll(): Promise<Toilet[]> {
  let targetUrl = WFS_URL
  let format = 'GEOJSON'

  if (!targetUrl) {
    const resource = await discoverResource()
    if (!resource) {
      console.warn('⚠️  FRANKFURT_WFS_URL is not set and auto-discovery failed.')
      console.warn('   Find the dataset at: https://www.offenedaten.frankfurt.de')
      console.warn('   Set the FRANKFURT_WFS_URL env var and re-run: npm run import:frankfurt')
      return []
    }
    targetUrl = resource.url
    format = resource.format || 'GEOJSON'
  }

  const collection = await fetchFromUrl(targetUrl, format)
  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    throw new Error('Expected a GeoJSON FeatureCollection')
  }

  return collection.features
    .map((f, i) => normalizeFeature(f, i))
    .filter((t): t is Toilet => t !== null)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🚻 Sandra Loo – Frankfurt am Main Open Data Import')
  console.log(`URL: ${WFS_URL || '(auto-discover)'}`)
  console.log(`Dataset: ${DATASET_ID}\n`)

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
