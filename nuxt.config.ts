// https://nuxt.com/docs/api/configuration/nuxt-config
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Toilet } from './shared/types/index'
import { normalizeAndMergeToilets } from './server/utils/store'

// Allow GitHub Pages (or any sub-path deployment) via NUXT_APP_BASE_URL.
// e.g.  NUXT_APP_BASE_URL=/sandra-loo/  npm run generate
const baseURL = process.env.NUXT_APP_BASE_URL || '/'

function getPrerenderApiRoutes(): string[] {
  const files = ['osm.json', 'leipzig.json', 'frankfurt.json']
  const all: Toilet[] = []

  for (const file of files) {
    const path = join(process.cwd(), 'data', 'imports', file)
    if (!existsSync(path)) continue

    try {
      const parsed = JSON.parse(readFileSync(path, 'utf-8')) as Toilet[]
      all.push(...parsed)
    }
    catch {
      // Ignore malformed file; build still proceeds with base API route.
    }
  }

  const ids = new Set(normalizeAndMergeToilets(all).map(t => t.id))
  const detailRoutes = [...ids].map(id => `/api/toilets/${encodeURIComponent(id)}`)
  const apiRoutes = ['/api/toilets/', ...detailRoutes]

  return [...new Set(apiRoutes)]
}

const prerenderApiRoutes = getPrerenderApiRoutes()

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: false },

  app: {
    baseURL,
  },

  routeRules: {
    // Admin screens are non-MVP and currently rely on runtime-only data paths.
    // Skip static prerender to keep Pages generation stable.
    '/admin': { prerender: false },
    '/admin/**': { prerender: false },
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    '@nuxt/eslint',
    '@nuxtjs/i18n',
  ],

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    dbPath: process.env.DATABASE_PATH || './data/sandra-loo.db',
    public: {
      appName: 'Sandra Loo',
      appVersion: '0.1.0',
    },
  },

  nitro: {
    // Disable runtime timing instrumentation to avoid noisy console.time label
    // collisions during concurrent prerender.
    timing: false,
    // Pre-render the app shell and all crawled links for static hosting.
    prerender: {
      autoSubfolderIndex: true,
      concurrency: 1,
      crawlLinks: true,
      // Avoid generating both /api/toilets (file) and /api/toilets/ (directory).
      // We canonicalize to the slash form above.
      ignore: ['/api/toilets'],
      routes: ['/', ...prerenderApiRoutes],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Sandra Loo - Civic Toilet Finder',
      short_name: 'Sandra Loo',
      description: 'Find public toilets. Play the awareness game.',
      theme_color: '#1a1a2e',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: baseURL,
      start_url: baseURL,
      icons: [
        {
          src: 'icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: 'icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      navigateFallback: baseURL,
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    devOptions: {
      enabled: false,
    },
  },

  typescript: {
    strict: true,
  },

  i18n: {
    restructureDir: '.',
    locales: [
      { code: 'de', file: 'de.json', iso: 'de-DE', name: 'Deutsch' },
      { code: 'pl', file: 'pl.json', iso: 'pl-PL', name: 'Polski' },
      { code: 'tr', file: 'tr.json', iso: 'tr-TR', name: 'Türkçe' },
      { code: 'en', file: 'en.json', iso: 'en-US', name: 'English' },
      { code: 'ar', file: 'ar.json', iso: 'ar-AR', name: 'العربية' },
      { code: 'ru', file: 'ru.json', iso: 'ru-RU', name: 'Русский' },
    ],
    defaultLocale: 'de',
    strategy: 'prefix_except_default',
    lazy: true,
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      fallbackLocale: 'de',
    },
    // Inline `vueI18n` config removed to avoid path-resolution issues
    // (the module will use sensible defaults; provide a config file if needed)
  },
})
