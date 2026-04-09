<template>
  <form class="space-y-3" @submit.prevent="submit">
    <h3 class="font-semibold text-brand text-sm">
      Write a review
    </h3>

    <div class="grid grid-cols-2 gap-3">
      <label class="block text-xs text-gray-600">
        Cleanliness (1–5)
        <input
          v-model.number="form.cleanliness"
          type="number"
          min="1"
          max="5"
          required
          class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
      </label>
      <label class="block text-xs text-gray-600">
        Lighting (1–5)
        <input
          v-model.number="form.lighting"
          type="number"
          min="1"
          max="5"
          required
          class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
        >
      </label>
    </div>

    <div class="flex gap-4 text-sm">
      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="form.toilet_paper" type="checkbox" class="rounded">
        Toilet paper available
      </label>
      <label class="flex items-center gap-2 cursor-pointer">
        <input v-model="form.accessibility" type="checkbox" class="rounded">
        Accessible
      </label>
    </div>

    <textarea
      v-model="form.comment"
      rows="2"
      placeholder="Optional comment…"
      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
    />
    <input
      v-model="form.website"
      type="text"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
      class="hidden"
    >

    <div class="flex items-center gap-3">
      <button type="submit" class="btn-primary text-sm" :disabled="submitting">
        {{ submitting ? 'Submitting…' : 'Submit review' }}
      </button>
      <p v-if="success" class="text-green-600 text-sm">
        ✓ Review submitted!
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

const form = ref({
  cleanliness: 3,
  lighting: 3,
  toilet_paper: true,
  accessibility: false,
  comment: '',
  website: '',
  form_started_at: Date.now(),
})

const submitting = ref(false)
const success = ref(false)
const errorMsg = ref('')

async function submit() {
  if (!form.value.form_started_at) {
    form.value.form_started_at = Date.now()
  }

  submitting.value = true
  success.value = false
  errorMsg.value = ''
  try {
    await $fetch('/api/reviews', {
      method: 'POST',
      body: { ...form.value, toilet_id: props.toiletId },
    })
    success.value = true
    form.value = {
      cleanliness: 3,
      lighting: 3,
      toilet_paper: true,
      accessibility: false,
      comment: '',
      website: '',
      form_started_at: Date.now(),
    }
    emit('submitted')
    setTimeout(() => { success.value = false }, 3000)
  }
  catch (e: unknown) {
    errorMsg.value = (e as { message?: string })?.message ?? 'Error submitting review'
  }
  finally {
    submitting.value = false
  }
}
</script>
