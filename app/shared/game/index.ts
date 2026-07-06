import type {
  GameConfig,
  GameSessionState,
  GameState,
  MilestoneOption,
  Reward,
  RewardBonuses,
  ToiletOption,
} from '../types'

export const DEFAULT_GAME_CONFIG: GameConfig = {
  maxSteps: 20,
  stepsPerMilestone: 10,
  pointsPerStep: 100,
  meterMax: 100,
  meterDangerThreshold: 75,
  bladderIncreasePerStep: 14,
  toiletOptions: [],
}

const SHOP_REWARDS: MilestoneOption[] = [
  {
    id: 'shoe-shop',
    label: 'Shoe Shop',
    description: 'Pick up fast soles and turn the run into a style statement.',
    icon: 'Sneakers',
    pointsBonus: 80,
    reward: {
      id: 'shop-speed',
      name: 'Speed Sneakers',
      description: 'Extra score on every remaining stop.',
      category: 'bonus',
      icon: 'Speed',
      scoreBonus: 20,
    },
  },
  {
    id: 'grocery-store',
    label: 'Grocery Store',
    description: 'Stock up on tissues and cooling drinks for a steadier route.',
    icon: 'Groceries',
    pointsBonus: 60,
    reward: {
      id: 'shop-relief',
      name: 'Emergency Tissue Pack',
      description: 'Each stop gives a little extra relief.',
      category: 'bonus',
      icon: 'Tissues',
      bladderReliefBonus: -10,
    },
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy',
    description: 'Grab a hygiene kit and reduce the risk from sketchy toilets.',
    icon: 'Pharmacy',
    pointsBonus: 70,
    reward: {
      id: 'shop-shield',
      name: 'Hygiene Kit',
      description: 'Cuts the igitt hit on future stops.',
      category: 'bonus',
      icon: 'Shield',
      igittShieldBonus: 10,
    },
  },
]

export function createInitialGameState(): GameState {
  return {
    step: 0,
    score: 0,
    bladderMeter: 20,
    igittMeter: 0,
    isRunning: false,
    isGameOver: false,
    gameOverReason: null,
    equippedRewards: [],
  }
}

export function createInitialGameSession(): GameSessionState {
  return {
    state: createInitialGameState(),
    milestoneOptions: [],
    showMilestonePicker: false,
    lastStepSummary: null,
  }
}

export function startGameSession(): GameSessionState {
  return {
    state: {
      ...createInitialGameState(),
      isRunning: true,
    },
    milestoneOptions: [],
    showMilestonePicker: false,
    lastStepSummary: null,
  }
}

export function chooseToiletStep(
  session: GameSessionState,
  config: GameConfig,
  option: ToiletOption,
  random: () => number = Math.random,
): GameSessionState {
  if (!session.state.isRunning || session.showMilestonePicker) return session

  const rewardBonuses = calculateRewardBonuses(session.state.equippedRewards)
  const stepPressureGain = config.bladderIncreasePerStep
  const bladderDelta = option.bladderEffect + rewardBonuses.bladderReliefBonus
  const igittDelta = option.igittEffect - rewardBonuses.igittShieldBonus
  const scoreDelta = config.pointsPerStep + option.pointsBonus + rewardBonuses.scoreBonus

  const nextBladder = clamp(
    session.state.bladderMeter + stepPressureGain + bladderDelta,
    0,
    config.meterMax,
  )
  const nextIgitt = clamp(session.state.igittMeter + igittDelta, 0, config.meterMax)
  const nextStep = session.state.step + 1
  const nextScore = session.state.score + scoreDelta

  const nextSession: GameSessionState = {
    state: {
      ...session.state,
      step: nextStep,
      score: nextScore,
      bladderMeter: nextBladder,
      igittMeter: nextIgitt,
    },
    milestoneOptions: [],
    showMilestonePicker: false,
    lastStepSummary: {
      optionLabel: option.label,
      optionType: option.type,
      stepPressureGain,
      bladderDelta,
      igittDelta,
      scoreDelta,
      totalBladder: Math.round(nextBladder),
      totalIgitt: Math.round(nextIgitt),
      rewardHighlights: describeRewardBonuses(rewardBonuses),
    },
  }

  if (nextBladder >= config.meterMax) {
    return endGameSession(nextSession, 'bladder')
  }

  if (nextIgitt >= config.meterMax) {
    return endGameSession(nextSession, 'igitt')
  }

  if (nextStep >= config.maxSteps) {
    return endGameSession(nextSession, null)
  }

  if (nextStep % Math.max(config.stepsPerMilestone, 1) === 0) {
    return {
      ...nextSession,
      milestoneOptions: generateMilestoneOptions(random),
      showMilestonePicker: true,
    }
  }

  return nextSession
}

export function chooseMilestoneOption(
  session: GameSessionState,
  option: MilestoneOption,
): GameSessionState {
  if (!session.showMilestonePicker) return session

  return {
    ...session,
    state: {
      ...session.state,
      score: session.state.score + option.pointsBonus,
      equippedRewards: [...session.state.equippedRewards, option.reward],
    },
    milestoneOptions: [],
    showMilestonePicker: false,
  }
}

export function calculateRewardBonuses(rewards: Reward[]): RewardBonuses {
  return rewards.reduce(
    (totals, reward) => ({
      bladderReliefBonus: totals.bladderReliefBonus + (reward.bladderReliefBonus ?? 0),
      igittShieldBonus: totals.igittShieldBonus + (reward.igittShieldBonus ?? 0),
      scoreBonus: totals.scoreBonus + (reward.scoreBonus ?? 0),
    }),
    {
      bladderReliefBonus: 0,
      igittShieldBonus: 0,
      scoreBonus: 0,
    },
  )
}

export function describeRewardBonuses(bonuses: RewardBonuses): string[] {
  const highlights: string[] = []

  if (bonuses.bladderReliefBonus < 0) {
    highlights.push(`${Math.abs(bonuses.bladderReliefBonus)} extra bladder relief`)
  }
  if (bonuses.igittShieldBonus > 0) {
    highlights.push(`${bonuses.igittShieldBonus} igitt shield`)
  }
  if (bonuses.scoreBonus > 0) {
    highlights.push(`+${bonuses.scoreBonus} bonus points`)
  }

  return highlights
}

export function generateMilestoneOptions(random: () => number = Math.random) {
  return [...SHOP_REWARDS].sort(() => random() - 0.5).slice(0, 3)
}

function endGameSession(session: GameSessionState, reason: 'bladder' | 'igitt' | null): GameSessionState {
  return {
    ...session,
    state: {
      ...session.state,
      isRunning: false,
      isGameOver: true,
      gameOverReason: reason,
    },
    showMilestonePicker: false,
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}
