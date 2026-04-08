<template>
  <div>
    <h1 class="text-2xl font-bold text-brand mb-6">
      Find a Toilet
    </h1>

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
          <option value="Leipzig">Leipzig</option>
          <option value="Frankfurt am Main">Frankfurt am Main</option>
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
          >
            {{ type }}
          </option>
        </select>

        <select
          v-model="filters.reported"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option value="any">All report states</option>
          <option value="true">Reported only</option>
          <option value="false">No reports</option>
        </select>

        <select
          v-model="filters.min_rating"
          class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
          <option :value="0">Any rating</option>
          <option :value="4">4.0 and up</option>
          <option :value="3">3.0 and up</option>
          <option :value="2">2.0 and up</option>
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
          <option value="nearest">Nearest</option>
          <option value="rating">Top rated</option>
        </select>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input v-model="filters.is_free" type="checkbox" class="rounded">
          Free only
        </label>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input v-model="filters.is_accessible" type="checkbox" class="rounded">
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
      class="fixed inset-0 z-[700] bg-black/35 p-3"
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
            <option value="Leipzig">Leipzig</option>
            <option value="Frankfurt am Main">Frankfurt am Main</option>
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
            >
              {{ type }}
            </option>
          </select>

          <select
            v-model="filters.reported"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option value="any">All report states</option>
            <option value="true">Reported only</option>
            <option value="false">No reports</option>
          </select>

          <select
            v-model="filters.min_rating"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
          >
            <option :value="0">Any rating</option>
            <option :value="4">4.0 and up</option>
            <option :value="3">3.0 and up</option>
            <option :value="2">2.0 and up</option>
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
            <option value="nearest">Nearest</option>
            <option value="rating">Top rated</option>
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3 mt-3">
          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input v-model="filters.is_free" type="checkbox" class="rounded">
            Free only
          </label>

          <label class="flex items-center gap-2 text-sm cursor-pointer">
            <input v-model="filters.is_accessible" type="checkbox" class="rounded">
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

    <div v-if="pending" class="text-center py-16 text-gray-400">
      Loading toilets...
    </div>

    <div v-else-if="error" class="card p-8 text-center text-red-500">
      <p>Could not load toilet data.</p>
    </div>

    <div
      v-else-if="!toilets.length"
      class="card p-10 text-center"
    >
      <h2 class="text-xl font-semibold text-brand mb-2">
        No toilets found yet
      </h2>
      <p class="text-gray-500 mb-4 max-w-md mx-auto">
        No data has been imported for this area yet. Run the import scripts to
        populate the database with real OpenStreetMap and city open-data.
      </p>
      <div class="bg-gray-50 rounded-lg p-4 text-left text-sm font-mono text-gray-700 inline-block">
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

        <div
          v-if="selectedToilet"
          class="card p-4"
          :class="isMobile ? 'sticky bottom-2 z-[450] shadow-lg' : ''"
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

const route = useRoute()
const router = useRouter()
const runtimeConfig = useRuntimeConfig()

const toiletTypes: ToiletType[] = ['public', 'cafe', 'restaurant', 'shopping_mall', 'park', 'petrol_station', 'other']

const filters = ref({
  city: String(route.query.city ?? ''),
  type: String(route.query.type ?? ''),
  is_free: route.query.is_free === 'true',
  is_accessible: route.query.is_accessible === 'true',
  reported: ((route.query.reported as ReportedFilter) ?? 'any'),
  min_rating: Number(route.query.min_rating ?? 0),
  radius: Number(route.query.radius ?? 0),
  sort: ((route.query.sort as SortMode) ?? 'updated'),
})

const userLocation = ref<UserLocation | null>(
  route.query.lat && route.query.lng
    ? { lat: Number(route.query.lat), lng: Number(route.query.lng) }
    : null,
)

const queryParams = computed(() => {
  const p: Record<string, string> = {}

  if (filters.value.city) p.city = filters.value.city
  if (filters.value.type) p.type = filters.value.type
  if (filters.value.is_free) p.is_free = 'true'
  if (filters.value.is_accessible) p.is_accessible = 'true'
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
  useStaticApiMode.value ? '/api/toilets/index' : '/api/toilets'
))

const { data, pending, error, refresh } = await useFetch<ToiletsResponse>(toiletsApiPath, {
  query: requestQuery,
  server: !useStaticApiMode.value,
  watch: false,
})

const apiToilets = computed(() => data.value?.data ?? [])
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
const viewMode = ref<'map' | 'list'>('map')
const isMobile = ref(false)
const showFilters = ref(false)

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

watch(selectedToilet, () => {
  refreshMapMarkers()
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
  [pending, mapContainer, viewMode],
  async ([isPending, container, mode]) => {
    if (isPending || !container || mode !== 'map') return

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
  }
}

async function initMap() {
  if (!import.meta.client || !mapContainer.value || map) return

  leaflet = await import('leaflet')

  map = leaflet.map(mapContainer.value, {
    zoomControl: true,
    preferCanvas: true,
  }).setView([51.34, 12.37], 12)

  tileLayer = leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors',
  })

  tileLayer.addTo(map)
  toiletsLayer = leaflet.layerGroup().addTo(map)
}

function refreshMapMarkers() {
  if (!map || !leaflet || !toiletsLayer) return

  toiletsLayer.clearLayers()

  for (const toilet of toilets.value) {
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

    marker.bindTooltip(toilet.name ?? 'Public Toilet')
    marker.addTo(toiletsLayer)
  }

  if (!hasAutoFitted && toilets.value.length > 0) {
    const bounds = leaflet.latLngBounds(toilets.value.map(t => [t.lat, t.lng] as [number, number]))
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
    min_rating: filters.value.min_rating > 0 ? String(filters.value.min_rating) : undefined,
    radius: filters.value.radius > 0 ? String(filters.value.radius) : undefined,
    sort: filters.value.sort,
    lat: userLocation.value ? String(userLocation.value.lat) : undefined,
    lng: userLocation.value ? String(userLocation.value.lng) : undefined,
  }
}

async function locateUser() {
  if (!import.meta.client || !navigator.geolocation) {
    locationError.value = 'Geolocation is not supported on this device.'
    return
  }

  locating.value = true
  locationError.value = ''

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 60000,
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
  }
  catch {
    locationError.value = 'Could not access your location. Please allow location permission and try again.'
  }
  finally {
    locating.value = false
  }
}

async function startNavigation(toilet: ToiletListItem) {
  routingError.value = ''

  if (!userLocation.value) {
    await locateUser()
  }

  if (!userLocation.value || !leaflet || !map) {
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

function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)} m`
  }
  return `${km.toFixed(1)} km`
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
