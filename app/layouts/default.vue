<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Navigation -->
    <header class="bg-brand text-white shadow-md">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span class="text-brand-accent">🚻</span>
          Sandra Loo
        </NuxtLink>
        <nav class="flex items-center gap-4 text-sm font-medium">
          <NuxtLink to="/toilets" class="hover:text-brand-accent transition-colors">
            Find Toilets
          </NuxtLink>
          <NuxtLink to="/game" class="hover:text-brand-accent transition-colors">
            Play
          </NuxtLink>
        </nav>
      </div>
    </header>

    <!-- Main content -->
    <main class="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="bg-brand text-gray-400 text-xs py-4 text-center">
      <p>Sandra Loo – Civic Toilet Finder &amp; Awareness Game</p>
      <p class="mt-1">
        Data from
        <a
          href="https://www.openstreetmap.org"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-white"
        >OpenStreetMap</a>
        · MIT License
      </p>
    </footer>
  </div>
</template>
