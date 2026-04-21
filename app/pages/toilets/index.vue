<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-2 mb-2 md:mb-3">
      <h1 class="text-2xl font-bold text-brand">
        {{ $t('toilets.title') }}
      </h1>
    </div>

    <div v-if="!isMobile || viewMode !== 'map'" class="mb-2 flex flex-wrap gap-2 text-xs">
      <button
        type="button"
        class="rounded-full bg-slate-100 text-slate-700 px-2.5 py-1 transition-colors hover:bg-slate-200"
        @click="handleDataStatusAction"
      >
        {{ dataStatusText }}
      </button>
      <button
        v-if="mapCoverageStatusText"
        type="button"
        class="rounded-full bg-blue-100 text-blue-700 px-2.5 py-1 transition-colors hover:bg-blue-200"
        @click="handleCoverageStatusAction"
      >
        {{ mapCoverageStatusText }}
      </button>
      <button
        type="button"
        class="rounded-full px-2.5 py-1 transition-colors"
        :class="`${locationStatusClass} hover:brightness-95`"
        @click="handleLocationStatusAction"
      >
        {{ locationStatusText }}
      </button>
      <button
        v-if="routing || routeInfo || routingError"
        type="button"
        class="rounded-full px-2.5 py-1 transition-colors"
        :class="routeStatusClass"
        @click="handleRouteStatusAction"
      >
        {{ routeStatusText }}
      </button>
    </div>

    <div v-if="!isMobile" class="card p-4 mb-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <select
          v-model="filters.city"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option value="">{{ $t('filters.all_cities') }}</option>
          <option
            v-for="city in availableCities"
            :key="`city-${city}`"
            :value="city"
          >
            {{ city }}
          </option>
        </select>

        <div class="col-span-2 md:col-span-4 rounded-lg border border-gray-300 px-3 py-2">
          <p class="text-xs text-gray-600 mb-2">
            {{ $t('filters.all_place_types') }}
          </p>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="type in toiletTypes"
              :key="type"
              type="button"
              class="px-2 py-1 rounded-full text-xs border transition-colors"
              :class="[
                filters.types.includes(type) ? 'bg-brand-accent/10 border-brand-accent text-brand' : 'bg-white border-gray-300 text-gray-700',
                isTypeDisabled(type) ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-accent/40',
              ]"
              :disabled="isTypeDisabled(type)"
              :aria-pressed="filters.types.includes(type) ? 'true' : 'false'"
              @click="toggleTypeFilter(type)"
            >
              {{ toiletTypeLabel(type) }}
            </button>
          </div>
        </div>

        <select
          v-model="filters.reported"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option value="any">{{ $t('filters.all_report_states') }}</option>
          <option value="true" :disabled="!canFilterReportedTrue">{{ $t('filters.reported_only') }}</option>
          <option value="false" :disabled="!canFilterReportedFalse">{{ $t('filters.no_reports') }}</option>
        </select>

        <select
          v-model="filters.min_rating"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option :value="0">{{ $t('filters.any_rating') }}</option>
          <option :value="4" :disabled="!canFilterMinRating(4)">{{ $t('filters.rating_and_up', { rating: '4.0' }) }}</option>
          <option :value="3" :disabled="!canFilterMinRating(3)">{{ $t('filters.rating_and_up', { rating: '3.0' }) }}</option>
          <option :value="2" :disabled="!canFilterMinRating(2)">{{ $t('filters.rating_and_up', { rating: '2.0' }) }}</option>
        </select>

        <select
          v-model.number="filters.radius"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option :value="0">{{ $t('filters.any_distance') }}</option>
          <option :value="1">{{ $t('filters.within_km', { km: 1 }) }}</option>
          <option :value="2">{{ $t('filters.within_km', { km: 2 }) }}</option>
          <option :value="5">{{ $t('filters.within_km', { km: 5 }) }}</option>
          <option :value="10">{{ $t('filters.within_km', { km: 10 }) }}</option>
        </select>

        <select
          v-model="filters.sort"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option value="updated">{{ $t('filters.latest_updates') }}</option>
          <option value="nearest" :disabled="!userLocation">{{ $t('filters.nearest') }}</option>
          <option value="rating">{{ $t('filters.top_rated') }}</option>
        </select>

          <label class="flex items-center gap-2 text-sm cursor-pointer" :class="!canFilterFree ? 'opacity-60' : ''">
          <input v-model="filters.is_free" type="checkbox" class="rounded" :disabled="!canFilterFree">
          {{ $t('filters.free_only') }}
        </label>

          <label class="flex items-center gap-2 text-sm cursor-pointer" :class="!canFilterAccessible ? 'opacity-60' : ''">
          <input v-model="filters.is_accessible" type="checkbox" class="rounded" :disabled="!canFilterAccessible">
          {{ $t('filters.accessible_only') }}
        </label>

          <label class="flex items-center gap-2 text-sm cursor-pointer" :class="!canFilterOpeningHours ? 'opacity-60' : ''">
          <input v-model="filters.has_opening_hours" type="checkbox" class="rounded" :disabled="!canFilterOpeningHours">
          {{ $t('filters.hours_shown_only') }}
        </label>
      </div>

      <div class="flex flex-wrap gap-2 mt-4">
        <button class="btn-primary text-sm" @click="applyFilters">
          {{ $t('filters.apply') }}
        </button>
        <button class="btn-secondary text-sm hidden md:inline-flex" :disabled="locating" @click="locateUser">
          {{ locating ? $t('common.locating') : $t('filters.use_current_location') }}
        </button>
        <button class="btn-secondary text-sm" @click="resetFilters">
          {{ $t('filters.reset') }}
        </button>
      </div>

      <p v-if="locationError" class="text-sm text-red-600 mt-2">
        {{ locationError }}
      </p>
    </div>

    <div
      v-if="isMobile && showFilters"
      class="fixed inset-0 z-[1300] bg-black/35 p-3"
      @click.self="showFilters = false"
    >
      <div class="card p-4 max-h-[88svh] overflow-y-auto">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-brand">
            {{ $t('filters.title') }}
          </h2>
          <button class="btn-secondary text-sm min-h-11" @click="showFilters = false"> {{ $t('common.close') }} </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <select
            v-model="filters.city"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option value="">{{ $t('filters.all_cities') }}</option>
          <option
            v-for="city in availableCities"
            :key="`mobile-city-${city}`"
            :value="city"
          >
            {{ city }}
          </option>
        </select>

          <div class="col-span-2 rounded-lg border border-gray-300 px-3 py-2">
            <p class="text-xs text-gray-600 mb-2">
              {{ $t('filters.all_place_types') }}
            </p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="type in toiletTypes"
                :key="`mobile-${type}`"
                type="button"
                class="px-2 py-1 rounded-full text-xs border transition-colors"
                :class="[
                  filters.types.includes(type) ? 'bg-brand-accent/10 border-brand-accent text-brand' : 'bg-white border-gray-300 text-gray-700',
                  isTypeDisabled(type) ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-accent/40',
                ]"
                :disabled="isTypeDisabled(type)"
                :aria-pressed="filters.types.includes(type) ? 'true' : 'false'"
                @click="toggleTypeFilter(type)"
              >
                {{ toiletTypeLabel(type) }}
              </button>
            </div>
          </div>

          <select
            v-model="filters.reported"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option value="any">{{ $t('filters.all_report_states') }}</option>
            <option value="true" :disabled="!canFilterReportedTrue">{{ $t('filters.reported_only') }}</option>
            <option value="false" :disabled="!canFilterReportedFalse">{{ $t('filters.no_reports') }}</option>
          </select>

          <select
            v-model="filters.min_rating"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option :value="0">{{ $t('filters.any_rating') }}</option>
            <option :value="4" :disabled="!canFilterMinRating(4)">{{ $t('filters.rating_and_up', { rating: '4.0' }) }}</option>
            <option :value="3" :disabled="!canFilterMinRating(3)">{{ $t('filters.rating_and_up', { rating: '3.0' }) }}</option>
            <option :value="2" :disabled="!canFilterMinRating(2)">{{ $t('filters.rating_and_up', { rating: '2.0' }) }}</option>
          </select>

          <select
            v-model.number="filters.radius"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option :value="0">{{ $t('filters.any_distance') }}</option>
            <option :value="1">{{ $t('filters.within_km', { km: 1 }) }}</option>
            <option :value="2">{{ $t('filters.within_km', { km: 2 }) }}</option>
            <option :value="5">{{ $t('filters.within_km', { km: 5 }) }}</option>
            <option :value="10">{{ $t('filters.within_km', { km: 10 }) }}</option>
          </select>

          <select
            v-model="filters.sort"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option value="updated">{{ $t('filters.latest_updates') }}</option>
            <option value="nearest" :disabled="!userLocation">{{ $t('filters.nearest') }}</option>
            <option value="rating">{{ $t('filters.top_rated') }}</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3 mt-3">
          <label class="flex items-center gap-2 text-sm cursor-pointer" :class="!canFilterFree ? 'opacity-60' : ''">
            <input v-model="filters.is_free" type="checkbox" class="rounded" :disabled="!canFilterFree"> {{ $t('filters.free_only') }} </label>

          <label class="flex items-center gap-2 text-sm cursor-pointer" :class="!canFilterAccessible ? 'opacity-60' : ''">
            <input v-model="filters.is_accessible" type="checkbox" class="rounded" :disabled="!canFilterAccessible"> {{ $t('filters.accessible_only') }} </label>

          <label class="flex items-center gap-2 text-sm cursor-pointer" :class="!canFilterOpeningHours ? 'opacity-60' : ''">
            <input v-model="filters.has_opening_hours" type="checkbox" class="rounded" :disabled="!canFilterOpeningHours">
            {{ $t('filters.hours_shown_only') }}
          </label>
        </div>

        <div class="flex gap-2 mt-4">
          <button class="btn-primary text-sm min-h-11 flex-1" @click="applyFilters">
            {{ $t('filters.apply') }}
          </button>
          <button class="btn-secondary text-sm min-h-11 flex-1" @click="resetFilters">
            {{ $t('filters.reset') }}
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between mb-4">
      <div v-if="!isMobile" class="inline-flex rounded-lg border border-gray-200 overflow-hidden">
        <button
          class="px-4 py-2 text-sm min-h-11"
          :class="viewMode === 'map' ? 'bg-brand-accent text-white' : 'bg-white text-gray-700'"
          @click="viewMode = 'map'"
        >
          {{ $t('common.map') }}
        </button>
        <button
          class="px-4 py-2 text-sm min-h-11"
          :class="viewMode === 'list' ? 'bg-brand-accent text-white' : 'bg-white text-gray-700'"
          @click="viewMode = 'list'"
        >
          {{ $t('common.list') }}
        </button>
      </div>
      <p class="text-sm text-gray-500">
        {{ toilets.length }} {{ $t('common.results') }}
      </p>
    </div>

    <div v-if="viewMode === 'map' && !isMobile" class="mb-4 text-xs">
      <button
        class="btn-secondary w-full text-sm min-h-11 mb-2"
        @click="showMapLegend = !showMapLegend"
      >
        {{ showMapLegend ? tSafe('toilets.hide_map_legend', 'Hide map legend') : tSafe('toilets.show_map_legend', 'Show map legend') }}
      </button>
      <div v-if="showMapLegend" class="flex flex-wrap gap-2">
        <span
          v-for="legend in placeTypeLegend"
          :key="legend.type"
          class="px-2 py-1 rounded-full flex items-center gap-1"
          :style="{ backgroundColor: `${legend.background}22`, color: legend.background }"
        >
          <span aria-hidden="true" class="inline-flex items-center" v-html="legend.iconHtml"></span>
          <span>{{ legend.label }}</span>
        </span>
      </div>
    </div>

    <div v-if="activePending && !hasLoadedOnce" class="text-center py-16 text-gray-400">
      {{ $t('toilets.loading') }}
    </div>

    <div v-else-if="activeError" class="card p-8 text-center text-red-500">
      <p>{{ $t('toilets.load_error') }}</p>
    </div>

    <div
      v-else-if="!toilets.length"
      class="card p-10 text-center"
    >
      <h2 class="text-xl font-semibold text-brand mb-2">
        {{ $t('toilets.none_title') }}
      </h2>
      <p v-if="hasImportedData" class="text-gray-500 mb-4 max-w-md mx-auto">
        {{ $t('toilets.none_with_filters') }}
      </p>
      <p v-else class="text-gray-500 mb-4 max-w-md mx-auto">
        {{ $t('toilets.none_no_data') }}
      </p>
      <div v-if="!hasImportedData" class="bg-gray-50 rounded-lg p-4 text-left text-sm font-mono text-gray-700 inline-block">
        <p>npm run import:osm</p>
        <p>npm run import:institutional</p>
        <p>npm run import:leipzig</p>
        <p>npm run import:leipzig-institutional</p>
        <p>npm run import:leipzig-institutional</p>
        <p>npm run import:frankfurt</p>
      </div>
    </div>

    <div v-else>
      <div v-show="viewMode === 'map'" class="space-y-4">
        <div v-if="isMobile" class="flex items-center gap-2">
          <button class="btn-secondary flex-1 min-h-11" @click="showFilters = !showFilters">
            {{ showFilters ? $t('common.hide_filters') : $t('common.show_filters') }}
          </button>
        </div>
        <ClientOnly>
          <div class="card overflow-hidden relative">
            <div
              ref="mapContainer"
              class="w-full map-surface"
              :class="isMobile ? 'h-[82svh] min-h-[460px]' : 'h-[58vh] min-h-[420px]'"
            />
            <button
              type="button"
              class="btn-secondary absolute top-3 left-3 z-[1200] text-xs min-h-9 px-3 py-1.5 shadow-md"
              :disabled="locating"
              @click="handleLocationStatusAction"
            >
              {{ locating ? $t('common.locating') : $t('toilets.my_location') }}
            </button>
            <button
              type="button"
              class="btn-secondary absolute top-3 right-14 z-[1200] h-9 w-9 min-h-9 px-0 py-0 text-sm shadow-md"
              :aria-expanded="showMapHelp ? 'true' : 'false'"
              :aria-label="tSafe('toilets.help_button_aria', 'Map help')"
              @click="showMapHelp = !showMapHelp"
            >
              ?
            </button>
            <div
              v-if="showMapHelp"
              class="absolute top-14 right-3 z-[1200] w-[min(18rem,calc(100%-1.5rem))] rounded-lg border border-slate-200 bg-white/95 backdrop-blur-sm p-3 shadow-lg text-xs text-slate-700 space-y-2"
            >
              <p class="font-semibold text-brand">
                {{ tSafe('toilets.help_title', 'Map help') }}
              </p>
              <p>
                <strong>{{ tSafe('toilets.help_location_status_label', 'Location status') }}:</strong>
                {{ mapHelpLocationStatus }}
              </p>
              <p class="text-slate-600">
                {{ tSafe('toilets.help_controls', 'Drag with one finger to move the map. Pinch with two fingers to zoom. Tap a marker to select a toilet.') }}
              </p>
              <p class="text-slate-600">
                {{ tSafe('toilets.help_consistency', 'Navigate and Open in OSM require location. If disabled, tap My location first.') }}
              </p>
              <p class="text-slate-600">
                <strong>{{ tSafe('toilets.help_stuck_title', 'If the map feels stuck') }}:</strong>
                {{ tSafe('toilets.help_stuck_body', 'Try tapping My location, then zoom out and drag again. If it still does not respond, close the filter panel and reload the page.') }}
              </p>
            </div>
          </div>
        </ClientOnly>
        <p
          v-if="isMapMarkerLimited"
          class="text-xs text-gray-500 px-1"
        >
          {{ $t('toilets.mobile_marker_limit_note', { count: mapToilets.length }) }}
        </p>

        <div
          v-if="isMobile && showMapGestureHint"
          class="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900"
        >
          <p class="font-medium">
            {{ tSafe('toilets.map_hint_title', 'Map quick tip') }}
          </p>
          <p class="mt-0.5">
            {{ tSafe('toilets.map_hint_body', 'Drag the map to explore nearby toilets. The details card collapses while moving so navigation stays in focus.') }}
          </p>
          <div class="mt-2 flex gap-2">
            <button class="btn-secondary text-xs px-2.5 py-1.5 min-h-8" @click="dismissMapGestureHint">
              {{ tSafe('toilets.map_hint_close', 'Got it') }}
            </button>
            <button class="btn-secondary text-xs px-2.5 py-1.5 min-h-8" @click="focusMapOnUserLocation">
              {{ $t('toilets.my_location') }}
            </button>
          </div>
        </div>

        <div
          v-if="selectedToilet"
          class="card p-4"
          :class="isMobile
            ? `sticky bottom-[calc(env(safe-area-inset-bottom)+0.5rem)] z-[1080] shadow-lg overscroll-contain overflow-hidden transition-[max-height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${mobileToiletSheetExpanded ? 'max-h-[62svh]' : 'max-h-[18svh]'}`
            : ''"
        >
          <div
            v-if="isMobile"
            class="mb-2 flex justify-center"
            @touchstart.passive="onMobileSheetTouchStart"
            @touchend.passive="onMobileSheetTouchEnd"
          >
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600"
              @click="mobileToiletSheetExpanded = !mobileToiletSheetExpanded"
            >
              <span class="inline-block h-1.5 w-8 rounded-full bg-slate-400"></span>
              <span>{{ mobileToiletSheetExpanded ? $t('common.hide_full_steps') : $t('common.show_full_steps') }}</span>
            </button>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h2 class="text-lg font-semibold text-brand">
                {{ selectedToilet.name ?? $t('toilet.public') }}
              </h2>
              <p class="text-sm text-gray-500">
                {{ selectedToilet.address ?? selectedToilet.city }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button class="btn-primary text-sm min-h-11" :disabled="!canStartNavigation" @click="startNavigation(selectedToilet)">
                {{ routing ? $t('toilets.building_route') : $t('toilets.navigate') }}
              </button>
            </div>
          </div>

          <div v-if="!isMobile || mobileToiletSheetExpanded">
            <div class="flex flex-wrap gap-2 mb-3 text-xs">
              <span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{{ toiletTypeLabel(selectedToilet.type) }}</span>
              <span class="px-2 py-1 rounded-full" :class="selectedToilet.is_free ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                {{ selectedToilet.is_free ? $t('toilet.free') : $t('toilet.paid') }}
              </span>
              <span v-if="selectedToilet.is_accessible" class="px-2 py-1 rounded-full bg-blue-100 text-blue-700">{{ $t('toilet.accessible') }}</span>
              <span v-if="selectedToilet.avg_rating !== null" class="px-2 py-1 rounded-full bg-amber-100 text-amber-700">{{ $t('toilet.rating', { rating: selectedToilet.avg_rating }) }}</span>
              <span v-if="selectedToilet.distance_km !== undefined" class="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                {{ $t('toilets.distance_away', { distance: formatDistance(selectedToilet.distance_km) }) }}
              </span>
              <span
                v-if="selectedToilet.freshness_label"
                class="px-2 py-1 rounded-full"
                :class="freshnessClass(selectedToilet.freshness_label)"
              >
                {{ freshnessText(selectedToilet.freshness_label, selectedToilet.freshness_days) }}
              </span>
              <span class="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                {{ $t('toilet.recent_confirmations', selectedToilet.recent_confirmation_count, { count: selectedToilet.recent_confirmation_count }) }}
              </span>
              <span
                class="px-2 py-1 rounded-full"
                :class="confidenceClass(selectedToilet.source_confidence_level)"
              >
                {{ $t('toilet.source_reliability', { score: selectedToilet.source_confidence_score }) }}
              </span>
            </div>
            <p v-if="selectedToilet.opening_hours" class="text-xs text-gray-600 mb-3">
              <strong>{{ $t('toilet.opening_hours_label') }}</strong> {{ selectedToilet.opening_hours }}
            </p>
            <div class="flex flex-wrap gap-2 mt-3">
              <button v-if="routeInfo" class="btn-secondary text-sm min-h-11" @click="clearRoute">
                {{ $t('toilets.clear_route') }}
              </button>
              <a
                v-if="userLocation"
                class="btn-secondary text-sm min-h-11"
                :href="externalRouteUrl(selectedToilet)"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ $t('toilets.open_in_osm') }}
              </a>
              <button
                v-else
                type="button"
                class="btn-secondary text-sm min-h-11 opacity-60 cursor-not-allowed"
                :title="tSafe('toilets.navigation_help_location', 'Location is required. Use My location first.')"
                disabled
              >
                {{ $t('toilets.open_in_osm') }}
              </button>
              <div class="relative ml-auto">
                <button
                  type="button"
                  class="btn-secondary min-h-11 px-3"
                  :aria-label="tSafe('toilets.context_menu_aria', 'More actions')"
                  @click="mobileContextMenuOpen = !mobileContextMenuOpen"
                >
                  <span aria-hidden="true" class="text-lg leading-none">⋯</span>
                </button>
                <div
                  v-if="mobileContextMenuOpen"
                  class="absolute right-0 bottom-full mb-2 w-64 rounded-lg border border-gray-200 bg-white p-2 text-sm space-y-1.5 shadow-lg z-20"
                >
                  <NuxtLink :to="toiletDetailHref(selectedToilet.id)" class="block rounded-md px-2.5 py-2 hover:bg-slate-50" @click="mobileContextMenuOpen = false">
                    {{ $t('toilets.open_details') }}
                  </NuxtLink>
                  <button type="button" class="block w-full text-left rounded-md px-2.5 py-2 text-gray-400 bg-gray-50 cursor-not-allowed" disabled>
                    {{ $t('review.title') }} ({{ tSafe('toilets.not_available_yet', 'not available yet') }})
                  </button>
                  <button type="button" class="block w-full text-left rounded-md px-2.5 py-2 text-gray-400 bg-gray-50 cursor-not-allowed" disabled>
                    {{ $t('report.title') }} ({{ tSafe('toilets.not_available_yet', 'not available yet') }})
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p v-if="!userLocation && locationError" class="text-xs text-amber-700 mt-2">
            {{ tSafe('toilets.navigation_help_location', 'Location is required. Use My location first.') }}
          </p>
          <p v-if="routingError" class="text-sm text-red-600 mt-2">
            {{ routingError }}
          </p>
        </div>

        <div v-if="routeInfo" class="card p-4">
          <h3 class="font-semibold text-brand mb-2">
            {{ $t('toilets.route_summary') }}
          </h3>
          <p class="text-sm text-gray-600 mb-3">
            {{ routeInfo.distanceKm.toFixed(1) }} km, {{ $t('toilets.about_minutes', { minutes: Math.round(routeInfo.durationMin) }) }}
          </p>

          <div
            ref="nextManeuverCard"
            class="rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-4 mb-3"
          >
            <p class="text-xs uppercase tracking-wide text-brand-accent mb-1">
              {{ $t('toilets.next_maneuver') }}
            </p>
            <p class="text-base md:text-lg font-semibold text-brand leading-snug">
              {{ currentStep ?? $t('toilets.continue_straight') }}
            </p>
            <p class="text-xs text-gray-500 mt-2">
              {{ $t('toilets.step_of', { current: activeStepIndex + 1, total: routeInfo.steps.length }) }}
            </p>
          </div>

          <div class="flex gap-2 mb-3">
            <button
              class="btn-secondary text-sm min-h-11 flex-1"
              :disabled="activeStepIndex <= 0"
              @click="prevStep"
            >
              {{ $t('common.previous') }}
            </button>
            <button
              class="btn-primary text-sm min-h-11 flex-1"
              :disabled="activeStepIndex >= routeInfo.steps.length - 1"
              @click="nextStep"
            >
              {{ $t('common.next') }}
            </button>
          </div>

          <button class="btn-secondary text-sm min-h-11 w-full" @click="showAllSteps = !showAllSteps">
            {{ showAllSteps ? $t('common.hide_full_steps') : $t('common.show_full_steps') }}
          </button>

          <ol v-if="showAllSteps" class="list-decimal list-inside text-sm text-gray-700 space-y-1 mt-3">
            <li
              v-for="(step, index) in routeInfo.steps"
              :key="`${index}-${step}`"
              :class="index === activeStepIndex ? 'font-semibold text-brand' : ''"
            >
              {{ step }}
            </li>
          </ol>
        </div>

        <div v-if="!isMobile" class="card p-4">
          <div class="flex items-center justify-between gap-2 mb-2">
            <h3 class="font-semibold text-brand">
            {{ $t('toilets.list_fallback') }}
            </h3>
            <p class="text-xs text-gray-500">
              {{ $t('toilets.page_of', { current: mapListPage, total: mapListTotalPages }) }}
            </p>
          </div>
          <div class="space-y-2">
            <div
              v-for="toilet in paginatedMapList"
              :key="`map-list-${toilet.id}`"
              role="button"
              tabindex="0"
              class="w-full text-left rounded-lg border px-3 py-2 transition-colors"
              :class="selectedToilet?.id === toilet.id ? 'border-brand-accent bg-brand-accent/10' : 'border-gray-200 bg-white hover:bg-[var(--cube-base-card)]'"
              @click="focusToiletFromList(toilet)"
              @keydown.enter.prevent="focusToiletFromList(toilet)"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-sm font-semibold text-brand truncate">
                    {{ toilet.name ?? $t('toilet.public') }}
                  </p>
                  <p class="text-xs text-gray-500 truncate">
                    {{ toilet.address ?? toilet.city }}
                  </p>
                  <div class="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span class="rounded-full bg-gray-100 text-gray-700 px-2 py-0.5">{{ toiletTypeLabel(toilet.type) }}</span>
                    <span class="rounded-full px-2 py-0.5" :class="toilet.is_free ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                      {{ toilet.is_free ? $t('toilet.free') : $t('toilet.paid') }}
                    </span>
                    <span v-if="toilet.distance_km !== undefined" class="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5">
                      {{ formatDistance(toilet.distance_km) }}
                    </span>
                      <span v-if="toilet.avg_rating !== null" class="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">{{ $t('toilet.rating', { rating: toilet.avg_rating }) }}</span>
                  </div>
                </div>
                  <NuxtLink
                  :to="toiletDetailHref(toilet.id)"
                  class="btn-secondary text-xs px-2.5 py-1.5"
                  @click.stop
                >
                  {{ $t('common.details') }}
                </NuxtLink>
              </div>
            </div>
          </div>
          <div v-if="mapListTotalPages > 1" class="mt-3 flex gap-2">
            <button
              class="btn-secondary text-sm min-h-10 flex-1"
              :disabled="mapListPage <= 1"
              @click="mapListPage -= 1"
            >
              {{ $t('common.previous') }}
            </button>
            <button
              class="btn-primary text-sm min-h-10 flex-1"
              :disabled="mapListPage >= mapListTotalPages"
              @click="mapListPage += 1"
            >
              {{ $t('common.next') }}
            </button>
          </div>
        </div>

      </div>

      <div v-show="viewMode === 'list'" class="space-y-3">
        <ToiletCard
          v-for="toilet in toilets"
          :key="toilet.id"
          :toilet="toilet"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css'
