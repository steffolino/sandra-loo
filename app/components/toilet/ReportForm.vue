<template>
  <form class="space-y-3" @submit.prevent="submit">
    <h3 class="font-semibold text-brand text-sm">
      Report an issue
    </h3>

    <div class="grid grid-cols-3 gap-2">
      <button
        v-for="type in reportTypes"
        :key="type.value"
        type="button"
        class="text-xs px-2 py-1.5 rounded-lg border transition-all"
        :class="selected === type.value
          ? 'border-brand-accent bg-brand-accent/10 text-brand-accent'
          : 'border-gray-300 text-gray-600 hover:border-gray-400'"
        @click="selected = type.value"
      >
        {{ type.label }}
      </button>
    </div>

    <textarea
      v-model="description"
      rows="2"
      placeholder="Optional description…"
      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
    />

    <div class="flex items-center gap-3">
      <button
        type="submit"
        class="btn-primary text-sm"
        :disabled="submitting || !selected"
      >
        {{ submitting ? 'Submitting…' : 'Submit report' }}
      </button>
      <p v-if="success" class="text-green-600 text-sm">
        ✓ Report submitted!
      </p>
      <p v-if="errorMsg" class="text-red-500 text-sm">
        {{ errorMsg }}
      </p>
    </div>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ toiletId: string }>()
const emit = defineEmits<{ submitted: [] }>()

const reportTypes = [
  { value: 'closed', label: 'Closed' },
  { value: 'dirty', label: 'Dirty' },
  { value: 'broken', label: 'Broken' },
  { value: 'unsafe', label: 'Unsafe' },
  { value: 'missing', label: 'Missing' },
  { value: 'other', label: 'Other' },
]

const selected = ref('')
const description = ref('')
const submitting = ref(false)
const success = ref(false)
const errorMsg = ref('')

async function submit() {
  if (!selected.value) return
  submitting.value = true
  success.value = false
  errorMsg.value = ''
  try {
    await $fetch('/api/reports', {
      method: 'POST',
      body: {
        toilet_id: props.toiletId,
        type: selected.value,
        description: description.value || null,
      },
    })
    success.value = true
    selected.value = ''
    description.value = ''
    emit('submitted')
    setTimeout(() => { success.value = false }, 3000)
  }
  catch (e: unknown) {
    errorMsg.value = (e as { message?: string })?.message ?? 'Error submitting report'
  }
  finally {
    submitting.value = false
  }
}
</script>
