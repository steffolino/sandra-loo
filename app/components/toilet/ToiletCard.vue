<template>
  <NuxtLink
    :to="toiletDetailHref(toilet.id)"
    class="card p-4 flex items-start gap-4 hover:shadow-md transition-shadow block"
  >
    <div class="text-2xl mt-0.5">WC</div>
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-brand truncate">
        {{ toilet.name ?? $t('toilet.public') }}
      </div>
      <div class="text-sm text-gray-500 truncate">
        {{ toilet.address ?? toilet.city }}
      </div>
      <div class="flex flex-wrap gap-1.5 mt-2">
        <span
          class="px-2 py-0.5 rounded-full text-xs font-medium"
          :class="toilet.is_free ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
        >
          {{ toilet.is_free ? $t('toilet.free') : $t('toilet.paid') }}
        </span>
        <span
          v-if="toilet.is_accessible"
          class="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          {{ $t('toilet.accessible') }}
        </span>
        <span
          v-if="toilet.opening_hours"
          class="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800"
        >
          {{ $t('toilet.hours_shown') }}
        </span>
        <span
          class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
        >
          {{ toiletTypeLabel(toilet.type) }}
        </span>
        <span
          v-if="toilet.avg_rating !== undefined && toilet.avg_rating !== null"
          class="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"
        >
          {{ $t('toilet.rating', { rating: toilet.avg_rating }) }}
        </span>
        <span
          v-if="toilet.report_count !== undefined && toilet.report_count > 0"
          class="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"
        >
          {{ $t('toilet.reports', toilet.report_count, { count: toilet.report_count }) }}
        </span>
        <span
          v-if="toilet.freshness_label !== undefined"
          class="px-2 py-0.5 rounded-full text-xs font-medium"
          :class="freshnessClass(toilet.freshness_label)"
        >
          {{ freshnessText(toilet.freshness_label, toilet.freshness_days) }}
        </span>
        <span
          v-if="toilet.recent_confirmation_count !== undefined"
          class="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"
        >
          {{ $t('toilet.recent_confirmations', toilet.recent_confirmation_count, { count: toilet.recent_confirmation_count }) }}
        </span>
        <span
          v-if="toilet.source_confidence_score !== undefined"
          class="px-2 py-0.5 rounded-full text-xs font-medium"
          :class="confidenceClass(toilet.source_confidence_level)"
        >
          {{ $t('toilet.source_reliability', { score: toilet.source_confidence_score }) }}
        </span>
      </div>
    </div>
    <div class="text-right shrink-0">
      <div
        v-if="toilet.distance_km !== undefined"
        class="text-xs text-gray-500 mb-1"
      >
        {{ formatDistance(toilet.distance_km) }}
      </div>
      <div class="text-brand-accent text-sm font-medium">
        ->
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Toilet, ToiletListItem } from '../../../shared/types/index'
import { toiletTypeLabelKey } from '../../utils/toilet-type'

defineProps<{ toilet: Toilet | ToiletListItem }>()
const { t } = useI18n()
const localePath = useLocalePath()

function formatDistance(km: number): string {
  if (km < 1) {
    return t('toilets.distance_away', { distance: `${Math.round(km * 1000)} m` })
  }
  return t('toilets.distance_away', { distance: `${km.toFixed(1)} km` })
}

function freshnessText(
  label: ToiletListItem['freshness_label'],
  days: number,
): string {
  if (label === 'fresh') return t('toilet.updated_days', { days })
  if (label === 'aging') return t('toilet.updated_days', { days })
  return t('toilet.data_may_be_stale', { days })
}

function freshnessClass(label: ToiletListItem['freshness_label']): string {
  if (label === 'fresh') return 'bg-teal-100 text-teal-700'
  if (label === 'aging') return 'bg-orange-100 text-orange-700'
  return 'bg-rose-100 text-rose-700'
}

function confidenceClass(level: ToiletListItem['source_confidence_level']): string {
  if (level === 'high') return 'bg-sky-100 text-sky-800'
  if (level === 'medium') return 'bg-indigo-100 text-indigo-700'
  return 'bg-gray-100 text-gray-700'
}

function toiletTypeLabel(type: Toilet['type']): string {
  return t(toiletTypeLabelKey(type))
}

function toiletDetailHref(id: string): string {
  return localePath(`/toilets/${encodeURIComponent(id)}/`)
}
</script>
