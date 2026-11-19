<script setup>
import IBrand from './icons/IBrand.vue'

defineProps({ inverse: Boolean })
</script>

<template>
  <span class="system-brand" :class="{ 'system-brand-inverse': inverse }" role="img" aria-label="Shopee">
    <IBrand aria-hidden="true" focusable="false" />
  </span>
</template>

<style scoped>
.system-brand {
  display: inline-flex;
  align-items: center;
  width: 152px;
  max-width: 100%;
  flex-shrink: 0;
  color: #ee4d2d;
}
.system-brand :deep(svg) {
  display: block;
  width: 100%;
  height: auto;
  fill: currentColor;
}
.system-brand-inverse {
  color: #fff;
  filter: drop-shadow(0 2px 2px rgb(0 0 0 / 12%));
}
@media (max-width: 600px) {
  .system-brand {
    width: 126px;
  }
}
</style>
