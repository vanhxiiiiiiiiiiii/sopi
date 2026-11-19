<script setup>
import PaymentRequest from '~/services/payment-request'
import AccountRequest from '~/services/account-request'
import { requestError } from '~/utils/checkout'

const options = ref(null)
const loading = ref(true)
const busy = ref(false)
const error = ref('')
const success = ref('')
const editing = ref(null)
const holder = ref('')
const removeId = ref(null)
async function load() {
  loading.value = true
  error.value = ''
  try { options.value = (await PaymentRequest.methods()).data }
  catch (failure) { error.value = requestError(failure, 'Không tải được thẻ đã lưu.') }
  finally { loading.value = false }
}
onMounted(load)
async function save(card) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try { await AccountRequest.updateCreditCardById(card.id, { cardholder_name: holder.value.trim() }); editing.value = null; await load(); success.value = 'Đã cập nhật tên hiển thị chủ thẻ.' }
  catch (failure) { error.value = requestError(failure, 'Không cập nhật được thẻ.') }
  finally { busy.value = false }
}
async function remove(id) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try { await AccountRequest.deleteCreditCardById(id); removeId.value = null; await load(); success.value = 'Đã xóa thẻ khỏi tài khoản.' }
  catch (failure) { error.value = requestError(failure, 'Không xóa được thẻ.') }
  finally { busy.value = false }
}
async function setup() {
  if (busy.value) return
  busy.value = true
  try { await PaymentRequest.setup() }
  catch (failure) { error.value = requestError(failure, 'Chưa thể liên kết thẻ.') }
  finally { busy.value = false }
}
</script>

<template>
  <section class="account-method-section">
    <header class="account-panel-header">
      <div><h2>Thẻ tín dụng / ghi nợ</h2><p>Chỉ hiển thị thông tin thẻ đã được che số.</p></div><button type="button" class="account-primary" :disabled="busy || !options?.card_available" @click="setup">
        Liên kết thẻ mới
      </button>
    </header>
    <p v-if="options && !options.card_available" class="account-state">
      {{ options.card_unavailable_reason }} Thẻ cũ cần liên kết lại qua trang bảo mật của nhà cung cấp khi dịch vụ được mở.
    </p>
    <p v-if="error" class="account-error" role="alert">
      {{ error }} <button type="button" class="account-link" @click="load">
        Thử lại
      </button>
    </p>
    <p v-if="success" class="account-success" role="status">
      {{ success }}
    </p>
    <p v-if="loading" class="account-state" role="status">
      Đang tải thẻ đã lưu…
    </p>
    <p v-else-if="!options?.cards?.length && !error" class="account-empty">
      Bạn chưa liên kết thẻ. COD vẫn sử dụng được khi thanh toán.
    </p>
    <div v-else class="account-records">
      <article v-for="card in options?.cards || []" :key="card.id" class="account-record">
        <div>
          <h3>{{ card.card_brand || 'Thẻ ngân hàng' }} · •••• {{ card.last_four || '—' }}</h3><p>{{ card.cardholder_name }} · Hết hạn {{ card.expiry_month || '—' }}/{{ card.expiry_year || '—' }}</p><p>{{ card.expired ? 'Thẻ đã hết hạn' : card.unavailable_reason }}</p><form v-if="editing === card.id" class="account-actions" @submit.prevent="save(card)">
            <label>Tên hiển thị chủ thẻ <input v-model.trim="holder" maxlength="64" required :disabled="busy"></label><button class="account-primary" :disabled="busy">
              Lưu
            </button><button type="button" class="account-secondary" @click="editing = null">
              Hủy
            </button>
          </form><div v-if="removeId === card.id" class="account-actions">
            <span>Xóa thẻ khỏi tài khoản?</span><button type="button" class="account-primary" :disabled="busy" @click="remove(card.id)">
              Xóa thẻ
            </button><button type="button" class="account-secondary" @click="removeId = null">
              Quay lại
            </button>
          </div>
        </div><div class="account-record-actions">
          <button type="button" class="account-link" :disabled="busy" @click="editing = card.id; holder = card.cardholder_name">
            Cập nhật tên
          </button><button type="button" class="account-link" :disabled="busy" @click="removeId = card.id">
            Xóa
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
