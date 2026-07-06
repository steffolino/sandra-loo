import { describe, it, expect } from 'vitest'
import { haversineKm, inRange, generateId, nowIso } from '../../server/utils/helpers'

describe('helpers', () => {
  describe('inRange', () => {
    it('returns true for value within range', () => {
      expect(inRange(3, 1, 5)).toBe(true)
      expect(inRange(1, 1, 5)).toBe(true)
      expect(inRange(5, 1, 5)).toBe(true)
    })

    it('returns false for value outside range', () => {
      expect(inRange(0, 1, 5)).toBe(false)
      expect(inRange(6, 1, 5)).toBe(false)
    })

    it('returns false for non-number', () => {
      expect(inRange('3', 1, 5)).toBe(false)
      expect(inRange(null, 1, 5)).toBe(false)
      expect(inRange(undefined, 1, 5)).toBe(false)
    })
  })

  describe('haversineKm', () => {
    it('returns 0 for same coordinates', () => {
      expect(haversineKm(51.34, 12.37, 51.34, 12.37)).toBe(0)
    })

    it('calculates approximate distance Leipzig–Frankfurt', () => {
      // Leipzig: 51.3397, 12.3731
      // Frankfurt: 50.1109, 8.6821
      const dist = haversineKm(51.3397, 12.3731, 50.1109, 8.6821)
      // ~300 km – just check rough magnitude
      expect(dist).toBeGreaterThan(200)
      expect(dist).toBeLessThan(400)
    })
  })

  describe('generateId', () => {
    it('returns a non-empty string', () => {
      const id = generateId()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
    })

    it('returns unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, generateId))
      expect(ids.size).toBe(100)
    })
  })

  describe('nowIso', () => {
    it('returns a valid ISO 8601 timestamp', () => {
      const ts = nowIso()
      expect(typeof ts).toBe('string')
      expect(() => new Date(ts).toISOString()).not.toThrow()
    })
  })
})
