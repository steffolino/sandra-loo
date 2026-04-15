<template>
  <div>
    <!-- Loading -->
    <div v-if="activePending" class="text-center py-16 text-gray-400">
      {{ $t('toilets.loading') }}
    </div>

    <div v-else-if="activeError" class="card p-8 text-center text-red-500">
      <p>{{ $t('toilets.detail_load_error') }}</p>
      <NuxtLink :to="localePath('/toilets/')" class="btn-primary mt-4">
        {{ $t('common.back_to_list') }}
      </NuxtLink>
    </div>

    <!-- Not found -->
    <div v-else-if="!toilet" class="card p-10 text-center">
      <div class="text-5xl mb-4">?</div>
      <h2 class="text-xl font-semibold text-brand mb-2">
        {{ $t('toilets.not_found') }}
      </h2>
      <NuxtLink :to="localePath('/toilets/')" class="btn-primary mt-4">
        {{ $t('common.back_to_list') }}
      </NuxtLink>
    </div>

    <!-- Detail view -->
    <div v-else>
      <NuxtLink :to="localePath('/toilets/')" class="text-sm text-brand-accent hover:underline mb-4 inline-block">
        {{ $t('common.back_to_list') }}
      </NuxtLink>

      <div class="card p-6 mb-6">
        <h1 class="text-2xl font-bold text-brand mb-1">
          {{ toilet.name ?? $t('toilet.public') }}
        </h1>
        <p v-if="toilet.address" class="text-gray-500 text-sm mb-3">
          {{ toilet.address }}, {{ toilet.city }}
        </p>

        <div class="flex flex-wrap gap-2 mb-4">
          <span
            class="px-2 py-1 rounded-full text-xs font-medium"
            :class="toilet.is_free ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
          >
              {{ toilet.is_free ? $t('toilet.free') : $t('toilet.paid') }}
          </span>
          <span
            v-if="toilet.is_accessible"
            class="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          > {{ $t('toilet.accessible') }} </span>
          <span
            class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
          >
            {{ toiletTypeLabel(toilet.type) }}
          </span>
        </div>

        <p v-if="toilet.opening_hours" class="text-sm text-gray-600 mb-2">
          <strong>{{ $t('toilet.opening_hours_label') }}</strong> {{ toilet.opening_hours }}
        </p>
        <p v-if="toilet.notes" class="text-sm text-gray-600 mb-4">
          <strong>{{ $t('toilet.notes_label') }}</strong> {{ toilet.notes }}
        </p>

        <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 mb-4">
          <p class="font-medium">
            {{ $t('toilets.guide_not_guarantee') }}
          </p>
          <p class="mt-1">
            {{ $t('toilets.status_changes_body') }}
          </p>
          <p class="mt-1">
            {{ $t('toilets.status_changes_institutional') }}
          </p>
        </div>

        <!-- Data details -->
        <div class="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 mt-4">
          <p class="mt-1">
            <strong>{{ $t('toilets.last_updated_label') }}</strong>
            {{ formatDate(toilet.last_updated_at) }}
          </p>
          <p class="mt-1">
            <a
              :href="resolveSourceUrl(toilet.source, toilet.source_url)"
              target="_blank"
              rel="noopener noreferrer"
              class="underline hover:text-brand"
            >{{ $t('toilets.open_data_source') }}</a>
          </p>
        </div>
      </div>

      <!-- Confirmation actions -->
      <div class="card p-5 mb-6">
        <h2 class="font-semibold text-brand mb-3">
          {{ $t('toilets.confirm_status') }}
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
        <p v-if="confirmSuccess" class="text-green-600 text-sm mt-2"> {{ $t('toilets.confirm_thanks') }} </p>
      </div>

      <!-- Reviews -->
      <div class="card p-5 mb-6">
        <h2 class="font-semibold text-brand mb-3">
          {{ $t('toilets.reviews_title') }}
          <span class="text-gray-400 font-normal text-sm">({{ toilet.reviews?.length ?? 0 }})</span>
        </h2>

        <div v-if="!toilet.reviews?.length" class="text-sm text-gray-400 py-4 text-center">
          {{ $t('toilets.no_reviews_yet') }}
        </div>

        <div v-else class="space-y-3 mb-4">
          <div
            v-for="review in toilet.reviews"
            :key="review.id"
            class="bg-gray-50 rounded-lg p-3 text-sm"
          >
            <div class="flex gap-4 mb-1">
              <span>{{ $t('review.cleanliness_label_short') }}: {{ review.cleanliness }}/5</span>
              <span>{{ $t('review.lighting_label_short') }}: {{ review.lighting }}/5</span>
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
          {{ $t('toilets.reports_title') }}
          <span class="text-gray-400 font-normal text-sm">({{ toilet.reports?.length ?? 0 }})</span>
        </h2>

        <div v-if="!toilet.reports?.length" class="text-sm text-gray-400 py-4 text-center">
          {{ $t('toilets.no_reports_yet') }}
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
import { resolveSourceUrl } from '../../utils/provenance'
import { toiletTypeLabelKey } from '../../utils/toilet-type'

