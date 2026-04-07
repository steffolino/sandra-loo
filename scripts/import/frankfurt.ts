#!/usr/bin/env tsx
/**
 * Import public toilet data from Frankfurt am Main Open Data portal.
 *
 * Data source: Frankfurt am Main Open Data – dl-de/by-2-0
 * https://offenedaten.frankfurt.de
 *
 * Dataset: "Öffentliche Toiletten Frankfurt am Main"
 * Dataset page: https://offenedaten.frankfurt.de
 *
 * The Frankfurt portal (offenedaten.frankfurt.de) is a custom InformationPortal
 * application (not CKAN/DKAN). It exposes a REST API at /service/ but the
 * search backend (/service/app/search/all) may be temporarily unavailable.
 *
 * Automatic import: set FRANKFURT_WFS_URL to a direct GeoJSON, WFS, or CSV
 * download URL and the script will fetch and parse it automatically.
 *
 * To find the download URL: browse https://offenedaten.frankfurt.de, search
 * for "öffentliche Toiletten" and copy the direct file download link.
 *
 * Usage:
 *   FRANKFURT_WFS_URL=https://... npm run import:frankfurt
 *
 * Output: data/imports/frankfurt.json
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Toilet } from '../../shared/types/index'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// GeoJSON or WFS URL for Frankfurt public toilets.
// Set this env var to a direct download URL to enable the Frankfurt import.
// Find the download URL at: https://offenedaten.frankfurt.de (search for Toiletten)
const WFS_URL = process.env.FRANKFURT_WFS_URL ?? ''
// InformationPortal REST API base (no trailing slash, no /api/3/action suffix)
const PORTAL_BASE = process.env.FRANKFURT_API_URL ?? 'https://offenedaten.frankfurt.de'
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
// InformationPortal discovery types
// ---------------------------------------------------------------------------

interface DKANResource {
  id: string
  url: string
  format: string
  datastore_active?: boolean
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
    source: WFS_URL || `${PORTAL_BASE}/dataset/${DATASET_ID}`,
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
// Auto-discovery via the InformationPortal REST search API
// ---------------------------------------------------------------------------

/**
 * Try to find the Frankfurt toilet dataset via the InformationPortal REST API.
 * The portal exposes a search endpoint at /service/app/search/all (POST).
 * If the search backend is unavailable (HTTP 500) the function returns null.
 */
async function discoverResource(): Promise<DKANResource | null> {
  const searchUrl = `${PORTAL_BASE}/service/app/search/all`
  console.log(`  Querying InformationPortal search at: ${searchUrl}`)

  let response: Response
  try {
    response = await fetch(searchUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        textSearch: 'Toiletten',
        pagingStart: 0,
        numOfResults: 30,
      }),
    })
  }
  catch (err) {
    console.warn(`  Could not reach Frankfurt portal: ${err}`)
    return null
  }

  if (!response.ok) {
    console.warn(`  InformationPortal search returned HTTP ${response.status} – auto-discovery unavailable`)
    return null
  }

  // The InformationPortal returns a custom JSON structure, not CKAN/DKAN.
  // Parse each result entry to locate a GeoJSON or CSV resource URL.
  let results: unknown
  try {
    results = await response.json()
  }
  catch {
    console.warn('  Could not parse search response JSON')
    return null
  }

  // Walk the result tree looking for a download link for the WC dataset.
  // Entries typically have a 'dcat_download' or 'url' field.
  const entries = Array.isArray(results)
    ? results
    : (results as Record<string, unknown[]>)?.results ?? []

  for (const entry of entries as Record<string, unknown>[]) {
    const title = String(entry.title ?? entry.ergebnis_bezeichnung ?? '').toLowerCase()
    if (!title.includes('toilet') && !title.includes('wc')) continue

    const downloads = (entry.downloads ?? entry.dcat_files_and_resources ?? []) as Array<Record<string, string>>
    for (const dl of downloads) {
      const fmt = (dl.format ?? dl.type ?? '').toUpperCase()
      const dlUrl = dl.url ?? dl.link ?? ''
      if (dlUrl && (fmt === 'GEOJSON' || fmt === 'JSON' || fmt === 'CSV')) {
        console.log(`  Found ${fmt} download: ${dlUrl}`)
        return { id: String(entry.id ?? 'frankfurt'), url: dlUrl, format: fmt, datastore_active: false }
      }
    }
  }

  console.warn('  No GeoJSON/CSV resource found in search results')
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
      console.warn('⚠️  Frankfurt toilet data could not be fetched automatically.')
      console.warn('   The Frankfurt portal (offenedaten.frankfurt.de) uses a custom')
      console.warn('   InformationPortal system. If auto-discovery fails, set the')
      console.warn('   FRANKFURT_WFS_URL env var to a direct GeoJSON/CSV download URL.')
      console.warn(`   Browse ${PORTAL_BASE} and search for "Toiletten" to find it.`)
      return fallbackFromOsmImport()
    }
    targetUrl = resource.url
    format = resource.format || 'GEOJSON'
  }

  const collection = await fetchFromUrl(targetUrl, format)
  if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
    throw new Error('Expected a GeoJSON FeatureCollection')
  }

  const records = collection.features
    .map((f, i) => normalizeFeature(f, i))
    .filter((t): t is Toilet => t !== null)

  if (records.length === 0) {
    return fallbackFromOsmImport()
  }

  return records
}


async function fallbackFromOsmImport(): Promise<Toilet[]> {
  const osmFile = join(process.cwd(), 'data', 'imports', 'osm.json')
  try {
    const raw = await readFile(osmFile, 'utf-8')
    const parsed = JSON.parse(raw) as Toilet[]
    const fallback = parsed
      .filter(t => t.city === CITY)
      .map(t => ({
        ...t,
        id: t.id.startsWith('frankfurt-') ? t.id : `frankfurt-${t.id}`,
        source_name: `${t.source_name} (fallback)`,
      }))

    if (fallback.length > 0) {
      console.warn(`  Using ${fallback.length} Frankfurt records from osm.json fallback`)
      return fallback
    }
  }
  catch {
    // Ignore and return empty list below.
  }

  console.warn('  No Frankfurt fallback data found in data/imports/osm.json')
  return []
}
// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🚻 Sandra Loo – Frankfurt am Main Open Data Import')
  console.log(`Portal: ${PORTAL_BASE}`)
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

