<template>
  <div>
    <h1 class="text-2xl font-bold text-brand mb-2">
      🎮 Sandra Loo: The Game
    </h1>
    <p class="text-sm text-gray-500 mb-6">
      A run-based survival game. Manage your bladder meter — and avoid the igitt zone.
    </p>
    <div class="card p-4 mb-6 border-amber-200 bg-amber-50 text-amber-900 text-sm">
      This game module is still work in progress. Features and balancing may change.
    </div>

    <!-- Not started -->
    <div v-if="!gameState.isRunning && !gameState.isGameOver" class="card p-8 text-center">
      <div class="text-6xl mb-4">🚻</div>
      <h2 class="text-xl font-semibold text-brand mb-2">
        Ready to play?
      </h2>
      <p class="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
        Survive {{ config?.maxSteps ?? 10 }} steps. Find a toilet before your bladder bursts or the igitt gets too high!
      </p>
      <button class="btn-primary text-base px-8 py-3" @click="startGame">
        Start Run
      </button>
    </div>

    <!-- Game over -->
    <div v-else-if="gameState.isGameOver" class="card p-8 text-center">
      <div class="text-6xl mb-4">
        {{ gameState.gameOverReason === 'bladder' ? '💦' : gameState.gameOverReason === 'igitt' ? '🤢' : '🏆' }}
      </div>
      <h2 class="text-xl font-semibold text-brand mb-2">
        {{ gameState.gameOverReason ? 'Game Over!' : 'You survived!' }}
      </h2>
      <p class="text-sm text-gray-500 mb-2">
        <span v-if="gameState.gameOverReason === 'bladder'">Your bladder couldn't hold it any longer…</span>
        <span v-else-if="gameState.gameOverReason === 'igitt'">The igitt level was unbearable…</span>
        <span v-else>You made it through all {{ config?.maxSteps }} steps!</span>
      </p>
      <p class="text-2xl font-bold text-brand-accent mb-6">
        Score: {{ gameState.score }}
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <button class="btn-primary" @click="startGame">
          Play again
        </button>
        <NuxtLink to="/game/leaderboard" class="btn-secondary">
          Leaderboard
        </NuxtLink>
      </div>
    </div>

    <!-- Active game -->
    <div v-else>
      <!-- Meters -->
      <GameMeters
        :bladder="gameState.bladderMeter"
        :igitt="gameState.igittMeter"
        :max="config?.meterMax ?? 100"
        :danger="config?.meterDangerThreshold ?? 75"
        class="mb-6"
      />

      <!-- Step / score -->
      <div class="flex justify-between text-sm font-medium text-gray-600 mb-6">
        <span>Step {{ gameState.step + 1 }} / {{ config?.maxSteps ?? 10 }}</span>
        <span class="text-brand-accent font-bold">{{ gameState.score }} pts</span>
      </div>

      <!-- Reward picker -->
      <div v-if="showRewardPicker" class="card p-5 mb-6">
        <h2 class="font-semibold text-brand mb-3">
          Choose a reward
        </h2>
        <div class="grid grid-cols-3 gap-3">
          <button
            v-for="reward in pendingRewards"
            :key="reward.id"
            class="card p-3 text-center hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-brand-accent"
            @click="pickReward(reward)"
          >
            <div class="text-2xl mb-1">
              {{ reward.icon }}
            </div>
            <div class="text-xs font-semibold text-brand">
              {{ reward.name }}
            </div>
            <div class="text-xs text-gray-500 mt-0.5">
              {{ reward.description }}
            </div>
          </button>
        </div>
        <button class="btn-secondary text-sm mt-3" @click="skipReward">
          Skip
        </button>
      </div>

      <!-- Toilet options -->
      <div v-else>
        <h2 class="font-semibold text-brand mb-3">
          Where will you go?
        </h2>
        <div class="grid sm:grid-cols-3 gap-4">
          <button
            v-for="option in config?.toiletOptions"
            :key="option.type"
            class="card p-5 text-center hover:shadow-md transition-shadow cursor-pointer hover:border-brand-accent border-2 border-transparent"
            @click="chooseToilet(option)"
          >
            <div class="text-3xl mb-2">
              {{ optionIcon(option.type) }}
            </div>
            <div class="font-semibold text-brand mb-1">
              {{ option.label }}
            </div>
            <div class="text-xs text-gray-400 space-y-0.5">
              <div>Bladder {{ option.bladderEffect > 0 ? '+' : '' }}{{ option.bladderEffect }}</div>
              <div>Igitt {{ option.igittEffect > 0 ? '+' : '' }}{{ option.igittEffect }}</div>
              <div v-if="option.pointsBonus !== 0">
                Points {{ option.pointsBonus > 0 ? '+' : '' }}{{ option.pointsBonus }}
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Equipped rewards -->
      <div v-if="gameState.equippedRewards.length > 0" class="mt-6">
        <p class="text-xs text-gray-400 mb-1">
          Equipped rewards:
        </p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="reward in gameState.equippedRewards"
            :key="reward.id"
            class="text-sm bg-gray-100 rounded-full px-3 py-1"
          >
            {{ reward.icon }} {{ reward.name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameConfig } from '../../../shared/types/index'
import { useGame } from '../../composables/useGame'

const { data } = await useFetch<{ data: GameConfig }>('/api/game/config')
const config = computed(() => data.value?.data)

const {
  state: gameState,
  pendingRewards,
  showRewardPicker,
  startGame,
  chooseToilet,
  pickReward,
  skipReward,
} = useGame(config.value ?? {
  maxSteps: 10,
  pointsPerStep: 100,
  meterMax: 100,
  meterDangerThreshold: 75,
  rewardsPerStep: 3,
  toiletOptions: [],
})

function optionIcon(type: string): string {
  const icons: Record<string, string> = {
    public: '🚻',
    cafe: '☕',
    park: '🌳',
  }
  return icons[type] ?? '🚻'
}
</script>
