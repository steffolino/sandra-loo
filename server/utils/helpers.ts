import { randomUUID } from 'node:crypto'

export function generateId(): string {
  return randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Validate that a value is a number within an inclusive range.
 */
export function inRange(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && value >= min && value <= max
}

/**
 * Haversine distance in km between two lat/lng pairs.
 */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a
    = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}
