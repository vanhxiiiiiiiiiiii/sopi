<script setup>
import { A11y, Autoplay } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/vue'
import { promotionCampaigns } from '~/data/promotion-campaigns'
import 'swiper/css'

const region = ref(null)
const carousel = shallowRef(null)
const activeIndex = ref(0)
const userPaused = ref(false)
const hovered = ref(false)
const focused = ref(false)
const pageHidden = ref(false)
const inView = ref(true)
const reducedMotion = ref(typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
const autoplayAllowed = computed(() => !userPaused.value && !hovered.value && !focused.value && !pageHidden.value && inView.value && !reducedMotion.value)
let motionQuery
let observer

function syncAutoplay() {
  if (!carousel.value || carousel.value.destroyed) return
  if (autoplayAllowed.value) carousel.value.autoplay.start()
  else carousel.value.autoplay.stop()
}
function ready(instance) {
  carousel.value = instance
  syncAutoplay()
}
function slideChanged(instance) {
  activeIndex.value = instance.realIndex
  if (!autoplayAllowed.value) instance.autoplay.stop()
}
function focusLeft(event) {
  focused.value = Boolean(event.relatedTarget && region.value?.contains(event.relatedTarget))
}
function visibilityChanged() { pageHidden.value = document.hidden }
function motionChanged(event) { reducedMotion.value = event.matches }
watch(autoplayAllowed, syncAutoplay)
onMounted(() => {
  visibilityChanged()
  document.addEventListener('visibilitychange', visibilityChanged)
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  reducedMotion.value = motionQuery.matches
  motionQuery.addEventListener('change', motionChanged)
  observer = new IntersectionObserver(([entry]) => { inView.value = entry.isIntersecting }, { threshold: 0.15 })
  observer.observe(region.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('visibilitychange', visibilityChanged)
  motionQuery?.removeEventListener('change', motionChanged)
  carousel.value?.autoplay?.stop()
})
</script>

<template>
  <section class="home-campaigns" aria-label="Ưu đãi và bộ sưu tập Shoppe">
    <div class="campaign-heading">
      <span><i /> SHOPPE · MÙA MUA SẮM RỰC RỠ</span><span>THÁNG 11 / 2026</span>
    </div>
    <div ref="region" class="campaign-carousel" role="region" aria-roledescription="băng chuyền" aria-label="Banner khuyến mãi Shoppe" @mouseenter="hovered = true" @mouseleave="hovered = false" @focusin="focused = true" @focusout="focusLeft" @keydown.left.prevent="carousel?.slidePrev()" @keydown.right.prevent="carousel?.slideNext()">
      <Swiper :modules="[Autoplay, A11y]" :loop="true" :watch-slides-progress="true" :speed="reducedMotion ? 0 : 650" :autoplay="{ delay: 5000, disableOnInteraction: false }" :a11y="{ slideLabelMessage: 'Banner {{index}} trên {{slidesLength}}' }" :grab-cursor="true" @swiper="ready" @slide-change="slideChanged">
        <SwiperSlide v-for="campaign in promotionCampaigns" :key="campaign.id" v-slot="{ isActive, isVisible }">
          <CBPromotionBanner :campaign="campaign.id" :aria-hidden="!(isActive && isVisible)" :tabindex="isActive && isVisible ? 0 : -1" :inert="!(isActive && isVisible) ? '' : undefined" />
        </SwiperSlide>
      </Swiper>
      <button type="button" class="carousel-arrow arrow-prev" aria-label="Banner trước" @click="carousel?.slidePrev()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
      </button>
      <button type="button" class="carousel-arrow arrow-next" aria-label="Banner tiếp theo" @click="carousel?.slideNext()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
      </button>
      <div class="carousel-controls">
        <span class="carousel-counter" aria-hidden="true">0{{ activeIndex + 1 }} <small>/ 0{{ promotionCampaigns.length }}</small></span>
        <div class="carousel-pagination" role="group" aria-label="Chọn banner">
          <button v-for="(campaign, index) in promotionCampaigns" :key="campaign.id" type="button" :aria-label="'Xem banner ' + campaign.name" :aria-pressed="activeIndex === index" @click="carousel?.slideToLoop(index)">
            <span />
          </button>
        </div>
        <button type="button" class="carousel-pause" :aria-label="userPaused ? 'Bật tự cuộn banner' : 'Tạm dừng tự cuộn banner'" :aria-pressed="userPaused" @click="userPaused = !userPaused">
          <svg v-if="userPaused" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="m6 4 10 6-10 6Z" /></svg><svg v-else viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path d="M5 4h3v12H5zM12 4h3v12h-3z" /></svg>
        </button>
      </div>
    </div>
    <div class="campaign-shortcuts" aria-label="Các chương trình Shoppe">
      <button v-for="(campaign, index) in promotionCampaigns" :key="campaign.id" type="button" :class="{ selected: activeIndex === index }" :aria-pressed="activeIndex === index" @click="carousel?.slideToLoop(index)">
        <span class="shortcut-number">0{{ index + 1 }}</span><span>{{ campaign.name }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.home-campaigns {
  max-width: 1440px;
  padding: 24px 32px 0;
  margin: 0 auto 28px;
}
.campaign-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 13px;
  font-size: 10px;
  letter-spacing: 1.3px;
  color: #a45a3e;
  text-align: left;
}
.campaign-heading > span:first-child {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #a13c23;
  font-weight: 750;
}
.campaign-heading i {
  width: 6px;
  height: 6px;
  background: #ef4c2b;
  border-radius: 50%;
}
.campaign-carousel {
  position: relative;
  border-radius: 12px 12px 0 0;
  overflow: hidden;
  background: #ee4d2d;
}
.campaign-carousel :deep(.swiper) {
  width: 100%;
}
.campaign-carousel :deep(.swiper-wrapper) {
  align-items: stretch;
}
.campaign-carousel :deep(.swiper-slide) {
  height: auto;
}
.carousel-arrow {
  position: absolute;
  top: 50%;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 39px;
  height: 65px;
  transform: translateY(-50%);
  background: #68170035;
  color: #fff;
  transition: background .2s;
}
.carousel-arrow:hover {
  background: #68170070;
}
.carousel-arrow svg {
  width: 24px;
  height: 24px;
}
.arrow-prev {
  left: 0;
  border-radius: 0 5px 5px 0;
}
.arrow-next {
  right: 0;
  border-radius: 5px 0 0 5px;
}
.carousel-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  position: absolute;
  z-index: 5;
  bottom: 9px;
  left: 50%;
  transform: translateX(-50%);
  padding: 0 10px;
  border-radius: 30px;
  color: white;
  background: #60200035;
  backdrop-filter: blur(8px);
}
.carousel-counter {
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
}
.carousel-counter small {
  opacity: .7;
  font-size: 9px;
}
.carousel-pagination {
  display: flex;
  align-items: center;
}
.carousel-pagination button {
  display: grid;
  place-items: center;
  width: 27px;
  height: 36px;
}
.carousel-pagination button > span {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 20px;
  background: #ffffff80;
  transition: width .25s, background .25s;
}
.carousel-pagination button[aria-pressed=true] > span {
  width: 22px;
  background: #ffeb82;
}
.carousel-pause {
  display: grid;
  place-items: center;
  width: 32px;
  height: 36px;
  border-left: 1px solid #ffffff38;
  padding-left: 8px;
}
.carousel-pause svg {
  width: 17px;
  height: 17px;
}
.campaign-shortcuts {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  border: 1px solid #f0dfd4;
  border-top: 0;
  border-radius: 0 0 12px 12px;
  background: #fffaf5;
  overflow: hidden;
}
.campaign-shortcuts > button {
  display: flex;
  align-items: center;
  gap: 9px;
  justify-content: center;
  min-height: 62px;
  padding: 10px;
  border-bottom: 3px solid transparent;
  color: #8b7362;
  font-size: 12px;
  text-align: left;
  line-height: 1.4;
}
.campaign-shortcuts > button + button {
  border-left: 1px solid #f1e5db;
}
.campaign-shortcuts > button.selected {
  border-bottom-color: #ee4d2d;
  background: #fff0e3;
  color: #bf3e21;
  font-weight: 750;
}
.shortcut-number {
  font-size: 9px;
  opacity: .6;
  letter-spacing: .5px;
}
.home-campaigns button:focus-visible {
  outline: 2px solid #fff;
  outline-offset: -4px;
}
.campaign-shortcuts > button:focus-visible {
  outline-color: #ba3d22;
}
@media(max-width: 900px) {
  .home-campaigns {
    padding-left: 18px;
    padding-right: 18px;
  }
  .campaign-shortcuts > button {
    font-size: 10px;
    gap: 6px;
  }
  .shortcut-number {
    display: none;
  }
}
@media(max-width: 760px) {
  .home-campaigns {
    padding: 18px 12px 0;
  }
  .campaign-heading {
    font-size: 8px;
    letter-spacing: .5px;
  }
  .campaign-heading > span:last-child {
    display: none;
  }
  .carousel-arrow {
    width: 26px;
    height: 49px;
    top: 66%;
  }
  .carousel-arrow svg {
    width: 20px;
  }
  .campaign-shortcuts {
    display: flex;
    overflow-x: auto;
    border-radius: 0 0 10px 10px;
  }
  .campaign-shortcuts > button {
    flex: 0 0 135px;
    min-height: 55px;
    font-size: 11px;
    text-align: center;
  }
  .carousel-pagination button, .carousel-pause {
    height: 40px;
  }
  .carousel-controls {
    bottom: 8px;
  }
  .carousel-counter {
    font-size: 9px;
  }
}
@media(prefers-reduced-motion: reduce) {
  .carousel-arrow, .carousel-pagination button > span {
    transition: none;
  }
}
:global(.dark) .campaign-heading > span:first-child {
  color: #ffac87;
}
:global(.dark) .campaign-heading {
  color: #ddae92;
}
:global(.dark) .campaign-shortcuts {
  background: #30251f;
  border-color: #614536;
}
:global(.dark) .campaign-shortcuts > button {
  color: #dabba7;
  border-left-color: #614536;
}
:global(.dark) .campaign-shortcuts > button.selected {
  background: #523020;
  color: #ffbb8d;
}
</style>
