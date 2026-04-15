import fs from 'node:fs'
import path from 'node:path'

const root = 'c:/Users/StretzS/projects/Neuer Ordner/sandra-loo'
const localesDir = path.join(root, 'locales')
const source = JSON.parse(fs.readFileSync(path.join(localesDir, 'en.json'), 'utf8'))

const targets = [
  { code: 'pl', file: 'pl.json', lang: 'pl' },
  { code: 'tr', file: 'tr.json', lang: 'tr' },
  { code: 'ar', file: 'ar.json', lang: 'ar' },
  { code: 'ru', file: 'ru.json', lang: 'ru' },
]

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out)
    else out[key] = String(v)
  }
  return out
}

function unflatten(flat) {
  const out = {}
  for (const [key, value] of Object.entries(flat)) {
    const parts = key.split('.')
    let cursor = out
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i]
      if (!cursor[p] || typeof cursor[p] !== 'object') cursor[p] = {}
      cursor = cursor[p]
    }
    cursor[parts[parts.length - 1]] = value
  }
  return out
}

function protectTokens(text) {
  const tokens = []
  let i = 0
  const protectedText = text.replace(/\{[^{}]+\}/g, (m) => {
    const t = `__VAR_${i++}__`
    tokens.push([t, m])
    return t
  })
  return { protectedText, tokens }
}

function restoreTokens(text, tokens) {
  let out = text
  for (const [t, original] of tokens) out = out.replaceAll(t, original)
  return out
}

async function translateOne(text, lang) {
  if (!text.trim()) return text
  if (text === 'Sandra Loo') return text

  const parts = text.split('|').map(s => s.trim())
  const translatedParts = []

  for (const part of parts) {
    const { protectedText, tokens } = protectTokens(part)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${lang}&dt=t&q=${encodeURIComponent(protectedText)}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })
    if (!res.ok) throw new Error(`translate failed ${res.status}`)
    const data = await res.json()
    const translated = (data?.[0] || []).map((chunk) => chunk?.[0] || '').join('')
    translatedParts.push(restoreTokens(translated, tokens))
    await new Promise(r => setTimeout(r, 70))
  }

  return translatedParts.join(' | ')
}

const flat = flatten(source)
const keys = Object.keys(flat)

for (const target of targets) {
  const out = {}
  let n = 0
  for (const key of keys) {
    const val = flat[key]
    try {
      out[key] = await translateOne(val, target.lang)
    }
    catch {
      out[key] = val
    }
    n++
    if (n % 40 === 0) console.log(`${target.code}: ${n}/${keys.length}`)
  }

  out['header.appName'] = source.header.appName
  const nested = unflatten(out)
  fs.writeFileSync(path.join(localesDir, target.file), JSON.stringify(nested, null, 4) + '\n', 'utf8')
  console.log(`Wrote ${target.file}`)
}
