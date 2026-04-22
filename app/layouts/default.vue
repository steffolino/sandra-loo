<template>
  <div class="min-h-screen flex flex-col bg-[var(--cube-base-soft)]">
    <header class="bg-[var(--cube-base)] text-brand shadow-sm border-b border-[color:color-mix(in_srgb,var(--cube-base)_85%,#9f9488)]">
      <div class="max-w-5xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between gap-3">
          <NuxtLink :to="localePath('/')" class="min-w-0 flex items-center gap-2 font-bold text-base sm:text-lg tracking-tight">
            <span class="text-brand-accent shrink-0">WC</span>
            <span class="truncate">{{ $t('header.appName') }}</span>
          </NuxtLink>

          <div class="w-[7.25rem] sm:w-auto shrink-0">
            <LanguageSwitcher />
          </div>
        </div>

        <nav class="mt-2.5 grid grid-cols-3 gap-2 text-sm font-medium sm:mt-3 sm:flex sm:items-center sm:gap-2">
          <NuxtLink
            :to="localePath('/toilets/')"
            class="text-center px-3 py-2.5 rounded-lg transition-colors border"
            :class="isToiletsRoute ? 'bg-[var(--cube-base-card)] text-brand border-[color:color-mix(in_srgb,var(--cube-base)_80%,#9f9488)] shadow-sm' : 'border-[color:color-mix(in_srgb,var(--cube-base)_78%,#9f9488)] text-brand hover:bg-[var(--cube-base-card)]'"
          >
            {{ $t('nav.map_view') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/game')"
            class="text-center px-3 py-2.5 rounded-lg transition-colors border"
            :class="isGameRoute ? 'bg-[var(--cube-base-card)] text-brand border-[color:color-mix(in_srgb,var(--cube-base)_80%,#9f9488)] shadow-sm' : 'border-[color:color-mix(in_srgb,var(--cube-base)_78%,#9f9488)] text-brand/80 hover:text-brand hover:bg-[var(--cube-base-card)]'"
          >
            {{ $t('nav.play') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/about')"
            class="text-center px-3 py-2.5 rounded-lg transition-colors border"
            :class="isAboutRoute ? 'bg-[var(--cube-base-card)] text-brand border-[color:color-mix(in_srgb,var(--cube-base)_80%,#9f9488)] shadow-sm' : 'border-[color:color-mix(in_srgb,var(--cube-base)_78%,#9f9488)] text-brand/80 hover:text-brand hover:bg-[var(--cube-base-card)]'"
          >
            {{ $t('nav.about') }}
          </NuxtLink>
        </nav>
      </div>
    </header>

    <main class="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
      <slot />
    </main>

    <a
      href="tel:110"
      class="fixed bottom-4 left-4 z-[1400] inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-lg ring-1 ring-red-700/60 transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 sm:left-auto sm:right-4"
      :aria-label="$t('common.emergency_call_aria')"
    >
      {{ $t('common.emergency_call') }}
    </a>

    <footer class="bg-[var(--cube-base-card)] text-[color:var(--cube-text)] text-xs py-4 text-center border-t border-[color:color-mix(in_srgb,var(--cube-base)_80%,#9f9488)]">
      <p>{{ $t('footer.tagline') }}</p>
      <p class="mt-1">
        <a
          href="https://www.openstreetmap.org"
          target="_blank"
          rel="noopener noreferrer"
          class="underline text-[#5c4290] hover:text-[#3f6675] focus:outline-none focus:ring-2 focus:ring-[#3f6675]/40 rounded-sm"
        >{{ $t('footer.data_source', { source: 'OpenStreetMap' }) }}</a>
        &middot; {{ $t('footer.license_mit') }}
      </p>
      <p class="mt-1">
        {{ $t('footer.feedback') }}
        <a
          href="https://github.com/steffolino/sandra-loo/issues/new/choose"
          target="_blank"
          rel="noopener noreferrer"
          class="underline text-[#5c4290] hover:text-[#3f6675] focus:outline-none focus:ring-2 focus:ring-[#3f6675]/40 rounded-sm"
        >{{ $t('footer.report_issue') }}</a>
      </p>
    </footer>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const localePath = useLocalePath()

const isToiletsRoute = computed(() => /\/(?:[a-z]{2}\/)?toilets(?:\/|$)/.test(route.path))
const isGameRoute = computed(() => /\/(?:[a-z]{2}\/)?game(?:\/|$)/.test(route.path))
const isAboutRoute = computed(() => /\/(?:[a-z]{2}\/)?about(?:\/|$)/.test(route.path))
</script>
