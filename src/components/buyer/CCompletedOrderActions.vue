<script setup>
import OrderRequest from '~/services/order-request'
import { orderItems, requestError } from '~/utils/checkout'

const props = defineProps({ order: { type: Object, required: true } })
const emit = defineEmits(['reviewed'])
const router = useRouter()
const modal = ref(null)
const contactModal = ref(null)
const saving = ref(false)
const buying = ref(false)
const error = ref('')
const reviewError = ref('')
const selected = ref('')
const drafts = reactive({})
const saved = ref({})
const products = computed(() => [...new Map(orderItems(props.order).filter(item => item.product_id).map(item => [String(item.product_id), item])).values()])
const reviews = computed(() => ({ ...Object.fromEntries((props.order.reviews || []).map(review => [String(review.product_id), review])), ...saved.value }))
const allReviewed = computed(() => products.value.length > 0 && products.value.every(item => reviews.value[item.product_id]))
const currentReview = computed(() => reviews.value[selected.value])
const draft = computed(() => drafts[selected.value])
const headingId = computed(() => `review-heading-${props.order.id}`)

watch(selected, (id) => {
  reviewError.value = ''
  if (id && !drafts[id]) drafts[id] = { rating: null, comment: '' }
})

function openReviews() {
  selected.value = String(products.value.find(item => !reviews.value[item.product_id])?.product_id || products.value[0]?.product_id || '')
  reviewError.value = ''
  modal.value.showModal()
}
function closeReviews() {
  if (!saving.value) modal.value.close()
}
async function submitReview() {
  if (saving.value || !draft.value?.rating) return
  saving.value = true
  reviewError.value = ''
  const productId = selected.value
  try {
    const { data } = await OrderRequest.review({ order_id: props.order.id, product_id: Number(productId), rating: Number(draft.value.rating), comment: draft.value.comment.trim() })
    saved.value = { ...saved.value, [productId]: data }
    emit('reviewed', data)
  }
  catch (failure) {
    reviewError.value = requestError(failure, 'Không lưu được đánh giá. Bạn có thể thử gửi lại.')
  }
  finally {
    saving.value = false
  }
}
async function buyAgain() {
  if (buying.value) return
  buying.value = true
  error.value = ''
  try {
    await OrderRequest.buyAgain(props.order.id)
    await router.push('/buyer/cart')
  }
  catch (failure) {
    error.value = requestError(failure, 'Không thể mua lại đơn hàng. Vui lòng thử lại.')
  }
  finally {
    buying.value = false
  }
}
</script>

<template>
  <div v-if="Number(order.status_id) === 4" class="completed-actions">
    <div class="completed-buttons">
      <button type="button" class="repurchase-button" :disabled="buying" @click="buyAgain">
        {{ buying ? 'Đang thêm vào giỏ…' : 'Mua Lại' }}
      </button>
      <button v-if="products.length" type="button" class="review-button" @click="openReviews">
        {{ allReviewed ? 'Xem đánh giá' : 'Đánh giá' }}
      </button>
      <button v-if="order.shop_id" type="button" class="shop-button" @click="contactModal.showModal()">
        Liên Hệ Người Bán
      </button>
    </div>
    <p v-if="error" class="action-error" role="alert">
      {{ error }}
    </p>
    <dialog ref="contactModal" class="review-modal" :aria-labelledby="'contact-heading-' + order.id" @click="event => event.target === contactModal && contactModal.close()">
      <header class="review-header">
        <div>
          <h2 :id="'contact-heading-' + order.id">
            Liên hệ người bán
          </h2>
          <p>{{ order.shop?.name || order.product?.shop?.name }}</p>
        </div>
        <button type="button" aria-label="Đóng thông tin liên hệ" @click="contactModal.close()">
          ×
        </button>
      </header>
      <p v-if="order.shop?.phone" class="contact-line">
        Điện thoại: <a :href="'tel:' + order.shop.phone">{{ order.shop.phone }}</a>
      </p>
      <p v-if="order.shop?.email" class="contact-line">
        Email: <a :href="'mailto:' + order.shop.email">{{ order.shop.email }}</a>
      </p>
      <p v-if="!order.shop?.phone && !order.shop?.email">
        Shop chưa cập nhật thông tin liên hệ.
      </p>
      <footer class="review-footer">
        <RouterLink :to="'/shop/' + order.shop_id" class="shop-button" @click="contactModal.close()">
          Xem Shop
        </RouterLink>
      </footer>
    </dialog>
    <dialog ref="modal" class="review-modal" :aria-labelledby="headingId" @cancel.prevent="closeReviews" @click="event => event.target === modal && closeReviews()">
      <header class="review-header">
        <div>
          <h2 :id="headingId">
            {{ allReviewed ? 'Đánh giá của bạn' : 'Đánh giá sản phẩm' }}
          </h2>
          <p>Đơn {{ order.order_code || '#' + order.id }}</p>
        </div>
        <button type="button" aria-label="Đóng đánh giá" :disabled="saving" @click="closeReviews">
          ×
        </button>
      </header>
      <label class="review-product-label" :for="'review-product-' + order.id">Sản phẩm đã mua</label>
      <select :id="'review-product-' + order.id" v-model="selected" :disabled="saving">
        <option v-for="item in products" :key="item.product_id" :value="String(item.product_id)">
          {{ item.product_name }}{{ reviews[item.product_id] ? ' · Đã đánh giá' : '' }}
        </option>
      </select>
      <div v-if="currentReview" class="saved-review" role="status">
        <p class="saved-stars" :aria-label="currentReview.rating + ' trên 5 sao'">
          {{ '★'.repeat(currentReview.rating) }}{{ '☆'.repeat(5 - currentReview.rating) }}
        </p>
        <p class="saved-confirmation">
          Đánh giá đã được lưu
        </p>
        <p>{{ currentReview.comment || 'Bạn chưa viết nhận xét.' }}</p>
      </div>
      <form v-else-if="draft" @submit.prevent="submitReview">
        <fieldset :disabled="saving" class="review-stars">
          <legend>Chất lượng sản phẩm</legend>
          <label v-for="star in 5" :key="star" :class="{ selected: Number(draft.rating) >= star }">
            <input v-model="draft.rating" type="radio" :name="'rating-' + order.id" :value="star" :aria-label="star + ' sao'" required>
            <span aria-hidden="true">★</span>
            <span class="star-number">{{ star }}</span>
          </label>
        </fieldset>
        <label class="review-product-label" :for="'review-comment-' + order.id">Nhận xét của bạn <span>(không bắt buộc)</span></label>
        <textarea :id="'review-comment-' + order.id" v-model="draft.comment" :disabled="saving" maxlength="2000" rows="4" placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm…" />
        <p class="character-count">
          {{ draft.comment.length }}/2.000
        </p>
        <p v-if="reviewError" class="action-error" role="alert">
          {{ reviewError }}
        </p>
        <footer class="review-footer">
          <button type="button" class="shop-button" :disabled="saving" @click="closeReviews">
            Để sau
          </button>
          <button type="submit" class="repurchase-button" :disabled="saving || !draft.rating">
            {{ saving ? 'Đang gửi…' : 'Gửi đánh giá' }}
          </button>
        </footer>
      </form>
      <footer v-else class="review-footer">
        <button type="button" class="shop-button" @click="closeReviews">
          Đóng
        </button>
      </footer>
    </dialog>
  </div>
