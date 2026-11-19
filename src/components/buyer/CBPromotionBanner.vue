<script setup>
import { campaignById } from '~/data/promotion-campaigns'

const props = defineProps({ campaign: { type: String, default: 'sale-11-11' } })
const content = computed(() => campaignById[props.campaign] || campaignById['sale-11-11'])
</script>

<template>
  <RouterLink :to="'/buyer/promotions/' + content.id" class="campaign-banner" :class="'theme-' + content.theme" :aria-label="content.name + ' · ' + content.cta" draggable="false">
    <div class="banner-rays" aria-hidden="true" />
    <div class="banner-dots" aria-hidden="true" />
    <div class="banner-copy">
      <span class="banner-eyebrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7Z M8 7V5a4 4 0 0 1 8 0v2" /></svg>{{ content.eyebrow }}</span>
      <h2>{{ content.title }}<em>{{ content.highlight }}</em></h2>
      <p>{{ content.description }}</p>
      <div class="banner-actions">
        <div class="offer-ticket">
          <span>{{ content.offerLabel }}<small>Số lượt sử dụng có hạn</small></span><strong>{{ content.offer }}</strong>
        </div>
        <span class="banner-cta">{{ content.cta }}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" /></svg></span>
      </div>
      <span class="banner-validity">01–30.11.2026 · Xem điều kiện tại trang ưu đãi</span>
    </div>
    <div class="banner-art" aria-hidden="true">
      <span class="art-stamp">{{ content.stamp }}</span>
      <span class="art-orbit" /><span class="art-orbit orbit-two" />
      <div class="art-podium" />
      <div class="hero-product">
        <span class="product-tag">SHOPPE PICKS</span><img :src="content.images[0]" alt="" width="300" height="300" draggable="false"><span class="product-caption">{{ content.productLabel }}</span>
      </div>
      <div class="mini-product mini-top">
        <img :src="content.images[1]" alt="" width="140" height="140" draggable="false"><span>CHỌN GU BẠN</span>
      </div>
      <div class="mini-product mini-bottom">
        <img :src="content.images[2]" alt="" width="140" height="140" draggable="false"><span>SĂN DEAL HỜI</span>
      </div>
      <span class="art-spark spark-one">✦</span><span class="art-spark spark-two">✦</span><span class="art-spark spark-three">✦</span>
      <span class="selection-badge">{{ content.badge }}</span>
    </div>
  </RouterLink>
</template>

