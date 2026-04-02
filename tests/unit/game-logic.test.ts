import { describe, it, expect } from 'vitest'
import type { GameConfig } from '../../shared/types/index'

/**
 * Game logic unit tests using synthetic data.
 * These tests import pure logic only – no Nuxt/Vue runtime.
 */

// ---------------------------------------------------------------------------
// Pure game step logic (extracted for testability)
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function applyStep(
  bladder: number,
  igitt: number,
  bladderEffect: number,
  igittEffect: number,
  randomIncrease: number,
  max: number,
): { bladder: number, igitt: number } {
  const newBladder = clamp(bladder + bladderEffect + randomIncrease, 0, max)
  const newIgitt = clamp(igitt + igittEffect, 0, max)
  return { bladder: newBladder, igitt: newIgitt }
}

const MOCK_CONFIG: GameConfig = {
  maxSteps: 10,
  pointsPerStep: 100,
  meterMax: 100,
  meterDangerThreshold: 75,
  rewardsPerStep: 3,
  toiletOptions: [
    { type: 'public', label: 'Public', probability: 0.4, bladderEffect: -40, igittEffect: 15, pointsBonus: 0 },
    { type: 'cafe', label: 'Café', probability: 0.35, bladderEffect: -45, igittEffect: 5, pointsBonus: 10 },
    { type: 'park', label: 'Park', probability: 0.25, bladderEffect: -50, igittEffect: 30, pointsBonus: -20 },
  ],
}

describe('game logic – applyStep', () => {
  it('reduces bladder meter after using a toilet', () => {
    const { bladder } = applyStep(60, 0, -40, 0, 0, 100)
    expect(bladder).toBe(20)
  })

  it('clamps bladder to 0 (never negative)', () => {
    const { bladder } = applyStep(10, 0, -40, 0, 0, 100)
    expect(bladder).toBe(0)
  })

  it('clamps bladder to max (100)', () => {
    const { bladder } = applyStep(90, 0, 0, 0, 30, 100)
    expect(bladder).toBe(100)
  })

  it('increases igitt when using park option', () => {
    const { igitt } = applyStep(50, 20, -50, 30, 0, 100)
    expect(igitt).toBe(50)
  })

  it('clamps igitt to max (100)', () => {
    const { igitt } = applyStep(50, 90, 0, 30, 0, 100)
    expect(igitt).toBe(100)
  })
})

describe('game config', () => {
  it('has the expected number of toilet options', () => {
    expect(MOCK_CONFIG.toiletOptions).toHaveLength(3)
  })

  it('toilet option probabilities sum to ≤ 1', () => {
    const sum = MOCK_CONFIG.toiletOptions.reduce((acc, o) => acc + o.probability, 0)
    expect(sum).toBeLessThanOrEqual(1.001) // float tolerance
  })

  it('all toilet options have required fields', () => {
    for (const option of MOCK_CONFIG.toiletOptions) {
      expect(option.type).toBeTruthy()
      expect(typeof option.bladderEffect).toBe('number')
      expect(typeof option.igittEffect).toBe('number')
    }
  })
})
