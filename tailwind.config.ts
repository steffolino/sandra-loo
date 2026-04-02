import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{vue,ts,js}',
    './server/**/*.{ts,js}',
    './shared/**/*.{ts,js}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1a1a2e',
          light: '#16213e',
          accent: '#e94560',
          muted: '#6b7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
