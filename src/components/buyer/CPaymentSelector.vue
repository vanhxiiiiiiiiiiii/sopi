<script setup>
defineProps({ modelValue: { type: String, default: 'cod' }, cardId: { type: [Number, String], default: '' }, options: { type: Object, default: null }, loading: Boolean, error: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue', 'update:cardId', 'retry'])
</script>

<template>
  <div class="payment-selector">
    <p v-if="loading" role="status">
      Đang tải phương thức thanh toán…
    </p>
    <p v-if="error" class="method-error" role="alert">
      {{ error }} <button type="button" @click="emit('retry')">
        Thử lại
      </button>
    </p>
    <fieldset v-if="options" class="method-list">
      <legend class="sr-only">
        Chọn một phương thức thanh toán
      </legend>
      <label class="method-option" :class="{ selected: modelValue === 'cod' }"><input type="radio" name="checkout-payment" value="cod" :checked="modelValue === 'cod'" :disabled="!options.cod_available" @change="emit('update:modelValue', 'cod'); emit('update:cardId', '')"><span><strong>Thanh toán khi nhận hàng</strong><small>Trả tiền mặt khi nhận đơn. Chỉ ghi nhận đã trả sau khi xác nhận thu COD.</small></span><b>COD</b></label>
      <label class="method-option" :class="{ selected: modelValue === 'card', unavailable: !options.card_available }"><input type="radio" name="checkout-payment" value="card" :checked="modelValue === 'card'" :disabled="!options.card_available" @change="emit('update:modelValue', 'card')"><span><strong>Thẻ tín dụng / ghi nợ</strong><small>Visa / Mastercard và thẻ được cổng thanh toán hỗ trợ.</small><small v-if="!options.card_available" class="method-error">{{ options.card_unavailable_reason }}</small></span><b>THẺ</b></label>
      <div v-if="modelValue === 'card'" class="saved-card-list">
        <p v-if="!options.cards?.length">
          Bạn chưa có thẻ được liên kết.
        </p>
        <label v-for="card in options.cards" :key="card.id" class="method-option" :class="{ unavailable: !card.usable }"><input type="radio" name="checkout-card" :checked="Number(cardId) === card.id" :disabled="!card.usable" @change="emit('update:cardId', card.id)"><span><strong>{{ card.card_brand || 'Thẻ ngân hàng' }} · •••• {{ card.last_four }}</strong><small>{{ card.cardholder_name }} · Hết hạn {{ card.expiry_month }}/{{ card.expiry_year }}</small><small v-if="!card.usable">{{ card.unavailable_reason }}</small></span></label>
      </div>
      <details v-else-if="options.cards?.length" class="saved-card-preview">
        <summary>Thẻ đã lưu ({{ options.cards.length }})</summary><p v-for="card in options.cards" :key="card.id">
          {{ card.card_brand || 'Thẻ' }} · •••• {{ card.last_four }} · {{ card.cardholder_name }} · {{ card.expiry_month }}/{{ card.expiry_year }}<br><span>{{ card.expired ? 'Thẻ đã hết hạn' : card.unavailable_reason }}</span>
        </p>
      </details>
      <RouterLink to="/buyer/account/payment" class="manage-payment">
        Quản lý / liên kết thẻ qua cổng thanh toán
      </RouterLink>
    </fieldset>
  </div>
</template>

<style scoped>
.payment-selector {
  font: inherit;
}
.method-list {
  border: 0;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}
.method-option {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 17px;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  cursor: pointer;
}
.method-option.selected {
  border-color: #ee4d2d;
  background: #fff8f3;
}
.method-option.unavailable {
  background: #f8f8f8;
  cursor: default;
}
.method-option input {
  margin-top: 4px;
  accent-color: #ee4d2d;
  flex-shrink: 0;
}
.method-option > span {
  flex: 1;
  min-width: 0;
}
.method-option strong, .method-option small {
  display: block;
  line-height: 1.6;
}
.method-option strong {
  font-size: 14px;
}
.method-option small {
  font-size: 12px;
  color: #777;
  margin-top: 5px;
}
.method-option b {
  font-size: 10px;
  color: #b14427;
  background: #fff0e6;
  border-radius: 4px;
  padding: 5px;
}
.method-option .method-error, .method-error {
  color: #a43a20;
}
.method-error button, .manage-payment {
  color: #c44427;
  text-decoration: underline;
}
.manage-payment {
  font-size: 12px;
  padding: 10px 0;
}
.saved-card-preview {
  color: #666;
  font-size: 12px;
  line-height: 1.8;
}
.saved-card-preview summary {
  cursor: pointer;
  padding: 8px 0;
}
.saved-card-preview p {
  padding: 8px 0;
}
.saved-card-preview span {
  color: #9a654f;
}
.saved-card-list {
  display: grid;
  gap: 10px;
}
.payment-selector input:focus-visible, .payment-selector a:focus-visible, .payment-selector button:focus-visible {
  outline: 2px solid #c44427;
  outline-offset: 4px;
}
</style>
