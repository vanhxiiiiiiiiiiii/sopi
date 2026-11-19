<route lang="yaml">
meta:
  layout: buyer/account/LBDashboard
</route>

<script setup>
import { shipmentStatuses } from '~/utils/delivery'
import OrderRequest from '~/services/order-request'
import { buyerOrderStatuses, localDate, money, orderItems, purchaseTabs, requestError } from '~/utils/checkout'

import { fallbackProductImage, getResources } from '~/utils/resources'

const router = useRouter()
const route = useRoute()
const status = ref(Object.prototype.hasOwnProperty.call(purchaseTabs, route.query.status) ? String(route.query.status) : '')
const attempt = ref(0)
const page = ref(1)
function selectStatus(value) {
  status.value = String(value)
  page.value = 1
  router.replace({ query: { ...route.query, status: value || undefined } })
}
const result = ref(null)
const loading = ref(true)
const error = ref('')

onMounted(() => {
  if (!localStorage.getItem('token')) {
    router.replace('/buyer/login')
    return
  }
  watch(
    [status, page, attempt],
    async(_, __, onCleanup) => {
      let active = true
      onCleanup(() => {
        active = false
      })
      loading.value = true
      error.value = ''
      try {
        const { data } = await OrderRequest.getOrders({
          params: { limit: 10, page: page.value, purchase_status: status.value || undefined },
        })
        if (active) result.value = data
      }
      catch (failure) {
        if (active) error.value = requestError(failure, 'Không tải được lịch sử đơn hàng.')
      }
      finally {
        if (active) loading.value = false
      }
    },
    { immediate: true },
  )
})
</script>

<template>
  <div class="purchase-page purchase-history">
    <div class="purchase-layout">
      <section class="purchase-content" aria-labelledby="purchase-title">
        <h1 id="purchase-title" class="purchase-heading">
          Đơn mua của tôi
        </h1>
        <div class="status-tabs" role="group" aria-label="Lọc theo trạng thái đơn hàng">
          <button
            v-for="(label, id) in purchaseTabs"
            :key="id"
            type="button"
            :aria-pressed="String(status) === String(id)"
            @click="selectStatus(id)"
          >
            {{ label }}
          </button>
        </div>
        <div class="list-caption">
          <p>{{ purchaseTabs[status] }}</p>
          <span v-if="!loading && !error">{{ result?.total ?? 0 }} đơn hàng</span>
        </div>
        <div v-if="error" class="purchase-alert" role="alert">
          <p>{{ error }}</p>
          <button type="button" class="button-secondary" @click="attempt++">
            Thử lại
          </button>
        </div>
        <div v-if="loading" class="order-card state-card" role="status">
          <span class="loader" aria-hidden="true" />
          <h2>Đang tải đơn hàng</h2>
          <p>Đang lấy lịch sử mua sắm của bạn…</p>
        </div>
        <template v-else-if="!error">
          <div v-if="!result?.data?.length" class="order-card state-card">
            <span class="empty-icon" aria-hidden="true">□</span>
            <h2>Chưa có đơn hàng ở đây</h2>
            <p>Các đơn hàng thuộc trạng thái này sẽ xuất hiện tại đây.</p>
            <RouterLink to="/buyer/home" class="button-primary">
              Khám phá sản phẩm
            </RouterLink>
          </div>
          <article
            v-for="record in result?.data ?? []"
            :key="record.id"
            class="order-card"
          >
            <header class="order-card-header">
              <div>
                <div class="shop-heading">
                  <p class="shop-name">
                    {{ record.shop?.name || record.product?.shop?.name || 'Đơn hàng của bạn' }}
                  </p>
                  <RouterLink v-if="record.shop_id" :to="'/shop/' + record.shop_id" class="visit-shop">
                    Xem Shop
                  </RouterLink>
                </div>
                <p class="order-meta">
                  {{ record.order_code || '#' + record.id }} <span>·</span>
                  {{ localDate(record.created_at) }}
                </p>
              </div>
              <div class="order-status-summary">
                <RouterLink v-if="record.shipment" :to="'/buyer/order/' + record.id" class="shipment-summary">
                  <IBShipping aria-hidden="true" />
                  {{ shipmentStatuses[record.shipment.status] || record.shipment.status }}
                </RouterLink>
                <span class="buyer-order-state">{{ buyerOrderStatuses[record.status_id] || 'Đang cập nhật' }}</span>
              </div>
            </header>
            <div class="order-products">
              <div
                v-for="item in orderItems(record)"
                :key="item.id"
                class="order-product"
              >
                <img
                  :src="
                    getResources(
                      item.product?.images?.[0] ??
                        (item.product_id === record.product_id
                          ? record.product?.images?.[0]
                          : null),
                    )
                  "
                  :alt="item.product_name"
                  width="84"
                  height="84"
                  loading="lazy"
                  @error="fallbackProductImage"
                >
                <div class="product-description">
                  <RouterLink
                    v-if="item.product_id"
                    :to="'/product/' + item.product_id"
                    class="product-title"
                  >
                    {{ item.product_name }}
                  </RouterLink>
                  <p v-else class="product-title">
                    {{ item.product_name }}
                  </p>
                  <p class="product-options">
                    {{ item.variations?.join(' / ') || 'Phân loại mặc định' }}
                  </p>
                  <span class="product-quantity">x{{ item.quantity }}</span>
                </div>
                <strong class="product-price">{{ money(item.line_total) }}</strong>
              </div>
            </div>
            <footer class="order-card-footer">
              <div class="order-actions">
                <p class="order-total">
                  Thành tiền
                  <strong>{{
                    money(record.payment_total ?? record.grand_total)
                  }}</strong>
                </p>
                <CCompletedOrderActions v-if="Number(record.status_id) === 4" :order="record" />
                <RouterLink :to="'/buyer/order/' + record.id" class="order-detail-link">
                  Xem chi tiết đơn hàng
                </RouterLink>
              </div>
            </footer>
          </article>
          <nav
            v-if="result?.last_page > 1"
            class="order-pagination"
            aria-label="Phân trang đơn hàng"
          >
            <button
              type="button"
              class="button-secondary"
              :disabled="page <= 1"
              @click="page--"
            >
              ← Trước
            </button><span>Trang {{ page }} / {{ result.last_page }}</span><button
              type="button"
              class="button-secondary"
              :disabled="page >= result.last_page"
              @click="page++"
            >
              Sau →
            </button>
          </nav>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped src="~/styles/purchases.css"></style>

