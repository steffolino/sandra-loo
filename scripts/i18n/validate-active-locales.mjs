import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const projectRoot = process.cwd()
const nuxtConfigPath = join(projectRoot, 'nuxt.config.ts')
const localeDir = join(projectRoot, 'locales')

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj ?? {})) {
    const next = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, next, out)
      continue
    }
    out[next] = String(value)
  }
  return out
}

function parseActiveLocaleFiles(configText) {
  const files = []
  const matcher = /file:\s*'([^']+\.json)'/g
  let match = matcher.exec(configText)

  while (match) {
    files.push(match[1])
    match = matcher.exec(configText)
  }

  return [...new Set(files)]
}

const configText = readFileSync(nuxtConfigPath, 'utf8')
const activeFiles = parseActiveLocaleFiles(configText)

if (!activeFiles.length) {
  throw new Error('No active locale files found in nuxt.config.ts.')
}

const parsed = new Map()
for (const file of activeFiles) {
  const fullPath = join(localeDir, file)
  try {
    parsed.set(file, JSON.parse(readFileSync(fullPath, 'utf8')))
  }
  catch (error) {
    throw new Error(`Invalid locale JSON: ${file}\n${error.message}`)
  }
}

if (!parsed.has('en.json')) {
  throw new Error('Expected en.json in active locales as a comparison baseline.')
}

const baseline = flatten(parsed.get('en.json'))
const baselineKeys = Object.keys(baseline)

for (const [file, content] of parsed.entries()) {
  const flat = flatten(content)
  for (const key of baselineKeys) {
    if (!(key in flat)) {
      throw new Error(`${file} is missing translation key: ${key}`)
    }
  }

  if (file === 'en.json') continue

  let identical = 0
  for (const key of baselineKeys) {
    if (flat[key] === baseline[key]) {
      identical += 1
    }
  }

  const ratio = identical / baselineKeys.length
  if (ratio > 0.4) {
    throw new Error(
      `${file} looks untranslated: ${(ratio * 100).toFixed(1)}% values are identical to en.json.`,
    )
  }
}

console.log(`i18n validation passed for active locales: ${activeFiles.join(', ')}`)

