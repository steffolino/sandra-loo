import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const outputDir = join(process.cwd(), '.output', 'public')
const toiletsPagePath = join(outputDir, 'toilets', 'index.html')
const apiIndexPath = join(outputDir, 'api', 'toilets', 'index')

if (!existsSync(toiletsPagePath)) {
  fail(`Missing static page: ${toiletsPagePath}`)
}

if (!existsSync(apiIndexPath)) {
  fail(`Missing static API payload: ${apiIndexPath}`)
}

const toiletsHtml = readFileSync(toiletsPagePath, 'utf-8')
if (!toiletsHtml.includes('Find a Toilet')) {
  fail('Smoke check failed: /toilets/ page did not render expected onboarding content.')
}

let payload
try {
  payload = JSON.parse(readFileSync(apiIndexPath, 'utf-8'))
}
catch (error) {
  fail(`Smoke check failed: could not parse /api/toilets payload (${String(error)}).`)
}

const toilets = payload?.data
if (!Array.isArray(toilets) || toilets.length === 0) {
  fail('Smoke check failed: /api/toilets payload is empty.')
}

const missingProvenance = toilets.filter((toilet) => (
  !toilet
  || typeof toilet.source !== 'string'
  || toilet.source.trim() === ''
  || typeof toilet.source_name !== 'string'
  || toilet.source_name.trim() === ''
))

if (missingProvenance.length > 0) {
  fail(`Smoke check failed: ${missingProvenance.length} toilets are missing source/source_name provenance.`)
}

const bySource = new Map()
for (const toilet of toilets) {
  const key = String(toilet.source_name)
  bySource.set(key, (bySource.get(key) ?? 0) + 1)
}
const sourceSnapshot = [...bySource.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([name, count]) => `${name}: ${count}`)
  .join(' | ')

console.log(`Smoke check passed: ${toilets.length} toilets available in static API payload.`)
console.log(`Provenance snapshot: ${sourceSnapshot}`)

function fail(message) {
  console.error(message)
  process.exit(1)
}
