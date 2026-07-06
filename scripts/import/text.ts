const MOJIBAKE_MARKERS = ['Ã', 'Â', 'â', 'ï¿½', '�']

export function cleanText(value: unknown): string {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  if (!looksMojibake(raw)) return raw

  try {
    const repaired = Buffer.from(raw, 'latin1').toString('utf8').trim()
    if (repaired && scoreText(repaired) < scoreText(raw)) {
      return repaired
    }
    if (repaired && scoreText(repaired) === scoreText(raw) && repaired.length >= raw.length) {
      return repaired
    }
  }
  catch {
    // Ignore repair failures and fall back to the original text.
  }

  return raw
}

export function cleanNullableText(value: unknown): string | null {
  const cleaned = cleanText(value)
  return cleaned || null
}

export function cleanTextArray(values: Array<unknown>): string[] {
  return values.map(cleanText).filter(Boolean)
}

function looksMojibake(text: string): boolean {
  return MOJIBAKE_MARKERS.some(marker => text.includes(marker))
}

function scoreText(text: string): number {
  let score = 0
  for (const marker of MOJIBAKE_MARKERS) {
    score += (text.match(new RegExp(escapeRegExp(marker), 'g')) ?? []).length
  }
  return score
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
