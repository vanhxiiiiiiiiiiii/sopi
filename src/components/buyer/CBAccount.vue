<script setup>
import { useUser } from '~/stores/user'
import AuthRequest from '~/services/auth-request'
import { getResources } from '~/utils/resources'
import { requestError } from '~/utils/checkout'
const user = useUser()
const router = useRouter()
const leaving = ref(false)
const error = ref('')
const avatar = computed(() =>
    user.profile?.avatar_image ? getResources(user.profile.avatar_image) : '/img/avatar_sample.png',
)
async function signOut() {
    if (leaving.value) return
    leaving.value = true
    try {
        await AuthRequest.logoutUser()
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        user.payget = {}
        user.profile = {}
        router.replace('/buyer/login')
    } catch (failure) {
        error.value = requestError(failure, 'Không thể đăng xuất.')
    } finally {
        leaving.value = false
    }
}
</script>
<template>
    <aside class="account-sidebar">
        <div class="account-identity">
            <img
                :src="avatar"
                alt="Ảnh đại diện"
                width="48"
                height="48"
                @error="$event.target.src = '/img/avatar_sample.png'"
            />
            <div>
                <strong>{{ user.payget?.username || 'Tài khoản của tôi' }}</strong
                ><RouterLink to="/buyer/account/dashboard">Sửa hồ sơ</RouterLink>
            </div>
        </div>
        <nav aria-label="Tài khoản của tôi">
            <p class="account-nav-label">
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                >
                    <circle cx="12" cy="7" r="4" />
                    <path d="M4 22v-3a8 8 0 0 1 16 0v3" /></svg
                >Tài khoản của tôi
            </p>
            <div class="account-subnav">
                <RouterLink to="/buyer/account/dashboard" exact-active-class="account-active"
                    >Hồ sơ</RouterLink
                ><RouterLink to="/buyer/account/payment" exact-active-class="account-active"
                    >Ngân hàng</RouterLink
                ><RouterLink to="/buyer/account/credit" exact-active-class="account-active"
                    >Thẻ tín dụng</RouterLink
                ><RouterLink to="/buyer/account/address" exact-active-class="account-active"
                    >Địa chỉ</RouterLink
                ><RouterLink to="/buyer/account/password" exact-active-class="account-active"
                    >Đổi mật khẩu</RouterLink
                >
            </div>
            <RouterLink
                to="/buyer/account/orders"
                class="account-nav-label"
                exact-active-class="account-active"
                ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                >
                    <path d="M8 4H4v18h16V4h-4M8 2h8v5H8zM8 12h8M8 16h8" /></svg
                >Đơn mua</RouterLink
            >
            <RouterLink
                to="/buyer/account/vouchers"
                class="account-nav-label"
                exact-active-class="account-active"
                ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    aria-hidden="true"
                >
                    <path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4zM9 5v14" /></svg
                >Kho voucher</RouterLink
            >
            <RouterLink to="/buyer/favourite" class="account-nav-label"
                >Sản phẩm yêu thích</RouterLink
            >
            <button type="button" class="account-logout" :disabled="leaving" @click="signOut">
                {{ leaving ? 'Đang đăng xuất…' : 'Đăng xuất' }}
            </button>
        </nav>
        <p v-if="error" class="account-error" role="alert">{{ error }}</p>
    </aside>
</template>
