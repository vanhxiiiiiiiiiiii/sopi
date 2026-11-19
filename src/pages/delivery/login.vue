<route lang="yaml">
meta:
  layout: delivery/LDeliveryLogin
</route>
<script setup>
import DeliveryRequest from '~/services/delivery-request'
import { requestError } from '~/utils/checkout'
import '~/styles/account.css'
import '~/styles/delivery.css'
const router = useRouter()
const payload = reactive({ usernameOrEmail: '', password: '' })
const busy = ref(false)
const error = ref('')
useHead({ title: 'Đăng nhập vận chuyển | Shoppe' })
async function login() {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    const { token } = await DeliveryRequest.login(payload)
    localStorage.setItem('delivery_token', token)
    payload.password = ''
    await router.replace('/delivery/dashboard')
  }
  catch (failure) { error.value = requestError(failure, 'Không đăng nhập được. Vui lòng kiểm tra tài khoản vận chuyển.') }
  finally { busy.value = false }
}
</script>
<template>
  <div class="operations-shell">
    <header class="operations-header">
      <div class="operations-header-inner">
        <RouterLink to="/buyer/home" class="operations-brand">
          <CSystemBrand /><span>Kênh vận chuyển</span>
        </RouterLink><RouterLink to="/buyer/home" class="account-link">
          Về trang mua sắm
        </RouterLink>
      </div>
    </header><main class="operations-login">
      <h1>Đăng nhập nhân viên</h1><p class="operations-muted">
        Sử dụng tài khoản vận chuyển do quản trị viên cấp.
      </p><p v-if="error" class="account-error" role="alert">
        {{ error }}
      </p><form class="operations-form" @submit.prevent="login">
        <label>Tên đăng nhập hoặc email<input v-model.trim="payload.usernameOrEmail" autocomplete="username" maxlength="150" required :disabled="busy"></label><label>Mật khẩu<input v-model="payload.password" type="password" autocomplete="current-password" maxlength="128" required :disabled="busy"></label><button type="submit" class="account-primary" :disabled="busy">
          {{ busy ? 'Đang đăng nhập…' : 'Đăng nhập' }}
        </button>
      </form><p class="operations-muted" style="margin-top:20px">
        Tài khoản mua hàng và người bán không có quyền truy cập kênh này. Liên hệ quản trị viên nếu cần cấp lại tài khoản.
      </p>
    </main>
  </div>
</template>
