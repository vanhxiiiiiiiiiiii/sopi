<route lang="yaml">
meta:
    layout: buyer/account/LBDashboard
</route>
<script setup>
import AccountRequest from '~/services/account-request'
import { requestError } from '~/utils/checkout'
const payload = reactive({ password: '', new_password: '', new_password_confirmation: '' })
const visible = ref(false)
const saving = ref(false)
const error = ref('')
const success = ref('')
async function save() {
    if (saving.value) return
    error.value = ''
    success.value = ''
    if (payload.new_password !== payload.new_password_confirmation) {
        error.value = 'Mật khẩu xác nhận chưa trùng khớp.'
        return
    }
    saving.value = true
    try {
        const result = await AccountRequest.updatePassword({ ...payload })
        if (result.token) localStorage.setItem('token', result.token)
        Object.assign(payload, { password: '', new_password: '', new_password_confirmation: '' })
        success.value = 'Đã cập nhật mật khẩu thành công.'
    } catch (failure) {
        error.value = requestError(failure, 'Không đổi được mật khẩu.')
    } finally {
        saving.value = false
    }
}
</script>
<template>
    <section class="account-panel">
        <header class="account-panel-header">
            <div>
                <h1>Đổi mật khẩu</h1>
                <p>Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu với người khác</p>
            </div>
        </header>
        <p v-if="error" class="account-error" role="alert">{{ error }}</p>
        <p v-if="success" class="account-success" role="status">{{ success }}</p>
        <form class="account-form account-password" @submit.prevent="save">
            <label class="account-form-row" for="current-password"
                ><span>Mật khẩu hiện tại</span
                ><input
                    id="current-password"
                    v-model="payload.password"
                    :type="visible ? 'text' : 'password'"
                    autocomplete="current-password"
                    minlength="5"
                    required
            /></label>
            <label class="account-form-row" for="new-password"
                ><span>Mật khẩu mới</span
                ><input
                    id="new-password"
                    v-model="payload.new_password"
                    :type="visible ? 'text' : 'password'"
                    autocomplete="new-password"
                    minlength="5"
                    required
            /></label>
            <label class="account-form-row" for="confirm-password"
                ><span>Xác nhận mật khẩu</span
                ><input
                    id="confirm-password"
                    v-model="payload.new_password_confirmation"
                    :type="visible ? 'text' : 'password'"
                    autocomplete="new-password"
                    minlength="5"
                    required
            /></label>
            <div class="account-form-row">
                <span /><label class="account-check"
                    ><input v-model="visible" type="checkbox" />Hiện mật khẩu</label
                >
            </div>
            <div class="account-form-row">
                <span />
                <div>
                    <button type="submit" class="account-primary" :disabled="saving">
                        {{ saving ? 'Đang cập nhật…' : 'Xác nhận' }}
                    </button>
                </div>
            </div>
        </form>
    </section>
</template>
