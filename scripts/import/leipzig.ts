#!/usr/bin/env tsx
/**
 * Import public toilet data from the City of Leipzig Open Data portal.
 *
 * Data source: Leipzig Open Data – CC BY 4.0
 * https://opendata.leipzig.de
 *
 * Dataset: "Öffentliche Toiletten Leipzig"
 * CKAN API endpoint: https://opendata.leipzig.de/api/3/action/datastore_search
 * Dataset page: https://opendata.leipzig.de/dataset/offentliche-toiletten-stadt-leipzig1
 *
 * Discovery: if LEIPZIG_RESOURCE_ID is not set the script calls
 * package_show to locate the first CSV resource automatically.
 * If that resource has `datastore_active: true` the CKAN Datastore API
 * is used (paginated JSON).  Otherwise the CSV is downloaded directly
 * and parsed in-process – no additional dependencies needed.
 *
 * Usage:
 *   npm run import:leipzig
 *
 * Output: data/imports/leipzig.json
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import type { Toilet } from '../../shared/types/index'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// Resource ID for the public toilets dataset on Leipzig Open Data.
// Leave unset to auto-discover via CKAN package_show.
const RESOURCE_ID = process.env.LEIPZIG_RESOURCE_ID ?? ''
const BASE_URL = process.env.LEIPZIG_API_URL ?? 'https://opendata.leipzig.de/api/3/action'
const DATASET_ID = process.env.LEIPZIG_DATASET_ID ?? 'offentliche-toiletten-stadt-leipzig1'
const OUTPUT_FILE = join(process.cwd(), 'data', 'imports', 'leipzig.json')
const CITY = 'Leipzig'

// ---------------------------------------------------------------------------
// CKAN datastore row type (generic)
// ---------------------------------------------------------------------------

interface CKANRow {
  _id?: number
  [key: string]: unknown
}

interface CKANResult {
  records: CKANRow[]
  total: number
}

interface CKANResponse {
  success: boolean
  result: CKANResult
}

interface CKANResource {
  id: string
  url: string
  format: string
  datastore_active: boolean
}

interface CKANPackageResponse {
  success: boolean
  result: {
    resources: CKANResource[]
  }
}

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------

/**
 * Split a single CSV line respecting double-quoted fields.
 * Uses a while-loop so that `""` (escaped quote) can advance the index by
 * exactly 2 characters in one step without relying on the for-loop increment.
 */
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

/**
 * Parse a CSV text body into an array of CKANRow objects.
 * Handles UTF-8 BOM, `,` and `;` separators, and German decimal commas.
 */
function parseCsv(text: string): CKANRow[] {
  // Remove BOM
  const clean = text.replace(/^\uFEFF/, '')
  const lines = clean.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  // Auto-detect separator (semicolon dominates in German exports)
  const headerLine = lines[0]
  const sep = headerLine.split(';').length > headerLine.split(',').length ? ';' : ','

  const fields = splitCsvLine(headerLine, sep).map(f => f.toLowerCase().replace(/^["']|["']$/g, ''))

  const rows: CKANRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i], sep)
    const row: CKANRow = { _id: i }
    fields.forEach((field, idx) => {
      // Normalise German decimal comma → dot for coordinate fields
      const raw = values[idx] ?? ''
      const lf = field.toLowerCase()
      if (lf === 'lat' || lf === 'lon' || lf === 'lng'
        || lf === 'latitude' || lf === 'longitude'
        || lf === 'x' || lf === 'y') {
        row[field] = raw.replace(',', '.')
      }
      else {
        row[field] = raw
      }
    })
    rows.push(row)
  }
  return rows
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Map a CKAN record to our Toilet schema.
 */
function normalizeRow(row: CKANRow, index: number): Toilet | null {
  const lat = parseFloat(String(row.lat ?? row.latitude ?? row.y ?? ''))
  const lng = parseFloat(String(row.lon ?? row.lng ?? row.longitude ?? row.x ?? ''))

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    console.warn(`  Skipping row ${index}: missing coordinates`)
    return null
  }

  const now = new Date().toISOString()

  return {
    id: `leipzig-${row._id ?? index}`,
    name: String(row.name ?? row.bezeichnung ?? row.Name ?? 'Öffentliche Toilette'),
    type: 'public',
    address: buildAddress(row),
    city: CITY,
    lat,
    lng,
    source: `${BASE_URL}/datastore_search?resource_id=${RESOURCE_ID || '(auto)'}&filters={"_id":${row._id ?? index}}`,
    source_name: 'Leipzig Open Data',
    is_accessible: Boolean(row.rollstuhl ?? row.wheelchair ?? row.barrierefrei ?? false),
    is_free: !(row.gebuehrenpflichtig ?? row.kostenpflichtig ?? false),
    opening_hours: String(row.oeffnungszeiten ?? row.opening_hours ?? '') || null,
    notes: String(row.hinweise ?? row.notes ?? '') || null,
    created_at: now,
    last_updated_at: now,
  }
}

