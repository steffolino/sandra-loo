<template>
  <div class="flex items-center w-full">
    <label for="lang" class="sr-only">{{ $t('common.language') }}</label>
    <select
      id="lang"
      :value="current"
      @change="onChange"
      class="w-full max-w-full px-2.5 py-2 rounded-lg border bg-[var(--cube-base-card)] text-xs sm:text-sm leading-5"
      :aria-label="$t('common.select_language')"
    >
      <option v-for="l in locales" :key="l.code" :value="l.code">{{ l.label }}</option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localeCookie = useCookie<string>('i18n_redirected')

const STORAGE_KEY = 'sandra-loo.locale'

const locales = [
  { code: 'de', label: 'Deutsch' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'ru', label: 'Русский' },
]

const validLocaleCodes = new Set(locales.map(l => l.code))

const current = computed(() => locale.value as string)

function applyDir(code: string) {
  document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr'
}

onMounted(() => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved || !validLocaleCodes.has(saved)) {
    applyDir(locale.value as string)
    return
  }

  localeCookie.value = saved
  if (saved !== locale.value) {
    const target = switchLocalePath(saved)
    if (target) {
      navigateTo(target, { replace: true })
    }
    else {
      locale.value = saved
    }
  }

  applyDir(saved)
})

watch(locale, (value) => {
  if (!import.meta.client) return
  localStorage.setItem(STORAGE_KEY, value as string)
  localeCookie.value = value as string
  applyDir(value as string)
}, { immediate: true })

async function onChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  localStorage.setItem(STORAGE_KEY, v)
  localeCookie.value = v
  const target = switchLocalePath(v)
  if (!target) return
  await navigateTo(target)
  applyDir(v)
}
</script>
