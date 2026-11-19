<route lang="yaml">
meta:
  layout: buyer/LBHome
</route>

<script setup>
import PromotionRequest from '~/services/promotion-request'
import AccountRequest from '~/services/account-request'
import { localDate, money, requestError } from '~/utils/checkout'
import { remainingUses, voucherState } from '~/utils/promotion'
import { campaignById, promotionCampaigns } from '~/data/promotion-campaigns'

const route = useRoute()
const router = useRouter()
const campaign = computed(() => String(route.params.campaign))
const names = Object.fromEntries(promotionCampaigns.map(item => [item.id, item.name]))
const content = computed(() => campaignById[campaign.value])
const validCampaign = computed(() => promotionCampaigns.some(item => item.id === campaign.value))
useHead({ title: computed(() => `${names[campaign.value] || 'Ưu đãi'} | Shoppe`) })
const vouchers = ref([])
const savedIds = ref([])
const customerUses = ref({})
const loading = ref(true)
const error = ref('')
const notice = ref('')
const savingIds = ref([])
const copied = ref('')
const now = ref(Date.now())
let clock
let loadVersion = 0
const state = voucher => voucherState({ ...voucher, customer_used_count: customerUses.value[voucher.id] || 0 }, now.value)
const activeCount = computed(() => vouchers.value.filter(v => state(v) === 'available').length)

async function load() {
  const version = ++loadVersion
  loading.value = true
  error.value = ''
  notice.value = ''
  vouchers.value = []
  savedIds.value = []
  customerUses.value = {}
  if (!validCampaign.value) {
    loading.value = false
    return
  }
  try {
    const { data } = await PromotionRequest.getCampaign(campaign.value)
    if (version !== loadVersion) return
    vouchers.value = data.vouchers || []
    if (localStorage.getItem('token')) {
      try {
        const { data: records } = await AccountRequest.getVouchers()
        if (version !== loadVersion) return
        savedIds.value = records.filter(v => v.saved_at).map(v => v.id)
        customerUses.value = Object.fromEntries(records.map(v => [v.id, v.customer_used_count]))
      }
      catch {
        notice.value = 'Chưa tải được trạng thái đã lưu. Bạn vẫn có thể lưu mã; hệ thống không lưu trùng.'
      }
    }
  }
  catch (failure) {
    if (version === loadVersion) error.value = requestError(failure, 'Không tải được ưu đãi. Vui lòng thử lại.')
  }
  finally {
    if (version === loadVersion) loading.value = false
  }
}
onMounted(() => {
  watch(campaign, load, { immediate: true })
  clock = setInterval(() => { now.value = Date.now() }, 30000)
})
onBeforeUnmount(() => { clearInterval(clock); loadVersion++ })

async function save(voucher) {
  if (savingIds.value.includes(voucher.id) || state(voucher) !== 'available') return
  if (!localStorage.getItem('token')) {
    await router.push({ path: '/buyer/login', query: { redirect: route.path } })
    return
  }
  savingIds.value.push(voucher.id)
  error.value = ''
  try {
    await PromotionRequest.saveVoucher(voucher.id)
    savedIds.value = [...new Set([...savedIds.value, voucher.id])]
    notice.value = `Đã lưu ${voucher.code} vào Kho voucher. Sao chép mã và nhập ở bước thanh toán.`
  }
  catch (failure) {
    if (failure.response?.status === 401)
      await router.push({ path: '/buyer/login', query: { redirect: route.path } })
    else
      error.value = requestError(failure, 'Chưa lưu được voucher. Vui lòng thử lại.')
  }
  finally {
    savingIds.value = savingIds.value.filter(id => id !== voucher.id)
  }
}
async function copy(voucher) {
  try {
    await navigator.clipboard.writeText(voucher.code)
    copied.value = voucher.code
    notice.value = `Đã sao chép ${voucher.code}. Nhập mã khi thanh toán để áp dụng.`
  }
  catch {
    error.value = 'Không sao chép tự động được. Bạn có thể chọn và sao chép mã trên vé.'
  }
}
</script>

