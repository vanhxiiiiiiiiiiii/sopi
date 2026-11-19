<script setup>
import Axios from '~/services/axios-instance'
import { adminIdentity, adminPagePermission, canAdmin, refreshAdmin } from '~/composables/admin-access'
import { requestError } from '~/utils/checkout'
import '~/styles/account.css'
import '~/styles/delivery.css'
import '~/styles/admin.css'
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const error = ref('')
const signingOut = ref(false)
let revision = 0
const allowed = computed(() => adminIdentity.value && (!adminPagePermission(route.path) || canAdmin(adminPagePermission(route.path))))
const links = computed(() => [
  ['/admin/dashboard', 'Tổng quan', null], ['/admin/administrators', 'Tài khoản & phân quyền', 'super'],
  ['/admin/commerce', 'Quản lý mua bán', 'commerce'], ['/admin/sellers', 'Duyệt người bán', 'commerce'],
  ['/admin/shipping/shipments', 'Vận đơn', 'logistics'], ['/admin/shipping/providers', 'Đơn vị vận chuyển', 'logistics'],
  ['/admin/shipping/staff', 'Nhân viên vận chuyển', 'logistics'],
  ['/admin/shipping/rates', 'Phí vận chuyển', 'logistics'],
].filter(([, , permission]) => !permission || canAdmin(permission)))
async function authorize() {
  const current = ++revision
  loading.value = true
  error.value = ''
  adminIdentity.value = null
  if (!localStorage.getItem('admin_token')) { await router.replace('/admin/login'); return }
  try {
    const data = await refreshAdmin()
    if (current === revision) adminIdentity.value = data
  }
  catch (failure) {
    if (current !== revision) return
    if (failure.response?.status === 401) { localStorage.removeItem('admin_token'); await router.replace('/admin/login') }
    else { error.value = requestError(failure, 'Không xác minh được quyền quản trị.') }
  }
  finally { if (current === revision) loading.value = false }
}
watch(() => route.path, authorize, { immediate: true })
onActivated(authorize)
async function logout() {
  signingOut.value = true
  try { await Axios.post('/admin/auth/sign-out') }
  finally {
    localStorage.removeItem('admin_token'); localStorage.removeItem('admin'); adminIdentity.value = null
    await router.replace('/admin/login'); signingOut.value = false
  }
}
</script>
<template>
  <div class="operations-shell admin-workspace">
    <header class="operations-header">
      <div class="operations-header-inner">
        <RouterLink to="/admin/dashboard" class="operations-brand">
          <CSystemBrand /><span>Kênh quản trị</span>
        </RouterLink>
        <div class="account-actions">
          <span v-if="adminIdentity" class="admin-role-tag">{{ adminIdentity.role.name }}</span><span>{{ adminIdentity?.username }}</span><button type="button" class="account-link" :disabled="signingOut" @click="logout">
            Đăng xuất
          </button>
        </div>
      </div>
      <nav v-if="adminIdentity" class="operations-nav" aria-label="Chức năng quản trị">
        <RouterLink v-for="[path, label] in links" :key="path" :to="path">
          {{ label }}
        </RouterLink>
      </nav>
    </header>
    <main class="operations-main">
      <p v-if="loading" class="account-state" role="status">
        Đang kiểm tra quyền truy cập…
      </p>
      <div v-else-if="error" class="account-error" role="alert">
        {{ error }} <button class="account-link" @click="authorize">
          Thử lại
        </button>
      </div>
      <RouterView v-else-if="allowed" />
      <section v-else class="account-panel">
        <h1>Không có quyền truy cập</h1><p>Chức năng này thuộc nhóm quản trị khác. Chọn một mục trong menu để tiếp tục.</p><RouterLink to="/admin/dashboard" class="account-link">
          Về tổng quan
        </RouterLink>
      </section>
    </main>
  </div>
</template>
