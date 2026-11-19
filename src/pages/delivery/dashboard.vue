<route lang="yaml">
meta:
  layout: delivery/LDelivery
</route>
<script setup>
import DeliveryRequest from '~/services/delivery-request'
import { deliveryLoginOnError } from '~/utils/delivery'
import { requestError } from '~/utils/checkout'
const router = useRouter()
const data = ref(null)
const error = ref('')
const loading = ref(true)
let timer
const stats = computed(() => {
  const c = data.value?.counts || {}
  return [
    ['Tổng vận đơn được phân công', data.value?.total || 0, ''],
    ['Chờ lấy hàng', Number(c.ASSIGNED || 0), 'ASSIGNED'],
    ['Đã lấy hàng', Number(c.PICKED_UP || 0), 'PICKED_UP'],
    ['Đang vận chuyển / giao hàng', Number(c.IN_TRANSIT || 0) + Number(c.OUT_FOR_DELIVERY || 0), ''],
    ['Giao thành công', Number(c.DELIVERED || 0), 'DELIVERED'],
    ['Giao thất bại', Number(c.DELIVERY_FAILED || 0), 'DELIVERY_FAILED'],
  ]
})
async function load(background = false) {
  if (!background) loading.value = true
  error.value = ''
  try { data.value = (await DeliveryRequest.dashboard(false)).data }
  catch (failure) { if (!deliveryLoginOnError(failure, router)) error.value = requestError(failure, 'Không tải được tổng quan.') }
  finally { loading.value = false }
}
onMounted(() => { load(); timer = setInterval(() => { if (!document.hidden) load(true) }, 30000) })
onBeforeUnmount(() => clearInterval(timer))
useHead({ title: 'Tổng quan vận chuyển | Shoppe' })
</script>
<template>
  <section>
    <header class="account-panel-header">
      <div><h1>Tổng quan vận chuyển</h1><p>Số liệu thực tế từ các vận đơn đang thuộc phạm vi của bạn.</p></div><button class="account-secondary" :disabled="loading" @click="load()">
        Làm mới
      </button>
    </header><p v-if="error" class="account-error" role="alert">
      {{ error }}
    </p><p v-if="loading" class="account-state" role="status">
      Đang tổng hợp vận đơn…
    </p><div v-else-if="data" class="operations-stats">
      <RouterLink v-for="[label, count, status] in stats" :key="label" :to="{ path: '/delivery/orders', query: status ? { status } : {} }" class="operations-stat">
        <span>{{ label }}</span><strong>{{ count }}</strong><small class="account-link">Xem vận đơn →</small>
      </RouterLink>
    </div><div class="operations-box">
      <h2>Ca giao hàng của bạn</h2><p class="operations-muted" style="margin:12px 0 20px">
        Kiểm tra địa chỉ lấy hàng, người nhận và số tiền COD trước khi bắt đầu. Khi giao thành công, hãy xác nhận thu COD riêng sau khi thực nhận đủ tiền.
      </p><RouterLink to="/delivery/orders" class="account-primary">
        Mở danh sách vận đơn
      </RouterLink>
    </div>
  </section>
</template>