<template>
  <section class="promotion-page">
    <nav class="promotion-breadcrumb" aria-label="Đường dẫn">
      <RouterLink to="/buyer/home">
        Trang chủ
      </RouterLink><span aria-hidden="true">/</span><span>{{ names[campaign] || 'Ưu đãi' }}</span>
    </nav>
    <template v-if="validCampaign">
      <div class="promotion-masthead" :class="['masthead-' + content.theme, { 'masthead-sale': campaign === 'sale-11-11' }]">
        <div><span class="promotion-kicker">SHOPPE · MÙA MUA SẮM THÁNG 11/2026</span><h1>{{ names[campaign] }}</h1><p>{{ content.description }}</p><a href="#monthly-vouchers" class="masthead-link">Khám phá kho voucher <span aria-hidden="true">↓</span></a></div>
        <div class="masthead-art" aria-hidden="true">
          <span>{{ content.stamp }}</span><small>SHOPPE · THE SHOPPING SEASON</small>
        </div>
      </div>
      <nav class="promotion-navigation" aria-label="Chương trình ưu đãi">
        <RouterLink v-for="item in promotionCampaigns" :key="item.id" :to="'/buyer/promotions/' + item.id" :aria-current="campaign === item.id ? 'page' : undefined">
          {{ item.name }}
        </RouterLink><RouterLink to="/buyer/account/vouchers">
          Kho voucher của tôi <span aria-hidden="true">↗︎</span>
        </RouterLink>
      </nav>
      <div id="monthly-vouchers" class="voucher-section-heading">
        <div><span class="promotion-kicker">LƯU HÔM NAY, MUA THẬT HỜI</span><h2>Voucher giới hạn tháng 11<span class="heading-dot">.</span></h2><p>Có hiệu lực từ 01–30/11/2026 · Mỗi mã dùng 1 lần/người</p></div><span v-if="!loading && !error" class="available-count">{{ activeCount }} ưu đãi có thể dùng</span>
      </div>
      <p v-if="notice" class="promotion-notice" role="status">
        {{ notice }}
      </p>
      <div v-if="error" class="promotion-error" role="alert">
        {{ error }} <button type="button" @click="load">
          Tải lại ưu đãi
        </button>
      </div>
      <div v-if="loading" class="promotion-empty" role="status">
        Đang mở kho ưu đãi…
      </div>
      <div v-else-if="!vouchers.length && !error" class="promotion-empty">
        Chưa có voucher cho chương trình này. Vui lòng quay lại sau.
      </div>
      <div v-else class="promotion-vouchers">
        <article v-for="voucher in vouchers" :key="voucher.id" class="monthly-ticket" :class="{ 'ticket-unavailable': state(voucher) === 'unavailable' }">
          <div class="ticket-stub">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4ZM9 5v14" /></svg><strong>{{ voucher.discount_type === 'percentage' ? `${Number(voucher.discount_value)}%` : money(voucher.discount_value) }}</strong><span>Shoppe</span>
          </div>
          <div class="ticket-body">
            <div class="ticket-label">
              <span>SỐ LƯỢT CÓ HẠN</span><span v-if="savedIds.includes(voucher.id)" class="saved-mark">✓ Đã lưu</span>
            </div><h3>{{ voucher.name }}</h3><p v-if="voucher.maximum_discount">
              Giảm tối đa <strong>{{ money(voucher.maximum_discount) }}</strong>
            </p><p>Đơn từ {{ money(voucher.minimum_order_value) }}</p><code>{{ voucher.code }}</code><div class="ticket-progress" role="meter" aria-label="Lượt voucher đã sử dụng" :aria-valuenow="Number(voucher.used_count)" :aria-valuemin="0" :aria-valuemax="Number(voucher.max_uses)">
              <span :style="{ width: `${Math.min(100, Number(voucher.used_count) / Math.max(1, Number(voucher.max_uses)) * 100)}%` }" />
            </div><p class="ticket-remaining">
              Còn {{ remainingUses(voucher) }} / {{ voucher.max_uses }} lượt sử dụng
            </p>
            <div class="ticket-bottom">
              <span>HSD {{ localDate(voucher.ends_at) }}</span><button v-if="savedIds.includes(voucher.id) && state(voucher) === 'available'" type="button" @click="copy(voucher)">
                {{ copied === voucher.code ? 'Đã sao chép' : 'Sao chép mã' }}
              </button><button v-else type="button" :disabled="state(voucher) !== 'available' || savingIds.includes(voucher.id)" @click="save(voucher)">
                {{ state(voucher) === 'unavailable' ? 'Hết hiệu lực' : state(voucher) === 'upcoming' ? 'Sắp mở' : savingIds.includes(voucher.id) ? 'Đang lưu…' : 'Lưu voucher' }}
              </button>
            </div>
            <details class="ticket-terms">
              <summary>Điều kiện sử dụng</summary><p>Áp dụng từ {{ localDate(voucher.starts_at) }} đến {{ localDate(voucher.ends_at) }}. Tối đa {{ voucher.max_uses_per_customer }} lượt/người, một mã cho mỗi lần thanh toán. Lưu mã không giữ chỗ lượt sử dụng; hệ thống kiểm tra số lượt và giá trị đơn khi thanh toán.</p>
            </details>
          </div>
        </article>
      </div>
      <aside class="promotion-guide">
        <span class="guide-number">01</span><p><strong>Lưu ưu đãi yêu thích</strong><span>Đăng nhập để lưu mã vào tài khoản.</span></p><span class="guide-number">02</span><p><strong>Chọn món đồ bạn muốn</strong><span>Kiểm tra giá trị đơn tối thiểu.</span></p><span class="guide-number">03</span><p><strong>Nhập mã khi thanh toán</strong><span>Ưu đãi được tính trực tiếp trên đơn.</span></p>
      </aside>
      <RouterLink to="/buyer/home" class="continue-shopping">
        Tiếp tục khám phá sản phẩm <span aria-hidden="true">→</span>
      </RouterLink>
    </template>
    <div v-else class="promotion-empty">
      <h1>Không tìm thấy chương trình</h1><RouterLink to="/buyer/home">
        Quay lại trang chủ
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.promotion-page {
  max-width: 1232px;
  margin: auto;
  padding: 22px 24px 60px;
  color: #3b2d24;
  text-align: left;
}
.promotion-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #8b7868;
  margin-bottom: 22px;
}
.promotion-breadcrumb a {
  color: #8c3a25;
}
.promotion-masthead {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  align-items: center;
  gap: 20px;
  position: relative;
  overflow: hidden;
  padding: 42px;
  border-radius: 18px;
  background: #f5ecde;
}
.promotion-kicker {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.7px;
}
.promotion-masthead h1 {
  font-size: clamp(28px, 3vw, 42px);
  font-weight: 750;
  line-height: 1.25;
  letter-spacing: -1.3px;
  margin: 20px 0 14px;
}
.promotion-masthead p {
  font-size: 14px;
  line-height: 1.8;
}
.masthead-link {
  display: inline-flex;
  gap: 22px;
  align-items: center;
  min-height: 46px;
  background: #3b2d24;
  color: white;
  padding: 0 18px;
  margin-top: 25px;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
}
.masthead-art {
  text-align: center;
  transform: rotate(-8deg);
}
.masthead-art > span {
  display: block;
  font-size: clamp(64px, 10vw, 138px);
  font-weight: 850;
  line-height: 1;
  letter-spacing: -8px;
  color: #ae5636;
}
.masthead-art > small {
  display: block;
  margin-top: 16px;
  font-size: 9px;
  letter-spacing: 3px;
}
.masthead-sale {
  background: radial-gradient(ellipse at right top, #ff9b3b, transparent 65%), #d8371c;
  color: #fff5dc;
}
.masthead-sale .masthead-art > span {
  color: #fff0c9;
  text-shadow: 0 6px #b92e1b;
}
.masthead-sale .masthead-link {
  background: #fff4d4;
  color: #9e2a16;
}
.promotion-navigation {
  display: flex;
  gap: 24px;
  overflow-x: auto;
  border-bottom: 1px solid #e7ded4;
  margin-bottom: 38px;
}
.promotion-navigation a {
  flex-shrink: 0;
  white-space: nowrap;
  padding: 21px 0 17px;
  font-size: 13px;
  color: #847264;
  border-bottom: 3px solid transparent;
}
.promotion-navigation a[aria-current] {
  color: #b04328;
  border-color: #d65232;
  font-weight: 700;
}
.promotion-navigation a:last-child {
  margin-left: auto;
}
.voucher-section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18px;
  scroll-margin-top: 25px;
  margin-bottom: 25px;
}
.voucher-section-heading .promotion-kicker {
  color: #a74c30;
}
.voucher-section-heading h2 {
  font-size: clamp(23px, 2.5vw, 31px);
  font-weight: 750;
  line-height: 1.3;
  margin: 10px 0;
  letter-spacing: -.7px;
}
.heading-dot {
  color: #da5030;
}
.voucher-section-heading p {
  font-size: 12px;
  color: #847466;
}
.available-count {
  font-size: 11px;
  border: 1px solid #ebd7c4;
  background: #fff8ed;
  color: #a14a2b;
  padding: 8px 12px;
  border-radius: 20px;
  white-space: nowrap;
}
.promotion-vouchers {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 22px;
}
.monthly-ticket {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  background: #fffdf9;
  border: 1px solid #eddcd0;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px #784d2110;
}
.ticket-stub {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 15px 8px;
  background: #e95130;
  color: #fff6e8;
  border-right: 2px dashed #ffd4b2;
}
.ticket-stub svg {
  width: 36px;
  height: 36px;
}
.ticket-stub strong {
  font-size: 28px;
  letter-spacing: -1px;
  word-break: break-word;
}
.ticket-stub > span {
  font-size: 9px;
  letter-spacing: 1.2px;
}
.ticket-body {
  min-width: 0;
  padding: 18px 19px 13px;
}
.ticket-label {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 6px;
  font-size: 8px;
  letter-spacing: 1px;
  color: #ad582b;
  font-weight: 700;
}
.saved-mark {
  color: #1c7963;
}
.ticket-body h3 {
  margin: 12px 0 8px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}
