<script setup>
// "Clear all filters" button; only rendered while at least one filter in its group is active.
defineProps({ active: Boolean })
defineEmits(['clear'])
</script>

<template>
  <button v-if="active" type="button" class="btn-clear-filters" @click="$emit('clear')">✕ إلغاء الفلاتر</button>
</template>
