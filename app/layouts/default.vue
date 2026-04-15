<template>
  <div class="min-h-screen flex flex-col bg-[var(--cube-base-soft)]">
    <header class="bg-[var(--cube-base)] text-brand shadow-sm border-b border-[color:color-mix(in_srgb,var(--cube-base)_85%,#9f9488)]">
      <div class="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <NuxtLink :to="localePath('/')" class="flex items-center gap-2 font-bold text-lg tracking-tight">
          <span class="text-brand-accent">WC</span>
          {{ $t('header.appName') }}
        </NuxtLink>

        <nav class="flex items-center gap-2 text-sm font-medium">
          <NuxtLink
            :to="localePath('/toilets/')"
            class="px-3 py-2 rounded-lg transition-colors border"
            :class="isToiletsRoute ? 'bg-[var(--cube-base-card)] text-brand border-[color:color-mix(in_srgb,var(--cube-base)_80%,#9f9488)]' : 'border-[color:color-mix(in_srgb,var(--cube-base)_78%,#9f9488)] text-brand hover:bg-[var(--cube-base-card)]'"
          >
            {{ $t('nav.map_view') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/game')"
            class="px-3 py-2 rounded-lg transition-colors border"
            :class="isGameRoute ? 'bg-[var(--cube-base-card)] text-brand border-[color:color-mix(in_srgb,var(--cube-base)_80%,#9f9488)]' : 'border-transparent text-brand/80 hover:text-brand hover:border-[color:color-mix(in_srgb,var(--cube-base)_78%,#9f9488)] hover:bg-[var(--cube-base-card)]'"
          >
            {{ $t('nav.play') }}
          </NuxtLink>
        </nav>
        <div class="ml-3 flex items-center">
          <LanguageSwitcher />
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
      <slot />
    </main>

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
</script>
