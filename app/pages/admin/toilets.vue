<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin" class="text-sm text-brand-accent hover:underline">
        ← Admin
      </NuxtLink>
      <h1 class="text-xl font-bold text-brand">
        Toilets
      </h1>
    </div>

    <div v-if="pending" class="text-center py-10 text-gray-400">
      Loading…
    </div>

    <div v-else-if="!toilets?.length" class="card p-10 text-center">
      <div class="text-4xl mb-3">📥</div>
      <h2 class="font-semibold text-brand mb-2">
        No data imported yet
      </h2>
      <p class="text-sm text-gray-500 mb-4">
        Run the import scripts to populate the database.
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
        {{ toilets.length }} records
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
          <tr>
            <th class="px-4 py-3 text-left">Name</th>
            <th class="px-4 py-3 text-left">City</th>
            <th class="px-4 py-3 text-left">Type</th>
            <th class="px-4 py-3 text-left">Source</th>
            <th class="px-4 py-3 text-left">Updated</th>
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

const { data, pending } = await useFetch<{ data: Toilet[] }>('/api/toilets')
const toilets = computed(() => data.value?.data ?? [])

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE')
}
</script>