import type { ToiletListItem, ToiletType } from '../../../shared/types/index'
import { toiletTypeIconHtml, toiletTypeLabelKey, toiletTypeMeta } from '../../utils/toilet-type'

interface ToiletsResponse {
  data: ToiletListItem[]
  meta: { total: number, hasData: boolean }
}

interface UserLocation {
  lat: number
  lng: number
}

interface ViewportWindow {
  south: number
  west: number
  north: number
  east: number
}

interface RouteInfo {
  distanceKm: number
  durationMin: number
  steps: string[]
}

interface OsrmStep {
  name?: string
  maneuver?: {
    type?: string
    modifier?: string
  }
}

interface OsrmRoute {
  distance: number
  duration: number
  geometry: {
    coordinates: [number, number][]
  }
  legs?: Array<{
    steps?: OsrmStep[]
  }>
}

interface OsrmResponse {
  routes?: OsrmRoute[]
}

type SortMode = 'nearest' | 'rating' | 'updated'
type ReportedFilter = 'any' | 'true' | 'false'
type FilterKey = 'city' | 'types' | 'is_free' | 'is_accessible' | 'has_opening_hours' | 'reported' | 'min_rating' | 'radius'
const MOBILE_MARKER_LIMIT = 110
const MOBILE_LOW_ZOOM_MARKER_LIMIT = 70
const MOBILE_MID_ZOOM_MARKER_LIMIT = 95
const MAP_LIST_PAGE_SIZE = 12
const FILTERS_STORAGE_KEY = 'toilets.filters.v1'
const MAP_HINT_STORAGE_KEY = 'toilets.map.hint.dismissed.v1'
const MOBILE_FILTER_DEBOUNCE_MS = 380
const MAP_VIEWPORT_PADDING_FACTOR = 0.28
const MARKER_REFRESH_DEBOUNCE_MS = 32
const OSRM_WALKING_PROFILE = 'walking'
const OSM_FOOT_ENGINE = 'fossgis_osrm_foot'
const ROUTE_CACHE_MAX_ENTRIES = 24

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const runtimeConfig = useRuntimeConfig()
const appBase = runtimeConfig.app.baseURL.endsWith('/')
  ? runtimeConfig.app.baseURL
  : `${runtimeConfig.app.baseURL}/`

