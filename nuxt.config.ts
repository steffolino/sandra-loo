// https://nuxt.com/docs/api/configuration/nuxt-config
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// Allow GitHub Pages (or any sub-path deployment) via NUXT_APP_BASE_URL.
// e.g.  NUXT_APP_BASE_URL=/sandra-loo/  npm run generate
const baseURL = process.env.NUXT_APP_BASE_URL || '/'

function getPrerenderApiRoutes(): string[] {
  const files = ['osm.json', 'leipzig.json', 'frankfurt.json']
  const ids = new Set<string>()

  for (const file of files) {
    const path = join(process.cwd(), 'data', 'imports', file)
    if (!existsSync(path)) continue

    try {
      const parsed = JSON.parse(readFileSync(path, 'utf-8')) as Array<{ id?: string }>
      for (const row of parsed) {
        if (row?.id) ids.add(row.id)
      }
    }
    catch {
      // Ignore malformed file; build still proceeds with base API route.
    }
  }

  const detailRoutes = [...ids].map(id => `/api/toilets/${encodeURIComponent(id)}`)
  return ['/api/toilets', ...detailRoutes]
}

const prerenderApiRoutes = getPrerenderApiRoutes()

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },

  app: {
    baseURL,
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vite-pwa/nuxt',
    '@nuxt/eslint',
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
    // Pre-render the app shell and all crawled links for static hosting.
    prerender: {
      crawlLinks: true,
      routes: ['/', ...prerenderApiRoutes],
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Sandra Loo – Civic Toilet Finder',
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
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    devOptions: {
      enabled: false,
    },
  },

  typescript: {
    strict: true,
  },
})