</template>

<style scoped>
.completed-actions { width: 100%; }
.contact-line { margin: 12px 0; overflow-wrap: anywhere; }
.contact-line a { color: #d94323; text-decoration: underline; }
.completed-buttons, .review-footer { display: flex; justify-content: flex-end; flex-wrap: wrap; gap: 10px; }
.repurchase-button, .review-button, .shop-button { display: inline-flex; align-items: center; justify-content: center; min-height: 42px; padding: 10px 24px; border: 1px solid #dedede; border-radius: 3px; background: #fff; color: #444; font: inherit; font-size: 14px; text-decoration: none; cursor: pointer; }
.repurchase-button { min-width: 150px; background: #ee4d2d; border-color: #ee4d2d; color: #fff; }
.repurchase-button:hover:enabled { background: #d94125; }
.review-button { color: #d94323; border-color: #ee4d2d; }
button:disabled { opacity: .55; cursor: not-allowed; }
button:focus-visible, a:focus-visible, select:focus-visible, textarea:focus-visible { outline: 2px solid #ee4d2d; outline-offset: 3px; }
.action-error { color: #a52b18; margin-top: 12px; text-align: left; font-size: 13px; }
.review-modal { box-sizing: border-box; width: min(560px, calc(100vw - 32px)); max-height: calc(100dvh - 32px); overflow-y: auto; margin: auto; padding: 26px; border: 0; border-radius: 5px; background: #fff; color: #333; box-shadow: 0 16px 60px #0003; text-align: left; font: 14px/1.6 Arial, Helvetica, sans-serif; }
.review-modal::backdrop { background: #0007; }
.review-header { display: flex; gap: 16px; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; }
.review-header h2 { margin: 0; font-size: 21px; font-weight: 500; }
.review-header p { color: #777; font-size: 12px; margin-top: 4px; overflow-wrap: anywhere; }
.review-header > button { background: transparent; border: 0; font: inherit; font-size: 28px; min-width: 36px; min-height: 36px; cursor: pointer; }
.review-product-label { display: block; margin-bottom: 8px; }
.review-product-label span { color: #777; font-size: 12px; }
.review-modal select, .review-modal textarea { box-sizing: border-box; width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 3px; background: #fff; color: #333; font: inherit; }
.review-modal textarea { resize: vertical; }
.review-stars { display: flex; flex-wrap: wrap; gap: 12px; border: 0; padding: 0; margin: 24px 0; }
.review-stars legend { margin-bottom: 8px; }
.review-stars label { position: relative; display: inline-flex; align-items: center; justify-content: center; flex-direction: column; min-width: 44px; min-height: 54px; cursor: pointer; color: #aaa; }
.review-stars input { position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer; }
.review-stars label:focus-within { outline: 2px solid #ee4d2d; outline-offset: 2px; border-radius: 3px; }
.review-stars label > span:first-of-type, .saved-stars { font-size: 30px; line-height: 1.2; }
.review-stars label.selected, .saved-stars { color: #ed9b19; }
.star-number { font-size: 11px; }
.character-count { text-align: right; color: #777; font-size: 11px; margin-top: 4px; }
.review-footer { margin-top: 24px; }
.saved-review { padding-top: 24px; white-space: pre-wrap; overflow-wrap: anywhere; }
.saved-confirmation { color: #27806c; margin: 10px 0; }
@media (max-width: 600px) { .completed-buttons > * { flex: 1; padding: 10px 12px; min-width: 100px; } .review-modal { padding: 20px; } }
</style>
