<template>
  <div class="space-y-3">
    <!-- Bladder meter -->
    <div>
      <div class="flex justify-between text-xs font-medium mb-1">
        <span class="text-blue-600">💧 Bladder</span>
        <span :class="bladder >= danger ? 'text-red-500 font-bold' : 'text-gray-500'">
          {{ roundedBladder }}%
        </span>
      </div>
      <div class="h-3 rounded-full bg-gray-200 overflow-hidden">
        <div
          class="h-3 rounded-full transition-all duration-500"
          :class="bladder >= danger ? 'bg-red-500' : bladder >= danger * 0.6 ? 'bg-yellow-400' : 'bg-blue-400'"
          :style="{ width: `${bladder}%` }"
        />
      </div>
    </div>

    <!-- Igitt meter -->
    <div>
      <div class="flex justify-between text-xs font-medium mb-1">
        <span class="text-yellow-600">🤢 Igitt</span>
        <span :class="igitt >= danger ? 'text-red-500 font-bold' : 'text-gray-500'">
          {{ roundedIgitt }}%
        </span>
      </div>
      <div class="h-3 rounded-full bg-gray-200 overflow-hidden">
        <div
          class="h-3 rounded-full transition-all duration-500"
          :class="igitt >= danger ? 'bg-red-500' : igitt >= danger * 0.6 ? 'bg-orange-400' : 'bg-yellow-400'"
          :style="{ width: `${igitt}%` }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  bladder: number
  igitt: number
  max: number
  danger: number
}>()

const roundedBladder = computed(() => Math.round(props.bladder))
const roundedIgitt = computed(() => Math.round(props.igitt))
</script>
