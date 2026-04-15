#!/usr/bin/env tsx
/**
 * Import Leipzig institutional candidates from official open data.
 *
 * This joins the official library contact/hours table with the matching
 * coordinate dataset, so the app can surface public-facing civic buildings
 * with verified opening hours and a plausible toilet-access signal.
 *
 * The pattern is intentionally copyable for other cities:
 * 1. find one dataset with opening hours/contact data
 * 2. find one dataset with coordinates
 * 3. join on a stable business/building name
 * 4. keep only rows with both location and opening hours
 *
 * Output: data/imports/leipzig-institutional.json
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Toilet } from '../../shared/types/index'
import { cleanNullableText, cleanText } from './text'

const CITY = 'Leipzig'
const OUTPUT_FILE = join(process.cwd(), 'data', 'imports', 'leipzig-institutional.json')

const CONTACTS_URL = process.env.LEIPZIG_LIBRARIES_CONTACTS_URL
  ?? 'https://opendata.leipzig.de/dataset/62cdd44d-a98b-4666-8e87-e5cd7d8c1a44/resource/6000018a-2007-4f29-b62a-b41b9c211ff2/download/bibliothekenkontaktdaten.csv'
const GEO_URL = process.env.LEIPZIG_LIBRARIES_GEO_URL
  ?? 'https://opendata.leipzig.de/dataset/2a43ed7d-5e0a-4cf3-ac06-1f601b4f6c3b/resource/c3304312-0dd8-4b12-99ee-524737aeef0c/download/bibliothekengeodaten.csv'
const SOURCE_URL = process.env.LEIPZIG_LIBRARIES_SOURCE_URL
  ?? 'https://opendata.leipzig.de/dataset/62cdd44d-a98b-4666-8e87-e5cd7d8c1a44'

interface CsvRow {
  [key: string]: string
}

function splitCsvLine(line: string, sep: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  let i = 0

  while (i < line.length) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
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

function parseCsv(text: string): CsvRow[] {
  const clean = text.replace(/^\uFEFF/, '')
  const lines = clean.split(/\r?\n/).filter(line => line.trim())
  if (lines.length < 2) return []

  const sep = lines[0].split(';').length > lines[0].split(',').length ? ';' : ','
  const headers = splitCsvLine(lines[0], sep).map(field => cleanText(field).toLowerCase().replace(/^["']|["']$/g, ''))

  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i], sep)
    const row: CsvRow = {}
    headers.forEach((field, idx) => {
      row[field] = values[idx] ?? ''
    })
    rows.push(row)
  }

  return rows
}

function normalizeKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/["'’`]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getValue(row: CsvRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value && value.trim()) return value.trim()
  }
  return ''
}

function buildOpeningHours(row: CsvRow): string | null {
  const days: Array<[string, string]> = [
    ['Mo', getValue(row, ['oe_mo'])],
    ['Di', getValue(row, ['oe_di'])],
    ['Mi', getValue(row, ['oe_mi'])],
    ['Do', getValue(row, ['oe_do'])],
    ['Fr', getValue(row, ['oe_fr'])],
    ['Sa', getValue(row, ['oe_sa'])],
  ]

  const parts: string[] = []
  for (const [day, raw] of days) {
    const cleaned = raw.replace(/\s+/g, ' ').trim()
    if (!cleaned) continue

    const rangeMatch = cleaned.match(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/)
    if (rangeMatch) {
      const range = rangeMatch[0].replace(/\s+/g, '')
      const extra = cleaned.replace(rangeMatch[0], '').replace(/uhr/i, '').replace(/\s+/g, ' ').trim()
      parts.push(extra ? `${day} ${range} (${extra})` : `${day} ${range}`)
    }
    else {
      parts.push(`${day} ${cleaned}`)
    }
  }

  return parts.length > 0 ? parts.join('; ') : null
}

function buildAddress(row: CsvRow): string | null {
  const street = cleanText(getValue(row, ['straße', 'strasse', 'street']))
  const postcode = cleanText(getValue(row, ['plz', 'postleitzahl']))
  const parts: string[] = []
  if (street) parts.push(street)
  if (postcode) parts.push(postcode)
  parts.push(CITY)
  return parts.length > 0 ? parts.join(', ') : null
}

function toToilet(contact: CsvRow, geo: CsvRow, index: number): Toilet | null {
  const latRaw = getValue(geo, ['y_(etrs89_lat)', 'y', 'lat', 'latitude'])
  const lngRaw = getValue(geo, ['x_(etrs89_lon)', 'x', 'lng', 'lon', 'longitude'])
  const lat = parseFloat(latRaw.replace(',', '.'))
  const lng = parseFloat(lngRaw.replace(',', '.'))

  if (Number.isNaN(lat) || Number.isNaN(lng)) return null

  const openingHours = buildOpeningHours(contact)
  if (!openingHours) return null

  const name = cleanText(getValue(contact, ['name']) || getValue(geo, ['name']))
  const rawStreet = cleanText(getValue(contact, ['straße', 'strasse', 'street']))
  const rawPostcode = cleanText(getValue(contact, ['plz', 'postleitzahl']))
  const now = new Date().toISOString()

  return {
    id: `leipzig-institutional-${index}`,
    name: name || 'Leipzig library',
    type: 'library',
    address: buildAddress(contact),
    city: CITY,
    lat,
    lng,
    source: GEO_URL,
    source_name: 'Leipzig Open Data - Libraries',
    source_url: SOURCE_URL,
    is_accessible: false,
    is_free: true,
    opening_hours: cleanNullableText(openingHours),
    notes: cleanNullableText(`Official Leipzig Open Data library record. Joined contact/hours and coordinates; toilet access is likely but not explicitly listed. ${rawStreet || rawPostcode ? `Address source: ${[rawStreet, rawPostcode].filter(Boolean).join(', ')}` : ''}`),
    created_at: now,
    last_updated_at: now,
  }
}

async function fetchCsv(url: string): Promise<CsvRow[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return parseCsv(await response.text())
}

function buildJoinKey(row: CsvRow): string {
  return normalizeKey(getValue(row, ['name']))
}

async function main() {
  console.log('Sandra Loo - Leipzig institutional import')
  console.log(`Contacts: ${CONTACTS_URL}`)
  console.log(`Coordinates: ${GEO_URL}`)

  const contacts = await fetchCsv(CONTACTS_URL)
  const geoRows = await fetchCsv(GEO_URL)

  const contactsByKey = new Map<string, CsvRow>()
  for (const row of contacts) {
    contactsByKey.set(buildJoinKey(row), row)
  }

  const records: Toilet[] = []
  for (const [index, geo] of geoRows.entries()) {
    const key = buildJoinKey(geo)
    const contact = contactsByKey.get(key)
    if (!contact) continue

    const record = toToilet(contact, geo, index)
    if (record) records.push(record)
  }

  if (records.length === 0) {
    throw new Error('Leipzig institutional import produced no records')
  }

  await mkdir(join(process.cwd(), 'data', 'imports'), { recursive: true })
  await writeFile(OUTPUT_FILE, JSON.stringify(records, null, 2), 'utf-8')
  console.log(`Written to: ${OUTPUT_FILE}`)
  console.log(`Records: ${records.length}`)
}

main().catch((error) => {
  console.error('Import failed:', error)
  process.exit(1)
})
