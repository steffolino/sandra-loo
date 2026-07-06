import { describe, expect, it } from 'vitest'
import type { GameConfig, Reward } from '../../shared/types/index'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function rewardBonuses(rewards: Reward[]) {
  return rewards.reduce((totals, reward) => ({
    bladderReliefBonus: totals.bladderReliefBonus + (reward.bladderReliefBonus ?? 0),
    igittShieldBonus: totals.igittShieldBonus + (reward.igittShieldBonus ?? 0),
    scoreBonus: totals.scoreBonus + (reward.scoreBonus ?? 0),
  }), {
    bladderReliefBonus: 0,
    igittShieldBonus: 0,
    scoreBonus: 0,
  })
}

function applyStep(
  bladder: number,
  igitt: number,
  bladderIncreasePerStep: number,
  bladderEffect: number,
  igittEffect: number,
  max: number,
  rewards: Reward[] = [],
) {
  const bonuses = rewardBonuses(rewards)
  const afterPressure = clamp(bladder + bladderIncreasePerStep, 0, max)

  return {
    bladder: clamp(afterPressure + bladderEffect + bonuses.bladderReliefBonus, 0, max),
    igitt: clamp(igitt + igittEffect - bonuses.igittShieldBonus, 0, max),
    bonuses,
  }
}

const MOCK_CONFIG: GameConfig = {
  maxSteps: 20,
  stepsPerMilestone: 10,
  pointsPerStep: 100,
  meterMax: 100,
  meterDangerThreshold: 75,
  bladderIncreasePerStep: 14,
  toiletOptions: [
    { type: 'public', label: 'Public', probability: 0.4, bladderEffect: -40, igittEffect: 15, pointsBonus: 0 },
    { type: 'cafe', label: 'Cafe', probability: 0.35, bladderEffect: -45, igittEffect: 5, pointsBonus: 10 },
    { type: 'park', label: 'Park', probability: 0.25, bladderEffect: -50, igittEffect: 30, pointsBonus: -20 },
  ],
}

describe('game logic - step pressure', () => {
  it('adds bladder pressure before toilet relief', () => {
    const { bladder } = applyStep(20, 0, 14, -40, 0, 100)
    expect(bladder).toBe(0)
  })

  it('can max out the bladder meter from the step itself', () => {
    const { bladder } = applyStep(92, 0, 14, -5, 0, 100)
    expect(bladder).toBe(95)
  })
})

describe('game logic - toilet stops', () => {
  it('increases igitt when using the park option', () => {
    const { igitt } = applyStep(50, 20, 14, -50, 30, 100)
    expect(igitt).toBe(50)
  })

  it('lets run bonuses stack into a stronger stop result', () => {
    const rewards: Reward[] = [
      {
        id: 'r1',
        name: 'Emergency Tissue Pack',
        description: 'Extra relief',
        category: 'bonus',
        icon: 'Tissues',
        bladderReliefBonus: -10,
      },
      {
        id: 'r2',
        name: 'Hygiene Kit',
        description: 'Igitt shield',
        category: 'bonus',
        icon: 'Shield',
        igittShieldBonus: 10,
      },
    ]

    const { bladder, igitt, bonuses } = applyStep(55, 18, 14, -40, 15, 100, rewards)

    expect(bladder).toBe(19)
    expect(igitt).toBe(23)
    expect(bonuses.bladderReliefBonus).toBe(-10)
    expect(bonuses.igittShieldBonus).toBe(10)
  })

  it('never lets igitt drop below 0 from shielding', () => {
    const rewards: Reward[] = [
      {
        id: 'r3',
        name: 'Hygiene Kit',
        description: 'Heavy shield',
        category: 'bonus',
        icon: 'Shield',
        igittShieldBonus: 12,
      },
    ]

    const { igitt } = applyStep(30, 4, 14, -45, 5, 100, rewards)
    expect(igitt).toBe(0)
  })
})

describe('game config', () => {
  it('has three toilet options per step', () => {
    expect(MOCK_CONFIG.toiletOptions).toHaveLength(3)
  })

  it('places a milestone every ten steps', () => {
    expect(MOCK_CONFIG.stepsPerMilestone).toBe(10)
  })

  it('toilet option probabilities sum to at most 1', () => {
    const sum = MOCK_CONFIG.toiletOptions.reduce((acc, option) => acc + option.probability, 0)
    expect(sum).toBeLessThanOrEqual(1.001)
  })

  it('all toilet options have required fields', () => {
    for (const option of MOCK_CONFIG.toiletOptions) {
      expect(option.type).toBeTruthy()
      expect(typeof option.bladderEffect).toBe('number')
      expect(typeof option.igittEffect).toBe('number')
    }
  })
})