<style scoped>
.purchase-heading { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
.purchase-history .status-tabs { border: 0; border-bottom: 2px solid #e8e8e8; border-radius: 2px; }
.purchase-history .status-tabs button { color: #333; font-size: 15px; padding: 20px 13px; font-weight: 400; }
.purchase-history .status-tabs [aria-pressed='true'] { color: #ee4d2d; border-bottom-color: #ee4d2d; }
.purchase-history .order-card { border: 0; }
.purchase-history .order-card-header { padding: 20px 24px 16px; flex-wrap: wrap; row-gap: 12px; }
.shop-heading { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.purchase-history .shop-name { font-size: 15px; margin: 0; }
.visit-shop { color: #555; border: 1px solid #ddd; padding: 4px 10px; text-decoration: none; font-size: 12px; border-radius: 2px; }
.purchase-history .order-meta { margin-top: 8px; }
.order-status-summary { display: flex; align-items: center; flex-wrap: wrap; justify-content: flex-end; gap: 14px; margin-left: auto; }
.shipment-summary { display: inline-flex; align-items: center; gap: 7px; color: #269b8d; text-decoration: none; font-size: 13px; }
.shipment-summary :deep(svg) { width: 20px; height: 20px; }
.buyer-order-state { color: #ee4d2d; font-size: 14px; text-transform: uppercase; border-left: 1px solid #ddd; padding-left: 14px; white-space: nowrap; }
.purchase-history .order-product { gap: 16px; padding: 20px 0; }
.purchase-history .order-product img { width: 90px; height: 90px; border-radius: 0; }
.purchase-history .product-title { font-size: 15px; }
.purchase-history .product-options { font-size: 13px; margin: 5px 0 2px; }
.purchase-history .product-quantity { color: #333; font-size: 13px; }
.purchase-history .product-price { color: #ee4d2d; }
.purchase-history .order-card-footer { display: block; background: #fffefd; border-top: 1px solid #eee; padding: 24px; }
.purchase-history .order-actions { width: 100%; gap: 20px; }
.purchase-history .order-total { color: #333; font-size: 14px; }
.purchase-history .order-total strong { font-size: 26px; color: #ee4d2d; }
.order-detail-link { color: #777; text-decoration: underline; text-underline-offset: 3px; font-size: 12px; min-height: 28px; }
@media (max-width: 760px) {
  .purchase-history .order-card-header { padding: 16px; }
  .order-status-summary { justify-content: flex-start; width: 100%; margin-left: 0; gap: 10px; }
  .shipment-summary { font-size: 12px; }
  .buyer-order-state { font-size: 12px; padding-left: 10px; }
  .purchase-history .order-product { display: grid; grid-template-columns: 68px minmax(0, 1fr); align-items: start; gap: 8px 12px; }
  .purchase-history .order-product img { width: 68px; height: 68px; }
  .purchase-history .product-price { grid-column: 2; width: auto; text-align: right; font-size: 12px; }
  .purchase-history .product-title { font-size: 13px; }
  .purchase-history .order-card-footer { padding: 20px 16px 16px; }
  .purchase-history .order-actions { align-items: flex-end; }
}
</style>
