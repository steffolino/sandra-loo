<template>
  <div class="space-y-6">
    <section class="card overflow-hidden border-[color:var(--cube-accent)]/25 bg-[radial-gradient(circle_at_top,_rgba(132,94,194,0.18),_rgba(255,255,255,0.96)_58%)] p-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-2xl">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-brand-accent/80">
            Step Run
          </p>
          <h1 class="mt-2 text-3xl font-bold text-brand">
            Sandra Loo: The Game
          </h1>
          <p class="mt-3 text-sm leading-6 text-slate-600">
            Each step gives you three toilet choices. Every move raises the bladder meter first, then your
            selected stop changes the situation. Every 10 steps, you hit a bonus shop milestone.
          </p>
        </div>

        <div class="grid grid-cols-3 gap-3 text-center text-xs font-medium text-slate-600">
          <div class="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
            <div class="text-[0.7rem] uppercase tracking-[0.2em] text-slate-400">Route</div>
            <div class="mt-1 text-sm font-semibold text-brand">{{ config?.maxSteps ?? 20 }} steps</div>
          </div>
          <div class="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
            <div class="text-[0.7rem] uppercase tracking-[0.2em] text-slate-400">Pressure</div>
            <div class="mt-1 text-sm font-semibold text-brand">+{{ config?.bladderIncreasePerStep ?? 14 }} each step</div>
          </div>
          <div class="rounded-2xl border border-white/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur">
            <div class="text-[0.7rem] uppercase tracking-[0.2em] text-slate-400">Milestone</div>
            <div class="mt-1 text-sm font-semibold text-brand">Every {{ config?.stepsPerMilestone ?? 10 }}</div>
          </div>
        </div>
      </div>
    </section>

    <div class="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      The loop is now fully step-based. Free roaming is gone from the main flow so every decision pushes the run forward.
    </div>

    <div v-if="!gameState.isRunning && !gameState.isGameOver" class="card p-8 text-center">
      <div class="mx-auto max-w-2xl">
        <h2 class="text-2xl font-semibold text-brand">Ready for a 20-step run?</h2>
        <p class="mt-3 text-sm leading-6 text-slate-500">
          Survive the route, manage bladder and igitt, and hit a shop milestone at step 10 before the final stretch.
        </p>
        <div class="mt-6 grid gap-3 text-left sm:grid-cols-3">
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Public Toilet</p>
            <p class="mt-2 text-sm text-slate-600">Solid relief, middling cleanliness.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Cafe</p>
            <p class="mt-2 text-sm text-slate-600">Usually the best comfort and score mix.</p>
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Park</p>
            <p class="mt-2 text-sm text-slate-600">Big relief, big igitt, pure desperation.</p>
          </div>
        </div>
        <button class="btn-primary mt-8 px-8 py-3 text-base" @click="startGame">Start Run</button>
      </div>
    </div>

    <div v-else-if="gameState.isGameOver" class="card p-8 text-center">
      <div class="mx-auto max-w-lg">
        <p class="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Run Complete</p>
        <h2 class="mt-3 text-2xl font-semibold text-brand">
          {{ gameState.gameOverReason ? 'Game Over' : 'You finished the route' }}
        </h2>
        <p class="mt-3 text-sm leading-6 text-slate-500">
          <span v-if="gameState.gameOverReason === 'bladder'">The bladder meter maxed out before the next stop.</span>
          <span v-else-if="gameState.gameOverReason === 'igitt'">The igitt level got too high to keep going.</span>
          <span v-else>You cleared all {{ config?.maxSteps ?? 20 }} steps and made it through the milestone stretch.</span>
        </p>
        <p class="mt-5 text-4xl font-bold text-brand-accent">
          {{ gameState.score }}
          <span class="text-base font-medium text-slate-400">pts</span>
        </p>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <button class="btn-primary" @click="startGame">Play again</button>
          <NuxtLink to="/game/leaderboard" class="btn-secondary">Leaderboard</NuxtLink>
        </div>
      </div>
    </div>

    <div v-else class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div class="space-y-6">
        <section v-if="showMilestonePicker" class="card p-5">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Milestone Stop</p>
              <h2 class="mt-1 font-semibold text-brand">Choose your sub-final bonus shop</h2>
              <p class="mt-1 text-sm text-slate-500">
                You reached step {{ gameState.step }}. Pick one shop to gain an extra bonus and a score boost.
              </p>
            </div>
            <div class="rounded-full bg-brand-accent/10 px-3 py-1 text-sm font-semibold text-brand-accent">
              Shop Event
            </div>
          </div>

          <div class="mt-4 grid gap-4 sm:grid-cols-3">
            <button
              v-for="option in milestoneOptions"
              :key="option.id"
              class="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-brand-accent hover:shadow-lg"
              @click="chooseMilestone(option)"
            >
              <div class="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {{ option.icon }}
              </div>
              <div class="mt-2 text-lg font-semibold text-brand">{{ option.label }}</div>
              <p class="mt-2 text-sm text-slate-500">{{ option.description }}</p>
              <div class="mt-4 rounded-2xl bg-white p-3">
                <div class="text-sm font-semibold text-brand">{{ option.reward.name }}</div>
                <div class="mt-1 text-xs text-slate-500">{{ option.reward.description }}</div>
                <div class="mt-3 flex flex-wrap gap-2">
                  <span
                    v-for="badge in rewardBadges(option.reward)"
                    :key="badge"
                    class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                  >
                    {{ badge }}
                  </span>
                  <span class="rounded-full bg-brand-accent/10 px-2.5 py-1 text-xs font-medium text-brand-accent">
                    +{{ option.pointsBonus }} points
                  </span>
                </div>
              </div>
            </button>
          </div>
        </section>

        <section v-else class="card p-5">
          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Next Step</p>
              <h2 class="mt-1 font-semibold text-brand">Pick the toilet for this step</h2>
              <p class="mt-1 text-sm text-slate-500">
                Use the 3D scene to choose the destination for this step. The bladder meter rises first, then your selected toilet changes the outcome.
              </p>
            </div>
          </div>

          <GameFpsRunScene
            class="mt-4"
            :options="config?.toiletOptions ?? []"
            :enabled="gameState.isRunning && !showMilestonePicker"
            :round-key="gameState.step"
            :bladder="gameState.bladderMeter"
            :igitt="gameState.igittMeter"
            :danger="config?.meterDangerThreshold ?? 75"
            :max-meter="config?.meterMax ?? 100"
            :step="gameState.step"
            :max-steps="config?.maxSteps ?? 20"
            :score="gameState.score"
            :pressure-gain="config?.bladderIncreasePerStep ?? 14"
            @select-option="chooseToilet"
          />

          <div class="mt-4 grid gap-4 sm:grid-cols-3">
            <button
              v-for="option in config?.toiletOptions"
              :key="option.type"
              class="rounded-3xl border-2 border-transparent bg-slate-50 p-5 text-left transition hover:-translate-y-1 hover:border-brand-accent hover:shadow-lg"
              @click="chooseToilet(option)"
            >
              <div class="flex items-center justify-between">
                <div class="text-sm font-semibold text-brand">{{ option.label }}</div>
                <span class="rounded-full px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em]" :class="optionTone(option.type)">
                  {{ option.type }}
                </span>
              </div>
              <div class="mt-4 space-y-2 text-sm text-slate-500">
                <div class="flex justify-between">
                  <span>Step pressure</span>
                  <span class="font-semibold text-rose-600">+{{ config?.bladderIncreasePerStep ?? 14 }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Relief</span>
                  <span class="font-semibold text-emerald-600">{{ signedValue(option.bladderEffect) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Igitt</span>
                  <span class="font-semibold text-amber-600">{{ signedValue(option.igittEffect) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Points</span>
                  <span class="font-semibold text-brand-accent">{{ signedValue(option.pointsBonus) }}</span>
                </div>
              </div>
            </button>
          </div>
        </section>
      </div>

      <aside class="space-y-6">
        <section class="card p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Active Extras</p>
          <div v-if="gameState.equippedRewards.length > 0" class="mt-4 space-y-3">
            <div
              v-for="reward in gameState.equippedRewards"
              :key="reward.id"
              class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="text-sm font-semibold text-brand">{{ reward.name }}</div>
                <span class="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-400">{{ reward.icon }}</span>
              </div>
              <p class="mt-2 text-sm text-slate-500">{{ reward.description }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  v-for="badge in rewardBadges(reward)"
                  :key="badge"
                  class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
                >
                  {{ badge }}
                </span>
              </div>
            </div>
          </div>
          <p v-else class="mt-4 text-sm text-slate-500">
            No extras yet. Reach the next milestone shop to power up the run.
          </p>
        </section>

        <section class="card p-5">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Last Step</p>
          <div v-if="lastStepSummary" class="mt-4 space-y-3">
            <div>
              <div class="text-base font-semibold text-brand">{{ lastStepSummary.optionLabel }}</div>
              <p class="mt-1 text-sm text-slate-500">
                Step pressure added {{ lastStepSummary.stepPressureGain }} bladder before the toilet effect kicked in.
              </p>
            </div>
            <div class="grid grid-cols-3 gap-3 text-center text-xs font-medium">
              <div class="rounded-2xl bg-rose-50 px-3 py-3 text-rose-700">
                <div class="uppercase tracking-[0.14em] text-rose-500">Pressure</div>
                <div class="mt-1 text-sm font-semibold">+{{ lastStepSummary.stepPressureGain }}</div>
              </div>
              <div class="rounded-2xl bg-emerald-50 px-3 py-3 text-emerald-700">
                <div class="uppercase tracking-[0.14em] text-emerald-500">Relief</div>
                <div class="mt-1 text-sm font-semibold">{{ signedValue(lastStepSummary.bladderDelta) }}</div>
              </div>
              <div class="rounded-2xl bg-amber-50 px-3 py-3 text-amber-700">
                <div class="uppercase tracking-[0.14em] text-amber-500">Igitt</div>
                <div class="mt-1 text-sm font-semibold">{{ signedValue(lastStepSummary.igittDelta) }}</div>
              </div>
            </div>
            <div v-if="lastStepSummary.rewardHighlights.length > 0" class="flex flex-wrap gap-2">
              <span
                v-for="highlight in lastStepSummary.rewardHighlights"
                :key="highlight"
                class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
              >
                {{ highlight }}
              </span>
            </div>
            <p class="text-sm text-slate-500">
              Current meters: {{ lastStepSummary.totalBladder }} bladder, {{ lastStepSummary.totalIgitt }} igitt.
            </p>
          </div>
          <p v-else class="mt-4 text-sm text-slate-500">
            No step taken yet. The first choice starts the whole route.
          </p>
        </section>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameConfig, Reward, ToiletOptionType } from '../../../shared/types/index'
import { useGame } from '../../composables/useGame'

const { data } = await useFetch<{ data: GameConfig }>('/api/game/config')
const config = computed(() => data.value?.data)

const {
  state: gameState,
  milestoneOptions,
  showMilestonePicker,
  lastStepSummary,
  startGame,
  chooseToilet,
  chooseMilestone,
} = useGame(config.value ?? {
  maxSteps: 20,
  stepsPerMilestone: 10,
  pointsPerStep: 100,
  meterMax: 100,
  meterDangerThreshold: 75,
  bladderIncreasePerStep: 14,
  toiletOptions: [],
})

function signedValue(value: number) {
  return `${value > 0 ? '+' : ''}${value}`
}

function rewardBadges(reward: Reward) {
  const badges: string[] = []

  if (reward.bladderReliefBonus) badges.push(`${reward.bladderReliefBonus} bladder`)
  if (reward.igittShieldBonus) badges.push(`-${reward.igittShieldBonus} igitt`)
  if (reward.scoreBonus) badges.push(`+${reward.scoreBonus} score`)

  return badges
}

function optionTone(type: ToiletOptionType) {
  if (type === 'public') return 'bg-sky-100 text-sky-700'
  if (type === 'cafe') return 'bg-rose-100 text-rose-700'
  return 'bg-amber-100 text-amber-700'
}
</script>
