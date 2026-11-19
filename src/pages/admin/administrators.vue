<route lang="yaml">
meta:
  layout: admin/LAWorkspace
</route>
<script setup>
import Axios from '~/services/axios-instance'
import { adminIdentity, adminRoles } from '~/composables/admin-access'
import { localDate, requestError } from '~/utils/checkout'
const records = ref([])
const activity = ref([])
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const success = ref('')
const q = ref('')
const page = ref(1)
const lastPage = ref(1)
const selected = ref(null)
const editing = ref(false)
const form = reactive({ username: '', email: '', role_code: 'commerce_admin', is_active: true, password: '', password_confirmation: '' })
async function load() {
  loading.value = true; error.value = ''
  try {
    const [users, logs] = await Promise.all([Axios.get('/admin/administrators', { params: { q: q.value || undefined, page: page.value } }), Axios.get('/admin/activity')])
    records.value = users.data.data; lastPage.value = users.data.last_page; activity.value = logs.data.data
  }
  catch (failure) { error.value = requestError(failure, 'Không tải được tài khoản quản trị.') }
  finally { loading.value = false }
}
function edit(record = null) {
  selected.value = record; editing.value = true; error.value = ''; success.value = ''
  Object.assign(form, { username: record?.username || '', email: record?.email || '', role_code: record?.role?.code || 'commerce_admin', is_active: record?.is_active ?? true, password: '', password_confirmation: '' })
}
const ownAccount = computed(() => selected.value?.id === adminIdentity.value?.id)
async function save() {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    await Axios[selected.value ? 'put' : 'post'](`/admin/administrators${selected.value ? `/${selected.value.id}` : ''}`, { ...form })
    form.password = ''; form.password_confirmation = ''; editing.value = false; await load(); success.value = 'Đã lưu tài khoản và quyền quản trị. Phiên cũ được thu hồi khi đổi quyền, mật khẩu hoặc khóa tài khoản.'
  }
  catch (failure) { error.value = requestError(failure, 'Không lưu được tài khoản quản trị.') }
  finally { busy.value = false }
}
watch(page, load)
onMounted(load)
</script>
<template>
  <section class="account-panel">
    <header class="account-panel-header">
      <div><h1>Tài khoản & phân quyền</h1><p>Chỉ Super Admin được cấp quyền và quản lý tài khoản quản trị.</p></div><button class="account-primary" :disabled="busy" @click="edit()">
        Thêm quản trị viên
      </button>
    </header>
    <div class="admin-role-grid">
      <article v-for="role in adminRoles" :key="role.code" class="admin-role-card">
        <h2>{{ role.name }}</h2><p>{{ role.description }}</p>
      </article>
    </div>
    <p v-if="error" class="account-error" role="alert">
      {{ error }}
    </p><p v-if="success" class="account-success" role="status">
      {{ success }}
    </p>
    <form v-if="editing" class="admin-edit" @submit.prevent="save">
      <h2>{{ selected ? 'Chỉnh sửa quản trị viên' : 'Tạo quản trị viên' }}</h2><p v-if="ownAccount">
        Bạn có thể sửa thông tin của mình; không thể tự khóa hoặc tự đổi vai trò.
      </p>
      <div class="admin-form-grid">
        <label>Tên đăng nhập<input v-model.trim="form.username" required maxlength="50" pattern="[A-Za-z0-9_-]+" :disabled="busy" autocomplete="off"></label>
        <label>Email<input v-model.trim="form.email" type="email" required maxlength="50" :disabled="busy"></label>
        <label>Vai trò<select v-model="form.role_code" required :disabled="busy || ownAccount"><option v-for="role in adminRoles" :key="role.code" :value="role.code">{{ role.name }}</option></select></label>
        <label>Trạng thái<select v-model="form.is_active" :disabled="busy || ownAccount"><option :value="true">Đang hoạt động</option><option :value="false">Ngừng hoạt động</option></select></label>
        <label>{{ selected ? 'Mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu (bắt buộc)' }}<input v-model="form.password" type="password" :required="!selected" minlength="12" maxlength="128" autocomplete="new-password" :disabled="busy"></label>
        <label>Nhập lại mật khẩu<input v-model="form.password_confirmation" type="password" :required="!!form.password" autocomplete="new-password" :disabled="busy"></label>
      </div><div class="account-actions">
        <button class="account-primary" :disabled="busy">
          {{ busy ? 'Đang lưu…' : 'Lưu tài khoản' }}
        </button><button type="button" class="account-secondary" :disabled="busy" @click="editing = false; form.password = ''; form.password_confirmation = ''">
          Hủy
        </button>
      </div>
    </form>
    <form class="operations-toolbar" @submit.prevent="page = 1; load()">
      <label>Tìm tài khoản<input v-model.trim="q" placeholder="Tên đăng nhập hoặc email" maxlength="100"></label><button class="account-secondary">
        Tìm kiếm
      </button>
    </form>
    <p v-if="loading" class="account-state" role="status">
      Đang tải tài khoản…
    </p>
    <div v-else class="admin-table-scroll">
      <table class="admin-table">
        <thead><tr><th>Tài khoản</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>
          <tr v-for="record in records" :key="record.id">
            <td>{{ record.username }}</td><td>{{ record.email }}</td><td>{{ record.role?.name || 'Chưa phân quyền' }}</td><td>{{ record.is_active ? 'Hoạt động' : 'Đã khóa' }}</td><td>
              <button class="account-link" :disabled="busy" @click="edit(record)">
                Chỉnh sửa
              </button>
            </td>
          </tr><tr v-if="!records.length">
            <td colspan="5">
              Không tìm thấy tài khoản.
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
    <h2 style="margin-top:32px">
      Lịch sử quản trị gần đây
    </h2><div class="admin-table-scroll">
      <table class="admin-table">
        <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Thao tác</th><th>Đối tượng</th></tr></thead><tbody>
          <tr v-for="log in activity" :key="log.id">
            <td>{{ localDate(log.created_at) }}</td><td>{{ log.actor_name }}</td><td>{{ { admin_created: 'Tạo quản trị viên', admin_updated: 'Đổi thông tin / quyền', product_moderated: 'Kiểm duyệt sản phẩm' }[log.action] || log.action }}</td><td>{{ log.subject_type }} #{{ log.subject_id }}</td>
          </tr><tr v-if="!activity.length">
            <td colspan="4">
              Chưa có thao tác.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>
