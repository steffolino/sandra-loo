#!/usr/bin/env tsx
/**
 * Import derived public toilet candidates from institutional public buildings.
 *
 * This layer is intentionally separate from explicit toilet POIs.
 * It is based on public-facing institutions in OpenStreetMap and only keeps
 * records where opening hours are available, so the UI can let users disable
 * this layer when they want explicit toilets only.
 *
 * Output: data/imports/institutional.json
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Toilet, ToiletType } from '../../shared/types/index'
import { cleanNullableText, cleanText } from './text'

const CITIES = (process.env.CITIES ?? 'Leipzig,Frankfurt am Main')
  .split(',')
  .map(c => c.trim())
  .filter(Boolean)

const OVERPASS_APIS = (process.env.OVERPASS_APIS
  ?? process.env.OVERPASS_API
  ?? 'https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter')
  .split(',')
  .map(url => url.trim())
  .filter(Boolean)

const OUTPUT_FILE = join(process.cwd(), 'data', 'imports', 'institutional.json')
const ALLOW_STALE = process.env.INSTITUTIONAL_IMPORT_ALLOW_STALE === 'true'

const INSTITUTIONAL_AMENITIES = [
  'townhall',
  'library',
  'university',
  'college',
  'community_centre',
  'arts_centre',
  'theatre',
  'cinema',
  'museum',
  'swimming_pool',
  'public_bath',
  'bus_station',
  'ferry_terminal',
  'train_station',
  'post_office',
] as const

function buildQuery(city: string): string {
  const amenityRegex = INSTITUTIONAL_AMENITIES.join('|')

  return `
[out:json][timeout:30];
area["name"="${city}"]["boundary"="administrative"]->.searchArea;
(
  node["amenity"~"^(${amenityRegex})$"](area.searchArea);
  way["amenity"~"^(${amenityRegex})$"](area.searchArea);
  relation["amenity"~"^(${amenityRegex})$"](area.searchArea);
  node["building"~"^(civic|government|public)$"]["opening_hours"](area.searchArea);
  way["building"~"^(civic|government|public)$"]["opening_hours"](area.searchArea);
  relation["building"~"^(civic|government|public)$"]["opening_hours"](area.searchArea);
);
out center tags;
`.trim()
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
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
  if (lat === undefined || lng === undefined) return null

  const tags = el.tags ?? {}
  const openingHours = pickOpeningHours(tags)
  if (!openingHours) return null

  const now = new Date().toISOString()
  const category = describeInstitution(tags)
  const type = classifyInstitutionType(tags)
  const sourceUrl = `https://www.openstreetmap.org/${el.type}/${el.id}`

  return {
    id: `institutional-${el.type}-${el.id}`,
    name: cleanNullableText(pickName(tags, category)),
    type,
    address: cleanNullableText(buildAddress(tags)),
    city,
    lat,
    lng,
    source: sourceUrl,
    source_name: 'Institutional layer (OSM-derived)',
    source_url: sourceUrl,
    is_accessible: parseAccessible(tags),
    is_free: parseIsFree(tags),
    opening_hours: openingHours,
    notes: cleanNullableText(`Derived from public institution access: ${category}. Verify toilet access on site.`),
    created_at: now,
    last_updated_at: now,
  }
}

function classifyInstitutionType(tags: Record<string, string>): ToiletType {
  const amenity = (tags.amenity ?? '').toLowerCase()
  const building = (tags.building ?? '').toLowerCase()

  if (amenity === 'library') return 'library'
  if (amenity === 'university' || amenity === 'college' || building === 'university' || building === 'college') return 'university'
  if (amenity === 'townhall' || amenity === 'community_centre' || building === 'civic' || building === 'government' || building === 'public') {
    return 'civic'
  }
  if (amenity === 'museum' || amenity === 'arts_centre' || amenity === 'theatre' || amenity === 'cinema') {
    return 'culture'
  }
  if (amenity === 'bus_station' || amenity === 'ferry_terminal' || amenity === 'train_station') {
    return 'transit'
  }

  return 'public'
}

function pickName(tags: Record<string, string>, category: string): string {
  return cleanText(tags.name)
    || cleanText(tags['name:de'])
    || cleanText(tags.operator)
    || category
}

function describeInstitution(tags: Record<string, string>): string {
  const amenity = cleanText(tags.amenity).replace(/_/g, ' ')
  const building = cleanText(tags.building).replace(/_/g, ' ')
  const label = amenity || building || 'public institution'
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function pickOpeningHours(tags: Record<string, string>): string | null {
  const candidates = [
    tags.opening_hours,
    tags['opening_hours:access'],
    tags['opening_hours:public'],
    tags['operator:opening_hours'],
  ]

  for (const candidate of candidates) {
    if (candidate && candidate.trim()) {
      return candidate.trim()
    }
  }

  return null
}

function parseAccessible(tags: Record<string, string>): boolean {
  const values = [tags.wheelchair, tags.entrance, tags.access, tags.step_free]
    .map(value => (value ?? '').toLowerCase())
  return values.some(value => value === 'yes' || value === 'designated' || value === 'public')
}

function parseIsFree(tags: Record<string, string>): boolean {
  const fee = (tags.fee ?? '').toLowerCase()
  if (!fee) return true
  return !(fee === 'yes' || fee === 'true' || fee === '1' || fee === 'charged')
}

function buildAddress(tags: Record<string, string>): string | null {
  const parts: string[] = []
  if (tags['addr:street']) {
    parts.push(cleanText(tags['addr:street']))
    if (tags['addr:housenumber']) parts[0] += ` ${cleanText(tags['addr:housenumber'])}`
  }
  if (tags['addr:postcode']) parts.push(cleanText(tags['addr:postcode']))
  if (tags['addr:city']) parts.push(cleanText(tags['addr:city']))
  return parts.length > 0 ? parts.join(', ') : null
}

async function fetchCity(city: string): Promise<Toilet[]> {
  console.log(`  Fetching institutional layer candidates for: ${city}...`)

  const query = buildQuery(city)
  let lastError: unknown

  for (const apiUrl of OVERPASS_APIS) {
    const host = (() => {
      try { return new URL(apiUrl).hostname } catch { return apiUrl }
    })()

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

        console.log(`  [${host} attempt ${attempt}/3] -> ${records.length} records for ${city}`)
        return records
      }
      catch (err) {
        lastError = err
        console.warn(`  [${host} attempt ${attempt}/3] failed: ${err}`)
        await sleep(1500 * attempt)
      }
    }
  }

  throw new Error(`All Overpass endpoints failed for ${city}: ${String(lastError)}`)
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
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

async function main() {
  console.log('Sandra Loo - Institutional Layer Import')
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
      console.warn(`  Using stale cached institutional data for ${city} (${fallback.length} records).`)
    }
  }

  const deduped = [...new Map(all.map(t => [t.id, t])).values()]
  console.log(`\nTotal records: ${deduped.length} (after deduplication)`)
  if (staleCities.length > 0) {
    console.log(`Stale fallback applied for: ${staleCities.join(', ')}`)
  }

  await mkdir(join(process.cwd(), 'data', 'imports'), { recursive: true })
  await writeFile(OUTPUT_FILE, JSON.stringify(deduped, null, 2), 'utf-8')
  console.log(`Written to: ${OUTPUT_FILE}`)
}

main().catch((err) => {
  console.error('Import failed:', err)
  process.exit(1)
})
