<script setup>
import { computed } from 'vue'
import { daysUntil, expiryStatus } from '../utils/helpers.js'

const props = defineProps({ date: String })
const st = computed(() => expiryStatus(daysUntil(props.date)))
</script>

<template>
  <span v-if="date" class="badge" :class="st.cls">{{ st.label }}</span>
</template>
