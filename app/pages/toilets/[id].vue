<template>
  <div>
    <!-- Loading -->
    <div v-if="pending" class="text-center py-16 text-gray-400">
      Loading…
    </div>

    <!-- Not found -->
    <div v-else-if="!toilet" class="card p-10 text-center">
      <div class="text-5xl mb-4">🔍</div>
      <h2 class="text-xl font-semibold text-brand mb-2">
        Toilet not found
      </h2>
      <NuxtLink to="/toilets" class="btn-primary mt-4">
        Back to list
      </NuxtLink>
    </div>

    <!-- Detail view -->
    <div v-else>
      <NuxtLink to="/toilets" class="text-sm text-brand-accent hover:underline mb-4 inline-block">
        ← Back
      </NuxtLink>

      <div class="card p-6 mb-6">
        <h1 class="text-2xl font-bold text-brand mb-1">
          {{ toilet.name ?? 'Public Toilet' }}
        </h1>
        <p v-if="toilet.address" class="text-gray-500 text-sm mb-3">
          {{ toilet.address }}, {{ toilet.city }}
        </p>

        <div class="flex flex-wrap gap-2 mb-4">
          <span
            class="px-2 py-1 rounded-full text-xs font-medium"
            :class="toilet.is_free ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
          >
            {{ toilet.is_free ? 'Free' : 'Paid' }}
          </span>
          <span
            v-if="toilet.is_accessible"
            class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            ♿ Accessible
          </span>
          <span
            class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
          >
            {{ toilet.type }}
          </span>
        </div>

        <p v-if="toilet.opening_hours" class="text-sm text-gray-600 mb-2">
          <strong>Opening hours:</strong> {{ toilet.opening_hours }}
        </p>
        <p v-if="toilet.notes" class="text-sm text-gray-600 mb-4">
          <strong>Notes:</strong> {{ toilet.notes }}
        </p>

        <!-- Data source transparency -->
        <div class="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 mt-4">
          <strong>Data source:</strong> {{ toilet.source_name }} ({{ toilet.source }})
          · Last updated: {{ formatDate(toilet.last_updated_at) }}
        </div>
      </div>

      <!-- Confirmation actions -->
      <div class="card p-5 mb-6">
        <h2 class="font-semibold text-brand mb-3">
          Confirm status
        </h2>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="type in confirmationTypes"
            :key="type.value"
            class="btn-secondary text-sm"
            :disabled="confirming"
            @click="confirm(type.value)"
          >
            {{ type.label }}
          </button>
        </div>
        <p v-if="confirmSuccess" class="text-green-600 text-sm mt-2">
          ✓ Thank you for confirming!
        </p>
      </div>

      <!-- Reviews -->
      <div class="card p-5 mb-6">
        <h2 class="font-semibold text-brand mb-3">
          Reviews
          <span class="text-gray-400 font-normal text-sm">({{ toilet.reviews?.length ?? 0 }})</span>
        </h2>

        <div v-if="!toilet.reviews?.length" class="text-sm text-gray-400 py-4 text-center">
          No reviews yet. Be the first!
        </div>

        <div v-else class="space-y-3 mb-4">
          <div
            v-for="review in toilet.reviews"
            :key="review.id"
            class="bg-gray-50 rounded-lg p-3 text-sm"
          >
            <div class="flex gap-4 mb-1">
              <span>Cleanliness: {{ review.cleanliness }}/5</span>
              <span>Lighting: {{ review.lighting }}/5</span>
            </div>
            <p v-if="review.comment" class="text-gray-600">
              {{ review.comment }}
            </p>
          </div>
        </div>

        <!-- Submit review form -->
        <ReviewForm :toilet-id="toilet.id" @submitted="refreshData" />
      </div>

      <!-- Reports -->
      <div class="card p-5">
        <h2 class="font-semibold text-brand mb-3">
          Reports
          <span class="text-gray-400 font-normal text-sm">({{ toilet.reports?.length ?? 0 }})</span>
        </h2>

        <div v-if="!toilet.reports?.length" class="text-sm text-gray-400 py-4 text-center">
          No reports. Toilet seems OK!
        </div>

        <div v-else class="space-y-2 mb-4">
          <div
            v-for="report in toilet.reports"
            :key="report.id"
            class="flex items-center gap-2 text-sm"
          >
            <span class="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs">{{ report.type }}</span>
            <span class="text-gray-500">{{ formatDate(report.created_at) }}</span>
          </div>
        </div>

        <ReportForm :toilet-id="toilet.id" @submitted="refreshData" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Toilet, Review, Report, Confirmation } from '../../../../shared/types/index'

type ToiletDetail = Toilet & {
  reviews: Review[]
  reports: Report[]
  confirmations: Confirmation[]
}

const route = useRoute()
const id = route.params.id as string
const runtimeConfig = useRuntimeConfig()
const useStaticApiMode = runtimeConfig.app.baseURL !== '/'
const appBase = runtimeConfig.app.baseURL.endsWith('/')
  ? runtimeConfig.app.baseURL
  : `${runtimeConfig.app.baseURL}/`

const endpoint = useStaticApiMode
  ? `${appBase}api/toilets/${id}/index`
  : `/api/toilets/${id}`

const { data, pending, refresh, execute } = await useFetch<{ data: ToiletDetail }>(endpoint, {
  server: !useStaticApiMode,
  immediate: !useStaticApiMode,
  transform: (input: { data: ToiletDetail } | string) => {
    if (typeof input === 'string') {
      return JSON.parse(input) as { data: ToiletDetail }
    }
    return input
  },
})

onMounted(async () => {
  if (useStaticApiMode) {
    await execute()
  }
})

const toilet = computed(() => data.value?.data ?? null)

const confirmationTypes = [
  { value: 'open', label: '✓ Open' },
  { value: 'clean', label: '✓ Clean' },
  { value: 'accessible', label: '✓ Accessible' },
  { value: 'free', label: '✓ Free' },
]

const confirming = ref(false)
const confirmSuccess = ref(false)

async function confirm(type: string) {
  if (!toilet.value) return
  confirming.value = true
  confirmSuccess.value = false
  try {
    await $fetch('/api/confirmations', {
      method: 'POST',
      body: { toilet_id: toilet.value.id, type },
    })
    confirmSuccess.value = true
    setTimeout(() => { confirmSuccess.value = false }, 3000)
  }
  finally {
    confirming.value = false
  }
}

async function refreshData() {
  await refresh()
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE')
}
</script>
