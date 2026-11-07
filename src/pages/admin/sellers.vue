<route lang="yaml">
meta:
    layout: admin/LALogin
</route>
<script setup>
import Axios from '~/services/axios-instance'
import { requestError, localDate } from '~/utils/checkout'
const router = useRouter()
const records = ref([])
const error = ref('')
const busy = ref(false)
const note = reactive({})
async function load() {
    try {
        records.value = (await Axios.get('/admin/seller-applications')).data
    } catch (failure) {
        error.value = requestError(failure, 'Không tải được hồ sơ.')
    }
}
onMounted(() => {
    if (!localStorage.getItem('admin_token')) router.replace('/admin/login')
    else load()
})
async function review(record, status) {
    if (busy.value) return
    busy.value = true
    error.value = ''
    try {
        await Axios.put('/admin/seller-applications/' + record.id, {
            status,
            review_note: note[record.id] || null,
        })
        await load()
    } catch (failure) {
        error.value = requestError(failure, 'Không xử lý được hồ sơ.')
    } finally {
        busy.value = false
    }
}
async function logout() {
    await Axios.post('/admin/auth/sign-out')
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin')
    router.replace('/admin/login')
}
</script>
<template>
    <section class="admin-panel">
        <header>
            <h1>Phê duyệt đăng ký người bán</h1>
            <button type="button" @click="logout">Đăng xuất quản trị</button>
        </header>
        <p v-if="error" class="admin-error" role="alert">{{ error }}</p>
        <p v-if="!records.length">Chưa có hồ sơ đăng ký.</p>
        <article v-for="record in records" :key="record.id">
            <h2>{{ record.name }}</h2>
            <p>{{ record.email }} · {{ record.phone }}</p>
            <p>{{ record.address }}</p>
            <p>Mã số thuế {{ record.tax_code || 'Chưa cung cấp' }}</p>
            <p>
                {{ localDate(record.created_at) }} ·
                {{
                    { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' }[
                        record.status
                    ]
                }}
            </p>
            <template v-if="record.status === 'pending'"
                ><label :for="'review-' + record.id"
                    >Ghi chú xét duyệt<textarea
                        :id="'review-' + record.id"
                        v-model="note[record.id]"
                        maxlength="1000"
                    /></label
                ><button type="button" :disabled="busy" @click="review(record, 'approved')">
                    Phê duyệt</button
                ><button type="button" :disabled="busy" @click="review(record, 'rejected')">
                    Từ chối
                </button></template
            >
            <p v-else>{{ record.review_note }}</p>
        </article>
    </section>
</template>
