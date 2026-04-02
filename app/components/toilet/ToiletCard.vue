<template>
  <NuxtLink
    :to="`/toilets/${toilet.id}`"
    class="card p-4 flex items-start gap-4 hover:shadow-md transition-shadow block"
  >
    <div class="text-2xl mt-0.5">🚻</div>
    <div class="flex-1 min-w-0">
      <div class="font-semibold text-brand truncate">
        {{ toilet.name ?? 'Public Toilet' }}
      </div>
      <div class="text-sm text-gray-500 truncate">
        {{ toilet.address ?? toilet.city }}
      </div>
      <div class="flex flex-wrap gap-1.5 mt-2">
        <span
          class="px-2 py-0.5 rounded-full text-xs font-medium"
          :class="toilet.is_free ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
        >
          {{ toilet.is_free ? 'Free' : 'Paid' }}
        </span>
        <span
          v-if="toilet.is_accessible"
          class="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
        >
          ♿
        </span>
        <span
          class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
        >
          {{ toilet.type }}
        </span>
      </div>
    </div>
    <div class="text-brand-accent text-sm font-medium shrink-0">
      →
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Toilet } from '../../../shared/types/index'

defineProps<{ toilet: Toilet }>()
</script>
