<route lang="yaml">
meta:
  layout: admin/LAWorkspace
</route>
<script setup>
import Axios from '~/services/axios-instance'
import { localDate, money, orderStatuses, paymentStatuses, requestError } from '~/utils/checkout'
import { shipmentStatuses } from '~/utils/delivery'
const tabs = { customers: 'Người mua', sellers: 'Cửa hàng', products: 'Sản phẩm', orders: 'Đơn hàng', payments: 'Thanh toán', vouchers: 'Voucher' }
const tab = ref('customers')
const records = ref([])
const page = ref(1)
const lastPage = ref(1)
const q = ref('')
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const success = ref('')
const selected = ref(null)
const editing = ref(false)
const form = reactive({})
let revision = 0
async function load() {
  const current = ++revision
  loading.value = true; error.value = ''
  try {
    const { data } = await Axios.get(`/admin/${tab.value}`, { params: { page: page.value, limit: 15, q: q.value || undefined } })
    if (current !== revision) return
    if (Array.isArray(data)) { records.value = data.filter(item => !q.value || `${item.code} ${item.name}`.toLowerCase().includes(q.value.toLowerCase())); lastPage.value = 1 }
    else { records.value = data.data; lastPage.value = data.last_page }
  }
  catch (failure) { if (current === revision) error.value = requestError(failure, 'Không tải được dữ liệu mua bán.') }
  finally { if (current === revision) loading.value = false }
}
function localInput(value) {
  if (!value) return ''
  const date = new Date(value)
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}
function edit(record = null) {
  selected.value = record; editing.value = true; error.value = ''; success.value = ''
  Object.keys(form).forEach(key => delete form[key])
  if (tab.value === 'customers') Object.assign(form, { account_status: record.account_status })
  if (tab.value === 'sellers') Object.assign(form, { is_active: !!record.is_active })
  if (tab.value === 'products') Object.assign(form, { status_id: Number(record.status_id), note: '' })
  if (tab.value === 'orders') Object.assign(form, { note: '' })
  if (tab.value === 'vouchers') {
    Object.assign(form, {
      code: record?.code || '',
      name: record?.name || '',
      discount_type: record?.discount_type || 'fixed',
      discount_value: record?.discount_value || 10,
      minimum_order_value: record?.minimum_order_value || 0,
      maximum_discount: record?.maximum_discount ?? '',
      max_uses: record?.max_uses || 100,
      max_uses_per_customer: record?.max_uses_per_customer || 1,
      starts_at: localInput(record?.starts_at || new Date()),
      ends_at: localInput(record?.ends_at || new Date(Date.now() + 86400000 * 7)),
      is_active: record?.is_active ?? true,
    })
  }
}
async function save() {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    const id = selected.value?.id
    if (tab.value === 'products') { await Axios.patch(`/admin/products/${id}/moderation`, { ...form }) }
    else if (tab.value === 'orders') { await Axios.post(`/admin/orders/${id}/cancel`, { note: form.note }) }
    else {
      const body = { ...form }
      if (tab.value === 'vouchers') {
        body.starts_at = new Date(body.starts_at).toISOString(); body.ends_at = new Date(body.ends_at).toISOString()
        body.maximum_discount = body.maximum_discount === '' ? null : body.maximum_discount
      }
      await Axios[id ? 'put' : 'post'](`/admin/${tab.value}${id ? `/${id}` : ''}`, body)
    }
    editing.value = false; await load(); success.value = 'Đã cập nhật dữ liệu.'
  }
  catch (failure) { error.value = requestError(failure, 'Không cập nhật được dữ liệu.') }
  finally { busy.value = false }
}
watch(tab, () => { page.value = 1; q.value = ''; selected.value = null; editing.value = false; success.value = ''; records.value = []; load() })
watch(page, load)
onMounted(load)
const productStatus = { 1: 'Đang bán', 2: 'Đã ẩn', 3: 'Đã gỡ' }
const customerStatus = { active: 'Hoạt động', inactive: 'Ngừng hoạt động', blocked: 'Bị khóa' }
const voucherFields = [
  ['code', 'Mã voucher', 'text'], ['name', 'Tên chương trình', 'text'], ['discount_value', 'Giá trị giảm', 'number'],
  ['minimum_order_value', 'Đơn tối thiểu', 'number'], ['maximum_discount', 'Giảm tối đa (có thể để trống)', 'number'],
  ['max_uses', 'Tổng lượt sử dụng', 'number'], ['max_uses_per_customer', 'Lượt / khách', 'number'],
  ['starts_at', 'Bắt đầu', 'datetime-local'], ['ends_at', 'Kết thúc', 'datetime-local'],
]
</script>
<template>
  <section class="account-panel">
    <header class="account-panel-header">
      <div><h1>Quản lý mua bán</h1><p>Quản trị hoạt động mua bán toàn sàn. Người bán tiếp tục xử lý đơn và quản lý hàng trong cửa hàng riêng.</p></div><RouterLink to="/admin/sellers" class="account-link">
        Duyệt đăng ký người bán →
      </RouterLink>
    </header>
    <div class="admin-tabs" role="group" aria-label="Nhóm nghiệp vụ mua bán">
      <button v-for="(label, key) in tabs" :key="key" type="button" :aria-pressed="tab === key" :disabled="busy" @click="tab = key">
        {{ label }}
      </button>
    </div>
    <p v-if="error" class="account-error" role="alert">
      {{ error }}
    </p><p v-if="success" class="account-success" role="status">
      {{ success }}
    </p>
    <p v-if="tab === 'payments'" class="operations-muted">
      Tra cứu trạng thái thanh toán. Việc thu COD cần biên nhận của nhân viên vận chuyển; trạng thái giao thành công không tự xác nhận đã thu tiền.
    </p>
    <form v-if="editing" class="admin-edit operations-form" @submit.prevent="save">
      <h2>{{ selected ? 'Xử lý #' + selected.id : 'Tạo voucher' }}</h2>
      <div class="admin-form-grid">
        <label v-if="tab === 'customers'">Trạng thái tài khoản<select v-model="form.account_status" :disabled="busy"><option v-for="(label, key) in customerStatus" :key="key" :value="key">{{ label }}</option></select></label>
        <label v-if="tab === 'sellers' || tab === 'vouchers'">Trạng thái hoạt động<select v-model="form.is_active" :disabled="busy"><option :value="true">Đang hoạt động</option><option :value="false">Ngừng hoạt động</option></select></label>
        <label v-if="tab === 'products'">Trạng thái sản phẩm<select v-model="form.status_id" :disabled="busy"><option v-for="(label, key) in productStatus" :key="key" :value="Number(key)">{{ label }}</option></select></label>
        <label v-if="tab === 'products' || tab === 'orders'">Lý do xử lý (bắt buộc)<textarea v-model.trim="form.note" required minlength="5" maxlength="1000" :disabled="busy" /></label>
        <template v-if="tab === 'vouchers'">
          <label>Loại giảm<select v-model="form.discount_type" :disabled="busy"><option value="fixed">Số tiền cố định</option><option value="percentage">Phần trăm</option></select></label>
          <label v-for="[key, label, type] in voucherFields" :key="key">{{ label }}<input v-model="form[key]" :type="type" :required="key !== 'maximum_discount'" :step="type === 'number' ? (key.includes('uses') ? '1' : '0.01') : undefined" :min="type === 'number' ? (key.includes('uses') ? 1 : 0) : undefined" :maxlength="key === 'code' ? 50 : key === 'name' ? 150 : undefined" :disabled="busy"></label>
        </template>
      </div>
      <p v-if="tab === 'customers'">
        Khóa tài khoản sẽ thu hồi các phiên đăng nhập hiện có.
      </p><p v-if="tab === 'sellers'">
        Shop ngừng hoạt động không được nhận đơn mới hoặc xử lý đơn. Hãy kiểm tra các đơn còn tồn trước khi khóa.
      </p>
      <template v-if="tab === 'orders'">
        <p>Đơn {{ selected.order_code }} · {{ orderStatuses[selected.status_id] }} · {{ money(selected.payment_total) }}</p><ul>
          <li v-for="item in selected.items" :key="item.id">
            {{ item.product_name }} × {{ item.quantity }}
          </li>
        </ul><p v-if="selected.shipment">
          Vận đơn: {{ selected.shipment.tracking_code }} · {{ shipmentStatuses[selected.shipment.status] }}
        </p><p>Hủy đơn ở giai đoạn chờ xác nhận / chuẩn bị sẽ hoàn tồn kho. Admin mua bán không được xác nhận thay nhân viên giao hàng.</p>
      </template>
      <div class="account-actions">
        <button class="account-primary" :disabled="busy || (tab === 'orders' && ![1, 2].includes(Number(selected.status_id)))">
          {{ busy ? 'Đang lưu…' : tab === 'orders' ? 'Xác nhận hủy đơn' : 'Lưu thay đổi' }}
        </button><button type="button" class="account-secondary" :disabled="busy" @click="editing = false">
          Đóng
        </button>
      </div>
    </form>
    <form class="operations-toolbar" @submit.prevent="page = 1; load()">
      <label>Tìm {{ tabs[tab].toLowerCase() }}<input v-model.trim="q" maxlength="100" placeholder="Tên hoặc mã liên quan"></label><button class="account-secondary" :disabled="loading">
        Tìm kiếm
      </button><button v-if="tab === 'vouchers'" type="button" class="account-primary" @click="edit()">
        Thêm voucher
      </button>
    </form>
    <p v-if="loading" class="account-state" role="status">
      Đang tải dữ liệu…
    </p>
    <div v-else class="admin-table-scroll">
      <table class="admin-table">
        <thead><tr><th>Mã / Tài khoản</th><th>Thông tin</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>
          <tr v-for="record in records" :key="record.id">
            <td>{{ record.username || record.product_code || record.order_code || record.payment_code || record.code || '#' + record.id }}</td>
            <td>
              <template v-if="tab === 'customers'">
                {{ record.email }}
              </template><template v-else-if="tab === 'sellers'">
                {{ record.name }}
              </template><template v-else-if="tab === 'products'">
                {{ record.name }}<br><span class="operations-muted">{{ record.shop?.name }}</span>
              </template><template v-else-if="tab === 'orders'">
                {{ record.shop?.name }}<br>{{ money(record.payment_total) }}
              </template><template v-else-if="tab === 'payments'">
                {{ record.order?.order_code }}<br>{{ money(record.amount) }} · {{ record.method.toUpperCase() }}
              </template><template v-else>
                {{ record.name }}<br><span class="operations-muted">{{ record.used_count }} / {{ record.max_uses }} lượt · Hết hạn {{ localDate(record.ends_at) }}</span>
              </template>
            </td>
            <td>{{ tab === 'customers' ? customerStatus[record.account_status] : tab === 'products' ? productStatus[record.status_id] : tab === 'orders' ? orderStatuses[record.status_id] : tab === 'payments' ? paymentStatuses[record.status] || record.status : record.is_active ? 'Hoạt động' : 'Ngừng hoạt động' }}</td>
            <td>
              <button v-if="tab !== 'payments'" type="button" class="account-link" :disabled="busy" @click="edit(record)">
                {{ tab === 'orders' ? 'Chi tiết / Hủy' : 'Quản lý' }}
              </button><span v-else class="operations-muted">Chỉ tra cứu</span>
            </td>
          </tr><tr v-if="!records.length">
            <td colspan="4">
              Không tìm thấy dữ liệu phù hợp.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="admin-pagination">
      <button class="account-secondary" :disabled="loading || page <= 1" @click="page--">
        Trước
      </button><span>Trang {{ page }} / {{ lastPage }}</span><button class="account-secondary" :disabled="loading || page >= lastPage" @click="page++">
        Sau
      </button>
    </div>
  </section>
</template>
