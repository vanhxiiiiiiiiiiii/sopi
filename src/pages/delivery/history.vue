<route lang="yaml">
meta:
  layout: delivery/LDelivery
</route>
<script setup>
import DeliveryRequest from '~/services/delivery-request'
import { deliveryLoginOnError, deliveryRoles, shipmentStatuses } from '~/utils/delivery'
import { localDate, requestError } from '~/utils/checkout'
const router = useRouter()
const data = ref(null)
const loading = ref(true)
const error = ref('')
const page = ref(1)
async function load() {
  loading.value = true
  error.value = ''
  try { data.value = (await DeliveryRequest.history(page.value)).data }
  catch (failure) { if (!deliveryLoginOnError(failure, router)) error.value = requestError(failure, 'Không tải được lịch sử.') }
  finally { loading.value = false }
}
onMounted(() => watch(page, load, { immediate: true }))
useHead({ title: 'Lịch sử vận chuyển | Shoppe' })
</script>
<template>
  <section class="account-panel">
    <header class="account-panel-header">
      <div><h1>Lịch sử xử lý</h1><p>Nhật ký các vận đơn được phân công cho bạn.</p></div><button class="account-secondary" :disabled="loading" @click="load">
        Làm mới
      </button>
    </header><p v-if="error" class="account-error" role="alert">
      {{ error }}
    </p><p v-if="loading" class="account-state" role="status">
      Đang tải lịch sử…
    </p><p v-else-if="!data?.data?.length" class="account-empty">
      Chưa có lịch sử vận chuyển.
    </p><div v-else class="operations-table-wrap">
      <table class="operations-table">
        <thead><tr><th>Thời gian</th><th>Vận đơn</th><th>Thay đổi</th><th>Người thực hiện</th><th>Ghi chú</th></tr></thead><tbody>
          <tr v-for="event in data.data" :key="event.id">
            <td>{{ localDate(event.created_at) }}</td><td>
              <RouterLink :to="'/delivery/orders/' + event.shipment_id" class="account-link">
                {{ event.shipment?.tracking_code }}
              </RouterLink>
            </td><td>{{ event.event_type === 'cod' ? 'Xác nhận thu COD' : shipmentStatuses[event.new_status] }}</td><td>{{ deliveryRoles[event.actor_role] }}<span v-if="event.actor_id"> #{{ event.actor_id }}</span></td><td>{{ event.note }}</td>
          </tr>
        </tbody>
      </table><div v-if="data.last_page > 1" class="operations-pagination">
        <button class="account-secondary" :disabled="page <= 1" @click="page--">
          Trang trước
        </button><span>{{ page }} / {{ data.last_page }}</span><button class="account-secondary" :disabled="page >= data.last_page" @click="page++">
          Trang sau
        </button>
      </div>
    </div>
  </section>
</template>
