<template>
  <div>
    <!-- Hero -->
    <section class="text-center py-16 px-4">
      <h1 class="text-4xl font-bold text-brand mb-3">
        {{ $t('header.appName') }} 🚻
      </h1>
      <p class="text-lg text-gray-600 max-w-xl mx-auto mb-8">
        {{ $t('home.tagline') }}
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <NuxtLink :to="localePath('/toilets/')" class="btn-primary text-base px-6 py-3">
          {{ $t('home.find_a_toilet') }}
        </NuxtLink>
        <NuxtLink :to="localePath('/game')" class="btn-secondary text-base px-6 py-3">
          {{ $t('home.play_game') }}
        </NuxtLink>
      </div>
    </section>

    <section class="card p-6 mb-8 bg-brand/5 border-brand/10">
      <h2 class="text-lg font-semibold text-brand mb-2">
        {{ $t('home.getting_started_title') }}
      </h2>
      <p class="text-sm text-gray-600 mb-3">
        {{ $t('home.getting_started_text') }}
      </p>
      <p class="text-sm text-gray-600">
        {{ $t('home.no_account_needed') }}
      </p>
    </section>

    <!-- Feature cards -->
    <section class="grid sm:grid-cols-3 gap-6 mt-4">
      <div class="card p-6">
        <div class="text-3xl mb-3">📍</div>
        <h2 class="font-semibold text-brand mb-1">
          {{ $t('home.feature.real_data') }}
        </h2>
        <p class="text-sm text-gray-500">
          {{ $t('home.feature.real_data_desc') }}
        </p>
      </div>
      <div class="card p-6">
        <div class="text-3xl mb-3">⭐</div>
        <h2 class="font-semibold text-brand mb-1">
          {{ $t('home.feature.community_reviews') }}
        </h2>
        <p class="text-sm text-gray-500">
          {{ $t('home.feature.community_reviews_desc') }}
        </p>
      </div>
      <div class="card p-6">
        <div class="text-3xl mb-3">🎮</div>
        <h2 class="font-semibold text-brand mb-1">
          {{ $t('home.feature.awareness_game') }}
        </h2>
        <p class="text-sm text-gray-500">
          {{ $t('home.feature.awareness_game_desc') }}
        </p>
      </div>
    </section>

    <!-- Cities -->
    <section class="mt-12">
      <h2 class="text-xl font-bold text-brand mb-4">
        {{ $t('home.available_cities_title') }}
      </h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <NuxtLink
          :to="localePath({ path: '/toilets/', query: { city: 'Leipzig' } })"
          class="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <span class="text-2xl">🏙️</span>
          <div>
            <div class="font-semibold text-brand">
              Leipzig
            </div>
            <div class="text-sm text-gray-500">
              {{ $t('home.city_leipzig_region') }}
            </div>
          </div>
        </NuxtLink>
        <NuxtLink
          :to="localePath({ path: '/toilets/', query: { city: 'Frankfurt am Main' } })"
          class="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow"
        >
          <span class="text-2xl">🏙️</span>
          <div>
            <div class="font-semibold text-brand">
              Frankfurt am Main
            </div>
            <div class="text-sm text-gray-500">
              {{ $t('home.city_frankfurt_region') }}
            </div>
          </div>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const localePath = useLocalePath()
</script>
