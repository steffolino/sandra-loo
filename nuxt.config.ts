// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  future: {
    compatibilityVersion: 4,
  },
  devtools: { enabled: true },

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
      scope: '/',
      start_url: '/',
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
