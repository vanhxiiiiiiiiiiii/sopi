<route lang="yaml">
meta:
    layout: admin/LALogin
</route>
<script setup>
import AuthRequest from '~/services/auth-request'
import { requestError } from '~/utils/checkout'
const router = useRouter()
const payload = reactive({ usernameOrEmail: '', password: '' })
const saving = ref(false)
const error = ref('')
async function login() {
    if (saving.value) return
    saving.value = true
    error.value = ''
    try {
        const result = await AuthRequest.loginAdmin(payload)
        localStorage.setItem('admin_token', result.token)
        localStorage.setItem('admin', JSON.stringify(result))
        router.replace('/admin/sellers')
    } catch (failure) {
        error.value = requestError(failure, 'Không đăng nhập được quản trị viên.')
    } finally {
        saving.value = false
    }
}
</script>
<template>
    <section class="admin-panel admin-login">
        <CSystemBrand />
        <h1>Đăng nhập quản trị</h1>
        <p>Quản trị hệ thống Shopee</p>
        <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
        <form @submit.prevent="login">
            <label
                >Tài khoản quản trị<input
                    v-model.trim="payload.usernameOrEmail"
                    autocomplete="username"
                    required /></label
            ><label
                >Mật khẩu<input
                    v-model="payload.password"
                    type="password"
                    autocomplete="current-password"
                    required /></label
            ><button type="submit" :disabled="saving">
                {{ saving ? 'Đang đăng nhập…' : 'Đăng nhập' }}
            </button>
        </form>
    </section>
</template>
