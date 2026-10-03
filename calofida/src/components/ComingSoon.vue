<script setup>
defineProps({ title: String })
</script>

<template>
  <div class="card soon">
    <h2>{{ title }}</h2>
    <p>الصفحة دي لسه تحت الإنشاء في النسخة الجديدة.</p>
  </div>
</template>

<style scoped>
.soon{text-align:center;padding:48px 20px}
.soon p{color:var(--ink-soft)}
</style>