.ticket-body p {
  font-size: 12px;
  line-height: 1.8;
  color: #847164;
  margin: 0;
}
.ticket-body code {
  display: inline-block;
  margin: 12px 0;
  font-size: 12px;
  letter-spacing: 1px;
  color: #a63b26;
  background: #fff0e6;
  border: 1px dashed #e2b292;
  padding: 4px 9px;
  user-select: text;
}
.ticket-progress {
  height: 4px;
  background: #f5e7db;
  overflow: hidden;
  border-radius: 5px;
}
.ticket-progress span {
  display: block;
  height: 100%;
  background: #e95130;
}
.ticket-body .ticket-remaining {
  font-size: 10px;
  margin-top: 5px;
}
.ticket-bottom {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}
.ticket-bottom > span {
  font-size: 10px;
  color: #857364;
}
.ticket-bottom button {
  min-height: 44px;
  padding: 0 17px;
  border-radius: 5px;
  color: #fff;
  background: #c84125;
  font-size: 12px;
  font-weight: 600;
}
.ticket-bottom button:disabled {
  background: #e8e1db;
  color: #776b60;
  cursor: default;
}
.ticket-terms {
  margin-top: 11px;
}
.ticket-terms summary {
  color: #a45232;
  cursor: pointer;
  font-size: 11px;
  padding: 5px 0;
}
.ticket-terms p {
  font-size: 11px;
  padding-top: 5px;
}
.ticket-unavailable .ticket-stub {
  background: #9e8f82;
}
.promotion-guide {
  display: grid;
  grid-template-columns: auto 1fr auto 1fr auto 1fr;
  gap: 16px;
  align-items: start;
  margin-top: 35px;
  border-radius: 12px;
  background: #f7f2eb;
  padding: 27px;
}
.guide-number {
  font-size: 24px;
  font-weight: 700;
  color: #bd714e;
}
.promotion-guide p {
  margin: 0;
}
.promotion-guide strong, .promotion-guide p > span {
  display: block;
}
.promotion-guide strong {
  font-size: 12px;
  margin-bottom: 7px;
}
.promotion-guide p > span {
  font-size: 11px;
  color: #897365;
  line-height: 1.6;
}
.continue-shopping {
  display: flex;
  justify-content: center;
  gap: 24px;
  align-items: center;
  min-height: 48px;
  margin: 30px auto 0;
  width: fit-content;
  padding: 0 22px;
  background: #3b2d24;
  border-radius: 6px;
  color: white;
  font-size: 13px;
}
.promotion-notice, .promotion-error {
  padding: 14px 17px;
  border-radius: 8px;
  font-size: 13px;
  margin-bottom: 20px;
  line-height: 1.7;
}
.promotion-notice {
  background: #eaf6ef;
  color: #23664f;
}
.promotion-error {
  background: #fff0e9;
  color: #a23320;
}
.promotion-error button {
  text-decoration: underline;
  font-weight: 700;
  margin-left: 10px;
  min-height: 44px;
}
.promotion-empty {
  text-align: center;
  padding: 50px 20px;
  font-size: 14px;
  color: #8c7463;
}
.promotion-page a:focus-visible, .promotion-page button:focus-visible, .promotion-page summary:focus-visible {
  outline: 3px solid #176d71;
  outline-offset: 4px;
}
@media(max-width: 850px) {
  .promotion-page {
    padding: 20px 16px 40px;
  }
  .promotion-masthead {
    padding: 30px;
  }
  .monthly-ticket {
    grid-template-columns: 85px minmax(0, 1fr);
  }
  .ticket-body {
    padding: 16px 13px;
  }
  .ticket-stub strong {
    font-size: 24px;
  }
  .promotion-guide {
    gap: 10px;
    padding: 20px;
  }
}
@media(max-width: 680px) {
  .promotion-masthead {
    grid-template-columns: 1fr;
    gap: 30px;
    padding: 28px 23px;
  }
  .promotion-masthead h1 {
    font-size: 31px;
  }
  .masthead-art {
    display: none;
  }
  .promotion-navigation {
    gap: 18px;
    flex-wrap: nowrap;
    margin-bottom: 28px;
  }
  .promotion-navigation a {
    font-size: 11px;
    padding: 17px 0 13px;
  }
  .promotion-navigation a:last-child {
    margin-left: 0;
  }
  .voucher-section-heading {
    align-items: start;
    flex-direction: column;
    gap: 12px;
  }
  .promotion-vouchers {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  .monthly-ticket {
    grid-template-columns: 90px minmax(0, 1fr);
  }
  .promotion-guide {
    grid-template-columns: auto 1fr;
    gap: 19px;
  }
  .ticket-body h3 {
    font-size: 15px;
  }
  .promotion-kicker {
    font-size: 9px;
    letter-spacing: 1px;
  }
}
:global(.dark) .promotion-page {
  color: #f4dfcc;
}

:global(.dark) .monthly-ticket {
  background: #302820;
  border-color: #65513e;
}
:global(.dark) .ticket-body p, :global(.dark) .ticket-bottom > span, :global(.dark) .voucher-section-heading p, :global(.dark) .promotion-navigation a {
  color: #c8b7a6;
}
:global(.dark) .promotion-guide {
  background: #302820;
}
:global(.dark) .promotion-guide p > span {
  color: #c8b7a6;
}
:global(.dark) .ticket-terms summary {
  color: #ffac85;
}

.promotion-masthead { color: #fff6dc; }
.masthead-blue { background: radial-gradient(ellipse at right top, #13c5de, transparent 70%), #0867bf; }
.masthead-pink { background: radial-gradient(ellipse at right top, #ff9e4a, transparent 70%), #e12766; }
.masthead-violet { background: radial-gradient(ellipse at right top, #af70ff, transparent 70%), #5c25ba; }
.masthead-green { background: radial-gradient(ellipse at right top, #6fc96e, transparent 70%), #078360; }
.promotion-masthead .masthead-art > span { color: #fff080; }
.promotion-masthead .masthead-link { background: #fff4d4; color: #7c3216; }
</style>
