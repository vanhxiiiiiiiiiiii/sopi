<script setup>
import { computed } from 'vue'
import { normalizeRating } from '~/utils/rating'

const props = defineProps({ rating: { type: [Number, String], default: 0 } })
const value = computed(() => normalizeRating(props.rating))
const fillWidth = index => `${Math.min(1, Math.max(0, value.value - index)) * 100}%`
const points = '7.5 .8 9.7 5.4 14.5 5.9 10.7 9.1 11.8 14.2 7.5 11.6 3.2 14.2 4.3 9.1 .5 5.9 5.3 5.4'
</script>

<template>
  <span class="rating-stars" role="img" :aria-label="`${value.toFixed(1)} trên 5 sao`">
    <span v-for="index in 5" :key="index" class="rating-star" aria-hidden="true">
      <svg class="rating-star-icon rating-star-empty" viewBox="0 0 15 15"><polygon :points="points" fill="currentColor" /></svg>
      <span class="rating-star-fill" :style="{ width: fillWidth(index - 1) }">
        <svg class="rating-star-icon" viewBox="0 0 15 15"><polygon :points="points" fill="currentColor" /></svg>
      </span>
    </span>
  </span>
</template>

<style scoped>
.rating-stars {
  display: inline-flex;
  align-items: center;
  gap: 0.0625rem;
  color: #ee4d2d;
  line-height: 1;
  vertical-align: middle;
}
.rating-star {
  position: relative;
  display: inline-block;
  width: 1em;
  height: 1em;
  flex: 0 0 1em;
}
.rating-star-icon {
  display: block;
  width: 1em;
  height: 1em;
  max-width: none;
}
.rating-star-empty {
  color: #d5d5d5;
}
.rating-star-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  overflow: hidden;
}
</style>