<style scoped>
.campaign-banner {
  --accent: #ffe36b;
  --ink: #a3290b;
  position: relative;
  display: grid;
  grid-template-columns: 1.18fr 1fr;
  align-items: center;
  height: 430px;
  overflow: hidden;
  isolation: isolate;
  color: #fff;
  text-align: left;
  background: radial-gradient(ellipse at 75% 80%, #ffb219 0, transparent 54%), linear-gradient(115deg, #ed250e 0%, #ff5013 60%, #ff8a0b 100%);
  text-decoration: none;
}
.theme-blue {
  --accent: #fff079;
  --ink: #154b9a;
  background: radial-gradient(ellipse at 82% 80%, #2ce6e2 0, transparent 58%), linear-gradient(115deg, #074ba9, #087bdd 55%, #00bccc);
}
.theme-pink {
  --accent: #fff288;
  --ink: #ae1450;
  background: radial-gradient(ellipse at 80% 90%, #ffb43c 0, transparent 58%), linear-gradient(115deg, #ca0752, #f72c72 60%, #ff7658);
}
.theme-violet {
  --accent: #77fff0;
  --ink: #5323a2;
  background: radial-gradient(ellipse at 85% 80%, #5e6dff 0, transparent 58%), linear-gradient(115deg, #431b9f, #7622d3 55%, #c04de4);
}
.theme-green {
  --accent: #fff27b;
  --ink: #075e46;
  background: radial-gradient(ellipse at 82% 95%, #a7d735 0, transparent 56%), linear-gradient(115deg, #006d54, #07986b 57%, #25bb76);
}
.campaign-banner:focus-visible {
  outline: 3px solid white;
  outline-offset: -6px;
}
.banner-rays {
  position: absolute;
  z-index: -1;
  inset: -150%;
  opacity: .32;
  background: repeating-conic-gradient(from 22deg at 64% 52%, transparent 0deg 15deg, #ffefac22 16deg 21deg, transparent 22deg 35deg);
  transform: rotate(-8deg);
}
.banner-dots {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 260px;
  height: 180px;
  opacity: .25;
  background-image: radial-gradient(#fff 1px, transparent 1px);
  background-size: 12px 12px;
  mask-image: linear-gradient(135deg, transparent, black);
}
.banner-copy {
  position: relative;
  z-index: 3;
  min-width: 0;
  padding: 28px 0 48px 70px;
}
.banner-eyebrow {
  display: flex;
  align-items: center;
  gap: 9px;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 1.4px;
  color: #fff6d7;
}
.banner-eyebrow svg {
  width: 20px;
  height: 22px;
  flex-shrink: 0;
}
.banner-copy h2 {
  margin: 23px 0 15px;
  font-size: clamp(31px, 3.4vw, 49px);
  line-height: 1.15;
  font-weight: 900;
  letter-spacing: -1.6px;
  text-shadow: 0 3px 0 #00000018;
}
.banner-copy h2 em {
  display: block;
  color: var(--accent);
  font-style: normal;
}
.banner-copy > p {
  max-width: 430px;
  font-size: 14px;
  line-height: 1.7;
  color: #fff9e9;
  margin: 0;
}
.banner-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 23px;
}
.offer-ticket {
  display: flex;
  align-items: center;
  gap: 15px;
  min-height: 65px;
  padding: 8px 16px;
  color: var(--ink);
  background: var(--accent);
  border: 1px solid #ffffff66;
  border-radius: 9px;
  box-shadow: 0 5px 0 #00000016;
  transform: rotate(-3deg);
}
.offer-ticket > span {
  font-size: 10px;
  font-weight: 800;
  line-height: 1.4;
}
.offer-ticket small {
  display: block;
  margin-top: 4px;
  font-size: 8px;
  font-weight: 500;
}
.offer-ticket strong {
  border-left: 1px dashed currentColor;
  padding-left: 14px;
  font-size: 37px;
  line-height: 1;
  letter-spacing: -2px;
  font-weight: 850;
}
.banner-cta {
  display: inline-flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
  min-height: 46px;
  padding: 0 17px;
  border-radius: 7px;
  background: #fff;
  color: var(--ink);
  font-size: 12px;
  font-weight: 750;
  box-shadow: 0 4px 0 #00000012;
}
.banner-cta svg {
  width: 19px;
  height: 19px;
}
.banner-validity {
  display: block;
  margin-top: 19px;
  color: #fff2d9;
  font-size: 10px;
}
.banner-art {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
}
.art-stamp {
  position: absolute;
  top: 13px;
  right: 45px;
  font-size: clamp(110px, 12vw, 170px);
  font-weight: 900;
  letter-spacing: -10px;
  line-height: 1;
  color: var(--accent);
  opacity: .95;
  text-shadow: 0 6px 0 #00000012;
  transform: rotate(-7deg);
}
.art-orbit {
  position: absolute;
  width: 375px;
  height: 375px;
  border: 1px solid #ffffff38;
  border-radius: 50%;
  top: 70px;
  right: 35px;
  transform: rotate(-20deg) scaleY(.8);
}
.orbit-two {
  transform: rotate(28deg) scaleY(.8);
}
.art-podium {
  position: absolute;
  width: 390px;
  height: 72px;
  border-radius: 50%;
  right: 32px;
  bottom: 49px;
  background: var(--accent);
  box-shadow: 0 18px 0 #ffffff35, 0 28px 25px #0000001c;
}
.hero-product {
  position: absolute;
  right: 165px;
  bottom: 74px;
  width: 232px;
  height: 247px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: #fffdfa;
  border-radius: 19px;
  transform: rotate(-9deg);
  box-shadow: 0 15px 25px #00000020;
}
.product-tag {
  align-self: start;
  padding: 5px 8px;
  border-radius: 20px;
  background: var(--accent);
  color: var(--ink);
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 1px;
}
.hero-product img {
  width: 100%;
  height: 170px;
  object-fit: contain;
  mix-blend-mode: multiply;
}
.product-caption {
  color: var(--ink);
  font-size: 9px;
  letter-spacing: .5px;
  font-weight: 750;
  padding-top: 4px;
}
.mini-product {
  position: absolute;
  width: 119px;
  padding: 9px;
  border-radius: 14px;
  background: #fffdfa;
  box-shadow: 0 12px 18px #00000022;
  text-align: center;
}
.mini-product img {
  width: 100%;
  height: 100px;
  object-fit: contain;
  mix-blend-mode: multiply;
}
.mini-product > span {
  color: var(--ink);
  font-size: 7px;
  font-weight: 700;
  letter-spacing: .7px;
}
.mini-top {
  right: 47px;
  top: 114px;
  transform: rotate(12deg);
}
.mini-bottom {
  right: 60px;
  bottom: 55px;
  transform: rotate(7deg);
}
.art-spark {
  position: absolute;
  color: var(--accent);
}
.spark-one {
  font-size: 43px;
  left: 5px;
  top: 78px;
}
.spark-two {
  font-size: 26px;
  right: 35px;
  top: 66px;
}
.spark-three {
  font-size: 26px;
  left: 18px;
  bottom: 90px;
}
.selection-badge {
  position: absolute;
  bottom: 25px;
  right: 75px;
  padding: 6px 11px;
  border-radius: 30px;
  border: 1px solid #ffffff66;
  color: #fff;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 1.5px;
}
@media(min-width: 1600px) {
  .banner-copy h2 {
    font-size: 51px;
  }
}
@media(max-width: 1100px) {
  .banner-copy {
    padding-left: 54px;
  }
  .banner-copy h2 {
    font-size: 36px;
  }
  .hero-product {
    width: 195px;
    height: 225px;
    right: 122px;
  }
  .hero-product img {
    height: 150px;
  }
  .mini-product {
    width: 97px;
  }
  .mini-product img {
    height: 80px;
  }
  .mini-top {
    right: 25px;
  }
  .mini-bottom {
    right: 34px;
  }
  .art-podium {
    width: 320px;
    right: 20px;
  }
  .art-stamp {
    right: 25px;
    font-size: 130px;
  }
  .banner-actions {
    gap: 13px;
  }
  .banner-cta {
    font-size: 11px;
  }
  .offer-ticket {
    min-height: 57px;
  }
  .offer-ticket strong {
    font-size: 31px;
  }
}
@media(max-width: 760px) {
  .campaign-banner {
    height: 620px;
    display: block;
  }
  .banner-copy {
    padding: 28px 28px 0;
  }
  .banner-eyebrow {
    font-size: 9px;
    letter-spacing: .8px;
  }
  .banner-copy h2 {
    margin-top: 17px;
    font-size: clamp(27px, 5.5vw, 39px);
    letter-spacing: -1px;
  }
  .banner-copy > p {
    font-size: 12px;
    line-height: 1.6;
    max-width: 430px;
  }
  .banner-actions {
    gap: 10px;
    margin-top: 18px;
    flex-wrap: nowrap;
  }
  .offer-ticket {
    gap: 9px;
    padding: 7px 10px;
    min-height: 53px;
  }
  .offer-ticket > span {
    font-size: 8px;
  }
  .offer-ticket small {
    font-size: 6px;
  }
  .offer-ticket strong {
    font-size: 28px;
    padding-left: 9px;
  }
  .banner-cta {
    padding: 0 11px;
    font-size: 10px;
    gap: 6px;
    min-height: 44px;
  }
  .banner-cta svg {
    width: 16px;
  }
  .banner-validity {
    font-size: 8px;
    margin-top: 15px;
  }
  .banner-art {
    position: absolute;
    bottom: 36px;
    right: 0;
    height: 265px;
    max-width: 420px;
  }
  .art-stamp {
    top: -10px;
    right: 35px;
    font-size: 100px;
    letter-spacing: -7px;
  }
  .hero-product {
    bottom: 36px;
    right: 127px;
    width: 175px;
    height: 181px;
    padding: 9px;
  }
  .hero-product img {
    height: 125px;
  }
  .product-tag {
    font-size: 6px;
    padding: 3px 6px;
  }
  .product-caption {
    font-size: 7px;
  }
  .mini-product {
    width: 83px;
    padding: 6px;
    border-radius: 10px;
  }
  .mini-product img {
    height: 65px;
  }
  .mini-product > span {
    font-size: 5px;
  }
  .mini-top {
    top: 45px;
    right: 35px;
  }
  .mini-bottom {
    bottom: 20px;
    right: 38px;
  }
  .art-podium {
    width: 283px;
    height: 47px;
    right: 27px;
    bottom: 15px;
  }
  .art-orbit {
    width: 270px;
    height: 250px;
    right: 24px;
    top: 15px;
  }
  .selection-badge {
    bottom: -16px;
    right: 50px;
    font-size: 6px;
  }
  .spark-one {
    left: 32px;
    top: 24px;
    font-size: 30px;
  }
  .spark-three {
    left: 25px;
    bottom: 35px;
  }
  .spark-two {
    top: 0;
    right: 24px;
    font-size: 20px;
  }
}
@media(max-width: 380px) {
  .banner-copy {
    padding-left: 22px;
    padding-right: 22px;
  }
  .banner-copy h2 {
    font-size: 26px;
  }
  .banner-actions {
    gap: 8px;
  }
  .offer-ticket > span {
    max-width: 66px;
  }
  .banner-cta {
    max-width: 145px;
    font-size: 9px;
  }
  .hero-product {
    right: 112px;
  }
  .mini-top {
    right: 25px;
  }
  .mini-bottom {
    right: 28px;
  }
  .art-podium {
    right: 17px;
  }
}
</style>