function buildAddress(row: CKANRow): string | null {
  const parts: string[] = []
  const street = row.strasse ?? row.street ?? row.adresse ?? row.Strasse
  const number = row.hausnummer ?? row.house_number
  if (street) {
    parts.push(number ? `${street} ${number}` : String(street))
  }
  const postcode = row.plz ?? row.postleitzahl
  if (postcode) parts.push(String(postcode))
  parts.push(CITY)
  return parts.join(', ')
}

// ---------------------------------------------------------------------------
// Discover resource via CKAN package_show
// ---------------------------------------------------------------------------

async function discoverResource(): Promise<CKANResource | null> {
  const url = `${BASE_URL}/package_show?id=${encodeURIComponent(DATASET_ID)}`
  console.log(`  Discovering dataset resources from: ${url}`)

  let response: Response
  try {
    response = await fetch(url)
  }
  catch (err) {
    console.warn(`  Could not reach Leipzig Open Data portal: ${err}`)
    return null
  }

  if (!response.ok) {
    console.warn(`  package_show returned ${response.status} – skipping auto-discovery`)
    return null
  }

  const json = (await response.json()) as CKANPackageResponse
  if (!json.success || !Array.isArray(json.result?.resources)) {
    console.warn('  Unexpected package_show response shape')
    return null
  }

  const resources = json.result.resources

  // Prefer a resource with an active datastore (fast paginated JSON API).
  const withDatastore = resources.find(r => r.datastore_active)
  if (withDatastore) {
    console.log(`  Found datastore resource: ${withDatastore.id}`)
    return withDatastore
  }

  // Fall back to the first CSV resource.
  const csvResource = resources.find(r => r.format?.toUpperCase() === 'CSV')
  if (csvResource) {
    console.log(`  Found CSV resource: ${csvResource.id} → ${csvResource.url}`)
    return csvResource
  }

  console.warn('  No usable resource (datastore or CSV) found in package')
  return null
}

// ---------------------------------------------------------------------------
// Fetch all pages from CKAN datastore
// ---------------------------------------------------------------------------

async function fetchAllFromDatastore(resourceId: string): Promise<Toilet[]> {
  const all: Toilet[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const url = `${BASE_URL}/datastore_search?resource_id=${resourceId}&limit=${limit}&offset=${offset}`
    console.log(`  Fetching ${url}…`)

    let response: Response
    try {
      response = await fetch(url)
    }
    catch (err) {
      console.warn(`  Could not reach Leipzig datastore: ${err}`)
      return all
    }

    if (!response.ok) {
      console.warn(`  Leipzig datastore API returned HTTP ${response.status} – stopping pagination`)
      return all
    }

    const json = (await response.json()) as CKANResponse
    if (!json.success || !json.result?.records) {
      console.warn('  Unexpected datastore response shape – stopping pagination')
      return all
    }

    const records = json.result.records
    if (records.length === 0) break

    const toilets = records
      .map((row, i) => normalizeRow(row, offset + i))
      .filter((t): t is Toilet => t !== null)

    all.push(...toilets)
    offset += limit

    if (offset >= json.result.total) break
  }

  return all
}

// ---------------------------------------------------------------------------
// Fetch and parse a direct CSV download
// ---------------------------------------------------------------------------

async function fetchAllFromCsv(csvUrl: string): Promise<Toilet[]> {
  console.log(`  Downloading CSV from: ${csvUrl}…`)
  let response: Response
  try {
    response = await fetch(csvUrl)
  }
  catch (err) {
    console.warn(`  Could not reach CSV server: ${err}`)
    console.warn(`  Leipzig CSV is hosted at ${new URL(csvUrl).hostname}.`)
    console.warn('  The import will be skipped this run; the site will show no Leipzig data.')
    return []
  }

  if (!response.ok) {
    console.warn(`  CSV download returned HTTP ${response.status} – skipping import`)
    return []
  }

  const text = await response.text()
  console.log(`  Downloaded ${text.length} bytes`)

  const rows = parseCsv(text)
  console.log(`  Parsed ${rows.length} rows from CSV`)

  return rows
    .map((row, i) => normalizeRow(row, i))
    .filter((t): t is Toilet => t !== null)
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

async function fetchAll(): Promise<Toilet[]> {
  // 1. If a resource ID is explicitly configured, use it directly.
  if (RESOURCE_ID) {
    console.log(`  Using configured LEIPZIG_RESOURCE_ID: ${RESOURCE_ID}`)
    return fetchAllFromDatastore(RESOURCE_ID)
  }

  // 2. Auto-discover the resource from the CKAN package metadata.
  const resource = await discoverResource()

  if (!resource) {
    console.warn('⚠️  Could not discover a Leipzig resource automatically.')
    console.warn('   Set LEIPZIG_RESOURCE_ID and re-run: npm run import:leipzig')
    return []
  }

  // 3. Use datastore API if available; otherwise download the CSV.
  if (resource.datastore_active) {
    return fetchAllFromDatastore(resource.id)
  }

  return fetchAllFromCsv(resource.url)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🚻 Sandra Loo – Leipzig Open Data Import')
  console.log(`API: ${BASE_URL}`)
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
