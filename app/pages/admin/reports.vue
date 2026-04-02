<template>
  <div>
    <div class="flex items-center gap-3 mb-6">
      <NuxtLink to="/admin" class="text-sm text-brand-accent hover:underline">
        ← Admin
      </NuxtLink>
      <h1 class="text-xl font-bold text-brand">
        Reports
      </h1>
    </div>

    <!-- Empty state placeholder -->
    <div class="card p-10 text-center">
      <div class="text-4xl mb-3">🚨</div>
      <h2 class="font-semibold text-brand mb-2">
        No reports yet
      </h2>
      <p class="text-sm text-gray-500">
        User reports will appear here once users start submitting them.
      </p>
      <p class="text-xs text-gray-400 mt-4">
        Full moderation workflow is planned for a future release.
      </p>
    </div>
  </div>
</template>
