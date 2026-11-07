<route lang="yaml">
meta:
    layout: seller/LSDashBoard
</route>
<script setup>
import Axios from '~/services/axios-instance'
import { requestError } from '~/utils/checkout'
const payload = reactive({ name: '', description: '' })
const loaded = ref(false)
const busy = ref(false)
const error = ref('')
const success = ref('')
onMounted(async () => {
    try {
        const { data } = await Axios.get('/shop')
        payload.name = data.name
        payload.description = data.description || ''
        loaded.value = true
    } catch (failure) {
        error.value = requestError(failure, 'Không tải được hồ sơ.')
    }
})
async function save() {
    if (busy.value) return
    busy.value = true
    error.value = ''
    success.value = ''
    try {
        const body = { name: payload.name }
        if (payload.description) body.description = payload.description
        await Axios.put('/shop', body)
        success.value = 'Đã cập nhật cửa hàng.'
    } catch (failure) {
        error.value = requestError(failure, 'Không lưu được cửa hàng.')
    } finally {
        busy.value = false
    }
}
</script>
<template>
    <section class="seller-panel">
        <h1>Hồ sơ cửa hàng</h1>
        <p v-if="error" role="alert">{{ error }}</p>
        <p v-if="success" role="status">{{ success }}</p>
        <form v-if="loaded" class="seller-application" @submit.prevent="save">
            <label>Tên cửa hàng<input v-model.trim="payload.name" maxlength="30" required /></label
            ><label
                >Giới thiệu cửa hàng<textarea
                    v-model.trim="payload.description"
                    maxlength="500"
                /></label
            ><button type="submit" :disabled="busy">
                {{ busy ? 'Đang lưu…' : 'Lưu thay đổi' }}
            </button>
        </form>
    </section>
</template>
