export function formatProvenanceLabel(source: unknown, sourceName: unknown): string {
  const safeSource = asText(source)
  const safeSourceName = asText(sourceName)
  const combined = `${safeSource} ${safeSourceName}`.toLowerCase()

  if (combined.includes('institutional') || combined.includes('derived')) {
    return 'institutional layer'
  }

  if (combined.includes('openstreetmap') || safeSource.toLowerCase() === 'osm') {
    return 'openstreetmap.org'
  }

  if (combined.includes('leipzig')) {
    return 'opendata.leipzig.de'
  }

  if (combined.includes('frankfurt')) {
    return 'offenedaten.frankfurt.de'
  }

  const sourceDomain = extractDomain(safeSource)
  if (sourceDomain) return sourceDomain

  const sourceNameDomain = extractDomain(safeSourceName)
  if (sourceNameDomain) return sourceNameDomain

  return safeSourceName || safeSource || 'unknown source'
}

export function formatProvenanceMeta(source: unknown, sourceName: unknown): string {
  const safeSource = asText(source)
  const safeSourceName = asText(sourceName)
  if (safeSourceName && safeSource) return `${safeSourceName} (${safeSource})`
  return safeSourceName || safeSource || 'unknown source'
}

export function resolveSourceUrl(source: unknown, sourceUrl: unknown): string {
  const normalizedSourceUrl = normalizeUrl(asText(sourceUrl))
  if (normalizedSourceUrl) return normalizedSourceUrl

  const normalizedSource = normalizeUrl(asText(source))
  if (normalizedSource) return normalizedSource

  return '#'
}

export type SourcePortal = 'osm' | 'leipzig' | 'frankfurt' | 'institutional' | 'other'

export function sourceKindFromRecord(source: unknown, sourceName: unknown): 'osm' | 'city_open_data' | 'institutional' | 'other' {
  const combined = `${asText(source)} ${asText(sourceName)}`.toLowerCase()
  if (combined.includes('institutional') || combined.includes('derived')) return 'institutional'
  if (combined.includes('openstreetmap') || combined.includes(' osm ')) return 'osm'
  if (combined.includes('open data') || combined.includes('opendata') || combined.includes('offenedaten')) {
    return 'city_open_data'
  }
  return 'other'
}

export function sourcePortalFromRecord(source: unknown, sourceName: unknown): SourcePortal {
  const safeSource = asText(source).toLowerCase()
  const safeSourceName = asText(sourceName).toLowerCase()
  const combined = `${safeSource} ${safeSourceName}`

  if (combined.includes('institutional') || combined.includes('derived')) return 'institutional'
  if (combined.includes('openstreetmap') || safeSource === 'osm') return 'osm'
  if (combined.includes('leipzig') || safeSource.includes('opendata.leipzig.de')) return 'leipzig'
  if (combined.includes('frankfurt') || safeSource.includes('offenedaten.frankfurt.de')) return 'frankfurt'

  return 'other'
}

function extractDomain(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    return parsed.hostname.replace(/^www\./, '')
  }
  catch {
    return null
  }
}

function normalizeUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    return parsed.toString()
  }
  catch {
    return null
  }
}

function asText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return String(value)
}
