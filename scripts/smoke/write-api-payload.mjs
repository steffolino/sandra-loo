import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Lightweight fallback to ensure CI has a static /api/toilets/index payload
// when Nitro/nuxt generate doesn't produce it.

const dataDir = join(process.cwd(), 'data', 'imports')
const files = ['osm.json', 'institutional.json', 'leipzig-institutional.json', 'leipzig.json', 'frankfurt.json']
const all = []

for (const file of files) {
  const path = join(dataDir, file)
  if (!existsSync(path)) continue
  try {
    const raw = readFileSync(path, 'utf8')
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) all.push(...parsed)
  }
  catch (err) {
    // ignore malformed import
  }
}

// De-duplicate by id (keep first seen)
const merged = []
const seen = new Set()
for (const t of all) {
  if (!t || !t.id) continue
  if (seen.has(t.id)) continue
  seen.add(t.id)
  merged.push(t)
}

// Filter rough Germany bounding box to match server logic
const filtered = merged.filter(t => typeof t.lat === 'number' && typeof t.lng === 'number' && t.lat >= 47 && t.lat <= 55.3 && t.lng >= 5.5 && t.lng <= 15.6)

const outDir = join(process.cwd(), '.output', 'public', 'api', 'toilets')
mkdirSync(outDir, { recursive: true })

const payload = {
  data: filtered,
  meta: { total: filtered.length, hasData: filtered.length > 0 },
}

const outPath = join(outDir, 'index')
writeFileSync(outPath, JSON.stringify(payload), 'utf8')
console.log(`Wrote fallback static API payload: ${outPath} (${filtered.length} toilets)`)