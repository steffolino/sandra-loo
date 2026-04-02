<template>
  <div>
    <h1 class="text-2xl font-bold text-brand mb-2">
      Admin
    </h1>
    <p class="text-sm text-gray-500 mb-8">
      Moderation and import inspection. Authentication required in production.
    </p>

    <div class="grid sm:grid-cols-3 gap-5">
      <NuxtLink to="/admin/toilets" class="card p-5 hover:shadow-md transition-shadow">
        <div class="text-3xl mb-2">🚻</div>
        <div class="font-semibold text-brand">Toilets</div>
        <div class="text-sm text-gray-500">Browse imported toilet records</div>
      </NuxtLink>
      <NuxtLink to="/admin/reports" class="card p-5 hover:shadow-md transition-shadow">
        <div class="text-3xl mb-2">🚨</div>
        <div class="font-semibold text-brand">Reports</div>
        <div class="text-sm text-gray-500">Review and triage user reports</div>
      </NuxtLink>
      <div class="card p-5 opacity-60">
        <div class="text-3xl mb-2">📥</div>
        <div class="font-semibold text-brand">Import Runs</div>
        <div class="text-sm text-gray-500">Coming soon – run import scripts</div>
      </div>
    </div>
  </div>
</template>
