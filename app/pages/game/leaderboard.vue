<template>
  <div>
    <h1 class="text-2xl font-bold text-brand mb-6">
      🏆 Leaderboard
    </h1>

    <div class="flex gap-3 mb-6">
      <button
        class="text-sm px-4 py-1.5 rounded-full font-medium transition-all"
        :class="scope === 'daily' ? 'bg-brand-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        @click="scope = 'daily'"
      >
        Today
      </button>
      <button
        class="text-sm px-4 py-1.5 rounded-full font-medium transition-all"
        :class="scope === 'all-time' ? 'bg-brand-accent text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'"
        @click="scope = 'all-time'"
      >
        All Time
      </button>
    </div>

    <div v-if="pending" class="text-center py-10 text-gray-400">
      Loading…
    </div>

    <!-- Empty state -->
    <div v-else-if="!entries?.length" class="card p-10 text-center">
      <div class="text-4xl mb-4">🏅</div>
      <h2 class="font-semibold text-brand mb-2">
        No scores yet
      </h2>
      <p class="text-sm text-gray-500 mb-4">
        Be the first to complete a run and claim the top spot!
      </p>
      <NuxtLink to="/game" class="btn-primary">
        Play now
      </NuxtLink>
    </div>

    <!-- Leaderboard table -->
    <div v-else class="card overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
          <tr>
            <th class="px-4 py-3 text-left">
              Rank
            </th>
            <th class="px-4 py-3 text-left">
              Player
            </th>
            <th class="px-4 py-3 text-right">
              Steps
            </th>
            <th class="px-4 py-3 text-right">
              Score
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="(entry, i) in entries"
            :key="entry.id"
            class="hover:bg-gray-50 transition-colors"
          >
            <td class="px-4 py-3 font-bold text-gray-400">
              <span v-if="i === 0">🥇</span>
              <span v-else-if="i === 1">🥈</span>
              <span v-else-if="i === 2">🥉</span>
              <span v-else>{{ i + 1 }}</span>
            </td>
            <td class="px-4 py-3 font-medium text-brand">
              {{ entry.user_id === 'anonymous' ? 'Anonymous' : entry.user_id }}
            </td>
            <td class="px-4 py-3 text-right text-gray-500">
              {{ entry.steps_completed }}
            </td>
            <td class="px-4 py-3 text-right font-bold text-brand-accent">
              {{ entry.score }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GameScore } from '../../../../shared/types/index'

const scope = ref<'daily' | 'all-time'>('daily')

const url = computed(() =>
  scope.value === 'daily' ? '/api/leaderboard/daily' : '/api/leaderboard/all-time',
)

const { data, pending, refresh } = await useFetch<{ data: GameScore[], meta: { hasData: boolean } }>(url)
const entries = computed(() => data.value?.data ?? [])

watch(scope, () => refresh())
</script>
