<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
      <h1 class="text-2xl font-bold text-brand">
        Find a Toilet
      </h1>
      <button class="btn-secondary text-sm" @click="showTrustInfo = true">
        How we verify data
      </button>
    </div>

    <div v-if="showTrustInfo" class="fixed inset-0 z-[1300] bg-black/40 p-3" @click.self="showTrustInfo = false">
      <div class="card p-5 max-w-lg mx-auto mt-10">
        <h2 class="text-lg font-semibold text-brand mb-2">
          How we verify data
        </h2>
        <p class="text-sm text-gray-600">
          Source shows where a toilet record comes from (for example, OpenStreetMap or city open data).
        </p>
        <p class="text-sm text-gray-600 mt-2">
          Freshness indicates how many days since the source record was updated.
        </p>
        <p class="text-sm text-gray-600 mt-2">
          Confidence is derived from source reliability signals; recent community confirmations add trust context.
        </p>
        <div class="mt-4">
          <button class="btn-primary text-sm" @click="showTrustInfo = false">
            Close
          </button>
        </div>
      </div>
    </div>

    <div class="md:hidden flex gap-2 mb-3">
      <button class="btn-secondary flex-1" :disabled="locating" @click="locateUser">
        {{ locating ? 'Locating...' : 'My location' }}
      </button>
      <button class="btn-secondary flex-1" @click="showFilters = !showFilters">
        {{ showFilters ? 'Hide filters' : 'Show filters' }}
      </button>
    </div>

    <div v-if="!isMobile" class="card p-4 mb-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <select
          v-model="filters.city"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option value="">All cities</option>
          <option
            v-for="city in availableCities"
            :key="`city-${city}`"
            :value="city"
          >
            {{ city }}
          </option>
        </select>

        <select
          v-model="filters.type"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option value="">All types</option>
          <option
            v-for="type in toiletTypes"
            :key="type"
            :value="type"
            :disabled="isTypeDisabled(type)"
          >
            {{ type }}
          </option>
        </select>

        <select
          v-model="filters.reported"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option value="any">All report states</option>
          <option value="true" :disabled="!canFilterReportedTrue">Reported only</option>
          <option value="false" :disabled="!canFilterReportedFalse">No reports</option>
        </select>

        <select
          v-model="filters.source_kind"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option value="any">All data sources</option>
          <option value="osm">OpenStreetMap</option>
          <option value="city_open_data">City open data</option>
          <option value="other">Other sources</option>
        </select>

        <select
          v-model="filters.min_rating"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option :value="0">Any rating</option>
          <option :value="4" :disabled="!canFilterMinRating(4)">4.0 and up</option>
          <option :value="3" :disabled="!canFilterMinRating(3)">3.0 and up</option>
          <option :value="2" :disabled="!canFilterMinRating(2)">2.0 and up</option>
        </select>

        <select
          v-model.number="filters.radius"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option :value="0">Any distance</option>
          <option :value="1">Within 1 km</option>
          <option :value="2">Within 2 km</option>
          <option :value="5">Within 5 km</option>
          <option :value="10">Within 10 km</option>
        </select>

        <select
          v-model="filters.sort"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option value="updated">Latest updates</option>
          <option value="nearest" :disabled="!userLocation">Nearest</option>
          <option value="rating">Top rated</option>
        </select>

        <label class="flex items-center gap-2 text-sm cursor-pointer" :class="!canFilterFree ? 'opacity-60' : ''">
          <input v-model="filters.is_free" type="checkbox" class="rounded" :disabled="!canFilterFree">
          Free only
        </label>

        <label class="flex items-center gap-2 text-sm cursor-pointer" :class="!canFilterAccessible ? 'opacity-60' : ''">
          <input v-model="filters.is_accessible" type="checkbox" class="rounded" :disabled="!canFilterAccessible">
          Accessible only
        </label>
      </div>

      <div class="flex flex-wrap gap-2 mt-4">
        <button class="btn-primary text-sm" @click="applyFilters">
          Apply filters
        </button>
        <button class="btn-secondary text-sm hidden md:inline-flex" :disabled="locating" @click="locateUser">
          {{ locating ? 'Locating...' : 'Use current location' }}
        </button>
        <button class="btn-secondary text-sm" @click="resetFilters">
          Reset
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
            Filters
          </h2>
          <button class="btn-secondary text-sm min-h-11" @click="showFilters = false">
            Close
          </button>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <select
            v-model="filters.city"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option value="">All cities</option>
          <option
            v-for="city in availableCities"
            :key="`mobile-city-${city}`"
            :value="city"
          >
            {{ city }}
          </option>
        </select>

          <select
            v-model="filters.type"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option value="">All types</option>
            <option
              v-for="type in toiletTypes"
              :key="`mobile-${type}`"
              :value="type"
              :disabled="isTypeDisabled(type)"
            >
              {{ type }}
            </option>
          </select>

          <select
            v-model="filters.reported"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option value="any">All report states</option>
            <option value="true" :disabled="!canFilterReportedTrue">Reported only</option>
            <option value="false" :disabled="!canFilterReportedFalse">No reports</option>
          </select>

          <select
            v-model="filters.source_kind"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option value="any">All data sources</option>
            <option value="osm">OpenStreetMap</option>
            <option value="city_open_data">City open data</option>
            <option value="other">Other sources</option>
          </select>

          <select
            v-model="filters.min_rating"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option :value="0">Any rating</option>
            <option :value="4" :disabled="!canFilterMinRating(4)">4.0 and up</option>
            <option :value="3" :disabled="!canFilterMinRating(3)">3.0 and up</option>
            <option :value="2" :disabled="!canFilterMinRating(2)">2.0 and up</option>
          </select>

          <select
            v-model.number="filters.radius"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option :value="0">Any distance</option>
            <option :value="1">Within 1 km</option>
            <option :value="2">Within 2 km</option>
            <option :value="5">Within 5 km</option>
            <option :value="10">Within 10 km</option>
          </select>

          <select
            v-model="filters.sort"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option value="updated">Latest updates</option>
            <option value="nearest" :disabled="!userLocation">Nearest</option>
            <option value="rating">Top rated</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3 mt-3">
          <label class="flex items-center gap-2 text-sm cursor-pointer" :class="!canFilterFree ? 'opacity-60' : ''">
            <input v-model="filters.is_free" type="checkbox" class="rounded" :disabled="!canFilterFree">
            Free only
          </label>

          <label class="flex items-center gap-2 text-sm cursor-pointer" :class="!canFilterAccessible ? 'opacity-60' : ''">
            <input v-model="filters.is_accessible" type="checkbox" class="rounded" :disabled="!canFilterAccessible">
            Accessible only
          </label>
        </div>

        <div class="flex gap-2 mt-4">
          <button class="btn-primary text-sm min-h-11 flex-1" @click="applyFilters">
            Apply filters
          </button>
          <button class="btn-secondary text-sm min-h-11 flex-1" @click="resetFilters">
            Reset
          </button>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-between mb-4">
      <div class="inline-flex rounded-lg border border-gray-200 overflow-hidden">
        <button
          class="px-4 py-2 text-sm min-h-11"
          :class="viewMode === 'map' ? 'bg-brand-accent text-white' : 'bg-white text-gray-700'"
          @click="viewMode = 'map'"
        >
          Map
        </button>
        <button
          class="px-4 py-2 text-sm min-h-11"
          :class="viewMode === 'list' ? 'bg-brand-accent text-white' : 'bg-white text-gray-700'"
          @click="viewMode = 'list'"
        >
          List
        </button>
      </div>
      <p class="text-sm text-gray-500">
        {{ toilets.length }} results
      </p>
    </div>

    <div v-if="activePending && !hasLoadedOnce" class="text-center py-16 text-gray-400">
      Loading toilets...
    </div>

    <div v-else-if="activeError" class="card p-8 text-center text-red-500">
      <p>Could not load toilet data.</p>
    </div>

    <div
      v-else-if="!toilets.length"
      class="card p-10 text-center"
    >
      <h2 class="text-xl font-semibold text-brand mb-2">
        No toilets found yet
      </h2>
      <p v-if="hasImportedData" class="text-gray-500 mb-4 max-w-md mx-auto">
        No toilets match your current filters. Try resetting filters or adjusting
        city/type/rating.
      </p>
      <p v-else class="text-gray-500 mb-4 max-w-md mx-auto">
        No data has been imported for this area yet. Run the import scripts to
        populate the database with real OpenStreetMap and city open-data.
      </p>
      <div v-if="!hasImportedData" class="bg-gray-50 rounded-lg p-4 text-left text-sm font-mono text-gray-700 inline-block">
        <p>npm run import:osm</p>
        <p>npm run import:leipzig</p>
        <p>npm run import:frankfurt</p>
      </div>
    </div>

    <div v-else>
      <div v-show="viewMode === 'map'" class="space-y-4">
        <ClientOnly>
          <div class="card overflow-hidden">
            <div
              ref="mapContainer"
              class="w-full"
              :class="isMobile ? 'h-[78svh] min-h-[520px]' : 'h-[58vh] min-h-[420px]'"
            />
          </div>
        </ClientOnly>
        <p
          v-if="isMapMarkerLimited"
          class="text-xs text-gray-500 px-1"
        >
          Showing {{ mapToilets.length }} nearby markers on mobile for faster loading.
        </p>

        <div
          v-if="selectedToilet"
          class="card p-4"
          :class="isMobile ? 'sticky bottom-2 z-[1080] shadow-lg' : ''"
        >
          <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <h2 class="text-lg font-semibold text-brand">
                {{ selectedToilet.name ?? 'Public Toilet' }}
              </h2>
              <p class="text-sm text-gray-500">
                {{ selectedToilet.address ?? selectedToilet.city }}
              </p>
            </div>
            <NuxtLink :to="`/toilets/${selectedToilet.id}`" class="btn-secondary text-sm">
              Open details
            </NuxtLink>
          </div>

          <div class="flex flex-wrap gap-2 mb-3 text-xs">
            <span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700">{{ selectedToilet.type }}</span>
            <span class="px-2 py-1 rounded-full" :class="selectedToilet.is_free ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
              {{ selectedToilet.is_free ? 'Free' : 'Paid' }}
            </span>
            <span v-if="selectedToilet.is_accessible" class="px-2 py-1 rounded-full bg-blue-100 text-blue-700">Accessible</span>
            <span v-if="selectedToilet.avg_rating !== null" class="px-2 py-1 rounded-full bg-amber-100 text-amber-700">Rating {{ selectedToilet.avg_rating }}</span>
            <span v-if="selectedToilet.distance_km !== undefined" class="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
              {{ formatDistance(selectedToilet.distance_km) }} away
            </span>
            <span
              v-if="selectedToilet.freshness_label"
              class="px-2 py-1 rounded-full"
              :class="freshnessClass(selectedToilet.freshness_label)"
            >
              {{ freshnessText(selectedToilet.freshness_label, selectedToilet.freshness_days) }}
            </span>
            <span class="px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
              {{ selectedToilet.recent_confirmation_count }} recent confirmation{{ selectedToilet.recent_confirmation_count === 1 ? '' : 's' }}
            </span>
            <span
              class="px-2 py-1 rounded-full"
              :class="confidenceClass(selectedToilet.source_confidence_level)"
            >
              Confidence {{ selectedToilet.source_confidence_score }}/100
            </span>
            <button
              type="button"
              class="px-2 py-1 rounded-full bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
              :title="`Open source: ${formatProvenanceMeta(selectedToilet.source, selectedToilet.source_name)}`"
              @click="openSource(selectedToilet.source, selectedToilet.source_url)"
            >
              Source {{ formatProvenanceLabel(selectedToilet.source, selectedToilet.source_name) }}
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <button class="btn-primary text-sm min-h-11" :disabled="routing" @click="startNavigation(selectedToilet)">
              {{ routing ? 'Building route...' : 'Navigate' }}
            </button>
            <button class="btn-secondary text-sm min-h-11" @click="clearRoute">
              Clear route
            </button>
            <a
              v-if="userLocation"
              class="btn-secondary text-sm min-h-11"
              :href="externalRouteUrl(selectedToilet)"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in OSM directions
            </a>
          </div>

          <p v-if="routingError" class="text-sm text-red-600 mt-2">
            {{ routingError }}
          </p>
        </div>

        <div v-if="routeInfo" class="card p-4">
          <h3 class="font-semibold text-brand mb-2">
            Route summary
          </h3>
          <p class="text-sm text-gray-600 mb-3">
            {{ routeInfo.distanceKm.toFixed(1) }} km, about {{ Math.round(routeInfo.durationMin) }} min walking
          </p>

          <div
            ref="nextManeuverCard"
            class="rounded-xl border border-brand-accent/20 bg-brand-accent/5 p-4 mb-3"
          >
            <p class="text-xs uppercase tracking-wide text-brand-accent mb-1">
              Next maneuver
            </p>
            <p class="text-base md:text-lg font-semibold text-brand leading-snug">
              {{ currentStep ?? 'Continue straight' }}
            </p>
            <p class="text-xs text-gray-500 mt-2">
              Step {{ activeStepIndex + 1 }} of {{ routeInfo.steps.length }}
            </p>
          </div>

          <div class="flex gap-2 mb-3">
            <button
              class="btn-secondary text-sm min-h-11 flex-1"
              :disabled="activeStepIndex <= 0"
              @click="prevStep"
            >
              Previous
            </button>
            <button
              class="btn-primary text-sm min-h-11 flex-1"
              :disabled="activeStepIndex >= routeInfo.steps.length - 1"
              @click="nextStep"
            >
              Next
            </button>
          </div>

          <button class="btn-secondary text-sm min-h-11 w-full" @click="showAllSteps = !showAllSteps">
            {{ showAllSteps ? 'Hide full steps' : 'Show full steps' }}
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
          <h3 class="font-semibold text-brand mb-2">
            List fallback
          </h3>
          <div class="space-y-3">
            <ToiletCard
              v-for="toilet in toilets"
              :key="toilet.id"
              :toilet="toilet"
            />
          </div>
        </div>

        <div
          v-if="isMobile && toilets.length > 0"
          class="sticky bottom-2 z-[1120]"
        >
          <div class="card p-2 shadow-xl bg-white/95 backdrop-blur-sm">
            <button
              class="btn-secondary w-full text-sm min-h-11"
              @click="showMobileToiletList = !showMobileToiletList"
            >
              {{ showMobileToiletList ? `Hide public toilet list (${toilets.length})` : `Show public toilet list (${toilets.length})` }}
            </button>

            <div
              v-if="showMobileToiletList"
              class="mt-2 max-h-[42svh] overflow-y-auto rounded-lg border border-gray-200 bg-white p-2"
            >
              <div class="space-y-2">
                <ToiletCard
                  v-for="toilet in toilets"
                  :key="`mobile-bottom-${toilet.id}`"
                  :toilet="toilet"
                />
              </div>
            </div>
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
import { formatProvenanceLabel, formatProvenanceMeta, resolveSourceUrl, sourceKindFromRecord } from '../../utils/provenance'

