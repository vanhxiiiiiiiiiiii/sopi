<script setup>
import Axios from '~/services/axios-instance'
import { requestError } from '~/utils/checkout'
const router = useRouter()
const route = useRoute()
const state = ref(null)
const loading = ref(true)
const error = ref('')
const saving = ref(false)
const started = ref(false)
const payload = reactive({ name: '', phone: '', email: '', address: '', tax_code: '' })
async function load() {
    state.value = null
    started.value = false
    loading.value = true
    error.value = ''
    if (!localStorage.getItem('token')) {
        router.replace('/buyer/login')
        return
    }
    try {
        const { data } = await Axios.get('/user/seller-application')
        state.value = data
    } catch (failure) {
        error.value = requestError(failure, 'Không tải được thông tin người bán.')
    } finally {
        loading.value = false
    }
}
onActivated(load)
async function submit() {
    if (saving.value) return
    saving.value = true
    error.value = ''
    try {
        const { data } = await Axios.post('/user/seller-application', payload)
        state.value = data
        started.value = false
    } catch (failure) {
        error.value = requestError(failure, 'Không gửi được hồ sơ.')
    } finally {
        saving.value = false
    }
}
const links = [
    { path: '/seller/home', label: 'Tổng quan' },
    { path: '/seller/orders/all', label: 'Tất cả đơn hàng' },
    { path: '/seller/product/all', label: 'Tất cả sản phẩm' },
    { path: '/seller/product/new', label: 'Thêm sản phẩm' },
    { path: '/seller/shop/profile', label: 'Hồ sơ cửa hàng' },
    { path: '/seller/shop/preview', label: 'Xem cửa hàng' },
]
</script>
<template>
    <div class="seller-workspace">
        <header class="seller-header">
            <RouterLink to="/buyer/home" class="seller-logo"><CSystemBrand /></RouterLink
            ><span>Kênh người bán</span
            ><RouterLink to="/buyer/account/dashboard" class="seller-account"
                >Tài khoản của tôi ↗</RouterLink
            >
        </header>
        <p v-if="loading" class="seller-welcome" role="status">Đang kiểm tra cửa hàng…</p>
        <div v-if="error" class="seller-error" role="alert">
            {{ error }} <button type="button" @click="load">Thử lại</button>
        </div>
        <div v-if="!loading && state?.shop?.is_active" class="seller-grid">
            <aside class="seller-sidebar">
                <strong>{{ state.shop.name }}</strong>
                <p>QUẢN LÝ CỬA HÀNG</p>
                <nav>
                    <RouterLink
                        v-for="link in links"
                        :key="link.path"
                        :to="link.path"
                        exact-active-class="selected"
                        >{{ link.label }}</RouterLink
                    >
                </nav>
                <RouterLink to="/buyer/home">← Trở về mua sắm</RouterLink>
            </aside>
            <main class="seller-content">
                <div class="seller-breadcrumb">
                    Người bán /
                    {{ links.find((link) => link.path === route.path)?.label || 'Cửa hàng' }}
                </div>
                <router-view />
            </main>
        </div>
        <main v-else-if="!loading && state" class="seller-onboarding">
            <section v-if="state.shop" class="seller-welcome">
                <h1>Cửa hàng đang ngừng hoạt động</h1>
                <p>Vui lòng liên hệ quản trị viên để được hỗ trợ.</p>
            </section>
            <section v-else-if="state.application?.status === 'pending'" class="seller-welcome">
                <div class="seller-emblem">✓</div>
                <h1>Hồ sơ đang chờ phê duyệt</h1>
                <p>
                    Đã nhận đăng ký cửa hàng <strong>{{ state.application.name }}</strong
                    >. Quản trị viên sẽ kiểm tra thông tin trước khi cấp quyền bán hàng.
                </p>
                <button type="button" @click="load">Kiểm tra trạng thái</button>
            </section>
            <section v-else class="seller-welcome">
                <div v-if="!started">
                    <div class="seller-emblem">♧</div>
                    <h1>Bắt đầu hành trình bán hàng</h1>
                    <p>Cung cấp thông tin cửa hàng để gửi hồ sơ đăng ký đến quản trị viên.</p>
                    <p v-if="state.application?.status === 'rejected'" class="seller-error">
                        Hồ sơ cần điều chỉnh. {{ state.application.review_note }}
                    </p>
                    <button type="button" @click="started = true">
                        {{ state.application ? 'Đăng ký lại' : 'Bắt đầu đăng ký' }}
                    </button>
                </div>
                <form v-else class="seller-application" @submit.prevent="submit">
                    <h1>Đăng ký trở thành người bán</h1>
                    <p>Thông tin được gửi đến quản trị viên xét duyệt.</p>
                    <label
                        >Tên cửa hàng<input
                            v-model.trim="payload.name"
                            maxlength="100"
                            required /></label
                    ><label
                        >Số điện thoại<input
                            v-model.trim="payload.phone"
                            type="tel"
                            pattern="[0-9]{10,11}"
                            required /></label
                    ><label
                        >Email liên hệ<input
                            v-model.trim="payload.email"
                            type="email"
                            required /></label
                    ><label
                        >Địa chỉ kinh doanh<textarea
                            v-model.trim="payload.address"
                            maxlength="1000"
                            required
                        /></label
                    ><label
                        >Mã số thuế (nếu có)<input
                            v-model.trim="payload.tax_code"
                            maxlength="50" /></label
                    ><button type="submit" :disabled="saving">
                        {{ saving ? 'Đang gửi…' : 'Gửi hồ sơ đăng ký' }}
                    </button>
                </form>
            </section>
        </main>
    </div>
</template>
<style src="~/styles/seller.css"></style>
