<route lang="yaml">
meta:
  layout: admin/LAWorkspace
</route>
<script setup>
import ShippingRequest from '~/services/shipping-request'
import { money, requestError } from '~/utils/checkout'
const settings = reactive({})
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const success = ref('')
const hub = ref(null)
const fields = [
  { key: 'base_fee', label: 'Phí cơ bản', min: 0, max: 100000000, step: '0.01' },
  { key: 'included_weight_grams', label: 'Cân nặng đã bao gồm (gram)', min: 0, max: 1000000, step: '1' },
  { key: 'extra_kg_fee', label: 'Phụ phí mỗi kg vượt mức', min: 0, max: 100000000, step: '0.01' },
  { key: 'included_distance_km', label: 'Quãng đường đã bao gồm (km)', min: 0, max: 3000, step: '0.01' },
  { key: 'per_km_fee', label: 'Phụ phí mỗi km vượt mức', min: 0, max: 100000000, step: '0.01' },
  { key: 'max_distance_km', label: 'Giới hạn giao hàng từ kho (km)', min: 0.1, max: 3000, step: '0.01' },
]
async function load() {
  loading.value = true
  error.value = ''
  try {
    Object.assign(settings, (await ShippingRequest.settings(true)).data)
    hub.value = { latitude: Number(settings.hub_latitude), longitude: Number(settings.hub_longitude) }
  }
  catch (failure) { error.value = requestError(failure, 'Không tải được biểu phí vận chuyển.') }
  finally { loading.value = false }
}
async function save() {
  if (saving.value) return
  saving.value = true
  error.value = ''; success.value = ''
  try {
    const { data } = await ShippingRequest.save({ ...settings, hub_latitude: hub.value?.latitude, hub_longitude: hub.value?.longitude,
      free_shipping_threshold: settings.free_shipping_threshold === '' ? null : settings.free_shipping_threshold })
    Object.assign(settings, data)
    success.value = 'Đã lưu biểu phí. Các đơn đã đặt giữ nguyên phí vận chuyển.'
  }
  catch (failure) { error.value = requestError(failure, 'Không lưu được biểu phí vận chuyển.') }
  finally { saving.value = false }
}
onMounted(load)
useHead({ title: 'Phí vận chuyển | Shoppe' })
</script>

<template>
  <section class="account-panel shipping-settings">
    <header class="account-panel-header"><div><h1>Thiết lập phí vận chuyển</h1><p>Tính theo cân nặng và tuyến đường ô tô từ kho phân loại đến người nhận.</p></div></header>
    <p v-if="error" class="account-error" role="alert">{{ error }} <button type="button" class="account-link" :disabled="saving" @click="load">Tải lại</button></p>
    <p v-if="success" class="account-success" role="status">{{ success }}</p>
    <p v-if="loading" class="account-state" role="status">Đang tải biểu phí…</p>
    <form v-else-if="settings.version" @submit.prevent="save">
      <fieldset :disabled="saving" class="shipping-fieldset">
        <legend>Kho phân loại trung tâm</legend>
        <div class="admin-form-grid">
          <label>Tên kho<input v-model.trim="settings.hub_name" required maxlength="120"></label>
          <label>Địa chỉ kho<input v-model.trim="settings.hub_address" required maxlength="255"></label>
        </div>
        <CShippingMap v-model="hub" :search-text="settings.hub_address" admin :disabled="saving" />
      </fieldset>
      <fieldset :disabled="saving" class="shipping-fieldset">
        <legend>Biểu phí</legend>
        <p class="operations-muted">Số tiền dùng cùng đơn vị với giá sản phẩm, hiện hiển thị {{ money(1) }}. Các mức ban đầu là dữ liệu mẫu cho đề tài.</p>
        <div class="admin-form-grid">
          <label v-for="field in fields" :key="field.key">{{ field.label }}<input v-model.number="settings[field.key]" type="number" required :min="field.min" :max="field.max" :step="field.step"></label>
          <label>Miễn phí khi tiền hàng mỗi shop đạt<input v-model="settings.free_shipping_threshold" type="number" min="0.01" max="100000000" step="0.01" placeholder="Để trống nếu không áp dụng"><small>Tính trước voucher. Để trống để tắt miễn phí.</small></label>
        </div>
      </fieldset>
      <div class="shipping-formula"><strong>Cách tính cho mỗi đơn của một shop</strong><p>Phí cơ bản + số kg vượt mức × phí/kg + số km vượt mức × phí/km.</p><p>Phần cân nặng vượt mức làm tròn lên từng kg; quãng đường làm tròn lên 0,1 km. Đủ ngưỡng miễn phí sẽ được miễn toàn bộ phí, trong phạm vi giao hàng.</p><p>Biểu phí tính chặng kho → người nhận. Đơn nhiều shop được tách đơn và tính phí riêng.</p></div>
      <button type="submit" class="account-primary" :disabled="saving || !hub">{{ saving ? 'Đang lưu…' : 'Lưu thiết lập' }}</button>
    </form>
  </section>
</template>

<style scoped>
.shipping-fieldset { border: 1px solid #e8e8e8; padding: 22px; border-radius: 5px; margin: 24px 0; }
.shipping-fieldset legend { font-weight: 600; font-size: 17px; padding: 0 8px; }
.shipping-fieldset .operations-muted { margin: 0 0 18px; }
.shipping-fieldset small { color: #666; font-size: 12px; font-weight: 400; }
.shipping-formula { background: #fff5ef; border-left: 3px solid #d94323; padding: 18px; margin: 24px 0; line-height: 1.7; }
.shipping-formula p { margin: 8px 0 0; }
@media(max-width:600px) { .shipping-fieldset { padding: 14px; } }
</style>
