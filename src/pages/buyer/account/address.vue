<route lang="yaml">
meta:
    layout: buyer/account/LBDashboard
</route>
<script setup>
import AccountRequest from '~/services/account-request'
import { addressLine, requestError } from '~/utils/checkout'
const records = ref([])
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const selectedId = ref(null)
const removeId = ref(null)
const error = ref('')
const success = ref('')
const payload = reactive({})
const fields = [
    { key: 'full_name', label: 'Họ và tên', max: 64 },
    { key: 'phone', label: 'Số điện thoại', pattern: '[0-9]{10,11}', max: 11 },
    { key: 'state', label: 'Tỉnh / thành phố', max: 50 },
    { key: 'city', label: 'Quận / huyện', max: 50 },
    { key: 'town', label: 'Phường / xã', max: 50 },
    { key: 'address', label: 'Số nhà, tên đường', max: 255 },
]
const isDefault = (record) => record.types?.some((type) => Number(type.id) === 1)
async function load() {
    const { data } = await AccountRequest.getAddress()
    records.value = data ?? []
}
onMounted(async () => {
    try {
        await load()
    } catch (failure) {
        error.value = requestError(failure, 'Không tải được địa chỉ.')
    } finally {
        loading.value = false
    }
})
function edit(record = null) {
    selectedId.value = record?.id ?? null
    fields.forEach((field) => {
        payload[field.key] = record?.[field.key] ?? ''
    })
    payload.is_home = record?.is_home ?? true
    payload.is_default_address = record ? !!isDefault(record) : !records.value.length
    editing.value = true
    removeId.value = null
    error.value = ''
    success.value = ''
}
async function save() {
    if (saving.value) return
    saving.value = true
    error.value = ''
    success.value = ''
    try {
        if (selectedId.value)
            await AccountRequest.updateAddressById(selectedId.value, { ...payload })
        else await AccountRequest.createAddress({ ...payload })
        editing.value = false
        await load()
        success.value = 'Đã lưu địa chỉ nhận hàng.'
    } catch (failure) {
        error.value = requestError(failure, 'Không lưu được địa chỉ.')
    } finally {
        saving.value = false
    }
}
async function setDefault(record) {
    if (saving.value) return
    saving.value = true
    error.value = ''
    try {
        await AccountRequest.updateAddressById(record.id, { is_default_address: true })
        await load()
        success.value = 'Đã cập nhật địa chỉ mặc định.'
    } catch (failure) {
        error.value = requestError(failure, 'Không cập nhật được địa chỉ mặc định.')
    } finally {
        saving.value = false
    }
}
async function remove() {
    if (saving.value) return
    saving.value = true
    error.value = ''
    try {
        await AccountRequest.deleteAddressById(removeId.value)
        removeId.value = null
        await load()
        success.value = 'Đã xóa địa chỉ.'
    } catch (failure) {
        error.value = requestError(failure, 'Không xóa được địa chỉ.')
    } finally {
        saving.value = false
    }
}
</script>
<template>
    <section class="account-panel">
        <header class="account-panel-header">
            <div>
                <h1>Địa chỉ của tôi</h1>
                <p>Quản lý các địa chỉ nhận hàng của bạn</p>
            </div>
            <button type="button" class="account-primary" :disabled="saving" @click="edit()">
                ＋ Thêm địa chỉ
            </button>
        </header>
        <p v-if="error" class="account-error" role="alert">{{ error }}</p>
        <p v-if="success" class="account-success" role="status">{{ success }}</p>
        <p v-if="loading" class="account-state" role="status">Đang tải địa chỉ…</p>
        <form v-if="editing" class="account-form account-inline-form" @submit.prevent="save">
            <h2>{{ selectedId ? 'Cập nhật địa chỉ' : 'Địa chỉ mới' }}</h2>
            <label
                v-for="field in fields"
                :key="field.key"
                class="account-form-row"
                :for="'address-' + field.key"
                ><span>{{ field.label }}</span
                ><input
                    :id="'address-' + field.key"
                    v-model.trim="payload[field.key]"
                    :type="field.key === 'phone' ? 'tel' : 'text'"
                    :maxlength="field.max"
                    :pattern="field.pattern"
                    :disabled="saving"
                    required
            /></label>
            <div class="account-form-row">
                <span /><label class="account-check"
                    ><input
                        v-model="payload.is_default_address"
                        type="checkbox"
                        :disabled="
                            selectedId &&
                            payload.is_default_address &&
                            records.some((record) => record.id === selectedId && isDefault(record))
                        "
                    />Đặt làm địa chỉ mặc định</label
                >
            </div>
            <div class="account-form-row">
                <span />
                <div class="account-actions">
                    <button
                        type="button"
                        class="account-secondary"
                        :disabled="saving"
                        @click="editing = false"
                    >
                        Trở lại</button
                    ><button type="submit" class="account-primary" :disabled="saving">
                        {{ saving ? 'Đang lưu…' : 'Lưu địa chỉ' }}
                    </button>
                </div>
            </div>
        </form>
        <div v-else-if="!loading && !records.length" class="account-empty">
            Bạn chưa có địa chỉ nhận hàng.
        </div>
        <div v-else-if="!loading" class="account-records">
            <article v-for="record in records" :key="record.id" class="account-record">
                <div>
                    <h3>
                        {{ record.full_name }} <span class="account-phone">{{ record.phone }}</span>
                    </h3>
                    <p>{{ addressLine(record) }}</p>
                    <span v-if="isDefault(record)" class="account-default">Mặc định</span>
                </div>
                <div class="account-record-actions">
                    <div>
                        <button
                            type="button"
                            class="account-link"
                            :disabled="saving"
                            @click="edit(record)"
                        >
                            Cập nhật</button
                        ><button
                            v-if="!isDefault(record)"
                            type="button"
                            class="account-link"
                            :disabled="saving"
                            @click="removeId = record.id"
                        >
                            Xóa
                        </button>
                    </div>
                    <button
                        type="button"
                        class="account-secondary"
                        :disabled="saving || isDefault(record)"
                        @click="setDefault(record)"
                    >
                        Thiết lập mặc định
                    </button>
                </div>
                <div v-if="removeId === record.id" class="account-confirm">
                    <p>Xóa địa chỉ nhận hàng này?</p>
                    <button
                        type="button"
                        class="account-secondary"
                        :disabled="saving"
                        @click="removeId = null"
                    >
                        Giữ lại</button
                    ><button
                        type="button"
                        class="account-primary"
                        :disabled="saving"
                        @click="remove"
                    >
                        Xác nhận xóa
                    </button>
                </div>
            </article>
        </div>
    </section>
</template>