type ToiletDetail = Toilet & {
  reviews: Review[]
  reports: Report[]
  confirmations: Confirmation[]
}

const route = useRoute()
const localePath = useLocalePath()
const id = route.params.id as string
const runtimeConfig = useRuntimeConfig()
const useStaticApiMode = runtimeConfig.app.baseURL !== '/'
const appBase = runtimeConfig.app.baseURL.endsWith('/')
  ? runtimeConfig.app.baseURL
  : `${runtimeConfig.app.baseURL}/`
const encodedId = encodeURIComponent(id)

const liveEndpoint = `/api/toilets/${encodedId}`
const staticEndpoints = [
  `${appBase}api/toilets/${encodedId}`,
  `${appBase}api/toilets/${encodedId}/index`,
]

const { data, pending, error, refresh } = await useFetch<{ data: ToiletDetail }>(liveEndpoint, {
  server: !useStaticApiMode,
  immediate: !useStaticApiMode,
  watch: false,
  transform: (input: { data: ToiletDetail } | string) => {
    if (typeof input === 'string') {
      return JSON.parse(input) as { data: ToiletDetail }
    }
    return input
  },
})

const staticData = ref<{ data: ToiletDetail } | null>(null)
const staticPending = ref(useStaticApiMode)
const staticError = ref<Error | null>(null)

async function loadStaticToilet() {
  if (!useStaticApiMode) return

  staticPending.value = true
  staticError.value = null

  try {
    let lastError: Error | null = null

    for (const endpoint of staticEndpoints) {
      try {
        const response = await fetch(endpoint, {
          cache: 'no-store',
          headers: {
            accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
          },
        })

        if (!response.ok) {
          lastError = new Error(`Failed to load toilet (${response.status})`)
          continue
        }

        const contentType = response.headers.get('content-type') ?? ''
        const payload = contentType.includes('application/json')
          ? await response.json() as { data: ToiletDetail }
          : JSON.parse(await response.text()) as { data: ToiletDetail }

        staticData.value = payload
        return
      }
      catch (err) {
        lastError = err instanceof Error ? err : new Error('Failed to load toilet')
      }
    }

    staticError.value = lastError ?? new Error('Failed to load toilet')
  }
  finally {
    staticPending.value = false
  }
}

onMounted(async () => {
  if (useStaticApiMode) {
    await loadStaticToilet()
  }
})

const activePending = computed(() => (useStaticApiMode ? staticPending.value : pending.value))
const activeError = computed(() => (useStaticApiMode ? staticError.value : error.value))
const toilet = computed(() => (useStaticApiMode ? staticData.value?.data : data.value?.data) ?? null)

const { t, locale } = useI18n()

const confirmationTypes = [
  { value: 'open', label: t('confirmation.open') },
  { value: 'clean', label: t('confirmation.clean') },
  { value: 'accessible', label: t('toilet.accessible') },
  { value: 'free', label: t('toilet.free') },
]

const confirming = ref(false)
const confirmSuccess = ref(false)
const confirmationFormStartedAt = Date.now()

async function confirm(type: string) {
  if (!toilet.value) return
  confirming.value = true
  confirmSuccess.value = false
  try {
    await $fetch('/api/confirmations', {
      method: 'POST',
      body: {
        toilet_id: toilet.value.id,
        type,
        website: '',
        form_started_at: confirmationFormStartedAt,
      },
    })
    confirmSuccess.value = true
    setTimeout(() => { confirmSuccess.value = false }, 3000)
  }
  finally {
    confirming.value = false
  }
}

async function refreshData() {
  if (useStaticApiMode) {
    await loadStaticToilet()
    return
  }
  await refresh()
}

function formatDate(iso: string): string {
  const localeCode = locale.value === 'en' ? 'en-US' : 'de-DE'
  return new Date(iso).toLocaleDateString(localeCode)
}

function toiletTypeLabel(type: Toilet['type']): string {
  return t(toiletTypeLabelKey(type))
}
</script>