interface ToiletsResponse {
  data: ToiletListItem[]
  meta: { total: number, hasData: boolean }
}

interface UserLocation {
  lat: number
  lng: number
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
type SourceKindFilter = 'any' | 'osm' | 'city_open_data' | 'other'
type FilterKey = 'city' | 'type' | 'is_free' | 'is_accessible' | 'reported' | 'min_rating' | 'radius' | 'source_kind'
const MOBILE_MARKER_LIMIT = 250

const route = useRoute()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()
const appBase = runtimeConfig.app.baseURL.endsWith('/')
  ? runtimeConfig.app.baseURL
  : `${runtimeConfig.app.baseURL}/`

const toiletTypes: ToiletType[] = ['public', 'cafe', 'restaurant', 'shopping_mall', 'park', 'petrol_station', 'other']

const filters = ref({
  city: String(route.query.city ?? ''),
  type: String(route.query.type ?? ''),
  is_free: route.query.is_free === 'true',
  is_accessible: route.query.is_accessible === 'true',
  reported: ((route.query.reported as ReportedFilter) ?? 'any'),
  source_kind: ((route.query.source_kind as SourceKindFilter) ?? 'any'),
  min_rating: Number(route.query.min_rating ?? 0),
  radius: Number(route.query.radius ?? 0),
  sort: ((route.query.sort as SortMode) ?? 'updated'),
})

const userLocation = ref<UserLocation | null>(null)

const queryParams = computed(() => {
  const p: Record<string, string> = {}

  if (filters.value.city) p.city = filters.value.city
  if (filters.value.type) p.type = filters.value.type
  if (filters.value.is_free) p.is_free = 'true'
  if (filters.value.is_accessible) p.is_accessible = 'true'
  if (filters.value.reported !== 'any') p.reported = filters.value.reported
  if (filters.value.source_kind !== 'any') p.source_kind = filters.value.source_kind
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
const staticPending = ref(false)
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
  if (!ignore.includes('type') && filters.value.type) {
    list = list.filter(t => t.type === filters.value.type)
  }
  if (!ignore.includes('is_free') && filters.value.is_free) {
    list = list.filter(t => t.is_free)
  }
  if (!ignore.includes('is_accessible') && filters.value.is_accessible) {
    list = list.filter(t => t.is_accessible)
  }
  if (!ignore.includes('reported') && filters.value.reported !== 'any') {
    const wantReported = filters.value.reported === 'true'
    list = list.filter(t => t.has_reports === wantReported)
  }
  if (!ignore.includes('source_kind') && filters.value.source_kind !== 'any') {
    list = list.filter(t => sourceKindFromRecord(t.source, t.source_name) === filters.value.source_kind)
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

const availableTypes = computed(() => new Set(withAppliedFilters(apiToilets.value, ['type']).map(t => t.type)))
const canFilterReportedTrue = computed(() => withAppliedFilters(apiToilets.value, ['reported']).some(t => t.has_reports))
const canFilterReportedFalse = computed(() => withAppliedFilters(apiToilets.value, ['reported']).some(t => !t.has_reports))
const canFilterFree = computed(() => withAppliedFilters(apiToilets.value, ['is_free']).some(t => t.is_free))
const canFilterAccessible = computed(() => withAppliedFilters(apiToilets.value, ['is_accessible']).some(t => t.is_accessible))

function isTypeDisabled(type: ToiletType): boolean {
  return !availableTypes.value.has(type) && filters.value.type !== type
}

function canFilterMinRating(threshold: number): boolean {
  if (filters.value.min_rating === threshold) return true
  return withAppliedFilters(apiToilets.value, ['min_rating']).some(t => (t.avg_rating ?? 0) >= threshold)
}

const toilets = computed(() => {
  if (!useStaticApiMode.value) {
    return apiToilets.value
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
  if (filters.value.type) {
    list = list.filter(t => t.type === filters.value.type)
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
  if (filters.value.source_kind !== 'any') {
    list = list.filter(t => sourceKindFromRecord(t.source, t.source_name) === filters.value.source_kind)
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

const mapToilets = computed(() => {
  const base = toilets.value

  if (!isMobile.value || base.length <= MOBILE_MARKER_LIMIT) {
    return base
  }

  let limited = userLocation.value
    ? [...base]
      .sort((a, b) => (a.distance_km ?? Number.POSITIVE_INFINITY) - (b.distance_km ?? Number.POSITIVE_INFINITY))
      .slice(0, MOBILE_MARKER_LIMIT)
    : base.slice(0, MOBILE_MARKER_LIMIT)

  if (
    selectedToilet.value
    && !limited.some(t => t.id === selectedToilet.value?.id)
  ) {
    limited = [selectedToilet.value, ...limited.slice(0, MOBILE_MARKER_LIMIT - 1)]
  }

  return limited
})

const isMapMarkerLimited = computed(() => (
  isMobile.value && toilets.value.length > mapToilets.value.length
))

watch(
  [availableCities, availableTypes, canFilterReportedTrue, canFilterReportedFalse, canFilterFree, canFilterAccessible],
  () => {
    if (filters.value.city && !availableCities.value.includes(filters.value.city)) {
      filters.value.city = ''
    }
    if (filters.value.type && isTypeDisabled(filters.value.type as ToiletType)) {
      filters.value.type = ''
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
    if (filters.value.min_rating > 0 && !canFilterMinRating(filters.value.min_rating)) {
      filters.value.min_rating = 0
    }
  },
)

const viewMode = ref<'map' | 'list'>('map')
const isMobile = ref(false)
const showFilters = ref(false)
const showMobileToiletList = ref(false)
const showTrustInfo = ref(false)

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
let userMarker: import('leaflet').CircleMarker | null = null
let routeLayer: import('leaflet').Polyline | null = null
let hasAutoFitted = false

const mapContainer = ref<HTMLElement | null>(null)
const nextManeuverCard = ref<HTMLElement | null>(null)
let mediaQuery: MediaQueryList | null = null

watch(toilets, (next) => {
  if (!next.length) {
    selectedToilet.value = null
    return
  }

  if (!selectedToilet.value || !next.some(t => t.id === selectedToilet.value?.id)) {
    selectedToilet.value = next[0]
  }

  refreshMapMarkers()
})

watch(activePending, (isPending) => {
  if (!isPending) {
    hasLoadedOnce.value = true
  }
}, { immediate: true })

watch(selectedToilet, () => {
  refreshMapMarkers()
})

watch(mapToilets, () => {
  refreshMapMarkers()
})

watch(viewMode, (mode) => {
  if (mode !== 'map') {
    showMobileToiletList.value = false
  }
})

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
  }
})

watch(
  [activePending, mapContainer, viewMode],
  async ([isPending, container, mode]) => {
    if (isPending || !container || mode !== 'map') return

    if (map && map.getContainer() !== container) {
      map.remove()
      map = null
      tileLayer = null
      toiletsLayer = null
      userMarker = null
      routeLayer = null
      hasAutoFitted = false
    }

    await nextTick()
    await initMap()
    refreshMapMarkers()
    renderUserLocationMarker()

    if (map) {
      map.invalidateSize()
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
    showMobileToiletList.value = false
  }
}

async function initMap() {
  if (!import.meta.client || !mapContainer.value || map) return

  leaflet = await import('leaflet')

  map = leaflet.map(mapContainer.value, {
    zoomControl: false,
    attributionControl: false,
    preferCanvas: true,
  }).setView([51.34, 12.37], 12)

  tileLayer = leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  })

  tileLayer.addTo(map)
  toiletsLayer = leaflet.layerGroup().addTo(map)
  leaflet.control.zoom({ position: 'topright' }).addTo(map)
  leaflet.control.attribution({
    position: 'topleft',
    prefix: false,
  }).addTo(map)
}

function refreshMapMarkers() {
  if (!map || !leaflet || !toiletsLayer) return

  toiletsLayer.clearLayers()

  for (const toilet of mapToilets.value) {
    const isSelected = selectedToilet.value?.id === toilet.id
    const marker = leaflet.circleMarker([toilet.lat, toilet.lng], {
      radius: isSelected ? 8 : 6,
      color: isSelected ? '#be123c' : '#0284c7',
      weight: 2,
      fillColor: isSelected ? '#f43f5e' : '#0ea5e9',
      fillOpacity: 0.9,
    })

    marker.on('click', () => {
      selectedToilet.value = toilet
    })

    if (!isMobile.value) {
      marker.bindTooltip(toilet.name ?? 'Public Toilet')
    }
    marker.addTo(toiletsLayer)
  }

  if (!hasAutoFitted && mapToilets.value.length > 0) {
    const bounds = leaflet.latLngBounds(mapToilets.value.map(t => [t.lat, t.lng] as [number, number]))
    map.fitBounds(bounds.pad(0.15))
    hasAutoFitted = true
  }

  if (selectedToilet.value) {
    map.panTo([selectedToilet.value.lat, selectedToilet.value.lng], { animate: true, duration: 0.35 })
  }
}

function renderUserLocationMarker() {
  if (!map || !leaflet || !userLocation.value) return

  if (userMarker) {
    userMarker.remove()
    userMarker = null
  }

  userMarker = leaflet.circleMarker([userLocation.value.lat, userLocation.value.lng], {
    radius: 7,
    color: '#0f766e',
    fillColor: '#14b8a6',
    fillOpacity: 0.95,
    weight: 2,
  }).addTo(map)
}

function applyFilters() {
  router.replace({ query: buildRouteQuery() })
  if (!useStaticApiMode.value) {
    refresh()
  }
  if (isMobile.value) {
    showFilters.value = false
  }
}

function resetFilters() {
  filters.value = {
    city: '',
    type: '',
    is_free: false,
    is_accessible: false,
    reported: 'any',
    source_kind: 'any',
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
    type: filters.value.type || undefined,
    is_free: filters.value.is_free ? 'true' : undefined,
    is_accessible: filters.value.is_accessible ? 'true' : undefined,
    reported: filters.value.reported === 'any' ? undefined : filters.value.reported,
    source_kind: filters.value.source_kind === 'any' ? undefined : filters.value.source_kind,
    min_rating: filters.value.min_rating > 0 ? String(filters.value.min_rating) : undefined,
    radius: filters.value.radius > 0 ? String(filters.value.radius) : undefined,
    sort: filters.value.sort,
    lat: userLocation.value ? String(userLocation.value.lat) : undefined,
    lng: userLocation.value ? String(userLocation.value.lng) : undefined,
  }
}

async function locateUser(): Promise<boolean> {
  if (!import.meta.client || !navigator.geolocation) {
    locationError.value = 'Geolocation is not supported on this device.'
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

    filters.value.sort = 'nearest'
    renderUserLocationMarker()

    if (map) {
      map.panTo([userLocation.value.lat, userLocation.value.lng], { animate: true })
    }

    router.replace({ query: buildRouteQuery() })
    if (!useStaticApiMode.value) {
      await refresh()
    }
    return true
  }
  catch {
    locationError.value = 'Could not access your location. Please allow location permission and try again.'
    return false
  }
  finally {
    locating.value = false
  }
}

async function startNavigation(toilet: ToiletListItem) {
  routingError.value = ''

  // Always trigger a fresh geolocation request before navigation.
  const hasLocation = await locateUser()

  if (!hasLocation || !userLocation.value || !leaflet || !map) {
    routingError.value = 'Current location is required to calculate a route.'
    return
  }

  routing.value = true

  try {
    const from = `${userLocation.value.lng},${userLocation.value.lat}`
    const to = `${toilet.lng},${toilet.lat}`
    const url = `https://router.project-osrm.org/route/v1/walking/${from};${to}?overview=full&geometries=geojson&steps=true`
    const response = await fetch(url)
    const payload = await response.json() as OsrmResponse

    if (!payload.routes?.length) {
      throw new Error('No route found')
    }

    const route = payload.routes[0]
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

    map.fitBounds(routeLayer.getBounds().pad(0.2))
    focusNextManeuverCard()
  }
  catch {
    routingError.value = 'Routing service is currently unavailable. Please try again in a moment.'
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

  const action = modifier ? `${type} ${modifier}` : type
  return name ? `${action} on ${name}` : action
}

function externalRouteUrl(toilet: ToiletListItem): string {
  if (!userLocation.value) return '#'

  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${userLocation.value.lat}%2C${userLocation.value.lng}%3B${toilet.lat}%2C${toilet.lng}`
}

function openSource(source: string, sourceUrl: string) {
  if (!import.meta.client) return
  const url = resolveSourceUrl(source, sourceUrl)
  if (url === '#') return
  window.open(url, '_blank', 'noopener,noreferrer')
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
  if (label === 'fresh') return `Updated ${days}d ago`
  if (label === 'aging') return `Updated ${days}d ago`
  return `Data may be stale (${days}d)`
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
</script>
