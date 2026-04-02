import type { GameConfig, GameState, Reward, ToiletOption } from '../../../shared/types/index'

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

  const pendingRewards = ref<Reward[]>([])
  const showRewardPicker = ref(false)

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
    pendingRewards.value = []
    showRewardPicker.value = false
  }

  function chooseToilet(option: ToiletOption) {
    if (!state.value.isRunning) return

    // Apply effects
    state.value.bladderMeter = Math.max(
      0,
      Math.min(config.meterMax, state.value.bladderMeter + option.bladderEffect),
    )
    state.value.igittMeter = Math.max(
      0,
      Math.min(config.meterMax, state.value.igittMeter + option.igittEffect),
    )

    state.value.score += config.pointsPerStep + option.pointsBonus
    state.value.step++

    // Random bladder increase per step
    state.value.bladderMeter = Math.min(
      config.meterMax,
      state.value.bladderMeter + Math.floor(Math.random() * 15) + 5,
    )

    // Check game over
    if (state.value.bladderMeter >= config.meterMax) {
      endGame('bladder')
      return
    }
    if (state.value.igittMeter >= config.meterMax) {
      endGame('igitt')
      return
    }

    // Max steps reached = win
    if (state.value.step >= config.maxSteps) {
      endGame(null)
      return
    }

    // Offer rewards
    pendingRewards.value = generateRewards(config.rewardsPerStep)
    showRewardPicker.value = true
  }

  function pickReward(reward: Reward) {
    state.value.equippedRewards.push(reward)
    pendingRewards.value = []
    showRewardPicker.value = false
  }

  function skipReward() {
    pendingRewards.value = []
    showRewardPicker.value = false
  }

  function endGame(reason: 'bladder' | 'igitt' | null) {
    state.value.isRunning = false
    state.value.isGameOver = true
    state.value.gameOverReason = reason
    showRewardPicker.value = false
  }

  return {
    state: readonly(state),
    pendingRewards: readonly(pendingRewards),
    showRewardPicker: readonly(showRewardPicker),
    startGame,
    chooseToilet,
    pickReward,
    skipReward,
  }
}

// ---------------------------------------------------------------------------
// Reward pool (cosmetic – MVP)
// ---------------------------------------------------------------------------

const REWARD_POOL: Reward[] = [
  { id: 'r1', name: 'Golden Roll', description: 'A shimmering toilet roll', category: 'cosmetic', icon: '🧻✨' },
  { id: 'r2', name: 'Hygiene Halo', description: 'You glow with cleanliness', category: 'cosmetic', icon: '😇' },
  { id: 'r3', name: 'Speed Sneakers', description: 'Run faster to the next loo', category: 'cosmetic', icon: '👟' },
  { id: 'r4', name: 'Nose Clip', description: 'Igitt immunity +10%', category: 'cosmetic', icon: '🤏' },
  { id: 'r5', name: 'VIP Pass', description: 'Skip the queue', category: 'cosmetic', icon: '🎫' },
  { id: 'r6', name: 'Café Voucher', description: 'Free latte, nicer loo', category: 'cosmetic', icon: '☕' },
]

function generateRewards(count: number): Reward[] {
  const shuffled = [...REWARD_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
