<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink :to="localePath('/admin')" class="text-sm text-brand-accent hover:underline">
        ← {{ $t('admin.title') }}
      </NuxtLink>
      <h1 class="text-xl font-bold text-brand">
        {{ $t('admin.reports') }}
      </h1>
    </div>

    <!-- Empty state placeholder -->
    <div class="card p-10 text-center">
      <div class="text-4xl mb-3">🚨</div>
      <h2 class="font-semibold text-brand mb-2">
        {{ $t('admin.no_reports') }}
      </h2>
      <p class="text-sm text-gray-500">
        {{ $t('admin.no_reports_text') }}
      </p>
      <p class="text-xs text-gray-400 mt-4">
        {{ $t('admin.moderation_workflow_soon') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
</script>
