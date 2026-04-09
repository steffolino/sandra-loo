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
          DEFAULT: '#4e8397',
          light: '#3f6f80',
          accent: '#845ec2',
          muted: '#8f8479',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
