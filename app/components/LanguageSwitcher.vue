<template>
  <div class="flex items-center">
    <label for="lang" class="sr-only">Language</label>
    <select
      id="lang"
      :value="current"
      @change="onChange"
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
const switchLocalePath = useSwitchLocalePath()

const locales = [
  { code: 'de', label: 'Deutsch' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'ru', label: 'Русский' },
]

const current = computed(() => locale.value as string)

async function onChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  const target = switchLocalePath(v)
  if (!target) return
  await navigateTo(target)
  document.documentElement.dir = v === 'ar' ? 'rtl' : 'ltr'
}
</script>
