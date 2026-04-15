<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink :to="localePath('/admin')" class="text-sm text-brand-accent hover:underline">
        ← {{ $t('admin.title') }}
      </NuxtLink>
      <h1 class="text-xl font-bold text-brand">
        {{ $t('admin.toilets') }}
      </h1>
    </div>

    <div v-if="pending" class="text-center py-10 text-gray-400">
      {{ $t('common.loading') }}
    </div>

    <div v-else-if="!toilets?.length" class="card p-10 text-center">
      <div class="text-4xl mb-3">📥</div>
      <h2 class="font-semibold text-brand mb-2">
        {{ $t('admin.no_data_imported_yet') }}
      </h2>
      <p class="text-sm text-gray-500 mb-4">
        {{ $t('admin.run_import_scripts_hint') }}
      </p>
      <div class="bg-gray-50 rounded-lg p-4 text-left text-sm font-mono text-gray-700 inline-block">
        <p>npm run import:osm</p>
        <p>npm run import:institutional</p>
        <p>npm run import:leipzig</p>
        <p>npm run import:leipzig-institutional</p>
        <p>npm run import:leipzig-institutional</p>
        <p>npm run import:frankfurt</p>
      </div>
    </div>

    <div v-else class="card overflow-hidden">
      <div class="px-4 py-3 bg-gray-50 text-sm text-gray-500 border-b border-gray-200">
        {{ $t('admin.records_count', { count: toilets.length }) }}
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
          <tr>
            <th class="px-4 py-3 text-left">{{ $t('common.name') }}</th>
            <th class="px-4 py-3 text-left">{{ $t('common.city') }}</th>
            <th class="px-4 py-3 text-left">{{ $t('common.type') }}</th>
            <th class="px-4 py-3 text-left">{{ $t('common.source') }}</th>
            <th class="px-4 py-3 text-left">{{ $t('common.updated') }}</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="toilet in toilets" :key="toilet.id" class="hover:bg-gray-50">
            <td class="px-4 py-2 font-medium text-brand">{{ toilet.name ?? '–' }}</td>
            <td class="px-4 py-2 text-gray-600">{{ toilet.city }}</td>
            <td class="px-4 py-2 text-gray-600">{{ toilet.type }}</td>
            <td class="px-4 py-2 text-gray-600">{{ toilet.source_name }}</td>
            <td class="px-4 py-2 text-gray-400 text-xs">{{ formatDate(toilet.last_updated_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Toilet } from '../../../../shared/types/index'
import { useI18n } from 'vue-i18n'

const localePath = useLocalePath()
const { locale } = useI18n()
const { data, pending } = await useFetch<{ data: Toilet[] }>('/api/toilets')
const toilets = computed(() => data.value?.data ?? [])

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(locale.value)
}
</script>
