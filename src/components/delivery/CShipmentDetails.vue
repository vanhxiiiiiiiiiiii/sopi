<script setup>
import DeliveryRequest from '~/services/delivery-request'
import { addressLine, localDate, money, paymentStatuses, requestError } from '~/utils/checkout'
import { deliveryLoginOnError, failedReasons, shipmentActions, shipmentStatuses } from '~/utils/delivery'
const props = defineProps({ admin: Boolean })
const route = useRoute()
const router = useRouter()
const record = ref(null)
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const success = ref('')
const staff = ref([])
const staffQuery = ref('')
const shipperId = ref('')
const action = ref('')
const note = ref('')
const reason = ref('')
const receipt = ref('')
const cashReceived = ref(false)
const pending = ref(null)
let timer
let version = 0
async function load(background = false) {
  const current = ++version
  if (!background) loading.value = true
  try {
    const { data } = await DeliveryRequest.detail(props.admin, route.params.id)
    if (current === version) record.value = data
  }
  catch (failure) { if (current === version && !deliveryLoginOnError(failure, router, props.admin)) error.value = requestError(failure, 'Không tải được vận đơn hoặc bạn không có quyền xem.') }
  finally { if (current === version) loading.value = false }
}
async function loadStaff() {
  try { staff.value = (await DeliveryRequest.staff({ limit: 100, q: staffQuery.value.trim() || undefined })).data.data }
  catch (failure) { error.value = requestError(failure, 'Không tải được nhân viên vận chuyển.') }
}
onMounted(() => {
  watch(() => route.params.id, () => { record.value = null; pending.value = null; error.value = ''; action.value = ''; load() }, { immediate: true })
  if (props.admin) loadStaff()
  timer = setInterval(() => { if (!document.hidden && !busy.value && !action.value && !pending.value) load(true) }, 30000)
})
onBeforeUnmount(() => { clearInterval(timer); version++ })
const canAssign = computed(() => record.value?.can_assign === true)
const recoveringCod = computed(() => canAssign.value && record.value.status === 'DELIVERED')
const requiresAssignmentNote = computed(() => canAssign.value && !['READY_FOR_PICKUP', 'ASSIGNED'].includes(record.value.status))
const canReturn = computed(() => record.value?.shipper_id && ['DELIVERED', 'DELIVERY_FAILED'].includes(record.value.status))
const canCollect = computed(() => !props.admin && record.value?.status === 'DELIVERED' && record.value.order.payment_method === 'cod' && record.value.order.payment_status === 'pending')
async function execute(kind, extra = {}) {
  if (busy.value || !record.value) return
  if (!pending.value) pending.value = { kind, body: { request_key: crypto.randomUUID(), expected_version: record.value.version, ...extra } }
  busy.value = true
  error.value = ''
  success.value = ''
  const intent = pending.value
  const shipmentId = record.value.id
  try {
    const requests = { status: DeliveryRequest.change, cod: DeliveryRequest.collect, assign: DeliveryRequest.assign, returning: DeliveryRequest.requestReturn }
    const { data } = await requests[intent.kind](shipmentId, intent.body)
    if (String(route.params.id) !== String(shipmentId)) return
    record.value = data
    pending.value = null
    action.value = ''
    note.value = ''
    reason.value = ''
    receipt.value = ''
    cashReceived.value = false
    success.value = intent.kind === 'cod' ? 'Đã ghi nhận thu COD. Thanh toán được đối soát độc lập với giao hàng.' : 'Đã cập nhật vận đơn và lịch sử xử lý.'
  }
  catch (failure) {
    if ([400, 401, 403, 404, 409, 422].includes(failure.response?.status)) pending.value = null
    if (failure.response?.status === 409) await load(true)
    if (!deliveryLoginOnError(failure, router, props.admin)) error.value = requestError(failure, 'Chưa xác nhận được kết quả. Hãy kiểm tra lại cùng yêu cầu để tránh thao tác trùng.')
  }
  finally { busy.value = false }
}
</script>
<template>
  <section>
    <RouterLink :to="admin ? '/admin/shipping/shipments' : '/delivery/orders'" class="account-link">
      ← Danh sách vận đơn
    </RouterLink><div class="account-panel-header" style="margin-top:18px">
      <div><h1>{{ record?.tracking_code || 'Chi tiết vận đơn' }}</h1><p>Đồng bộ trạng thái với người bán và khách hàng.</p></div><button type="button" class="account-secondary" :disabled="busy || loading" @click="error = ''; load()">
        Làm mới
      </button>
    </div><p v-if="error" class="account-error" role="alert">
      {{ error }}
    </p><p v-if="success" class="account-success" role="status">
      {{ success }}
    </p><div v-if="pending" class="account-state">
      <p>Yêu cầu đang chờ xác nhận kết quả. Không gửi thao tác mới.</p><button type="button" class="account-primary" :disabled="busy" @click="execute()">
        Kiểm tra lại cùng yêu cầu
      </button>
    </div><p v-if="loading" class="account-state" role="status">
      Đang tải chi tiết vận đơn…
    </p><div v-else-if="record" class="operations-grid">
      <div class="operations-stack">
        <section class="operations-box">
          <h2>Thông tin giao nhận</h2><span class="operations-badge" :data-status="record.status">{{ shipmentStatuses[record.status] }}</span><dl class="operations-info">
            <div><dt>Đơn hàng</dt><dd>{{ record.order.order_code || '#' + record.order.id }}</dd></div><div><dt>Gian hàng</dt><dd>{{ record.order.shop_name || '#' + record.order.shop_id }}</dd></div><div><dt>Đơn vị vận chuyển</dt><dd>{{ record.carrier }}</dd></div><div><dt>Nhân viên phụ trách</dt><dd>{{ record.shipper_name || 'Chờ phân công' }}</dd></div><div><dt>Phân công lúc</dt><dd>{{ localDate(record.assigned_at) }}</dd></div><div><dt>Lấy hàng lúc</dt><dd>{{ localDate(record.picked_up_at) }}</dd></div><div><dt>Giao thành công lúc</dt><dd>{{ localDate(record.delivered_at) }}</dd></div>
          </dl><hr style="margin:20px 0;border-color:#eee"><h3>Địa chỉ lấy hàng</h3><p class="operations-address">
            <strong>{{ record.order.pickup_address?.full_name }}</strong> · {{ record.order.pickup_address?.phone }}<br>{{ addressLine(record.order.pickup_address) }}
          </p><h3 style="margin-top:18px">
            Người nhận
          </h3><p class="operations-address">
            <strong>{{ record.order.recipient?.full_name }}</strong> · {{ record.order.recipient?.phone }}<br>{{ addressLine(record.order.recipient) }}
          </p>
        </section><section class="operations-box">
          <h2>Sản phẩm trong kiện hàng</h2><ul>
            <li v-for="(item, index) in record.order.items" :key="index" style="padding:9px 0;border-bottom:1px solid #eee">
              {{ item.product_name }} <strong>× {{ item.quantity }}</strong>
            </li>
          </ul><dl class="operations-info">
            <div><dt>Phí vận chuyển</dt><dd>{{ money(record.shipping_fee) }}</dd></div><div><dt>Phương thức</dt><dd>{{ record.order.payment_method === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Thẻ tín dụng / ghi nợ' }}</dd></div><div><dt>Thanh toán</dt><dd>{{ paymentStatuses[record.order.payment_status] || 'Đang cập nhật' }}</dd></div><div><dt>COD còn phải thu</dt><dd><strong>{{ money(record.order.cod_due) }}</strong></dd></div>
          </dl><p v-if="record.failed_reason" class="account-error">
            Lý do giao thất bại gần nhất: {{ record.failed_reason }}
          </p>
        </section><section class="operations-box">
          <h2>Lịch sử vận chuyển</h2><CShipmentTimeline :events="record.histories" />
        </section>
      </div><div class="operations-stack">
        <section v-if="!admin && record.allowed_statuses.length" class="operations-box">
          <h2>Cập nhật tiến độ</h2><form class="operations-form" @submit.prevent="execute('status', { status: action, note: note || null, failed_reason: action === 'DELIVERY_FAILED' ? reason : null })">
            <label>Thao tác tiếp theo<select v-model="action" required :disabled="busy || !!pending"><option value="" disabled>Chọn thao tác</option><option v-for="status in record.allowed_statuses" :key="status" :value="status">{{ shipmentActions[status] }}</option></select></label><label v-if="action === 'DELIVERY_FAILED'">Lý do giao thất bại<select v-model="reason" required :disabled="busy || !!pending"><option value="" disabled>Chọn lý do</option><option v-for="item in failedReasons" :key="item" :value="item">{{ item }}</option></select></label><label>Ghi chú<textarea v-model.trim="note" maxlength="1000" :disabled="busy || !!pending" /></label><p v-if="action === 'DELIVERED'" class="operations-muted">
              Chỉ xác nhận khi đã giao hàng thực tế. Xác nhận giao hàng không tự ghi nhận đã thu COD.
            </p><button type="submit" class="account-primary" :disabled="busy || !!pending || !action">
              {{ busy ? 'Đang cập nhật…' : 'Xác nhận cập nhật' }}
            </button>
          </form>
        </section><section v-if="canCollect" class="operations-box">
          <h2>Xác nhận thu COD</h2><p class="operations-muted">
            Chỉ thực hiện sau khi đã nhận đủ tiền từ người nhận.
          </p><form class="operations-form" @submit.prevent="execute('cod', { amount: Number(record.order.cod_due), receipt_reference: receipt, cash_received: cashReceived })">
            <label>Số tiền phải thu<input :value="money(record.order.cod_due)" readonly></label><label>Mã biên nhận / đối soát<input v-model.trim="receipt" minlength="6" maxlength="100" required :disabled="busy || !!pending"></label><label style="display:flex;align-items:flex-start;gap:10px"><input v-model="cashReceived" type="checkbox" required :disabled="busy || !!pending" style="min-height:auto;margin-top:4px">Tôi xác nhận đã thu đủ số tiền COD thực tế.</label><button class="account-primary" :disabled="busy || !!pending">
              Ghi nhận đã thu COD
            </button>
          </form>
        </section><section v-if="admin && canAssign" class="operations-box">
          <h2>{{ recoveringCod ? 'Tiếp quản COD tồn đọng' : 'Phân công nhân viên' }}</h2><p v-if="recoveringCod" id="cod-recovery-hint" class="operations-muted">
            Nhân viên cũ đã ngừng hoạt động. Ghi lý do và chọn người tiếp quản khoản COD. Kết quả giao hàng được giữ nguyên; nhân viên tiếp quản cần xác nhận thu tiền thực tế bằng biên nhận.
          </p><form class="operations-toolbar" @submit.prevent="loadStaff">
            <label>Tìm nhân viên<input v-model.trim="staffQuery" maxlength="100" placeholder="Tên hoặc tài khoản"></label><button class="account-secondary">
              Tìm
            </button>
          </form><form class="operations-form" @submit.prevent="execute('assign', { shipper_id: Number(shipperId), note: note || null })">
            <label>Nhân viên vận chuyển<select v-model="shipperId" required :disabled="busy || !!pending"><option value="" disabled>Chọn nhân viên đang hoạt động</option><option v-for="person in staff" :key="person.id" :value="person.id" :disabled="!person.is_active || !person.provider?.is_active">{{ person.name }} · {{ person.provider?.name }} · {{ person.username }}</option></select></label><label>{{ requiresAssignmentNote ? 'Lý do tiếp quản (bắt buộc)' : 'Ghi chú' }}<textarea v-model.trim="note" maxlength="1000" :required="requiresAssignmentNote" :aria-describedby="recoveringCod ? 'cod-recovery-hint' : undefined" :disabled="busy || !!pending" /></label><button class="account-primary" :disabled="busy || !!pending || !shipperId">
              Xác nhận phân công
            </button>
          </form>
        </section><section v-if="admin && canReturn" class="operations-box">
          <h2>Xử lý hoàn hàng</h2><form class="operations-form" @submit.prevent="execute('returning', { note })">
            <label>Lý do hoàn hàng<textarea v-model.trim="note" required minlength="5" maxlength="1000" :disabled="busy || !!pending" /></label><button class="account-primary" :disabled="busy || !!pending">
              Yêu cầu hoàn hàng
            </button>
          </form>
        </section><section class="operations-box">
          <h2>Quy trình xử lý</h2><p class="operations-muted">
            Lấy hàng → Vận chuyển → Bắt đầu giao → Giao thành công hoặc báo thất bại.<br>Giao thất bại có thể giao lại hoặc hoàn hàng. Mỗi thay đổi được lưu thời gian và người thực hiện.
          </p>
        </section>
      </div>
    </div>
  </section>
</template>
