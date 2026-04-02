<template>
  <div>
    <h1 class="text-2xl font-bold text-brand mb-6">
      Find a Toilet
    </h1>

    <!-- Filters -->
    <div class="card p-4 mb-6">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <select
          v-model="filters.city"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option value="">All cities</option>
          <option value="Leipzig">Leipzig</option>
          <option value="Frankfurt am Main">Frankfurt am Main</option>
        </select>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input v-model="filters.is_free" type="checkbox" class="rounded">
          Free only
        </label>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input v-model="filters.is_accessible" type="checkbox" class="rounded">
          Accessible only
        </label>

        <button class="btn-primary text-sm" @click="applyFilters">
          Search
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="text-center py-16 text-gray-400">
      Loading toilets…
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card p-8 text-center text-red-500">
      <p>Could not load toilet data.</p>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="!toilets || toilets.length === 0"
      class="card p-10 text-center"
    >
      <div class="text-5xl mb-4">🚻</div>
      <h2 class="text-xl font-semibold text-brand mb-2">
        No toilets found yet
      </h2>
      <p class="text-gray-500 mb-6 max-w-md mx-auto">
        No data has been imported for this area yet. Run the import scripts to
        populate the database with real OpenStreetMap and city open-data.
      </p>
      <div class="bg-gray-50 rounded-lg p-4 text-left text-sm font-mono text-gray-700 inline-block">
        <p># Import all sources:</p>
        <p>npm run import:osm</p>
        <p>npm run import:leipzig</p>
        <p>npm run import:frankfurt</p>
      </div>
      <p class="text-xs text-gray-400 mt-4">
        See <code>docs/import-strategy.md</code> for full instructions.
      </p>
    </div>

    <!-- Toilet list -->
    <div v-else class="space-y-3">
      <ToiletCard
        v-for="toilet in toilets"
        :key="toilet.id"
        :toilet="toilet"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Toilet } from '../../../shared/types/index'

const route = useRoute()
const router = useRouter()

const filters = ref({
  city: (route.query.city as string) ?? '',
  is_free: false,
  is_accessible: false,
})

const queryParams = computed(() => {
  const p: Record<string, string> = {}
  if (filters.value.city) p.city = filters.value.city
  if (filters.value.is_free) p.is_free = 'true'
  if (filters.value.is_accessible) p.is_accessible = 'true'
  return p
})

const { data, pending, error, refresh } = await useFetch<{
  data: Toilet[]
  meta: { total: number, hasData: boolean }
}>('/api/toilets', { query: queryParams })

const toilets = computed(() => data.value?.data ?? [])

function applyFilters() {
  router.replace({ query: { city: filters.value.city || undefined } })
  refresh()
}
</script>
