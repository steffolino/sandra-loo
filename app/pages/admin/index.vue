<template>
  <div>
    <h1 class="text-2xl font-bold text-brand mb-2">
      {{ $t('admin.title') }}
    </h1>
    <p class="text-sm text-gray-500 mb-8">
      {{ $t('admin.description') }}
    </p>

    <div class="grid sm:grid-cols-3 gap-5">
      <NuxtLink to="/admin/toilets" class="card p-5 hover:shadow-md transition-shadow">
        <div class="text-3xl mb-2">🚻</div>
        <div class="font-semibold text-brand">{{ $t('admin.toilets') }}</div>
        <div class="text-sm text-gray-500">{{ $t('admin.toilets_desc') }}</div>
      </NuxtLink>
      <NuxtLink to="/admin/reports" class="card p-5 hover:shadow-md transition-shadow">
        <div class="text-3xl mb-2">🚨</div>
        <div class="font-semibold text-brand">{{ $t('admin.reports') }}</div>
        <div class="text-sm text-gray-500">{{ $t('admin.reports_desc') }}</div>
      </NuxtLink>
      <div class="card p-5 opacity-60">
        <div class="text-3xl mb-2">📥</div>
        <div class="font-semibold text-brand">{{ $t('admin.import_runs') }}</div>
        <div class="text-sm text-gray-500">{{ $t('admin.import_runs_desc') }}</div>
      </div>
    </div>
  </div>
</template>
