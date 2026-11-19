<route lang="yaml">
meta:
  layout: seller/LSDashBoard
</route>
<script setup>
import OrderRequest from '~/services/order-request'
import AccountRequest from '~/services/account-request'
import { addressLine, localDate, money, orderStatuses, paymentStatuses, requestError } from '~/utils/checkout'
import { sellerStatuses, shipmentStatuses } from '~/utils/delivery'
import '~/styles/account.css'
const router = useRouter()
const page = ref(1)
const status = ref('')
const data = ref(null)
const addresses = ref([])
const pickupId = ref('')
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const success = ref('')
const confirming = ref(null)
let sequence = 0
let timer
function actions(order) {
  if (![1, 2].includes(Number(order.status_id))) return []
  const next = { pending: ['confirm', 'Xác nhận đơn'], confirmed: ['prepare', 'Bắt đầu chuẩn bị'], preparing: ['ready', 'Sẵn sàng bàn giao'] }[order.seller_status || 'pending']
  return next ? [next, ['cancel', 'Hủy đơn']] : [['cancel', 'Hủy đơn']]
}
async function load(background = false) {
  const current = ++sequence
  if (!background) loading.value = true
  try {
    const response = await OrderRequest.getOrdersStatus({ params: { limit: 10, page: page.value, status_id: status.value || undefined } })
    if (current === sequence) data.value = response.data
  }
  catch (failure) { if (current === sequence) error.value = requestError(failure, 'Không tải được đơn hàng của cửa hàng.') }
  finally { if (current === sequence) loading.value = false }
}
onMounted(async() => {
  if (!localStorage.getItem('token')) { router.replace('/buyer/login'); return }
  watch([page, status], () => { confirming.value = null; error.value = ''; load() }, { immediate: true })
  try { addresses.value = (await AccountRequest.getAddress()).data; pickupId.value = addresses.value[0]?.id || '' }
  catch (failure) { error.value = requestError(failure, 'Không tải được địa chỉ lấy hàng.') }
  timer = setInterval(() => { if (!document.hidden && !busy.value && !confirming.value) load(true) }, 30000)
})
onBeforeUnmount(() => { clearInterval(timer); sequence++ })
async function update() {
  if (!confirming.value || busy.value) return
  const { orderId, next, label } = confirming.value
  if (next === 'ready' && !pickupId.value) { error.value = 'Hãy chọn địa chỉ lấy hàng của cửa hàng.'; return }
  busy.value = true
  error.value = ''
  success.value = ''
  try {
    await OrderRequest.sellerStep(orderId, next, next === 'ready' ? { pickup_address_id: Number(pickupId.value) } : {})
    confirming.value = null
    await load()
    success.value = `Đã cập nhật: ${label}.`
  }
  catch (failure) { error.value = requestError(failure, 'Không cập nhật được trạng thái.') }
  finally { busy.value = false }
}
</script>
<template>
  <section class="account-panel seller-order-panel">
    <header class="account-panel-header">
      <div><h1>Đơn hàng của cửa hàng</h1><p>Xác nhận, chuẩn bị hàng và bàn giao. Tiến độ giao hàng do nhân viên vận chuyển cập nhật.</p></div><button type="button" class="account-secondary" :disabled="loading || busy" @click="load()">
        Làm mới
      </button>
    </header><label class="seller-order-filter">Trạng thái <select v-model="status" :disabled="busy" @change="page = 1"><option value="">Tất cả</option><option v-for="(label, id) in orderStatuses" :key="id" :value="id">{{ label }}</option></select></label><p v-if="error" class="account-error" role="alert">
      {{ error }}
    </p><p v-if="success" class="account-success" role="status">
      {{ success }}
    </p><p v-if="loading" class="account-state" role="status">
      Đang tải đơn hàng…
    </p><template v-else-if="data">
      <p class="seller-order-muted">
        {{ data.total }} đơn hàng · Tự cập nhật mỗi 30 giây
      </p><p v-if="!data.data.length" class="account-empty">
        Chưa có đơn hàng phù hợp.
      </p><article v-for="order in data.data" :key="order.id" class="seller-order-record">
        <div class="account-panel-header">
          <h2>{{ order.order_code || '#' + order.id }}</h2><span>{{ orderStatuses[order.status_id] }} · {{ sellerStatuses[order.seller_status] || '' }}</span>
        </div><p>{{ order.items?.map(item => item.product_name + ' × ' + item.quantity).join(', ') || order.name }}</p><p class="seller-order-muted">
          {{ money(order.payment_total ?? order.grand_total) }} · {{ localDate(order.created_at) }}
        </p><p v-for="payment in order.payments" :key="payment.id" class="seller-order-muted">
          {{ payment.method === 'cod' ? 'COD' : 'Thẻ ngân hàng' }} · {{ paymentStatuses[payment.status] || payment.status }}
        </p><template v-if="order.shipment">
          <p style="margin-top:13px">
            <strong>Vận chuyển:</strong> {{ shipmentStatuses[order.shipment.status] || order.shipment.status }} · {{ order.shipment.tracking_code }} · {{ order.shipment.carrier }}
          </p><details class="seller-order-history">
            <summary>Xem lịch sử vận chuyển</summary><CShipmentTimeline :events="order.shipment.histories || []" />
          </details>
        </template><div v-if="confirming?.orderId === order.id" class="seller-order-confirm">
          <p>{{ confirming.label }}?</p><label v-if="confirming.next === 'ready'">Địa chỉ lấy hàng <select v-model="pickupId" required :disabled="busy"><option value="" disabled>Chọn địa chỉ lấy hàng</option><option v-for="address in addresses" :key="address.id" :value="address.id">{{ address.full_name }} · {{ addressLine(address) }}</option></select></label><RouterLink v-if="confirming.next === 'ready' && !addresses.length" to="/buyer/account/address" class="account-link">
            Thêm địa chỉ của cửa hàng
          </RouterLink><div class="account-actions">
            <button class="account-primary" :disabled="busy || (confirming.next === 'ready' && !pickupId)" @click="update">
              {{ busy ? 'Đang cập nhật…' : 'Xác nhận' }}
            </button><button class="account-secondary" :disabled="busy" @click="confirming = null">
              Quay lại
            </button>
          </div>
        </div><div v-else class="account-actions" style="margin-top:15px">
          <button v-for="[next, label] in actions(order)" :key="next" class="account-secondary" :disabled="busy" @click="confirming = { orderId: order.id, next, label }">
            {{ label }}
          </button>
        </div>
      </article><div v-if="data.last_page > 1" class="account-actions" style="justify-content:flex-end;margin-top:20px">
        <button class="account-secondary" :disabled="page <= 1 || busy" @click="page--">
          Trang trước
        </button><span>{{ page }} / {{ data.last_page }}</span><button class="account-secondary" :disabled="page >= data.last_page || busy" @click="page++">
          Trang sau
        </button>
      </div>
    </template>
  </section>
</template>
<style scoped>
.seller-order-panel {
  width: 100%;
  max-width: 1200px;
  font: inherit;
}
.seller-order-filter {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 22px;
  font-size: 13px;
}
.seller-order-filter select, .seller-order-confirm select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font: inherit;
  max-width: 100%;
}
.seller-order-record {
  padding: 24px 0;
  border-bottom: 1px solid #eee;
  font-size: 13px;
  line-height: 1.7;
}
.seller-order-record .account-panel-header {
  font-size: 12px;
}
.seller-order-muted {
  font-size: 12px;
  color: #777;
  margin-top: 7px;
}
.seller-order-confirm {
  display: grid;
  gap: 15px;
  padding: 17px;
  background: #fff8f3;
  margin-top: 15px;
  border-radius: 6px;
}
.seller-order-confirm label {
  display: grid;
  gap: 9px;
}
.seller-order-history {
  font-size: 12px;
  color: #777;
  margin-top: 12px;
}
.seller-order-history summary {
  cursor: pointer;
  padding: 10px 0;
}
.seller-order-history > ol {
  margin-top: 15px;
}
</style>
