<route lang="yaml">
meta:
  layout: admin/LAWorkspace
</route>
<script setup>
import DeliveryRequest from '~/services/delivery-request'
import { requestError } from '~/utils/checkout'
import { deliveryLoginOnError } from '~/utils/delivery'
const router = useRouter()
const records = ref(null)
const providers = ref([])
const page = ref(1)
const query = ref('')
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const success = ref('')
const editing = ref(false)
const selectedId = ref(null)
const payload = reactive({ shipping_provider_id: '', username: '', email: '', name: '', phone: '', password: '', password_confirmation: '', is_active: true })
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [people, carriers] = await Promise.all([DeliveryRequest.staff({ page: page.value, limit: 20, q: query.value.trim() || undefined }), DeliveryRequest.providers()])
    records.value = people.data
    providers.value = carriers.data
  }
  catch (failure) { if (!deliveryLoginOnError(failure, router, true)) error.value = requestError(failure, 'Không tải được nhân viên vận chuyển.') }
  finally { loading.value = false }
}
function edit(item = null) {
  selectedId.value = item?.id || null
  Object.assign(payload, { shipping_provider_id: item?.shipping_provider_id || '', username: item?.username || '', email: item?.email || '', name: item?.name || '', phone: item?.phone || '', password: '', password_confirmation: '', is_active: item?.is_active ?? true })
  editing.value = true
  error.value = ''
  success.value = ''
}
async function save() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const body = { ...payload }
    if (!body.password) { delete body.password; delete body.password_confirmation }
    await DeliveryRequest.saveStaff(selectedId.value, body)
    payload.password = ''
    payload.password_confirmation = ''
    editing.value = false
    await load()
    success.value = 'Đã lưu tài khoản. Nhân viên đăng nhập tại /delivery/login.'
  }
  catch (failure) { if (!deliveryLoginOnError(failure, router, true)) error.value = requestError(failure, 'Không lưu được nhân viên.') }
  finally { busy.value = false }
}
function search() { if (page.value === 1) load(); else page.value = 1 }
onMounted(() => watch(page, load, { immediate: true }))
useHead({ title: 'Nhân viên vận chuyển | Shoppe' })
</script>
<template>
  <section class="account-panel">
    <header class="account-panel-header">
      <div><h1>Nhân viên vận chuyển</h1><p>Cấp tài khoản riêng cho đơn vị vận chuyển; quyền giao hàng không gắn với tài khoản người bán.</p></div><button class="account-primary" :disabled="busy" @click="edit()">
        Thêm nhân viên
      </button>
    </header><p v-if="error" class="account-error" role="alert">
      {{ error }} <button class="account-link" @click="load">
        Thử lại
      </button>
    </p><p v-if="success" class="account-success" role="status">
      {{ success }}
    </p><form v-if="editing" class="operations-form" @submit.prevent="save">
      <label>Đơn vị vận chuyển<select v-model="payload.shipping_provider_id" required :disabled="busy"><option value="" disabled>Chọn đơn vị</option><option v-for="provider in providers" :key="provider.id" :value="provider.id" :disabled="!provider.is_active">{{ provider.name }}</option></select></label><p v-if="!providers.length" class="operations-muted">
        Hãy thêm đơn vị vận chuyển đang hoạt động trước.
      </p><label>Họ tên<input v-model.trim="payload.name" maxlength="100" required :disabled="busy"></label><label>Tên đăng nhập<input v-model.trim="payload.username" maxlength="64" pattern="[A-Za-z0-9_-]+" autocomplete="off" required :disabled="busy"></label><label>Email<input v-model.trim="payload.email" type="email" maxlength="150" required :disabled="busy"></label><label>Điện thoại<input v-model.trim="payload.phone" inputmode="tel" pattern="[0-9]{10,11}" maxlength="11" required :disabled="busy"></label><label>{{ selectedId ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu (ít nhất 12 ký tự)' }}<input v-model="payload.password" type="password" autocomplete="new-password" minlength="12" maxlength="128" :required="!selectedId" :disabled="busy"></label><label>Nhập lại mật khẩu<input v-model="payload.password_confirmation" type="password" autocomplete="new-password" minlength="12" maxlength="128" :required="!!payload.password || !selectedId" :disabled="busy"></label><label style="display:flex;gap:10px;align-items:center"><input v-model="payload.is_active" type="checkbox" style="min-height:auto" :disabled="busy">Tài khoản đang hoạt động</label><p class="operations-muted">
        Khóa tài khoản hoặc đổi mật khẩu sẽ kết thúc các phiên đăng nhập hiện có. Không đổi đơn vị của tài khoản đã có lịch sử phân công.
      </p><div class="account-actions">
        <button class="account-primary" :disabled="busy">
          {{ busy ? 'Đang lưu…' : 'Lưu tài khoản' }}
        </button><button type="button" class="account-secondary" :disabled="busy" @click="editing = false; payload.password = ''; payload.password_confirmation = ''">
          Hủy
        </button>
      </div>
    </form><template v-else>
      <form class="operations-toolbar" @submit.prevent="search">
        <label>Tìm nhân viên<input v-model.trim="query" maxlength="100" placeholder="Họ tên hoặc tài khoản"></label><button class="account-secondary">
          Tìm kiếm
        </button>
      </form><p v-if="loading" class="account-state" role="status">
        Đang tải nhân viên…
      </p><p v-else-if="!records?.data?.length && !error" class="account-empty">
        Chưa có nhân viên phù hợp.
      </p><div v-else-if="records" class="operations-table-wrap">
        <table class="operations-table">
          <thead><tr><th>Họ tên</th><th>Tài khoản</th><th>Đơn vị</th><th>Liên hệ</th><th>Trạng thái</th><th /></tr></thead><tbody>
            <tr v-for="person in records.data" :key="person.id">
              <td>{{ person.name }}</td><td>{{ person.username }}</td><td>{{ person.provider?.name }}</td><td>{{ person.email }}<small>{{ person.phone }}</small></td><td>{{ person.is_active ? 'Đang hoạt động' : 'Đã khóa' }}</td><td>
                <button class="account-link" @click="edit(person)">
                  Cập nhật
                </button>
              </td>
            </tr>
          </tbody>
        </table><div v-if="records.last_page > 1" class="operations-pagination">
          <button class="account-secondary" :disabled="page <= 1" @click="page--">
            Trang trước
          </button><span>{{ page }} / {{ records.last_page }}</span><button class="account-secondary" :disabled="page >= records.last_page" @click="page++">
            Trang sau
          </button>
        </div>
      </div>
    </template>
  </section>
</template>
