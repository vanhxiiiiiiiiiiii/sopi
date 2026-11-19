<script setup>
import DeliveryRequest from '~/services/delivery-request'
import { localDate, money, requestError } from '~/utils/checkout'
import { deliveryLoginOnError, shipmentStatuses } from '~/utils/delivery'
const props = defineProps({ admin: Boolean })
const router = useRouter()
const route = useRoute()
const data = ref(null)
const loading = ref(true)
const error = ref('')
const status = ref(String(route.query.status || ''))
const query = ref('')
const page = ref(1)
let timer
let version = 0
async function load(background = false) {
  const current = ++version
  if (!background) loading.value = true
  error.value = ''
  try {
    const response = await DeliveryRequest.list(props.admin, { page: page.value, limit: 15, status: status.value || undefined, q: query.value.trim() || undefined })
    if (current === version) data.value = response.data
  }
  catch (failure) { if (current === version && !deliveryLoginOnError(failure, router, props.admin)) error.value = requestError(failure, 'Không tải được vận đơn.') }
  finally { if (current === version) loading.value = false }
}
function apply() { if (page.value === 1) load(); else page.value = 1 }
onMounted(() => { watch(page, () => load(), { immediate: true }); timer = setInterval(() => { if (!document.hidden && !loading.value) load(true) }, 30000) })
onBeforeUnmount(() => { clearInterval(timer); version++ })
</script>
<template>
  <section class="account-panel">
    <header class="account-panel-header">
      <div><h1>{{ admin ? 'Tất cả vận đơn' : 'Vận đơn được phân công' }}</h1><p>{{ admin ? 'Phân công nhân viên, theo dõi tiến độ và xử lý hoàn hàng.' : 'Theo dõi, lấy hàng và cập nhật tiến độ giao hàng của bạn.' }}</p></div><button type="button" class="account-secondary" :disabled="loading" @click="load()">
        Làm mới
      </button>
    </header><form class="operations-toolbar" @submit.prevent="apply">
      <label>Mã vận đơn<input v-model="query" maxlength="100" placeholder="Nhập mã SHP-…"></label><label>Trạng thái<select v-model="status" @change="apply"><option value="">Tất cả trạng thái</option><option v-for="(label, value) in shipmentStatuses" :key="value" :value="value">{{ label }}</option></select></label><button type="submit" class="account-primary">
        Tìm kiếm
      </button>
    </form><p v-if="error" class="account-error" role="alert">
      {{ error }}
    </p><p v-if="loading" class="account-state" role="status">
      Đang tải vận đơn…
    </p><p v-else-if="!data?.data?.length && !error" class="account-empty">
      {{ admin ? 'Chưa có vận đơn phù hợp. Vận đơn được tạo khi người bán sẵn sàng bàn giao.' : 'Bạn chưa có vận đơn phù hợp được phân công.' }}
    </p><template v-else-if="data">
      <p class="operations-muted">
        {{ data.total }} vận đơn · Tự cập nhật mỗi 30 giây
      </p><div class="operations-table-wrap">
        <table class="operations-table">
          <thead><tr><th>Vận đơn / đơn hàng</th><th>Người nhận</th><th>Trạng thái</th><th>COD cần thu</th><th>{{ admin ? 'Nhân viên' : 'Phân công' }}</th><th /></tr></thead><tbody>
            <tr v-for="item in data.data" :key="item.id">
              <td><strong>{{ item.tracking_code }}</strong><small>{{ item.order.order_code || '#' + item.order.id }}</small></td><td>{{ item.order.recipient?.full_name }}<small>{{ item.order.recipient?.phone }}</small></td><td><span class="operations-badge" :data-status="item.status">{{ shipmentStatuses[item.status] || item.status }}</span></td><td>{{ money(item.order.cod_due) }}</td><td>{{ admin ? item.shipper_name || 'Chưa phân công' : localDate(item.assigned_at) }}</td><td>
                <RouterLink :to="(admin ? '/admin/shipping/shipments/' : '/delivery/orders/') + item.id" class="account-link">
                  Xem chi tiết
                </RouterLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div><div v-if="data.last_page > 1" class="operations-pagination">
        <button type="button" class="account-secondary" :disabled="page <= 1" @click="page--">
          Trang trước
        </button><span>{{ page }} / {{ data.last_page }}</span><button type="button" class="account-secondary" :disabled="page >= data.last_page" @click="page++">
          Trang sau
        </button>
      </div>
    </template>
  </section>
</template>
