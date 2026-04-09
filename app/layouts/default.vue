<template>
  <div class="min-h-screen flex flex-col bg-[var(--cube-base-soft)]">
    <header class="bg-[var(--cube-base)] text-brand shadow-sm border-b border-[color:color-mix(in_srgb,var(--cube-base)_85%,#9f9488)]">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <NuxtLink to="/" class="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span class="text-brand-accent">WC</span>
          Sandra Loo
        </NuxtLink>

        <nav class="flex items-center gap-2 text-sm font-medium">
          <NuxtLink
            to="/toilets/"
            class="px-3 py-2 rounded-lg transition-colors border"
            :class="isToiletsRoute ? 'bg-[var(--cube-base-card)] text-brand border-[color:color-mix(in_srgb,var(--cube-base)_80%,#9f9488)]' : 'border-[color:color-mix(in_srgb,var(--cube-base)_78%,#9f9488)] text-brand hover:bg-[var(--cube-base-card)]'"
          >
            Map View
          </NuxtLink>
          <NuxtLink
            to="/game"
            class="px-3 py-2 rounded-lg transition-colors border"
            :class="isGameRoute ? 'bg-[var(--cube-base-card)] text-brand border-[color:color-mix(in_srgb,var(--cube-base)_80%,#9f9488)]' : 'border-transparent text-brand/80 hover:text-brand hover:border-[color:color-mix(in_srgb,var(--cube-base)_78%,#9f9488)] hover:bg-[var(--cube-base-card)]'"
          >
            Play
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main class="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
      <slot />
    </main>

    <footer class="bg-[var(--cube-base-card)] text-[color:var(--cube-text)] text-xs py-4 text-center border-t border-[color:color-mix(in_srgb,var(--cube-base)_80%,#9f9488)]">
      <p>Sandra Loo - Civic Toilet Finder &amp; Awareness Game</p>
      <p class="mt-1">
        Data from
        <a
          href="https://www.openstreetmap.org"
          target="_blank"
          rel="noopener noreferrer"
          class="underline text-[#5c4290] hover:text-[#3f6675] focus:outline-none focus:ring-2 focus:ring-[#3f6675]/40 rounded-sm"
        >OpenStreetMap</a>
        &middot; MIT License
      </p>
      <p class="mt-1">
        Feedback:
        <a
          href="https://github.com/steffolino/sandra-loo/issues/new/choose"
          target="_blank"
          rel="noopener noreferrer"
          class="underline text-[#5c4290] hover:text-[#3f6675] focus:outline-none focus:ring-2 focus:ring-[#3f6675]/40 rounded-sm"
        >Report an issue or suggestion</a>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()

const isToiletsRoute = computed(() => route.path.startsWith('/toilets'))
const isGameRoute = computed(() => route.path.startsWith('/game'))
</script>
