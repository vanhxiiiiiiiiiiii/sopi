<route lang="yaml">
meta:
  layout: admin/LAWorkspace
</route>
<script setup>
import DeliveryRequest from '~/services/delivery-request'
import { requestError } from '~/utils/checkout'
import { deliveryLoginOnError } from '~/utils/delivery'
const router = useRouter()
const records = ref([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const success = ref('')
const editing = ref(false)
const selectedId = ref(null)
const payload = reactive({ code: '', name: '', phone: '', is_active: true })
async function load() {
  loading.value = true
  try { records.value = (await DeliveryRequest.providers()).data }
  catch (failure) { if (!deliveryLoginOnError(failure, router, true)) error.value = requestError(failure, 'Không tải được đơn vị vận chuyển.') }
  finally { loading.value = false }
}
function edit(item = null) { selectedId.value = item?.id || null; Object.assign(payload, { code: item?.code || '', name: item?.name || '', phone: item?.phone || '', is_active: item?.is_active ?? true }); editing.value = true; error.value = ''; success.value = '' }
async function save() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try { await DeliveryRequest.saveProvider(selectedId.value, { ...payload }); editing.value = false; await load(); success.value = 'Đã lưu đơn vị vận chuyển.' }
  catch (failure) { if (!deliveryLoginOnError(failure, router, true)) error.value = requestError(failure, 'Không lưu được đơn vị vận chuyển.') }
  finally { busy.value = false }
}
onMounted(load)
useHead({ title: 'Đơn vị vận chuyển | Shoppe' })
</script>
<template>
  <section class="account-panel">
    <header class="account-panel-header">
      <div><h1>Đơn vị vận chuyển</h1><p>Quản lý đơn vị thực hiện lấy hàng, giao hàng và hoàn hàng.</p></div><button class="account-primary" :disabled="busy" @click="edit()">
        Thêm đơn vị
      </button>
    </header><p v-if="error" class="account-error" role="alert">
      {{ error }} <button class="account-link" @click="load">
        Thử lại
      </button>
    </p><p v-if="success" class="account-success" role="status">
      {{ success }}
    </p><form v-if="editing" class="operations-form" @submit.prevent="save">
      <label>Mã đơn vị<input v-model.trim="payload.code" maxlength="40" pattern="[A-Za-z0-9_-]+" required :disabled="busy"></label><label>Tên đơn vị<input v-model.trim="payload.name" maxlength="120" required :disabled="busy"></label><label>Điện thoại liên hệ<input v-model.trim="payload.phone" maxlength="20" :disabled="busy"></label><label style="display:flex;align-items:center;gap:10px"><input v-model="payload.is_active" type="checkbox" :disabled="busy" style="min-height:auto">Đang hoạt động</label><p class="operations-muted">
        Vô hiệu hóa đơn vị sẽ chặn đăng nhập và cập nhật của nhân viên trực thuộc. Hãy xử lý các vận đơn đang giao trước khi khóa.
      </p><div class="account-actions">
        <button class="account-primary" :disabled="busy">
          {{ busy ? 'Đang lưu…' : 'Lưu' }}
        </button><button type="button" class="account-secondary" :disabled="busy" @click="editing = false">
          Hủy
        </button>
      </div>
    </form><p v-else-if="loading" class="account-state" role="status">
      Đang tải đơn vị…
    </p><p v-else-if="!records.length && !error" class="account-empty">
      Chưa có đơn vị vận chuyển. Thêm đơn vị thực tế trước khi cấp tài khoản nhân viên.
    </p><div v-else class="operations-table-wrap">
      <table class="operations-table">
        <thead><tr><th>Mã đơn vị</th><th>Tên đơn vị</th><th>Điện thoại</th><th>Trạng thái</th><th /></tr></thead><tbody>
          <tr v-for="item in records" :key="item.id">
            <td>{{ item.code }}</td><td>{{ item.name }}</td><td>{{ item.phone || '—' }}</td><td>{{ item.is_active ? 'Đang hoạt động' : 'Đã vô hiệu hóa' }}</td><td>
              <button class="account-link" @click="edit(item)">
                Cập nhật
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
