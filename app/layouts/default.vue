<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <header class="bg-brand text-white shadow-md">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span class="text-brand-accent">WC</span>
          Sandra Loo
        </NuxtLink>

        <nav class="flex items-center gap-2 text-sm font-medium">
          <NuxtLink
            to="/toilets/"
            class="px-3 py-2 rounded-lg transition-colors border"
            :class="isToiletsRoute ? 'bg-brand-accent text-white border-brand-accent' : 'border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10'"
          >
            Map View
          </NuxtLink>
          <NuxtLink
            to="/game"
            class="px-3 py-2 rounded-lg transition-colors"
            :class="isGameRoute ? 'bg-white/15 text-white' : 'text-white/85 hover:text-white'"
          >
            Play
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main class="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
      <slot />
    </main>

    <footer class="bg-brand text-gray-400 text-xs py-4 text-center">
      <p>Sandra Loo - Civic Toilet Finder &amp; Awareness Game</p>
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

<script setup lang="ts">
const route = useRoute()

const isToiletsRoute = computed(() => route.path.startsWith('/toilets'))
const isGameRoute = computed(() => route.path.startsWith('/game'))
</script>
