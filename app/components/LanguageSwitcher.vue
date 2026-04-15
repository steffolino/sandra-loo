<template>
  <div class="flex items-center">
    <label for="lang" class="sr-only">Language</label>
    <select
      id="lang"
      v-model="current"
      class="px-2 py-1 rounded border bg-[var(--cube-base)] text-sm"
      aria-label="Select language"
    >
      <option v-for="l in locales" :key="l.code" :value="l.code">{{ l.label }}</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const locales = [
  { code: 'de', label: 'Deutsch' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'ru', label: 'Русский' },
]

const current = computed({
  get: () => locale.value as string,
  set: (v: string) => {
    locale.value = v
    if (v === 'ar') document.documentElement.dir = 'rtl'
    else document.documentElement.dir = 'ltr'
  },
})
</script>
