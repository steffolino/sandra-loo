/**
 * Tests for the Leipzig / Frankfurt CSV parsing helpers.
 *
 * The CSV parsing functions are inlined here (same logic as in the import
 * scripts) so that we can test them without depending on the script's
 * internal structure.  This mirrors the pattern used in game-logic.test.ts.
 */
import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// CSV helpers (duplicated from scripts/import/leipzig.ts for testability)
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

interface CsvRow { [key: string]: string }

function parseCsv(text: string): CsvRow[] {
  const clean = text.replace(/^\uFEFF/, '')
  const lines = clean.split(/\r?\n/).filter((l: string) => l.trim())
  if (lines.length < 2) return []

  const sep = lines[0].split(';').length > lines[0].split(',').length ? ';' : ','
  const fields = splitCsvLine(lines[0], sep).map((f: string) => f.toLowerCase().replace(/^["']|["']$/g, ''))

  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i], sep)
    const row: CsvRow = {}
    fields.forEach((field: string, idx: number) => {
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
// Tests
// ---------------------------------------------------------------------------

describe('splitCsvLine', () => {
  it('splits a comma-separated line', () => {
    expect(splitCsvLine('a,b,c', ',')).toEqual(['a', 'b', 'c'])
  })

  it('splits a semicolon-separated line', () => {
    expect(splitCsvLine('a;b;c', ';')).toEqual(['a', 'b', 'c'])
  })

  it('handles quoted fields containing the separator', () => {
    expect(splitCsvLine('"Musterstraße, 5",04109,Leipzig', ',')).toEqual([
      'Musterstraße, 5',
      '04109',
      'Leipzig',
    ])
  })

  it('handles escaped double-quotes inside quoted fields', () => {
    expect(splitCsvLine('"Say ""hello""",ok', ',')).toEqual(['Say "hello"', 'ok'])
  })

  it('returns a single-element array for a line with no separator', () => {
    expect(splitCsvLine('onlyone', ',')).toEqual(['onlyone'])
  })
})

describe('parseCsv', () => {
  const COMMA_CSV = [
    'lat,lon,name,plz',
    '51.3397,12.3731,Testtoilette,04109',
    '51.3500,12.3800,Andere Toilette,04105',
  ].join('\n')

  const SEMICOLON_CSV = [
    'lat;lon;name;plz',
    '51,3397;12,3731;Testtoilette;04109',
    '51,3500;12,3800;Andere Toilette;04105',
  ].join('\n')

  const BOM_CSV = '\uFEFF' + COMMA_CSV

  it('parses a comma-separated CSV', () => {
    const rows = parseCsv(COMMA_CSV)
    expect(rows).toHaveLength(2)
    expect(rows[0].name).toBe('Testtoilette')
    expect(rows[0].lat).toBe('51.3397')
    expect(rows[0].lon).toBe('12.3731')
  })

  it('parses a semicolon-separated CSV with German decimal commas in coordinates', () => {
    const rows = parseCsv(SEMICOLON_CSV)
    expect(rows).toHaveLength(2)
    // German decimal commas in coordinate columns are normalised to dots
    expect(rows[0].lat).toBe('51.3397')
    expect(rows[0].lon).toBe('12.3731')
  })

  it('strips the UTF-8 BOM if present', () => {
    const rows = parseCsv(BOM_CSV)
    expect(rows).toHaveLength(2)
  })

  it('returns empty array for CSV with only a header row', () => {
    expect(parseCsv('lat,lon,name')).toEqual([])
  })

  it('returns empty array for completely empty input', () => {
    expect(parseCsv('')).toEqual([])
  })

  it('lower-cases all field names', () => {
    const csv = 'Lat,Lon,Name\n51.0,12.0,Test'
    const rows = parseCsv(csv)
    expect(rows[0]).toHaveProperty('lat')
    expect(rows[0]).toHaveProperty('lon')
    expect(rows[0]).toHaveProperty('name')
  })
})
