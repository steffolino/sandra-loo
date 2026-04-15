#!/usr/bin/env tsx
/**
 * Import Leipzig civic/public-building candidates from the official polling
 * place geodata.
 *
 * This is not a toilet dataset. It is a separate institutional layer that
 * surfaces public-facing civic buildings with official coordinates and a
 * public-access signal (polling-place use / barrierefreiheit).
 *
 * We keep it separate so users can disable it if they only want explicit
 * toilet POIs or official toilet/library layers.
 *
 * Output: data/imports/leipzig-civic.json
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import shp from 'shpjs'
import type { Toilet, ToiletType } from '../../shared/types/index'
import { cleanNullableText, cleanText } from './text'

const CITY = 'Leipzig'
const OUTPUT_FILE = join(process.cwd(), 'data', 'imports', 'leipzig-civic.json')

const SHAPE_URL = process.env.LEIPZIG_CIVIC_SHAPE_URL
  ?? 'https://opendata.leipzig.de/dataset/72f1f5fc-dad9-44a2-b3a8-67b3fad88abd/resource/c9b77a0e-b0ac-4eed-8a3e-803c31309ffe/download/wahllokale_2025.zip'
const CSV_URL = process.env.LEIPZIG_CIVIC_CSV_URL
  ?? 'https://opendata.leipzig.de/dataset/72f1f5fc-dad9-44a2-b3a8-67b3fad88abd/resource/0316b420-dcec-49e1-a635-4b05764351a4/download/wbz_bundestag_mit_wahlobj.csv'
const SOURCE_URL = process.env.LEIPZIG_CIVIC_SOURCE_URL
  ?? 'https://opendata.leipzig.de/dataset/bundestagswahl-2025-geodaten-der-wahllokale'

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
      row[field] = cleanText(values[idx] ?? '')
    })
    rows.push(row)
  }

  return rows
}

function getValue(row: CsvRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value && value.trim()) return value.trim()
  }
  return ''
}

function normalizeKey(value: string): string {
  return cleanText(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/["'â€™`]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function classifyType(name: string): ToiletType {
  const n = normalizeKey(name)
  if (n.includes('bibliothek')) return 'library'
  if (n.includes('hochschule') || n.includes('kolleg') || n.includes('universitat') || n.includes('university')) return 'university'
  if (n.includes('stadtburo') || n.includes('burger') || n.includes('rathaus') || n.includes('feuerwache') || n.includes('wahlamt')) return 'civic'
  return 'civic'
}

function buildAddress(street: string, postcode: string): string | null {
  const parts: string[] = []
  if (street) parts.push(cleanText(street))
  if (postcode) parts.push(cleanText(postcode))
  parts.push(CITY)
  return parts.length > 0 ? parts.join(', ') : null
}

function parseAccessible(value: string): boolean {
  const v = normalizeKey(value)
  return v.includes('barrierefrei') || v === 'ja' || v === 'yes' || v === 'true'
}

function buildJoinKey(name: string, street: string, postcode: string): string {
  return [normalizeKey(name), normalizeKey(street), normalizeKey(postcode)].filter(Boolean).join('|')
}

async function fetchCsv(url: string): Promise<CsvRow[]> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  return parseCsv(await response.text())
}

async function fetchShape(url: string): Promise<Array<{ properties?: Record<string, unknown>, geometry?: { coordinates?: [number, number] } }>> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }
  const parsed = await shp(await response.arrayBuffer())
  const fc = Array.isArray(parsed) ? parsed[0] : parsed
  if (!fc || !Array.isArray(fc.features)) {
    throw new Error('Leipzig civic shapefile did not decode to a feature collection')
  }
  return fc.features
}

async function main() {
  console.log('Sandra Loo - Leipzig civic import')
  console.log(`Shape: ${SHAPE_URL}`)
  console.log(`CSV: ${CSV_URL}`)

  const [csvRows, features] = await Promise.all([
    fetchCsv(CSV_URL),
    fetchShape(SHAPE_URL),
  ])

  const csvByKey = new Map<string, CsvRow>()
  for (const row of csvRows) {
    const name = getValue(row, ['wahlobjekt'])
    const street = getValue(row, ['strasse', 'straße'])
    const postcode = getValue(row, ['plz'])
    csvByKey.set(buildJoinKey(name, street, postcode), row)
  }

  const records: Toilet[] = []
  for (const [index, feature] of features.entries()) {
    const props = feature.properties ?? {}
    const coordinates = feature.geometry?.coordinates
    if (!coordinates || coordinates.length < 2) continue

    const [lng, lat] = coordinates
    const name = cleanText(props.objname ?? props.name ?? 'Leipzig civic venue')
    const street = cleanText(props.adresse ?? '')
    const postcode = cleanText(props.obj_plz ?? '')
    const csvRow = csvByKey.get(buildJoinKey(name, street, postcode))
    const accessible = csvRow ? parseAccessible(csvRow.barrierefreiheit ?? '') : false
    const type = classifyType(name)
    const now = new Date().toISOString()

    records.push({
      id: `leipzig-civic-${index}`,
      name,
      type,
      address: buildAddress(street, postcode),
      city: CITY,
      lat,
      lng,
      source: SHAPE_URL,
      source_name: 'Leipzig Open Data - Polling places',
      source_url: SOURCE_URL,
      is_accessible: accessible,
      is_free: true,
      opening_hours: null,
      notes: cleanNullableText('Official civic/public building location from Leipzig polling-place geodata. Toilet access and regular opening hours are not verified.'),
      created_at: now,
      last_updated_at: now,
    })
  }

  if (records.length === 0) {
    throw new Error('Leipzig civic import produced no records')
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
