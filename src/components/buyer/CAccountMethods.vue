<script setup>
import AccountRequest from '~/services/account-request'
import { requestError } from '~/utils/checkout'
const props = defineProps({ kind: { type: String, required: true } })
const isCard = props.kind === 'card'
const title = isCard ? 'Thẻ tín dụng / ghi nợ' : 'Tài khoản ngân hàng của tôi'
const fields = isCard
    ? [
          { key: 'cardholder_name', label: 'Tên chủ thẻ', max: 64 },
          { key: 'card_number', label: 'Số thẻ', pattern: '[0-9]{16}', max: 16 },
          {
              key: 'expiry_date',
              label: 'Ngày hết hạn',
              placeholder: 'MM/YY',
              pattern: '(0[1-9]|1[0-2])/?[0-9]{2}',
              max: 5,
          },
          { key: 'cvv', label: 'CVV', pattern: '[0-9]{3}', max: 3, type: 'password' },
          { key: 'registration_address', label: 'Địa chỉ đăng ký' },
          { key: 'postal_code', label: 'Mã bưu chính', pattern: '[0-9]{5}', max: 5 },
      ]
    : [
          { key: 'accountholder_name', label: 'Tên chủ tài khoản', max: 64 },
          {
              key: 'identification_number',
              label: 'Số CMND / CCCD',
              pattern: '[0-9]{9,12}',
              max: 12,
          },
          { key: 'bank_name', label: 'Tên ngân hàng' },
          { key: 'bank_branch', label: 'Chi nhánh' },
          { key: 'account_number', label: 'Số tài khoản', pattern: '[0-9]{9,17}', max: 17 },
      ]
const api = isCard
    ? {
          list: AccountRequest.getCreditCard,
          create: AccountRequest.createCreditCard,
          update: AccountRequest.updateCreditCardById,
          remove: AccountRequest.deleteCreditCardById,
      }
    : {
          list: AccountRequest.getBankAccount,
          create: AccountRequest.createBankAccount,
          update: AccountRequest.updateBankAccountById,
          remove: AccountRequest.deleteBankAccountById,
      }
const records = ref([])
const loading = ref(true)
const saving = ref(false)
const editing = ref(false)
const selectedId = ref(null)
const removeId = ref(null)
const payload = reactive({})
const error = ref('')
const success = ref('')
async function load() {
    const { data } = await api.list()
    records.value = data ?? []
}
onMounted(async () => {
    try {
        await load()
    } catch (failure) {
        error.value = requestError(failure, 'Không tải được thông tin liên kết.')
    } finally {
        loading.value = false
    }
})
function edit(record = null) {
    selectedId.value = record?.id ?? null
    fields.forEach((field) => {
        payload[field.key] = field.key === 'cvv' ? '' : record?.[field.key] ?? ''
    })
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
        if (selectedId.value) await api.update(selectedId.value, { ...payload })
        else await api.create({ ...payload })
        editing.value = false
        fields.forEach((field) => {
            payload[field.key] = ''
        })
        await load()
        success.value = 'Đã lưu thông tin liên kết.'
    } catch (failure) {
        error.value = requestError(failure, 'Không lưu được thông tin.')
    } finally {
        saving.value = false
    }
}
async function remove() {
    if (saving.value) return
    saving.value = true
    error.value = ''
    success.value = ''
    try {
        await api.remove(removeId.value)
        removeId.value = null
        await load()
        success.value = 'Đã xóa thông tin liên kết.'
    } catch (failure) {
        error.value = requestError(failure, 'Không xóa được thông tin.')
    } finally {
        saving.value = false
    }
}
</script>
<template>
    <section class="account-method-section">
        <header class="account-panel-header">
            <h2>{{ title }}</h2>
            <button type="button" class="account-primary" :disabled="saving" @click="edit()">
                ＋ {{ isCard ? 'Thêm thẻ mới' : 'Thêm ngân hàng liên kết' }}
            </button>
        </header>
        <p v-if="error" class="account-error" role="alert">{{ error }}</p>
        <p v-if="success" class="account-success" role="status">{{ success }}</p>
        <p v-if="loading" class="account-state" role="status">Đang tải thông tin…</p>
        <form v-if="editing" class="account-form account-inline-form" @submit.prevent="save">
            <h3>
                {{
                    selectedId
                        ? 'Cập nhật thông tin'
                        : isCard
                        ? 'Thêm thẻ mới'
                        : 'Thêm tài khoản ngân hàng'
                }}
            </h3>
            <label
                v-for="field in fields"
                :key="field.key"
                class="account-form-row"
                :for="kind + '-' + field.key"
                ><span>{{ field.label }}</span
                ><input
                    :id="kind + '-' + field.key"
                    v-model.trim="payload[field.key]"
                    :type="field.type || 'text'"
                    :maxlength="field.max"
                    :pattern="field.pattern"
                    :placeholder="field.placeholder || field.label"
                    :disabled="saving"
                    autocomplete="off"
                    required
            /></label>
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
                        {{ saving ? 'Đang lưu…' : 'Lưu' }}
                    </button>
                </div>
            </div>
        </form>
        <div v-else-if="!loading && !records.length" class="account-empty">
            {{ isCard ? 'Bạn chưa liên kết thẻ.' : 'Bạn chưa có tài khoản ngân hàng.' }}
        </div>
        <div v-else-if="!loading" class="account-records">
            <article v-for="record in records" :key="record.id" class="account-record">
                <div>
                    <h3>{{ isCard ? record.cardholder_name : record.bank_name }}</h3>
                    <p>
                        ••••
                        {{ String(isCard ? record.card_number : record.account_number).slice(-4) }}
                    </p>
                    <p>
                        {{
                            isCard
                                ? 'Hết hạn ' + record.expiry_date
                                : record.accountholder_name + ' · ' + record.bank_branch
                        }}
                    </p>
                </div>
                <div class="account-record-actions">
                    <button
                        type="button"
                        class="account-link"
                        :disabled="saving"
                        @click="edit(record)"
                    >
                        Cập nhật</button
                    ><button
                        type="button"
                        class="account-link"
                        :disabled="saving"
                        @click="removeId = record.id"
                    >
                        Xóa
                    </button>
                </div>
                <div
                    v-if="removeId === record.id"
                    class="account-confirm"
                    role="group"
                    aria-label="Xác nhận xóa"
                >
                    <p>Xóa thông tin liên kết này?</p>
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
                        {{ saving ? 'Đang xóa…' : 'Xác nhận xóa' }}
                    </button>
                </div>
            </article>
        </div>
    </section>
</template>
