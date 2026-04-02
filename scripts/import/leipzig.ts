#!/usr/bin/env tsx
/**
 * Import public toilet data from the City of Leipzig Open Data portal.
 *
 * Data source: Leipzig Open Data – CC BY 4.0
 * https://opendata.leipzig.de
 *
 * Dataset: "Öffentliche Toiletten Leipzig"
 * CKAN API endpoint: https://opendata.leipzig.de/api/3/action/datastore_search
 * Resource ID: configured via LEIPZIG_RESOURCE_ID env var
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
// Find at: https://opendata.leipzig.de/dataset/oeffentliche-toiletten
const RESOURCE_ID = process.env.LEIPZIG_RESOURCE_ID ?? ''
const BASE_URL = process.env.LEIPZIG_API_URL ?? 'https://opendata.leipzig.de/api/3/action'
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

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Map a CKAN record to our Toilet schema.
 *
 * Field mapping is approximate – update once the real dataset structure
 * is known. Common field names for Leipzig open data are used here.
 */
function normalizeRow(row: CKANRow, index: number): Toilet | null {
  const lat = parseFloat(String(row.lat ?? row.latitude ?? row.y ?? ''))
  const lng = parseFloat(String(row.lon ?? row.longitude ?? row.x ?? ''))

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
    source: `${BASE_URL}/datastore_search?resource_id=${RESOURCE_ID}&filters={"_id":${row._id ?? index}}`,
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
// Fetch all pages from CKAN
// ---------------------------------------------------------------------------

async function fetchAll(): Promise<Toilet[]> {
  if (!RESOURCE_ID) {
    console.warn('⚠️  LEIPZIG_RESOURCE_ID is not set.')
    console.warn('   Find the dataset at: https://opendata.leipzig.de/dataset/oeffentliche-toiletten')
    console.warn('   Set the RESOURCE_ID env var and re-run: npm run import:leipzig')
    return []
  }

  const all: Toilet[] = []
  let offset = 0
  const limit = 100

  while (true) {
    const url = `${BASE_URL}/datastore_search?resource_id=${RESOURCE_ID}&limit=${limit}&offset=${offset}`
    console.log(`  Fetching ${url}…`)

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Leipzig API error: ${response.status} ${response.statusText}`)
    }

    const json = (await response.json()) as CKANResponse
    if (!json.success || !json.result?.records) {
      throw new Error('Unexpected API response shape')
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
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🚻 Sandra Loo – Leipzig Open Data Import')
  console.log(`API: ${BASE_URL}\n`)

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
