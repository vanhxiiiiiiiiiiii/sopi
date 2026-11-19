<route lang="yaml">
meta:
    layout: buyer/account/LBDashboard
</route>
<script setup>
import AccountRequest from '~/services/account-request'
import ResourceRequest from '~/services/resource-request'
import { useUser } from '~/stores/user'
import { getResources } from '~/utils/resources'
import { requestError } from '~/utils/checkout'
const user = useUser()
const profile = ref(null)
const loading = ref(true)
const saving = ref(false)
const uploading = ref(false)
const error = ref('')
const success = ref('')
const fileInput = ref(null)
const payload = reactive({
    display_name: '',
    phone: '',
    gender: 0,
    date_of_birth: '',
    avatar_image: '',
})
const preview = computed(() =>
    payload.avatar_image ? getResources(payload.avatar_image) : '/img/avatar_sample.png',
)
function dateInput(value) {
    if (!value) return ''
    if (value.includes('/')) {
        const [month, day, year] = value.split('/')
        return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-')
    }
    return value.slice(0, 10)
}
onMounted(async () => {
    try {
        const { data } = await AccountRequest.getProfile()
        profile.value = data
        const saved = data.profile ?? {}
        Object.assign(payload, {
            display_name: saved.display_name ?? '',
            phone: saved.phone ?? '',
            gender: saved.gender ?? 0,
            date_of_birth: dateInput(saved.date_of_birth),
            avatar_image: saved.avatar_image ?? '',
        })
    } catch (failure) {
        error.value = requestError(failure, 'Không tải được hồ sơ.')
    } finally {
        loading.value = false
    }
})
async function upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    error.value = ''
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 1024 * 1024) {
        error.value = 'Chọn ảnh JPEG hoặc PNG có dung lượng tối đa 1 MB.'
        event.target.value = ''
        return
    }
    uploading.value = true
    try {
        const form = new FormData()
        form.append('image', file)
        form.append('ratio', '0')
        const { data } = await ResourceRequest.createResourcesImages(form)
        payload.avatar_image = data.id
    } catch (failure) {
        error.value = requestError(failure, 'Không tải được ảnh.')
    } finally {
        uploading.value = false
    }
}
async function save() {
    if (saving.value || uploading.value) return
    saving.value = true
    error.value = ''
    success.value = ''
    try {
        const body = Object.fromEntries(
            Object.entries(payload).filter(([, value]) => value !== '' && value != null),
        )
        if (payload.date_of_birth) {
            const [year, month, day] = payload.date_of_birth.split('-')
            body.date_of_birth = [month, day, year].join('/')
        }
        await AccountRequest.updateProfile(body)
        const { data } = await AccountRequest.getProfile()
        user.payget = data
        user.profile = data.profile ?? {}
        success.value = 'Đã lưu hồ sơ của bạn.'
    } catch (failure) {
        error.value = requestError(failure, 'Không lưu được hồ sơ.')
    } finally {
        saving.value = false
    }
}
</script>
<template>
    <section class="account-panel">
        <header class="account-panel-header">
            <div>
                <h1>Hồ sơ của tôi</h1>
                <p>Quản lý thông tin hồ sơ và tài khoản của bạn</p>
            </div>
        </header>
        <p v-if="loading" class="account-state" role="status">Đang tải hồ sơ…</p>
        <p v-if="error" class="account-error" role="alert">{{ error }}</p>
        <p v-if="success" class="account-success" role="status">{{ success }}</p>
        <form v-if="profile && !loading" class="profile-grid" @submit.prevent="save">
            <div class="account-form">
                <div class="account-form-row">
                    <span>Tên đăng nhập</span><strong>{{ profile.username }}</strong>
                </div>
                <label class="account-form-row" for="profile-name"
                    ><span>Họ và tên</span
                    ><input
                        id="profile-name"
                        v-model.trim="payload.display_name"
                        maxlength="50"
                        autocomplete="name"
                        required
                /></label>
                <div class="account-form-row">
                    <span>Email</span><span>{{ profile.email }}</span>
                </div>
                <label class="account-form-row" for="profile-phone"
                    ><span>Số điện thoại</span
                    ><input
                        id="profile-phone"
                        v-model.trim="payload.phone"
                        type="tel"
                        pattern="[0-9]{10,11}"
                        autocomplete="tel"
                /></label>
                <fieldset class="account-form-row">
                    <legend class="sr-only">Giới tính</legend>
                    <span aria-hidden="true">Giới tính</span>
                    <div class="account-radio-row">
                        <label><input v-model="payload.gender" type="radio" :value="1" /> Nam</label
                        ><label><input v-model="payload.gender" type="radio" :value="2" /> Nữ</label
                        ><label
                            ><input v-model="payload.gender" type="radio" :value="0" /> Khác</label
                        >
                    </div>
                </fieldset>
                <label class="account-form-row" for="profile-birthday"
                    ><span>Ngày sinh</span
                    ><input
                        id="profile-birthday"
                        v-model="payload.date_of_birth"
                        type="date"
                        autocomplete="bday"
                        :max="new Date().toISOString().slice(0, 10)"
                /></label>
                <div class="account-form-row">
                    <span />
                    <div>
                        <button
                            type="submit"
                            class="account-primary"
                            :disabled="saving || uploading"
                        >
                            {{ saving ? 'Đang lưu…' : 'Lưu thay đổi' }}
                        </button>
                    </div>
                </div>
            </div>
            <div class="profile-avatar">
                <img
                    :src="preview"
                    alt="Ảnh đại diện"
                    width="104"
                    height="104"
                    @error="$event.target.src = '/img/avatar_sample.png'"
                /><input
                    ref="fileInput"
                    class="sr-only"
                    type="file"
                    accept="image/jpeg,image/png"
                    aria-label="Chọn ảnh đại diện"
                    :disabled="uploading || saving"
                    @change="upload"
                /><button
                    type="button"
                    class="account-secondary"
                    :disabled="uploading || saving"
                    @click="fileInput.click()"
                >
                    {{ uploading ? 'Đang tải ảnh…' : 'Chọn ảnh' }}
                </button>
                <p>Dung lượng tối đa 1 MB<br />Định dạng JPEG, PNG</p>
            </div>
        </form>
    </section>
</template>