const toiletTypes: ToiletType[] = ['public', 'library', 'university', 'civic', 'culture', 'transit', 'cafe', 'restaurant', 'shopping_mall', 'park', 'petrol_station', 'other']
const placeTypeLegend = computed(() => toiletTypes.map((type) => {
  const meta = toiletTypeMeta(type)
  return {
    type,
    ...meta,
    label: t(toiletTypeLabelKey(type)),
    iconHtml: toiletTypeIconHtml(type, 14),
  }
}))

function parseTypesFromQuery(value: unknown): ToiletType[] {
  if (!value) return []
  const raw = Array.isArray(value) ? value.join(',') : String(value)
  const types = raw.split(',').map(v => v.trim()).filter(Boolean)
  return types.filter((type): type is ToiletType => toiletTypes.includes(type as ToiletType))
}

function hasExplicitRouteFilters(): boolean {
  const keys = ['city', 'types', 'type', 'is_free', 'is_accessible', 'has_opening_hours', 'reported', 'min_rating', 'radius', 'sort']
  return keys.some(key => route.query[key] !== undefined)
}

function loadSavedFilters(): Partial<{
  city: string
  types: ToiletType[]
  is_free: boolean
  is_accessible: boolean
  has_opening_hours: boolean
  reported: ReportedFilter
  min_rating: number
  radius: number
  sort: SortMode
}> | null {
  if (!import.meta.client) return null
  try {
    const raw = localStorage.getItem(FILTERS_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const types = Array.isArray(parsed.types)
      ? parsed.types.filter((type): type is ToiletType => toiletTypes.includes(type as ToiletType))
      : []

    return {
      city: typeof parsed.city === 'string' ? parsed.city : '',
      types,
      is_free: parsed.is_free === true,
      is_accessible: parsed.is_accessible === true,
      has_opening_hours: parsed.has_opening_hours === true,
      reported: ['any', 'true', 'false'].includes(String(parsed.reported)) ? parsed.reported as ReportedFilter : 'any',
      min_rating: Number(parsed.min_rating ?? 0) || 0,
      radius: Number(parsed.radius ?? 0) || 0,
      sort: ['nearest', 'rating', 'updated'].includes(String(parsed.sort)) ? parsed.sort as SortMode : 'updated',
    }
  }
  catch {
    return null
  }
}

const routeTypes = parseTypesFromQuery(route.query.types ?? route.query.type)
const savedFilters = loadSavedFilters()
const initialFilters = hasExplicitRouteFilters() || !savedFilters
  ? {
      city: String(route.query.city ?? ''),
      types: routeTypes,
      is_free: route.query.is_free === 'true',
      is_accessible: route.query.is_accessible === 'true',
      has_opening_hours: route.query.has_opening_hours === 'true',
      reported: ((route.query.reported as ReportedFilter) ?? 'any'),
      min_rating: Number(route.query.min_rating ?? 0),
      radius: Number(route.query.radius ?? 0),
      sort: ((route.query.sort as SortMode) ?? 'updated'),
    }
  : {
      city: savedFilters.city ?? '',
      types: savedFilters.types ?? [],
      is_free: savedFilters.is_free ?? false,
      is_accessible: savedFilters.is_accessible ?? false,
      has_opening_hours: savedFilters.has_opening_hours ?? false,
      reported: savedFilters.reported ?? 'any',
      min_rating: savedFilters.min_rating ?? 0,
      radius: savedFilters.radius ?? 0,
      sort: savedFilters.sort ?? 'updated',
    }

const filters = ref(initialFilters)

const userLocation = ref<UserLocation | null>(null)

const queryParams = computed(() => {
  const p: Record<string, string> = {}

  if (filters.value.city) p.city = filters.value.city
  if (filters.value.is_free) p.is_free = 'true'
  if (filters.value.is_accessible) p.is_accessible = 'true'
  if (filters.value.has_opening_hours) p.has_opening_hours = 'true'
  if (filters.value.reported !== 'any') p.reported = filters.value.reported
  if (filters.value.min_rating > 0) p.min_rating = String(filters.value.min_rating)
  if (filters.value.radius > 0) p.radius = String(filters.value.radius)
  p.sort = filters.value.sort

  if (userLocation.value) {
    p.lat = String(userLocation.value.lat)
    p.lng = String(userLocation.value.lng)
  }

  return p
})

const useStaticApiMode = computed(() => runtimeConfig.app.baseURL !== '/')
const requestQuery = computed<Record<string, string> | undefined>(() => (
  useStaticApiMode.value ? undefined : queryParams.value
))
const toiletsApiPath = computed(() => (
  useStaticApiMode.value ? `${appBase}api/toilets/index` : '/api/toilets'
))

const { data, pending, error, refresh } = await useFetch<ToiletsResponse>(toiletsApiPath, {
  query: requestQuery,
  server: !useStaticApiMode.value,
  immediate: !useStaticApiMode.value,
  watch: false,
  transform: (input: ToiletsResponse | string) => {
    if (typeof input === 'string') {
      return JSON.parse(input) as ToiletsResponse
    }
    return input
  },
})

const staticData = ref<ToiletsResponse | null>(null)
const staticPending = ref(useStaticApiMode.value)
const staticError = ref<Error | null>(null)

async function loadStaticToilets() {
  if (!useStaticApiMode.value) return

  staticPending.value = true
  staticError.value = null

  try {
    const response = await fetch(toiletsApiPath.value, {
      cache: 'no-store',
      headers: {
        accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to load toilets (${response.status})`)
    }

    const contentType = response.headers.get('content-type') ?? ''
    const payload = contentType.includes('application/json')
      ? await response.json() as ToiletsResponse
      : JSON.parse(await response.text()) as ToiletsResponse

    staticData.value = payload
  }
  catch (err) {
    staticError.value = err instanceof Error ? err : new Error('Failed to load toilets')
  }
  finally {
    staticPending.value = false
  }
}

onMounted(async () => {
  if (useStaticApiMode.value) {
    await loadStaticToilets()
  }
})

const activePending = computed(() => useStaticApiMode.value ? staticPending.value : pending.value)
const activeError = computed(() => useStaticApiMode.value ? staticError.value : error.value)
const apiToilets = computed(() => (
  useStaticApiMode.value
    ? staticData.value?.data ?? []
    : data.value?.data ?? []
))
const hasImportedData = computed(() => apiToilets.value.length > 0)
const hasLoadedOnce = ref(false)

function withAppliedFilters(source: ToiletListItem[], ignore: FilterKey[] = []): ToiletListItem[] {
  let list = [...source]

  if (!ignore.includes('city') && filters.value.city) {
    const city = filters.value.city.toLowerCase()
    list = list.filter(t => t.city.toLowerCase() === city)
  }
  if (!ignore.includes('types') && filters.value.types.length > 0) {
    list = list.filter(t => filters.value.types.includes(t.type))
  }
  if (!ignore.includes('is_free') && filters.value.is_free) {
    list = list.filter(t => t.is_free)
  }
  if (!ignore.includes('is_accessible') && filters.value.is_accessible) {
    list = list.filter(t => t.is_accessible)
  }
  if (!ignore.includes('has_opening_hours') && filters.value.has_opening_hours) {
    list = list.filter(t => Boolean(t.opening_hours))
  }
  if (!ignore.includes('reported') && filters.value.reported !== 'any') {
    const wantReported = filters.value.reported === 'true'
    list = list.filter(t => t.has_reports === wantReported)
  }
  if (!ignore.includes('min_rating') && filters.value.min_rating > 0) {
    list = list.filter(t => (t.avg_rating ?? 0) >= filters.value.min_rating)
  }
  if (!ignore.includes('radius') && filters.value.radius > 0 && userLocation.value) {
    list = list.filter(t => (t.distance_km ?? Number.POSITIVE_INFINITY) <= filters.value.radius)
  }

  return list
}

const availableCities = computed(() => {
  const cities = withAppliedFilters(apiToilets.value, ['city'])
    .map(t => t.city)
    .filter(Boolean)
  return [...new Set(cities)].sort((a, b) => a.localeCompare(b))
})

const availableTypes = computed(() => new Set(withAppliedFilters(apiToilets.value, ['types']).map(t => t.type)))
const canFilterReportedTrue = computed(() => withAppliedFilters(apiToilets.value, ['reported']).some(t => t.has_reports))
const canFilterReportedFalse = computed(() => withAppliedFilters(apiToilets.value, ['reported']).some(t => !t.has_reports))
const canFilterFree = computed(() => withAppliedFilters(apiToilets.value, ['is_free']).some(t => t.is_free))
const canFilterAccessible = computed(() => withAppliedFilters(apiToilets.value, ['is_accessible']).some(t => t.is_accessible))
const canFilterOpeningHours = computed(() => withAppliedFilters(apiToilets.value, ['has_opening_hours']).some(t => Boolean(t.opening_hours)))

function isTypeDisabled(type: ToiletType): boolean {
  return !availableTypes.value.has(type) && !filters.value.types.includes(type)
}

function toggleTypeFilter(type: ToiletType) {
  if (isTypeDisabled(type)) return
  if (filters.value.types.includes(type)) {
    filters.value.types = filters.value.types.filter(t => t !== type)
    return
  }
  filters.value.types = [...filters.value.types, type]
}

function canFilterMinRating(threshold: number): boolean {
  if (filters.value.min_rating === threshold) return true
  return withAppliedFilters(apiToilets.value, ['min_rating']).some(t => (t.avg_rating ?? 0) >= threshold)
}

const toilets = computed(() => {
  if (!useStaticApiMode.value) {
    if (!filters.value.types.length) return apiToilets.value
    return apiToilets.value.filter(t => filters.value.types.includes(t.type))
  }

  let list = apiToilets.value.map((toilet) => {
    const distance = userLocation.value
      ? haversineKm(userLocation.value.lat, userLocation.value.lng, toilet.lat, toilet.lng)
      : undefined

    return {
      ...toilet,
      distance_km: distance !== undefined ? Number(distance.toFixed(2)) : toilet.distance_km,
    }
  })

  if (filters.value.city) {
    const city = filters.value.city.toLowerCase()
    list = list.filter(t => t.city.toLowerCase() === city)
  }
  if (filters.value.types.length > 0) {
    list = list.filter(t => filters.value.types.includes(t.type))
  }
  if (filters.value.is_free) {
    list = list.filter(t => t.is_free)
  }
  if (filters.value.is_accessible) {
    list = list.filter(t => t.is_accessible)
  }
  if (filters.value.reported !== 'any') {
    const wantReported = filters.value.reported === 'true'
    list = list.filter(t => t.has_reports === wantReported)
  }
  if (filters.value.min_rating > 0) {
    list = list.filter(t => (t.avg_rating ?? 0) >= filters.value.min_rating)
  }
  if (filters.value.radius > 0 && userLocation.value) {
    list = list.filter(t => (t.distance_km ?? Number.POSITIVE_INFINITY) <= filters.value.radius)
  }

  if (filters.value.sort === 'nearest' && userLocation.value) {
    list = list.sort((a, b) => (a.distance_km ?? Number.POSITIVE_INFINITY) - (b.distance_km ?? Number.POSITIVE_INFINITY))
  }
  else if (filters.value.sort === 'rating') {
    list = list.sort((a, b) => (b.avg_rating ?? -1) - (a.avg_rating ?? -1))
  }
  else {
    list = list.sort((a, b) => Date.parse(b.last_updated_at) - Date.parse(a.last_updated_at))
  }

  return list
})

const mapListPage = ref(1)

const mapListTotalPages = computed(() => (
  Math.max(1, Math.ceil(toilets.value.length / MAP_LIST_PAGE_SIZE))
))

const paginatedMapList = computed(() => {
  const start = (mapListPage.value - 1) * MAP_LIST_PAGE_SIZE
  return toilets.value.slice(start, start + MAP_LIST_PAGE_SIZE)
})

function effectiveMobileMarkerLimit(): number {
  if (mapZoom.value <= 12) return MOBILE_LOW_ZOOM_MARKER_LIMIT
  if (mapZoom.value <= 14) return MOBILE_MID_ZOOM_MARKER_LIMIT
  return MOBILE_MARKER_LIMIT
}

const mapToilets = computed(() => {
  let base = toilets.value

  if (mapViewportWindow.value) {
    const { south, west, north, east } = mapViewportWindow.value
    base = base.filter(toilet => (
      toilet.lat >= south
      && toilet.lat <= north
      && toilet.lng >= west
      && toilet.lng <= east
    ))
  }

  if (!isMobile.value) {
    return base
  }

  const markerLimit = effectiveMobileMarkerLimit()
  if (base.length <= markerLimit) return base

  let limited = userLocation.value
    ? [...base]
      .sort((a, b) => (a.distance_km ?? Number.POSITIVE_INFINITY) - (b.distance_km ?? Number.POSITIVE_INFINITY))
      .slice(0, markerLimit)
    : base.filter((_, index) => index % Math.ceil(base.length / markerLimit) === 0).slice(0, markerLimit)

  if (
    selectedToilet.value
    && !limited.some(t => t.id === selectedToilet.value?.id)
  ) {
    limited = [selectedToilet.value, ...limited.slice(0, markerLimit - 1)]
  }

  return limited
})

const isMapMarkerLimited = computed(() => (
  isMobile.value && toilets.value.length > mapToilets.value.length
))

watch(
  [availableCities, availableTypes, canFilterReportedTrue, canFilterReportedFalse, canFilterFree, canFilterAccessible, canFilterOpeningHours],
  () => {
    if (filters.value.city && !availableCities.value.includes(filters.value.city)) {
      filters.value.city = ''
    }
    const validTypes = filters.value.types.filter(type => !isTypeDisabled(type))
    if (validTypes.length !== filters.value.types.length) {
      filters.value.types = validTypes
    }
    if (filters.value.reported === 'true' && !canFilterReportedTrue.value) {
      filters.value.reported = 'any'
    }
    if (filters.value.reported === 'false' && !canFilterReportedFalse.value) {
      filters.value.reported = 'any'
    }
    if (filters.value.is_free && !canFilterFree.value) {
      filters.value.is_free = false
    }
    if (filters.value.is_accessible && !canFilterAccessible.value) {
      filters.value.is_accessible = false
    }
    if (filters.value.has_opening_hours && !canFilterOpeningHours.value) {
      filters.value.has_opening_hours = false
    }
    if (filters.value.min_rating > 0 && !canFilterMinRating(filters.value.min_rating)) {
      filters.value.min_rating = 0
    }
  },
)

const viewMode = ref<'map' | 'list'>('map')
const isMobile = ref(false)
const showFilters = ref(false)
const showMapLegend = ref(false)
const showMapGestureHint = ref(false)
const showMapHelp = ref(false)
const mapZoom = ref(12)
const mapViewportWindow = ref<ViewportWindow | null>(null)
const mobileToiletSheetExpanded = ref(false)
const mobileSheetTouchStartY = ref<number | null>(null)
const mobileContextMenuOpen = ref(false)

const locating = ref(false)
const locationError = ref('')

const selectedToilet = ref<ToiletListItem | null>(null)
const routeInfo = ref<RouteInfo | null>(null)
const activeStepIndex = ref(0)
const showAllSteps = ref(false)
const routing = ref(false)
const routingError = ref('')
const currentStep = computed(() => routeInfo.value?.steps[activeStepIndex.value] ?? null)

let leaflet: typeof import('leaflet') | null = null
let map: import('leaflet').Map | null = null
let tileLayer: import('leaflet').TileLayer | null = null
let toiletsLayer: import('leaflet').LayerGroup | null = null
let userMarker: import('leaflet').Marker | null = null
let routeLayer: import('leaflet').Polyline | null = null
let userAccuracyCircle: import('leaflet').Circle | null = null
const navigationTargetToiletId = ref<string | null>(null)
let hasAutoFitted = false
let userPositionWatchId: number | null = null
let markerByToiletId = new Map<string, import('leaflet').Marker>()
let markerRenderSignatureById = new Map<string, string>()
let selectedMarkerId: string | null = null
let navigationTargetMarkerId: string | null = null
const routeCache = new Map<string, OsrmRoute>()

const mapContainer = ref<HTMLElement | null>(null)
const nextManeuverCard = ref<HTMLElement | null>(null)
let mediaQuery: MediaQueryList | null = null
let mobileFilterApplyTimeout: ReturnType<typeof setTimeout> | null = null
let geoRefreshTimeout: ReturnType<typeof setTimeout> | null = null
let markerRefreshTimeout: ReturnType<typeof setTimeout> | null = null

const dataStatusText = computed(() => {
  if (activePending.value) {
    return tSafe('toilets.status_loading_data', 'Loading map data')
  }
  if (activeError.value) {
    return tSafe('toilets.status_data_error', 'Map data unavailable')
  }
  return `${toilets.value.length} ${t('common.results')}`
})

const locationStatusText = computed(() => {
  if (locating.value) return t('common.locating')
  if (locationError.value) return tSafe('toilets.status_location_error', 'Location unavailable')
  if (userLocation.value) return tSafe('toilets.status_location_ready', 'Location active')
  return tSafe('toilets.status_location_idle', 'Location off')
})

const locationStatusClass = computed(() => {
  if (locating.value) return 'bg-amber-100 text-amber-700'
  if (locationError.value) return 'bg-rose-100 text-rose-700'
  if (userLocation.value) return 'bg-emerald-100 text-emerald-700'
  return 'bg-gray-100 text-gray-700'
})

const canStartNavigation = computed(() => {
  if (routing.value || locating.value) return false
  if (!userLocation.value && Boolean(locationError.value)) return false
  return true
})

const routeStatusText = computed(() => {
  if (routing.value) return t('toilets.building_route')
  if (routingError.value) return tSafe('toilets.status_route_error', 'Route unavailable')
  if (routeInfo.value) return tSafe('toilets.status_route_ready', 'Route ready')
  return tSafe('toilets.status_route_idle', 'Route idle')
})

const routeStatusClass = computed(() => {
  if (routing.value) return 'bg-amber-100 text-amber-700'
  if (routingError.value) return 'bg-rose-100 text-rose-700'
  if (routeInfo.value) return 'bg-teal-100 text-teal-700'
  return 'bg-gray-100 text-gray-700'
})

const mapHelpLocationStatus = computed(() => {
  if (locating.value) return tSafe('toilets.help_location_searching', 'Searching location...')
  if (userLocation.value) return tSafe('toilets.help_location_active', 'Current location found')
  if (locationError.value) return tSafe('toilets.help_location_error', 'Current location not found')
  return tSafe('toilets.help_location_missing', 'Location not active yet')
})

const mapCoverageStatusText = computed(() => {
  if (viewMode.value !== 'map') return ''
  if (mapToilets.value.length >= toilets.value.length) return ''
  return tSafe('toilets.status_map_density', `Showing ${mapToilets.value.length}/${toilets.value.length} markers`)
})

function isMapHintDismissed(): boolean {
  if (!import.meta.client) return true
  return localStorage.getItem(MAP_HINT_STORAGE_KEY) === '1'
}

function dismissMapGestureHint() {
  showMapGestureHint.value = false
  if (!import.meta.client) return
  localStorage.setItem(MAP_HINT_STORAGE_KEY, '1')
}

function handleDataStatusAction() {
  if (activeError.value) {
    if (useStaticApiMode.value) {
      loadStaticToilets()
      return
    }
    refresh()
    return
  }

  if (viewMode.value === 'map') {
    viewMode.value = 'list'
    return
  }

  viewMode.value = 'map'
}

function handleCoverageStatusAction() {
  if (!map || viewMode.value !== 'map') return
  map.setZoom(Math.min(18, map.getZoom() + 1))
}

function handleLocationStatusAction() {
  if (userLocation.value) {
    focusMapOnUserLocation()
    return
  }
  void locateUser()
}

function handleRouteStatusAction() {
  if (routingError.value) {
    clearRoute()
    return
  }

  if (!routeInfo.value) return

  showAllSteps.value = true
  focusNextManeuverCard()
}

watch(toilets, (next) => {
  if (!next.length) {
    selectedToilet.value = null
    navigationTargetToiletId.value = null
    mapListPage.value = 1
    return
  }

  if (!selectedToilet.value || !next.some(t => t.id === selectedToilet.value?.id)) {
    selectedToilet.value = next[0]
  }
  if (navigationTargetToiletId.value && !next.some(t => t.id === navigationTargetToiletId.value)) {
    navigationTargetToiletId.value = null
  }

  scheduleMapMarkerRefresh()
})

watch([toilets, mapListTotalPages], () => {
  if (mapListPage.value > mapListTotalPages.value) {
    mapListPage.value = mapListTotalPages.value
  }
})

watch(activePending, (isPending) => {
  if (!isPending) {
    hasLoadedOnce.value = true
  }
}, { immediate: true })

watch(selectedToilet, () => {
  if (isMobile.value) {
    mobileToiletSheetExpanded.value = false
  }
  mobileContextMenuOpen.value = false
  scheduleMapMarkerRefresh()
})

watch(navigationTargetToiletId, () => {
  scheduleMapMarkerRefresh()
})

watch(mapToilets, () => {
  scheduleMapMarkerRefresh()
})

watch(viewMode, (mode) => {
  if (mode !== 'map') {
    showMapGestureHint.value = false
    showMapHelp.value = false
    return
  }

  if (isMobile.value && !isMapHintDismissed()) {
    showMapGestureHint.value = true
  }
})

watch(filters, () => {
  if (!isMobile.value || !showFilters.value) return

  if (mobileFilterApplyTimeout) {
    clearTimeout(mobileFilterApplyTimeout)
  }

  mobileFilterApplyTimeout = setTimeout(() => {
    applyFilters({ closeOnMobile: false })
  }, MOBILE_FILTER_DEBOUNCE_MS)
}, { deep: true })

watch(filters, (next) => {
  if (!import.meta.client) return
  localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify({
    city: next.city,
    types: next.types,
    is_free: next.is_free,
    is_accessible: next.is_accessible,
    has_opening_hours: next.has_opening_hours,
    reported: next.reported,
    min_rating: next.min_rating,
    radius: next.radius,
    sort: next.sort,
  }))
}, { deep: true })

onMounted(async () => {
  setupMobileMode()
})

onBeforeUnmount(() => {
  if (mediaQuery) {
    mediaQuery.removeEventListener('change', updateMobileMode)
    mediaQuery = null
  }

  if (map) {
    map.remove()
    map = null
    mapViewportWindow.value = null
  }
  markerByToiletId.clear()
  markerRenderSignatureById.clear()

  stopUserPositionWatch()

  if (mobileFilterApplyTimeout) {
    clearTimeout(mobileFilterApplyTimeout)
    mobileFilterApplyTimeout = null
  }
  if (geoRefreshTimeout) {
    clearTimeout(geoRefreshTimeout)
    geoRefreshTimeout = null
  }
  if (markerRefreshTimeout) {
    clearTimeout(markerRefreshTimeout)
    markerRefreshTimeout = null
  }
})

watch(
  [activePending, mapContainer, viewMode],
  async ([isPending, container, mode]) => {
    if (isPending || !container || mode !== 'map') return

    if (map && map.getContainer() !== container) {
      if (markerRefreshTimeout) {
        clearTimeout(markerRefreshTimeout)
        markerRefreshTimeout = null
      }
      map.remove()
      map = null
      mapViewportWindow.value = null
      tileLayer = null
      toiletsLayer = null
      userMarker = null
      routeLayer = null
      hasAutoFitted = false
      navigationTargetMarkerId = null
      markerByToiletId.clear()
      markerRenderSignatureById.clear()
    }

    await nextTick()
    await initMap()
    scheduleMapMarkerRefresh()
    renderUserLocationMarker()
    if (userLocation.value) {
      focusMapOnUserLocation()
    }

    if (map) {
      map.invalidateSize()
      updateMapViewportWindow()
    }
  },
  { immediate: true },
)

function setupMobileMode() {
  if (!import.meta.client) return

  mediaQuery = window.matchMedia('(max-width: 767px)')
  updateMobileMode()
  mediaQuery.addEventListener('change', updateMobileMode)
}

function updateMobileMode() {
  if (!mediaQuery) return

  isMobile.value = mediaQuery.matches
  if (!isMobile.value) {
    showFilters.value = true
    showMapLegend.value = true
    showMapGestureHint.value = false
    mobileToiletSheetExpanded.value = true
    showMapHelp.value = false
  }
  else {
    viewMode.value = 'map'
    showMapLegend.value = false
    if (viewMode.value === 'map' && !isMapHintDismissed()) {
      showMapGestureHint.value = true
    }
    mobileToiletSheetExpanded.value = false
    mobileContextMenuOpen.value = false
    showMapHelp.value = false
  }
}

async function initMap() {
  if (!import.meta.client || !mapContainer.value || map) return

  leaflet = await import('leaflet')

  map = leaflet.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false,
    preferCanvas: true,
    zoomAnimation: !isMobile.value,
    markerZoomAnimation: false,
    fadeAnimation: false,
    zoomAnimationThreshold: 8,
    inertia: !isMobile.value,
    tapTolerance: 20,
  }).setView([51.34, 12.37], 12)
  mapZoom.value = map.getZoom()

  tileLayer = leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
    updateWhenIdle: true,
    updateWhenZooming: false,
    keepBuffer: 8,
  })

  tileLayer.addTo(map)
  toiletsLayer = leaflet.layerGroup().addTo(map)
  leaflet.control.zoom({ position: 'topright' }).addTo(map)
  leaflet.control.attribution({
    position: 'topleft',
    prefix: false,
  }).addTo(map)

  map.on('zoomend', () => {
    if (!map) return
    mapZoom.value = map.getZoom()
    updateMapViewportWindow()
  })

  map.on('moveend', () => {
    updateMapViewportWindow()
  })

  map.on('movestart', () => {
    if (!isMobile.value) return

    if (mobileToiletSheetExpanded.value) {
      mobileToiletSheetExpanded.value = false
    }
    if (mobileContextMenuOpen.value) {
      mobileContextMenuOpen.value = false
    }
    if (showMapHelp.value) {
      showMapHelp.value = false
    }
    if (showMapGestureHint.value) {
      dismissMapGestureHint()
    }
  })

  updateMapViewportWindow()
}

function refreshMapMarkers() {
  if (!map || !leaflet || !toiletsLayer) return

  const nextById = new Map(mapToilets.value.map(toilet => [toilet.id, toilet]))
  const navigationFocusActive = Boolean(navigationTargetToiletId.value)

  for (const [toiletId, marker] of markerByToiletId.entries()) {
    if (nextById.has(toiletId)) continue
    toiletsLayer.removeLayer(marker)
    markerByToiletId.delete(toiletId)
    markerRenderSignatureById.delete(toiletId)
    if (selectedMarkerId === toiletId) {
      selectedMarkerId = null
    }
  }

  for (const toilet of mapToilets.value) {
    const shouldBeSelected = selectedToilet.value?.id === toilet.id
    const isNavigationTarget = navigationTargetToiletId.value === toilet.id
    const shouldBeSubdued = navigationFocusActive && !isNavigationTarget
    const marker = markerByToiletId.get(toilet.id)

    if (!marker) {
      const created = createToiletMarker(toilet, shouldBeSelected, isNavigationTarget, shouldBeSubdued)
      created.setOpacity(shouldBeSubdued ? 0.38 : 1)
      markerByToiletId.set(toilet.id, created)
      markerRenderSignatureById.set(toilet.id, markerRenderSignature(toilet, shouldBeSelected, isNavigationTarget, shouldBeSubdued))
      toiletsLayer.addLayer(created)
      continue
    }

    const nextSignature = markerRenderSignature(toilet, shouldBeSelected, isNavigationTarget, shouldBeSubdued)
    const prevSignature = markerRenderSignatureById.get(toilet.id)
    if (nextSignature !== prevSignature) {
      marker.setPopupContent(buildMarkerPopup(toilet))
      const currentPosition = marker.getLatLng()
      if (Math.abs(currentPosition.lat - toilet.lat) > 0.000001 || Math.abs(currentPosition.lng - toilet.lng) > 0.000001) {
        marker.setLatLng([toilet.lat, toilet.lng])
      }
      marker.options.title = `${describeUserMarker(toilet)}: ${toilet.name ?? t('toilet.public')}`

      if (!isMobile.value) {
        marker.bindTooltip(toilet.name ?? t('toilet.public'))
      }
      else {
        marker.unbindTooltip()
      }
      markerRenderSignatureById.set(toilet.id, nextSignature)
    }

    const wasSelected = selectedMarkerId === toilet.id
    const wasNavigationTarget = navigationTargetMarkerId === toilet.id
    const wasSubdued = (marker.options.opacity ?? 1) < 0.99
    if (wasSelected !== shouldBeSelected || wasNavigationTarget !== isNavigationTarget || wasSubdued !== shouldBeSubdued) {
      marker.setIcon(createToiletMarkerIcon(toilet, shouldBeSelected, isNavigationTarget, shouldBeSubdued))
    }
    marker.setOpacity(shouldBeSubdued ? 0.38 : 1)
  }

  selectedMarkerId = selectedToilet.value?.id ?? null
  navigationTargetMarkerId = navigationTargetToiletId.value

  if (!hasAutoFitted && mapToilets.value.length > 0) {
    const bounds = leaflet.latLngBounds(mapToilets.value.map(t => [t.lat, t.lng] as [number, number]))
    map.fitBounds(bounds.pad(0.15))
    hasAutoFitted = true
  }

}

function scheduleMapMarkerRefresh() {
  if (!import.meta.client) {
    refreshMapMarkers()
    return
  }
  if (markerRefreshTimeout) return
  markerRefreshTimeout = setTimeout(() => {
    markerRefreshTimeout = null
    refreshMapMarkers()
  }, MARKER_REFRESH_DEBOUNCE_MS)
}

function createToiletMarker(
  toilet: ToiletListItem,
  selected: boolean,
  navigationTarget: boolean,
  subdued: boolean,
): import('leaflet').Marker {
  const marker = leaflet!.marker([toilet.lat, toilet.lng], {
    icon: createToiletMarkerIcon(toilet, selected, navigationTarget, subdued),
    riseOnHover: true,
    riseOffset: navigationTarget ? 350 : 250,
    keyboard: false,
    title: `${describeUserMarker(toilet)}: ${toilet.name ?? t('toilet.public')}`,
  })

  marker.bindPopup(buildMarkerPopup(toilet), {
    closeButton: true,
    autoPanPadding: [24, 24],
    className: 'toilet-marker-popup',
    maxWidth: 260,
  })

  marker.on('click', () => {
    if (navigationTargetToiletId.value === toilet.id) {
      clearRoute()
      map?.closePopup()
      return
    }

    const selectedItem = mapToilets.value.find(item => item.id === toilet.id)
    selectedToilet.value = selectedItem ?? toilet
    if (map) {
      const targetZoom = Math.max(map.getZoom(), 16)
      if (isMobile.value) {
        map.setView([toilet.lat, toilet.lng], targetZoom, { animate: false })
      }
      else {
        map.flyTo([toilet.lat, toilet.lng], targetZoom, { animate: true, duration: 0.35 })
      }
    }
    marker.openPopup()
  })

  if (!isMobile.value) {
    marker.bindTooltip(toilet.name ?? t('toilet.public'))
  }

  return marker
}

function createToiletMarkerIcon(
  toilet: ToiletListItem,
  selected: boolean,
  navigationTarget: boolean,
  subdued: boolean,
): import('leaflet').DivIcon {
  const { iconHtml, background, foreground } = markerStyleForToilet(toilet, selected, navigationTarget, subdued)
  const size = navigationTarget ? 38 : selected ? 34 : 30
  const borderColor = navigationTarget ? '#0f766e' : 'rgba(255,255,255,0.95)'
  const borderWidth = navigationTarget ? 3 : 2
  const boxShadow = isMobile.value
    ? (navigationTarget ? '0 0 0 2px rgba(15, 118, 110, 0.22)' : 'none')
    : (navigationTarget
        ? '0 0 0 4px rgba(15, 118, 110, 0.22), 0 12px 24px rgba(15, 23, 42, 0.3)'
        : '0 10px 22px rgba(15, 23, 42, 0.26)')
  const filter = subdued ? (isMobile.value ? 'grayscale(1)' : 'grayscale(1) saturate(0.15)') : 'none'
  return leaflet!.divIcon({
    className: 'toilet-map-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        border-radius:999px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:${selected ? 13 : 12}px;
        font-weight:700;
        line-height:1;
        color:${foreground};
        background:${background};
        border:${borderWidth}px solid ${borderColor};
        box-shadow:${boxShadow};
        transform:${isMobile.value ? 'none' : 'translateY(-2px)'};
        filter:${filter};
      ">${iconHtml}</div>
    `,
  })
}

function markerStyleForToilet(
  toilet: ToiletListItem,
  selected: boolean,
  navigationTarget: boolean,
  subdued: boolean,
): { iconHtml: string, background: string, foreground: string } {
  const meta = toiletTypeMeta(toilet.type)
  if (subdued) {
    return { iconHtml: toiletTypeIconHtml(toilet.type, 15), background: '#d1d5db', foreground: '#475569' }
  }
  const shade = selected || navigationTarget ? 0.86 : 1
  return selected || navigationTarget
    ? { iconHtml: toiletTypeIconHtml(toilet.type, 15), background: meta.background, foreground: meta.foreground }
    : { iconHtml: toiletTypeIconHtml(toilet.type, 15), background: tintColor(meta.background, shade), foreground: meta.foreground }
}

function markerRenderSignature(
  toilet: ToiletListItem,
  selected: boolean,
  navigationTarget: boolean,
  subdued: boolean,
): string {
  return [
    toilet.id,
    toilet.lat.toFixed(6),
    toilet.lng.toFixed(6),
    toilet.name ?? '',
    toilet.address ?? '',
    toilet.city,
    toilet.type,
    selected ? '1' : '0',
    navigationTarget ? '1' : '0',
    subdued ? '1' : '0',
  ].join('|')
}

function describeUserMarker(toilet: ToiletListItem): string {
  return toiletTypeLabel(toilet.type)
}

function toiletTypeLabel(type: ToiletType): string {
  return t(toiletTypeLabelKey(type))
}

function buildMarkerPopup(toilet: ToiletListItem): string {
  const typeLabel = escapeHtml(toiletTypeLabel(toilet.type))
  const name = escapeHtml(toilet.name ?? t('toilet.public'))
  const address = escapeHtml(toilet.address ?? toilet.city)
  const detailHref = `/toilets/${encodeURIComponent(toilet.id)}/`
  const openDetailsLabel = escapeHtml(t('toilets.open_details'))
  const reviewLabel = escapeHtml(t('review.title'))
  const reportLabel = escapeHtml(t('report.title'))
  const contextMenuAria = escapeHtml(tSafe('toilets.context_menu_aria', 'More actions'))
  const notAvailableYet = escapeHtml(tSafe('toilets.not_available_yet', 'not available yet'))

  return `
    <div class="relative space-y-2 text-sm text-slate-700 min-w-[220px] pb-7">
      <details class="absolute bottom-0 right-0 toilet-popup-menu">
        <summary aria-label="${contextMenuAria}" class="inline-flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 cursor-pointer list-none">
          <span aria-hidden="true" class="text-base leading-none">⋯</span>
        </summary>
        <div class="absolute right-0 bottom-full mb-1 w-52 rounded-md border border-slate-200 bg-white p-1.5 text-xs space-y-1 shadow-lg">
          <a href="${detailHref}" class="block rounded px-2 py-1.5 hover:bg-slate-50">${openDetailsLabel}</a>
          <button type="button" disabled class="block w-full text-left rounded px-2 py-1.5 bg-slate-50 text-slate-400 cursor-not-allowed">${reviewLabel} (${notAvailableYet})</button>
          <button type="button" disabled class="block w-full text-left rounded px-2 py-1.5 bg-slate-50 text-slate-400 cursor-not-allowed">${reportLabel} (${notAvailableYet})</button>
        </div>
      </details>
      <div class="flex items-start gap-2">
        <div class="shrink-0 mt-0.5 text-[var(--brand-accent)]">${toiletTypeIconHtml(toilet.type, 16)}</div>
        <div class="min-w-0">
          <div class="font-semibold text-brand leading-tight">${name}</div>
          <div class="text-xs text-slate-500">${typeLabel}</div>
        </div>
      </div>
      <div class="text-xs text-slate-500">${address}</div>
    </div>
  `
}

function tSafe(key: string, fallback: string): string {
  const translated = t(key)
  return translated === key ? fallback : translated
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function tintColor(hex: string, blend: number): string {
  const clean = hex.replace('#', '')
  if (clean.length !== 6) return hex
  const r = Number.parseInt(clean.slice(0, 2), 16)
  const g = Number.parseInt(clean.slice(2, 4), 16)
  const b = Number.parseInt(clean.slice(4, 6), 16)
  const mix = (value: number) => Math.round(value * blend + 255 * (1 - blend))
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

function createUserLocationIcon(): import('leaflet').DivIcon {
  return leaflet!.divIcon({
    className: 'user-location-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `
      <span class="user-location-pulse"></span>
      <span class="user-location-dot"></span>
    `,
  })
}

function renderUserLocationMarker() {
  if (!map || !leaflet || !userLocation.value) return

  if (userMarker) {
    userMarker.remove()
    userMarker = null
  }

  if (userAccuracyCircle) {
    userAccuracyCircle.remove()
    userAccuracyCircle = null
  }

  userMarker = leaflet.marker([userLocation.value.lat, userLocation.value.lng], {
    icon: createUserLocationIcon(),
    title: tSafe('toilets.my_location', 'My location'),
    zIndexOffset: 3000,
    keyboard: false,
  }).addTo(map)

  userAccuracyCircle = leaflet.circle([userLocation.value.lat, userLocation.value.lng], {
    radius: 55,
    color: '#0f8ba5',
    fillColor: '#0f8ba5',
    fillOpacity: 0.16,
    weight: 2,
    interactive: false,
  }).addTo(map)
}

function startUserPositionWatch() {
  if (!import.meta.client || !navigator.geolocation || userPositionWatchId !== null) return

  userPositionWatchId = navigator.geolocation.watchPosition(
    (position) => {
      const nextPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      }

      const hasMeaningfulMove = !userLocation.value
        || haversineKm(userLocation.value.lat, userLocation.value.lng, nextPosition.lat, nextPosition.lng) >= 0.05

      userLocation.value = nextPosition
      renderUserLocationMarker()

      if (!hasMeaningfulMove) return

      if (filters.value.sort === 'nearest' || filters.value.radius > 0) {
        router.replace({ query: buildRouteQuery() })
        if (!useStaticApiMode.value) {
          if (geoRefreshTimeout) {
            clearTimeout(geoRefreshTimeout)
          }
          geoRefreshTimeout = setTimeout(() => {
            refresh()
          }, 320)
        }
      }
    },
    () => {
      // Silent failure for watch updates; explicit "Locate me" already gives actionable errors.
    },
    {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 20000,
    },
  )
}

function stopUserPositionWatch() {
  if (!import.meta.client || !navigator.geolocation || userPositionWatchId === null) return
  navigator.geolocation.clearWatch(userPositionWatchId)
  userPositionWatchId = null
}

function focusMapOnUserLocation() {
  if (!map || !userLocation.value) return
  const targetZoom = Math.max(map.getZoom(), 15)
  if (isMobile.value) {
    map.setView([userLocation.value.lat, userLocation.value.lng], targetZoom, { animate: false })
    return
  }
  map.flyTo([userLocation.value.lat, userLocation.value.lng], targetZoom, { animate: true, duration: 0.45 })
}

function applyFilters(options: { closeOnMobile?: boolean } = {}) {
  const { closeOnMobile = true } = options
  mapListPage.value = 1
  router.replace({ query: buildRouteQuery() })
  if (!useStaticApiMode.value) {
    refresh()
  }
  if (isMobile.value && closeOnMobile) {
    showFilters.value = false
  }
}

function resetFilters() {
  mapListPage.value = 1
  filters.value = {
    city: '',
    types: [],
    is_free: false,
    is_accessible: false,
    has_opening_hours: false,
    reported: 'any',
    min_rating: 0,
    radius: 0,
    sort: userLocation.value ? 'nearest' : 'updated',
  }
  router.replace({ query: buildRouteQuery() })
  if (!useStaticApiMode.value) {
    refresh()
  }
}

function buildRouteQuery(): Record<string, string | undefined> {
  return {
    city: filters.value.city || undefined,
    types: filters.value.types.length ? filters.value.types.join(',') : undefined,
    is_free: filters.value.is_free ? 'true' : undefined,
    is_accessible: filters.value.is_accessible ? 'true' : undefined,
    has_opening_hours: filters.value.has_opening_hours ? 'true' : undefined,
    reported: filters.value.reported === 'any' ? undefined : filters.value.reported,
    min_rating: filters.value.min_rating > 0 ? String(filters.value.min_rating) : undefined,
    radius: filters.value.radius > 0 ? String(filters.value.radius) : undefined,
    sort: filters.value.sort,
    lat: userLocation.value ? String(userLocation.value.lat) : undefined,
    lng: userLocation.value ? String(userLocation.value.lng) : undefined,
  }
}

async function locateUser(): Promise<boolean> {
  if (!import.meta.client || !navigator.geolocation) {
    locationError.value = t('toilets.geolocation_not_supported')
    return false
  }

  locating.value = true
  locationError.value = ''

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      })
    })

    userLocation.value = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    }
    startUserPositionWatch()

    filters.value.sort = 'nearest'
    renderUserLocationMarker()

    if (map) {
      focusMapOnUserLocation()
    }

    router.replace({ query: buildRouteQuery() })
    if (!useStaticApiMode.value) {
      await refresh()
    }

    // Keep map focus on the device position even after data refresh updates markers.
    if (map) {
      focusMapOnUserLocation()
    }
    return true
  }
  catch {
    locationError.value = t('toilets.geolocation_permission_error')
    return false
  }
  finally {
    locating.value = false
  }
}

async function startNavigation(toilet: ToiletListItem) {
  if (locating.value || (!userLocation.value && locationError.value)) {
    routingError.value = locationError.value || t('toilets.route_requires_location')
    return
  }

  routingError.value = ''
  navigationTargetToiletId.value = toilet.id
  selectedToilet.value = toilet
  mobileContextMenuOpen.value = false
  map?.closePopup()

  // Always trigger a fresh geolocation request before navigation.
  const hasLocation = await locateUser()

  if (!hasLocation || !userLocation.value || !leaflet || !map) {
    routingError.value = t('toilets.route_requires_location')
    return
  }

  routing.value = true

  try {
    const from = `${userLocation.value.lng},${userLocation.value.lat}`
    const to = `${toilet.lng},${toilet.lat}`
    const cacheKey = routeCacheKey(userLocation.value, toilet)
    let route = routeCache.get(cacheKey)

    if (!route) {
      const url = `https://router.project-osrm.org/route/v1/${OSRM_WALKING_PROFILE}/${from};${to}?overview=full&geometries=geojson&steps=true`
      const response = await fetch(url, { cache: 'force-cache' })
      const payload = await response.json() as OsrmResponse

      if (!payload.routes?.length) {
        throw new Error('No route found')
      }

      route = payload.routes[0]
      routeCache.set(cacheKey, route)
      if (routeCache.size > ROUTE_CACHE_MAX_ENTRIES) {
        const oldest = routeCache.keys().next().value
        if (oldest) {
          routeCache.delete(oldest)
        }
      }
    }
    const steps = route.legs?.[0]?.steps ?? []

    routeInfo.value = {
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
      steps: steps.map(formatStepInstruction).filter(Boolean),
    }
    activeStepIndex.value = 0
    showAllSteps.value = false

    const points = route.geometry.coordinates.map((point) => [point[1], point[0]] as [number, number])

    if (routeLayer) {
      routeLayer.remove()
      routeLayer = null
    }

    routeLayer = leaflet.polyline(points, {
      color: '#0f766e',
      weight: 5,
      opacity: 0.85,
    }).addTo(map)
    routeLayer.on('click', () => {
      clearRoute()
    })

    map.fitBounds(routeLayer.getBounds().pad(0.2), { animate: !isMobile.value })
    focusNextManeuverCard()
  }
  catch {
    routingError.value = t('toilets.routing_unavailable')
  }
  finally {
    routing.value = false
  }
}

function clearRoute() {
  routeInfo.value = null
  activeStepIndex.value = 0
  showAllSteps.value = false
  routingError.value = ''
  navigationTargetToiletId.value = null

  if (routeLayer) {
    routeLayer.remove()
    routeLayer = null
  }
}

function nextStep() {
  if (!routeInfo.value) return
  if (activeStepIndex.value >= routeInfo.value.steps.length - 1) return
  activeStepIndex.value += 1
  focusNextManeuverCard()
}

function prevStep() {
  if (activeStepIndex.value <= 0) return
  activeStepIndex.value -= 1
  focusNextManeuverCard()
}

function focusNextManeuverCard() {
  if (!import.meta.client || !isMobile.value || !nextManeuverCard.value) return
  nextManeuverCard.value.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function formatStepInstruction(step: OsrmStep): string {
  const type = String(step?.maneuver?.type ?? 'continue')
  const modifier = String(step?.maneuver?.modifier ?? '').trim()
  const name = String(step?.name ?? '').trim()

  const typeMap: Record<string, string> = {
    continue: t('toilets.maneuver_type.continue'),
    turn: t('toilets.maneuver_type.turn'),
    depart: t('toilets.maneuver_type.depart'),
    arrive: t('toilets.maneuver_type.arrive'),
    merge: t('toilets.maneuver_type.merge'),
    roundabout: t('toilets.maneuver_type.roundabout'),
    'on ramp': t('toilets.maneuver_type.on_ramp'),
    'off ramp': t('toilets.maneuver_type.off_ramp'),
  }
  const modifierMap: Record<string, string> = {
    left: t('toilets.maneuver_modifier.left'),
    right: t('toilets.maneuver_modifier.right'),
    straight: t('toilets.maneuver_modifier.straight'),
    slight_left: t('toilets.maneuver_modifier.slight_left'),
    slight_right: t('toilets.maneuver_modifier.slight_right'),
    sharp_left: t('toilets.maneuver_modifier.sharp_left'),
    sharp_right: t('toilets.maneuver_modifier.sharp_right'),
    uturn: t('toilets.maneuver_modifier.uturn'),
  }

  const typeLabel = typeMap[type] ?? type
  const modifierLabel = modifier ? (modifierMap[modifier] ?? modifier) : ''
  const action = modifierLabel ? `${typeLabel} ${modifierLabel}` : typeLabel
  return name ? t('toilets.route_action_on', { action, street: name }) : action
}

function externalRouteUrl(toilet: ToiletListItem): string {
  if (!userLocation.value) return '#'

  return `https://www.openstreetmap.org/directions?engine=${OSM_FOOT_ENGINE}&route=${userLocation.value.lat}%2C${userLocation.value.lng}%3B${toilet.lat}%2C${toilet.lng}`
}

function focusToiletFromList(toilet: ToiletListItem) {
  selectedToilet.value = toilet
  viewMode.value = 'map'
  if (isMobile.value) {
    mobileToiletSheetExpanded.value = false
  }

  if (map) {
    const targetZoom = Math.max(map.getZoom(), 16)
    if (isMobile.value) {
      map.setView([toilet.lat, toilet.lng], targetZoom, { animate: false })
    }
    else {
      map.flyTo([toilet.lat, toilet.lng], targetZoom, { animate: true, duration: 0.35 })
    }
  }
}

function onMobileSheetTouchStart(event: TouchEvent) {
  if (!isMobile.value) return
  mobileSheetTouchStartY.value = event.touches[0]?.clientY ?? null
}

function onMobileSheetTouchEnd(event: TouchEvent) {
  if (!isMobile.value || mobileSheetTouchStartY.value === null) return

  const endY = event.changedTouches[0]?.clientY
  if (typeof endY !== 'number') {
    mobileSheetTouchStartY.value = null
    return
  }

  const delta = mobileSheetTouchStartY.value - endY
  if (delta > 36) {
    mobileToiletSheetExpanded.value = true
  }
  else if (delta < -36) {
    mobileToiletSheetExpanded.value = false
  }

  mobileSheetTouchStartY.value = null
}

function toiletDetailHref(id: string): string {
  return `/toilets/${encodeURIComponent(id)}/`
}

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  return `${km.toFixed(1)} km`
}

function freshnessText(
  label: ToiletListItem['freshness_label'],
  days: number,
): string {
  if (label === 'fresh') return t('toilet.updated_days', { days })
  if (label === 'aging') return t('toilet.updated_days', { days })
  return t('toilet.data_may_be_stale', { days })
}

function freshnessClass(label: ToiletListItem['freshness_label']): string {
  if (label === 'fresh') return 'bg-teal-100 text-teal-700'
  if (label === 'aging') return 'bg-orange-100 text-orange-700'
  return 'bg-rose-100 text-rose-700'
}

function confidenceClass(level: ToiletListItem['source_confidence_level']): string {
  if (level === 'high') return 'bg-sky-100 text-sky-800'
  if (level === 'medium') return 'bg-indigo-100 text-indigo-700'
  return 'bg-gray-100 text-gray-700'
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a
    = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

function updateMapViewportWindow() {
  if (!map) return
  const bounds = map.getBounds().pad(MAP_VIEWPORT_PADDING_FACTOR)
  mapViewportWindow.value = {
    south: bounds.getSouth(),
    west: bounds.getWest(),
    north: bounds.getNorth(),
    east: bounds.getEast(),
  }
}

function routeCacheKey(from: UserLocation, to: Pick<ToiletListItem, 'lat' | 'lng'>): string {
  return `${from.lat.toFixed(5)},${from.lng.toFixed(5)}->${to.lat.toFixed(5)},${to.lng.toFixed(5)}`
}
</script>
