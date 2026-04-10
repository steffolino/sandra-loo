import type {
  GameConfig,
  GameState,
  GameStepSummary,
  MilestoneOption,
  Reward,
  ToiletOption,
} from '../../../shared/types/index'

export function useGame(config: GameConfig) {
  const state = ref<GameState>({
    step: 0,
    score: 0,
    bladderMeter: 20,
    igittMeter: 0,
    isRunning: false,
    isGameOver: false,
    gameOverReason: null,
    equippedRewards: [],
  })

  const milestoneOptions = ref<MilestoneOption[]>([])
  const showMilestonePicker = ref(false)
  const lastStepSummary = ref<GameStepSummary | null>(null)

  function startGame() {
    state.value = {
      step: 0,
      score: 0,
      bladderMeter: 20,
      igittMeter: 0,
      isRunning: true,
      isGameOver: false,
      gameOverReason: null,
      equippedRewards: [],
    }
    milestoneOptions.value = []
    showMilestonePicker.value = false
    lastStepSummary.value = null
  }

  function chooseToilet(option: ToiletOption) {
    if (!state.value.isRunning || showMilestonePicker.value) return

    const rewardBonuses = calculateRewardBonuses(state.value.equippedRewards)
    const stepPressureGain = config.bladderIncreasePerStep
    const bladderDelta = option.bladderEffect + rewardBonuses.bladderReliefBonus
    const igittDelta = option.igittEffect - rewardBonuses.igittShieldBonus
    const scoreDelta = config.pointsPerStep + option.pointsBonus + rewardBonuses.scoreBonus

    state.value.bladderMeter = Math.min(config.meterMax, state.value.bladderMeter + stepPressureGain)
    state.value.bladderMeter = Math.max(
      0,
      Math.min(config.meterMax, state.value.bladderMeter + bladderDelta),
    )
    state.value.igittMeter = Math.max(
      0,
      Math.min(config.meterMax, state.value.igittMeter + igittDelta),
    )
    state.value.score += scoreDelta
    state.value.step++

    lastStepSummary.value = {
      optionLabel: option.label,
      optionType: option.type,
      stepPressureGain,
      bladderDelta,
      igittDelta,
      scoreDelta,
      totalBladder: Math.round(state.value.bladderMeter),
      totalIgitt: Math.round(state.value.igittMeter),
      rewardHighlights: describeBonuses(rewardBonuses),
    }

    if (state.value.bladderMeter >= config.meterMax) {
      endGame('bladder')
      return
    }

    if (state.value.igittMeter >= config.meterMax) {
      endGame('igitt')
      return
    }

    if (state.value.step >= config.maxSteps) {
      endGame(null)
      return
    }

    if (state.value.step % config.stepsPerMilestone === 0) {
      milestoneOptions.value = generateMilestoneOptions()
      showMilestonePicker.value = true
    }
  }

  function chooseMilestone(option: MilestoneOption) {
    if (!showMilestonePicker.value) return

    state.value.equippedRewards.push(option.reward)
    state.value.score += option.pointsBonus
    milestoneOptions.value = []
    showMilestonePicker.value = false
  }

  function endGame(reason: 'bladder' | 'igitt' | null) {
    state.value.isRunning = false
    state.value.isGameOver = true
    state.value.gameOverReason = reason
    showMilestonePicker.value = false
  }

  return {
    state: readonly(state),
    milestoneOptions: readonly(milestoneOptions),
    showMilestonePicker: readonly(showMilestonePicker),
    lastStepSummary: readonly(lastStepSummary),
    startGame,
    chooseToilet,
    chooseMilestone,
  }
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

function generateMilestoneOptions() {
  return [...SHOP_REWARDS].sort(() => Math.random() - 0.5).slice(0, 3)
}

function calculateRewardBonuses(rewards: Reward[]) {
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

function describeBonuses(bonuses: ReturnType<typeof calculateRewardBonuses>): string[] {
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
