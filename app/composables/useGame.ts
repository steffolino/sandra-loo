import { computed, ref, unref } from 'vue'
import type { MaybeRef } from 'vue'
import type {
  GameConfig,
  GameSessionState,
  MilestoneOption,
  ToiletOption,
} from '../shared/types'
import {
  DEFAULT_GAME_CONFIG,
  chooseMilestoneOption,
  chooseToiletStep,
  createInitialGameSession,
  startGameSession,
} from '../shared/game'

export function useGame(config: MaybeRef<GameConfig | undefined>) {
  const resolvedConfig = computed(() => unref(config) ?? DEFAULT_GAME_CONFIG)

  const session = ref<GameSessionState>(createInitialGameSession())
  const state = computed(() => session.value.state)
  const milestoneOptions = computed(() => session.value.milestoneOptions)
  const showMilestonePicker = computed(() => session.value.showMilestonePicker)
  const lastStepSummary = computed(() => session.value.lastStepSummary)

  function startGame() {
    session.value = startGameSession()
  }

  function chooseToilet(option: ToiletOption) {
    session.value = chooseToiletStep(session.value, resolvedConfig.value, option)
  }

  function chooseMilestone(option: MilestoneOption) {
    session.value = chooseMilestoneOption(session.value, option)
  }

  return {
    state,
    milestoneOptions,
    showMilestonePicker,
    lastStepSummary,
    startGame,
    chooseToilet,
    chooseMilestone,
  }
}
