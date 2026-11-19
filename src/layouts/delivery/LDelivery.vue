<script setup>
import DeliveryRequest from '~/services/delivery-request'
import AuthRequest from '~/services/auth-request'
import { deliveryLoginOnError } from '~/utils/delivery'
import { requestError } from '~/utils/checkout'
import '~/styles/account.css'
import '~/styles/delivery.css'

const route = useRoute()
const router = useRouter()
const admin = computed(() => route.path.startsWith('/admin/'))
const authorized = ref(false)
const identity = ref('')
const error = ref('')
const loading = ref(true)
const signingOut = ref(false)
const links = computed(() => admin.value
  ? [
    ['/admin/shipping/shipments', 'Vận đơn'], ['/admin/shipping/providers', 'Đơn vị vận chuyển'], ['/admin/shipping/staff', 'Nhân viên'], ['/admin/dashboard', 'Quản trị'],
  ]
  : [['/delivery/dashboard', 'Tổng quan'], ['/delivery/orders', 'Vận đơn của tôi'], ['/delivery/history', 'Lịch sử xử lý']])
async function authorize() {
  loading.value = true
  error.value = ''
  const key = admin.value ? 'admin_token' : 'delivery_token'
  if (!localStorage.getItem(key)) { await router.replace(admin.value ? '/admin/login' : '/delivery/login'); return }
  try {
    if (admin.value) { await DeliveryRequest.providers(); identity.value = 'Quản trị vận chuyển' }
    else { const { data } = await DeliveryRequest.me(); identity.value = `${data.name} · ${data.provider.name}` }
    authorized.value = true
  }
  catch (failure) { if (!deliveryLoginOnError(failure, router, admin.value)) error.value = requestError(failure, 'Không kiểm tra được phiên đăng nhập.') }
  finally { loading.value = false }
}
onMounted(authorize)
async function signOut() {
  if (signingOut.value) return
  signingOut.value = true
  try { if (admin.value) await AuthRequest.logoutAdmin(); else await DeliveryRequest.logout() }
  finally { localStorage.removeItem(admin.value ? 'admin_token' : 'delivery_token'); await router.replace(admin.value ? '/admin/login' : '/delivery/login'); signingOut.value = false }
}
</script>

<template>
  <div class="operations-shell">
    <header class="operations-header">
      <div class="operations-header-inner">
        <RouterLink to="/buyer/home" class="operations-brand">
          <CSystemBrand /><span>{{ admin ? 'Quản lý vận chuyển' : 'Kênh vận chuyển' }}</span>
        </RouterLink><div class="account-actions">
          <span class="operations-muted">{{ identity }}</span><button v-if="authorized" type="button" class="account-link" :disabled="signingOut" @click="signOut">
            Đăng xuất
          </button>
        </div>
      </div><nav v-if="authorized" class="operations-nav" aria-label="Điều hướng vận chuyển">
        <RouterLink v-for="[path, label] in links" :key="path" :to="path">
          {{ label }}
        </RouterLink>
      </nav>
    </header>
    <main class="operations-main">
      <p v-if="loading" class="account-state" role="status">
        Đang kiểm tra quyền truy cập…
      </p><p v-if="error" class="account-error" role="alert">
        {{ error }} <button type="button" class="account-link" @click="authorize">
          Thử lại
        </button>
      </p><RouterView v-if="authorized" />
    </main>
  </div>
</template>
