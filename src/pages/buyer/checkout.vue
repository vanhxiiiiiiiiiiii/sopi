<route lang="yaml">
meta:
    layout: buyer/LBCheckout
</route>

<script setup>
import AccountRequest from '~/services/account-request'
import CartRequest from '~/services/cart-request'
import OrderRequest from '~/services/order-request'
import { useCart } from '~/stores/cart'
import { addressLine, cartOptions, money, requestError } from '~/utils/checkout'
import { fallbackProductImage, getResources } from '~/utils/resources'

const router = useRouter()
const route = useRoute()
const modelIds = [
    ...new Set(
        String(route.query.items ?? '')
            .split(',')
            .filter((id) => /^[1-9]\d*$/.test(id))
            .map(Number),
    ),
]
const cart = useCart()
const addresses = ref([])
const addressId = ref('')
const newAddress = ref(false)
const recipient = reactive({ full_name: '', phone: '', address: '', town: '', city: '', state: '' })
const addressFields = [
    { name: 'full_name', label: 'Họ tên người nhận', max: 64 },
    { name: 'phone', label: 'Số điện thoại', max: 11, pattern: '[0-9]{10,11}' },
    { name: 'address', label: 'Số nhà và tên đường', max: 255 },
    { name: 'town', label: 'Phường / xã', max: 50 },
    { name: 'city', label: 'Quận / huyện', max: 50 },
    { name: 'state', label: 'Tỉnh / thành phố', max: 50 },
]
const savingAddress = ref(false)
const voucher = ref('')
const appliedVoucher = ref(null)
const totals = ref(null)
const loading = ref(true)
const quoting = ref(false)
const submitting = ref(false)
const error = ref('')
const pending = ref(null)
let pendingKey

const selectedAddress = computed(() =>
    addresses.value.find((address) => address.id === addressId.value),
)
const chosen = computed(() =>
    cart.result.filter((item) => modelIds.includes(item.product_model_id)),
)
const quantity = computed(() => chosen.value.reduce((sum, item) => sum + Number(item.quantity), 0))
const cartAvailable = computed(
    () =>
        chosen.value.length > 0 &&
        chosen.value.length === modelIds.length &&
        !chosen.value.some((item) => item.unavailable_reason),
)

async function quote(code = null) {
    quoting.value = true
    error.value = ''
    try {
        const { data } = await OrderRequest.quoteCart(code, modelIds)
        totals.value = data
        appliedVoucher.value = code
    } catch (failure) {
        error.value = requestError(failure, 'Không tính được tổng tiền.')
    } finally {
        quoting.value = false
    }
}

onMounted(async () => {
    if (!localStorage.getItem('token')) {
        await router.replace('/buyer/login')
        return
    }
    try {
        const user = JSON.parse(localStorage.getItem('user') ?? '{}')
        pendingKey = `e-shopee:checkout:${user.data?.id ?? user.id ?? ''}`
        pending.value = JSON.parse(sessionStorage.getItem(pendingKey) ?? 'null')
        const [{ data: items }, { data: savedAddresses }] = await Promise.all([
            CartRequest.getCart(),
            AccountRequest.getAddress(),
        ])
        cart.result = items
        addresses.value = savedAddresses
        addressId.value = savedAddresses[0]?.id ?? ''
        newAddress.value = !savedAddresses.length
        if (cartAvailable.value && !pending.value) await quote()
    } catch (failure) {
        error.value = requestError(failure, 'Không tải được thông tin thanh toán.')
    } finally {
        loading.value = false
    }
})

async function saveAddress() {
    if (savingAddress.value) return
    savingAddress.value = true
    error.value = ''
    try {
        const { data } = await AccountRequest.createAddress(
            Object.fromEntries(
                Object.entries(recipient).map(([field, value]) => [field, value.trim()]),
            ),
        )
        addresses.value.push(data)
        addressId.value = data.id
        newAddress.value = false
    } catch (failure) {
        error.value = requestError(failure, 'Không lưu được địa chỉ giao hàng.')
    } finally {
        savingAddress.value = false
    }
}

async function placeOrder() {
    if (
        submitting.value ||
        (!pending.value &&
            (!selectedAddress.value || !cartAvailable.value || !totals.value || newAddress.value))
    )
        return
    submitting.value = true
    error.value = ''
    try {
        if (!pending.value) {
            pending.value = {
                request_key: crypto.randomUUID(),
                address_id: addressId.value,
                payment_method: 'cod',
                voucher_code: appliedVoucher.value,
                orders: chosen.value.map((item) => ({
                    product_model_id: item.product_model_id,
                    quantity: item.quantity,
                })),
            }
            sessionStorage.setItem(pendingKey, JSON.stringify(pending.value))
        }
        const { data } = await OrderRequest.createOrders(pending.value)
        sessionStorage.removeItem(pendingKey)
        pending.value = null
        cart.result = cart.result.filter((item) => !modelIds.includes(item.product_model_id))
        await router.replace({
            path: '/buyer/order/confirmation',
            query: { orders: data.map((order) => order.id).join(',') },
        })
    } catch (failure) {
        error.value = requestError(
            failure,
            'Chưa xác nhận được kết quả. Hãy gửi lại cùng yêu cầu đặt hàng.',
        )
        if ([400, 422].includes(failure.response?.status)) {
            sessionStorage.removeItem(pendingKey)
            pending.value = null
        }
    } finally {
        submitting.value = false
    }
}
</script>

<template>
    <div class="checkout-page">
        <div class="checkout-wrap">
            <div class="page-heading">
                <div>
                    <p class="eyebrow">HOÀN TẤT ĐƠN HÀNG</p>
                    <h1>Thanh toán</h1>
                    <p class="page-intro">Kiểm tra sản phẩm và thông tin nhận hàng của bạn.</p>
                </div>
                <ol class="checkout-steps" aria-label="Tiến trình mua hàng">
                    <li><span>✓</span> Giỏ hàng</li>
                    <li aria-current="step"><span>2</span> Thanh toán</li>
                    <li><span>3</span> Hoàn tất</li>
                </ol>
            </div>

            <div v-if="error" class="notice notice-error" role="alert">{{ error }}</div>
            <div
                v-if="loading"
                class="checkout-card loading-state"
                role="status"
                aria-live="polite"
            >
                <span class="loading-indicator" aria-hidden="true" />
                <div>
                    <h2>Đang chuẩn bị đơn hàng</h2>
                    <p>Đang lấy sản phẩm, địa chỉ và tổng thanh toán…</p>
                </div>
            </div>
            <div v-else-if="pending" class="checkout-card empty-state">
                <h2>Kiểm tra lại yêu cầu đặt hàng</h2>
                <p>Yêu cầu trước đang chờ xác nhận. Gửi lại để kiểm tra kết quả đơn hàng.</p>
                <button
                    type="button"
                    class="primary-button"
                    :disabled="submitting"
                    @click="placeOrder"
                >
                    {{ submitting ? 'Đang kiểm tra…' : 'Kiểm tra đơn hàng' }}
                </button>
            </div>
            <div v-else-if="!cartAvailable" class="checkout-card empty-state">
                <h2>
                    {{
                        cart.result.length
                            ? 'Sản phẩm cần được kiểm tra lại'
                            : 'Giỏ hàng đang trống'
                    }}
                </h2>
                <p>
                    {{
                        cart.result.length
                            ? 'Vui lòng chọn lại sản phẩm còn hàng trong giỏ.'
                            : 'Thêm sản phẩm vào giỏ để bắt đầu đặt hàng.'
                    }}
                </p>
                <RouterLink to="/buyer/cart" class="primary-button">Quay lại giỏ hàng</RouterLink>
            </div>

            <template v-else>
                <section class="checkout-card address-card" aria-labelledby="address-title">
                    <div class="card-heading">
                        <h2 id="address-title">
                            <span class="section-number">01</span> Địa chỉ nhận hàng
                        </h2>
                        <span v-if="selectedAddress && !newAddress" class="saved-badge"
                            >Đã lưu</span
                        >
                    </div>
                    <template v-if="!newAddress">
                        <div class="address-preview">
                            <div>
                                <p class="recipient-name">
                                    {{ selectedAddress?.full_name }}
                                    <span>{{ selectedAddress?.phone }}</span>
                                </p>
                                <p>{{ addressLine(selectedAddress) }}</p>
                            </div>
                            <button type="button" class="text-button" @click="newAddress = true">
                                Thêm địa chỉ mới
                            </button>
                        </div>
                        <label v-if="addresses.length > 1" class="address-picker"
                            >Chọn địa chỉ khác
                            <select v-model="addressId">
                                <option
                                    v-for="address in addresses"
                                    :key="address.id"
                                    :value="address.id"
                                >
                                    {{ address.full_name }} · {{ addressLine(address) }}
                                </option>
                            </select>
                        </label>
                    </template>
                    <form v-else class="address-form" @submit.prevent="saveAddress">
                        <p class="form-hint">
                            Nhập thông tin người nhận và lưu địa chỉ để tiếp tục.
                        </p>
                        <div class="address-fields">
                            <label
                                v-for="field in addressFields"
                                :key="field.name"
                                :class="{ 'wide-field': field.name === 'address' }"
                                :for="'checkout-' + field.name"
                            >
                                {{ field.label }}
                                <span class="required-mark" aria-hidden="true">*</span>
                                <input
                                    :id="'checkout-' + field.name"
                                    v-model.trim="recipient[field.name]"
                                    :name="field.name"
                                    :type="field.name === 'phone' ? 'tel' : 'text'"
                                    :autocomplete="
                                        {
                                            full_name: 'shipping name',
                                            phone: 'shipping tel',
                                            address: 'shipping address-line1',
                                            town: 'shipping address-line2',
                                            city: 'shipping address-level2',
                                            state: 'shipping address-level1',
                                        }[field.name]
                                    "
                                    :maxlength="field.max"
                                    :pattern="field.pattern"
                                    :placeholder="
                                        field.name === 'phone'
                                            ? 'Nhập số điện thoại nhận hàng'
                                            : field.label
                                    "
                                    required
                                    :disabled="savingAddress"
                                />
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="primary-button" :disabled="savingAddress">
                                {{ savingAddress ? 'Đang lưu…' : 'Lưu địa chỉ nhận hàng' }}
                            </button>
                            <button
                                v-if="addresses.length"
                                type="button"
                                class="secondary-button"
                                :disabled="savingAddress"
                                @click="newAddress = false"
                            >
                                Dùng địa chỉ đã lưu
                            </button>
                        </div>
                    </form>
                </section>

                <section class="checkout-card products-card" aria-labelledby="products-title">
                    <div class="card-heading">
                        <h2 id="products-title">
                            <span class="section-number">02</span> Sản phẩm đặt mua
                        </h2>
                        <span class="muted">{{ quantity }} sản phẩm</span>
                    </div>
                    <table class="products-table">
                        <thead>
                            <tr>
                                <th scope="col">Sản phẩm</th>
                                <th scope="col">Đơn giá</th>
                                <th scope="col">Số lượng</th>
                                <th scope="col">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="item in chosen" :key="item.product_model_id">
                                <td>
                                    <div class="product-info">
                                        <img
                                            :src="getResources(item.product?.images?.[0])"
                                            :alt="item.product?.name"
                                            width="72"
                                            height="72"
                                            @error="fallbackProductImage"
                                        />
                                        <div>
                                            <p v-if="item.shop?.name" class="shop-name">
                                                {{ item.shop.name }}
                                            </p>
                                            <p class="product-name">{{ item.product?.name }}</p>
                                            <span class="variation">{{
                                                cartOptions(item) || 'Phân loại mặc định'
                                            }}</span>
                                        </div>
                                    </div>
                                </td>
                                <td data-label="Đơn giá">{{ money(item.unit_price) }}</td>
                                <td data-label="Số lượng">× {{ item.quantity }}</td>
                                <td data-label="Thành tiền" class="line-total">
                                    {{ money(item.final_total_price) }}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div class="shipping-row">
                        <div class="shipping-label">
                            <span class="section-icon" aria-hidden="true"
                                ><svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="1.6"
                                >
                                    <path d="M3 5h11v12H3zM14 9h4l3 4v4h-7" />
                                    <circle cx="7" cy="18" r="2" />
                                    <circle cx="18" cy="18" r="2" /></svg
                            ></span>
                            <div>
                                <h3>Phí vận chuyển</h3>
                                <p>Được tính trong tổng thanh toán</p>
                            </div>
                        </div>
                        <strong>{{ money(totals?.shipping_fee) }}</strong>
                    </div>
                </section>

                <div class="checkout-bottom">
                    <div class="checkout-options">
                        <section class="checkout-card voucher-card" aria-labelledby="voucher-title">
                            <div class="card-heading">
                                <h2 id="voucher-title">
                                    <span class="section-number">03</span> Mã giảm giá
                                </h2>
                                <span class="optional-label">Tùy chọn</span>
                            </div>
                            <form
                                class="voucher-form"
                                @submit.prevent="quote(voucher.trim() || null)"
                            >
                                <label for="checkout-voucher" class="sr-only">Mã voucher</label
                                ><input
                                    id="checkout-voucher"
                                    v-model="voucher"
                                    placeholder="Nhập mã voucher của bạn"
                                    maxlength="50"
                                    :disabled="quoting || submitting"
                                />
                                <button
                                    type="submit"
                                    class="secondary-button"
                                    :disabled="quoting || submitting"
                                >
                                    {{ quoting ? 'Đang kiểm tra…' : 'Áp dụng' }}
                                </button>
                            </form>
                            <p v-if="appliedVoucher" class="voucher-success" role="status">
                                Đã áp dụng mã {{ appliedVoucher }}
                            </p>
                            <p v-else class="form-hint">
                                Ưu đãi sẽ được cập nhật vào tổng thanh toán.
                            </p>
                        </section>
                        <section class="checkout-card payment-card" aria-labelledby="payment-title">
                            <div class="card-heading">
                                <h2 id="payment-title">
                                    <span class="section-number">04</span> Phương thức thanh toán
                                </h2>
                            </div>
                            <div class="payment-option">
                                <span class="radio-mark" aria-hidden="true" />
                                <div>
                                    <h3>Thanh toán khi nhận hàng</h3>
                                    <p>Trả tiền mặt khi đơn hàng được giao đến bạn.</p>
                                </div>
                                <span class="cod-badge">COD</span>
                            </div>
                        </section>
                        <RouterLink to="/buyer/cart" class="back-link"
                            >← Quay lại giỏ hàng</RouterLink
                        >
                    </div>
                    <section
                        class="checkout-card order-summary"
                        aria-labelledby="summary-title"
                        :aria-busy="quoting"
                    >
                        <div class="card-heading">
                            <h2 id="summary-title">Tổng kết đơn hàng</h2>
                            <span class="summary-count">{{ quantity }}</span>
                        </div>
                        <dl class="summary-lines">
                            <div>
                                <dt>Tổng tiền hàng</dt>
                                <dd>{{ money(totals?.subtotal) }}</dd>
                            </div>
                            <div>
                                <dt>Phí vận chuyển</dt>
                                <dd>{{ money(totals?.shipping_fee) }}</dd>
                            </div>
                            <div>
                                <dt>Giảm giá</dt>
                                <dd class="discount-value">
                                    {{ totals?.discount_amount ? '− ' : ''
                                    }}{{ money(totals?.discount_amount) }}
                                </dd>
                            </div>
                        </dl>
                        <div class="grand-total">
                            <span>Tổng thanh toán</span
                            ><strong>{{ money(totals?.payment_total) }}</strong>
                        </div>
                        <p v-if="newAddress || !selectedAddress" class="checkout-hint">
                            Vui lòng lưu địa chỉ nhận hàng để đặt hàng.
                        </p>
                        <p
                            v-else-if="(voucher.trim() || null) !== appliedVoucher"
                            class="checkout-hint"
                        >
                            Áp dụng mã voucher hoặc xóa mã trước khi đặt hàng.
                        </p>
                        <button
                            type="button"
                            class="primary-button place-order-button"
                            :disabled="
                                submitting ||
                                quoting ||
                                savingAddress ||
                                !selectedAddress ||
                                !totals ||
                                newAddress ||
                                (voucher.trim() || null) !== appliedVoucher
                            "
                            @click="placeOrder"
                        >
                            {{ submitting ? 'Đang đặt hàng…' : 'Đặt hàng'
                            }}<span aria-hidden="true">→</span>
                        </button>
                        <p class="order-note">
                            Kiểm tra kỹ địa chỉ và sản phẩm trước khi xác nhận.
                        </p>
                    </section>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped>
.checkout-page {
    --accent: #c43e1c;
    --accent-soft: #fff5ef;
    --ink: #24272e;
    --muted: #69717c;
    --line: #e8e9ec;
    --surface: #fff;
    min-height: 70vh;
    background: #f5f6f8;
    color: var(--ink);
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    text-align: left;
    padding: 36px 24px 64px;
}
.checkout-wrap {
    max-width: 1180px;
    margin: 0 auto;
}
.page-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 28px;
    margin-bottom: 28px;
}
.eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.7px;
    color: var(--accent);
    margin: 0 0 6px;
}
h1 {
    font-size: 30px;
    font-weight: 700;
    line-height: 1.25;
    letter-spacing: -0.8px;
    margin: 0 0 8px;
}
.page-intro,
.muted,
.form-hint {
    color: var(--muted);
    margin: 0;
}
.checkout-steps {
    display: flex;
    align-items: center;
    gap: 24px;
    list-style: none;
    padding: 0;
    color: var(--muted);
    font-size: 12px;
}
.checkout-steps li {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
}
.checkout-steps span {
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border: 1px solid #d6d9df;
    border-radius: 50%;
    font-size: 12px;
}
.checkout-steps [aria-current] {
    color: var(--accent);
    font-weight: 700;
}
.checkout-steps [aria-current] span {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
}
.checkout-card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 10px;
    margin-bottom: 20px;
    overflow: hidden;
}
.card-heading {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 23px 28px 18px;
}
h2 {
    font-size: 17px;
    font-weight: 700;
    line-height: 1.4;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 12px;
}
h3 {
    font-size: 14px;
    font-weight: 600;
    margin: 0;
}
.section-number {
    color: var(--accent);
    font-size: 11px;
    letter-spacing: 0.5px;
    background: var(--accent-soft);
    border-radius: 6px;
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    flex-shrink: 0;
}
.address-card {
    position: relative;
}
.address-card::before {
    content: '';
    display: block;
    height: 3px;
    background: repeating-linear-gradient(
        135deg,
        #ed684b 0,
        #ed684b 24px,
        #fff 24px,
        #fff 34px,
        #87b1d1 34px,
        #87b1d1 58px,
        #fff 58px,
        #fff 68px
    );
}
.saved-badge,
.optional-label,
.cod-badge,
.summary-count {
    font-size: 11px;
    padding: 3px 9px;
    border-radius: 5px;
    background: #f3f4f6;
    color: var(--muted);
}
.saved-badge {
    color: #25704e;
    background: #edf8f1;
}
.address-preview {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 0 28px 26px;
}
.address-preview p {
    margin: 4px 0;
}
.recipient-name {
    font-weight: 700;
}
.recipient-name span {
    font-weight: 400;
    margin-left: 16px;
    color: var(--muted);
}
.address-picker {
    display: block;
    padding: 0 28px 24px;
    max-width: 700px;
}
.address-picker select {
    margin-top: 8px;
}
.address-form {
    padding: 0 28px 28px;
}
.address-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px 24px;
    margin: 20px 0;
}
.address-fields label {
    font-size: 13px;
    font-weight: 600;
    display: block;
}
.wide-field {
    grid-column: 1/-1;
}
.required-mark {
    color: var(--accent);
}
input,
select {
    width: 100%;
    min-height: 44px;
    border: 1px solid #d9dde3;
    border-radius: 6px;
    background: var(--surface);
    color: var(--ink);
    padding: 11px 13px;
    font: inherit;
    line-height: 1.5;
    box-sizing: border-box;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.address-fields input {
    margin-top: 7px;
    font-weight: 400;
}
input::placeholder {
    color: #858b94;
}
input:focus,
select:focus {
    border-color: var(--accent);
    outline: 0;
    box-shadow: 0 0 0 3px #c43e1c1a;
}
button,
a {
    touch-action: manipulation;
}
button:focus-visible,
a:focus-visible {
    outline: 3px solid #d96843;
    outline-offset: 4px;
}
button {
    font: inherit;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
}
button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}
.primary-button,
.secondary-button {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    border-radius: 6px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    border: 1px solid transparent;
}
.primary-button {
    background: var(--accent);
    color: white;
}
.primary-button:hover:enabled {
    background: #a93215;
}
.secondary-button {
    border-color: #d9dde3;
    background: var(--surface);
    color: var(--ink);
}
.secondary-button:hover:enabled {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--accent-soft);
}
.form-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
}
.text-button {
    color: var(--accent);
    background: transparent;
    border: 0;
    min-height: 44px;
    padding: 8px 0;
    font-weight: 600;
    white-space: nowrap;
}
.products-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
}
.products-table th {
    font-weight: 400;
    font-size: 12px;
    color: var(--muted);
    padding: 12px 28px;
    border-top: 1px solid var(--line);
    background: #fcfcfd;
    text-align: right;
}
.products-table th:first-child {
    width: 58%;
    text-align: left;
}
.products-table td {
    padding: 22px 28px;
    text-align: right;
    border-bottom: 1px solid var(--line);
    font-variant-numeric: tabular-nums;
}
.products-table td:first-child {
    text-align: left;
}
.product-info {
    display: flex;
    align-items: center;
    gap: 16px;
}
.product-info img {
    width: 72px;
    height: 72px;
    object-fit: contain;
    border: 1px solid var(--line);
    border-radius: 6px;
    background: white;
    flex-shrink: 0;
}
.shop-name {
    font-size: 11px;
    color: var(--accent);
    font-weight: 600;
    margin: 0 0 4px;
}
.product-name {
    font-size: 14px;
    line-height: 1.5;
    font-weight: 500;
    margin: 0 0 6px;
    overflow-wrap: anywhere;
}
.variation {
    color: var(--muted);
    font-size: 12px;
}
.line-total {
    font-weight: 700;
    white-space: nowrap;
}
.shipping-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 18px;
    padding: 20px 28px;
    background: #fafbfc;
}
.shipping-label {
    display: flex;
    align-items: center;
    gap: 13px;
}
.shipping-label p,
.payment-option p {
    font-size: 12px;
    color: var(--muted);
    margin: 3px 0 0;
}
.section-icon {
    color: #667c73;
    width: 28px;
    height: 28px;
}
.section-icon svg {
    width: 100%;
    height: 100%;
}
.checkout-bottom {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 380px;
    gap: 24px;
    align-items: start;
}
.voucher-form {
    display: flex;
    gap: 12px;
    padding: 0 28px 12px;
}
.voucher-form input {
    min-width: 0;
}
.voucher-form button {
    white-space: nowrap;
}
.voucher-card > .form-hint,
.voucher-success {
    font-size: 12px;
    margin: 0 28px 24px;
}
.voucher-success {
    color: #267449;
}
.payment-option {
    display: flex;
    align-items: center;
    gap: 14px;
    border: 1px solid #e8c8bc;
    background: var(--accent-soft);
    border-radius: 7px;
    margin: 0 28px 26px;
    padding: 18px;
}
.radio-mark {
    width: 18px;
    height: 18px;
    border: 5px solid var(--accent);
    border-radius: 50%;
    background: white;
    box-sizing: border-box;
    flex-shrink: 0;
}
.cod-badge {
    margin-left: auto;
    color: var(--accent);
    border: 1px solid #e8c8bc;
    background: var(--surface);
}
.order-summary {
    position: sticky;
    top: 24px;
}
.order-summary .card-heading {
    padding-bottom: 22px;
    border-bottom: 1px solid var(--line);
}
.summary-count {
    color: var(--accent);
    background: var(--accent-soft);
}
.summary-lines {
    margin: 0;
    padding: 22px 28px 18px;
}
.summary-lines > div {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}
.summary-lines dt {
    color: var(--muted);
}
.summary-lines dd {
    margin: 0;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
}
.discount-value {
    color: #267449;
}
.grand-total {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    border-top: 1px dashed var(--line);
    padding: 22px 28px;
}
.grand-total strong {
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--accent);
}
.checkout-hint {
    margin: 0 28px 16px;
    font-size: 12px;
    color: var(--muted);
}
.place-order-button {
    display: flex;
    width: calc(100% - 56px);
    margin: 0 28px;
    justify-content: space-between;
    min-height: 48px;
    font-size: 16px;
}
.order-note {
    font-size: 11px;
    text-align: center;
    color: var(--muted);
    margin: 12px 28px 24px;
}
.back-link {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    color: var(--muted);
    font-size: 13px;
    text-decoration: none;
}
.back-link:hover {
    color: var(--accent);
}
.notice {
    padding: 16px 20px;
    border-radius: 8px;
    margin-bottom: 20px;
}
.notice-error {
    border: 1px solid #f1c7c7;
    background: #fff1f1;
    color: #a92525;
}
.loading-state {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 36px;
}
.loading-state p,
.empty-state p {
    color: var(--muted);
    margin: 8px 0 20px;
}
.loading-state p {
    margin-bottom: 0;
}
.loading-indicator {
    width: 28px;
    height: 28px;
    border: 3px solid #f2dfd6;
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: checkout-spin 1s linear infinite;
    flex-shrink: 0;
}
.empty-state {
    padding: 40px 28px;
}
@keyframes checkout-spin {
    to {
        transform: rotate(360deg);
    }
}
:global(.dark) .checkout-page {
    --ink: #edf0f4;
    --muted: #a7afba;
    --line: #38404c;
    --surface: #202833;
    --accent: #ffac8d;
    --accent-soft: #392e2b;
    background: #171d26;
}
:global(.dark) .checkout-page .primary-button {
    background: #f5a180;
    color: #241c18;
}
:global(.dark) .checkout-page .products-table th,
:global(.dark) .checkout-page .shipping-row {
    background: #242d39;
}
@media (max-width: 960px) {
    .checkout-bottom {
        grid-template-columns: minmax(0, 1fr) 330px;
    }
    .products-table th,
    .products-table td {
        padding-left: 20px;
        padding-right: 20px;
    }
    .products-table th:first-child {
        width: 50%;
    }
    .checkout-steps {
        gap: 12px;
    }
}
@media (max-width: 720px) {
    .checkout-page {
        padding: 24px 16px 40px;
    }
    .page-heading {
        display: block;
    }
    .checkout-steps {
        margin-top: 22px;
        gap: 20px;
    }
    .checkout-bottom {
        grid-template-columns: 1fr;
        gap: 0;
    }
    .card-heading {
        padding: 20px;
    }
    .address-form {
        padding: 0 20px 20px;
    }
    .address-preview {
        padding: 0 20px 20px;
        align-items: flex-start;
        flex-direction: column;
        gap: 4px;
    }
    .address-picker {
        padding: 0 20px 20px;
    }
    .address-fields {
        gap: 16px;
    }
    .recipient-name span {
        display: block;
        margin-left: 0;
    }
    .products-table,
    .products-table tbody,
    .products-table tr,
    .products-table td {
        display: block;
        width: auto;
    }
    .products-table thead {
        display: none;
    }
    .products-table tr {
        padding: 0 20px 20px;
        border-bottom: 1px solid var(--line);
    }
    .products-table td {
        padding: 8px 0;
        border: 0;
        font-size: 13px;
    }
    .products-table td:first-child {
        padding: 4px 0 16px;
    }
    .products-table td[data-label] {
        display: flex;
        justify-content: space-between;
    }
    .products-table td[data-label]::before {
        content: attr(data-label);
        color: var(--muted);
        font-weight: 400;
    }
    .shipping-row {
        padding: 18px 20px;
    }
    .voucher-form {
        padding: 0 20px 12px;
    }
    .voucher-card > .form-hint,
    .voucher-success {
        margin-left: 20px;
        margin-right: 20px;
    }
    .payment-option {
        margin-left: 20px;
        margin-right: 20px;
    }
    .order-summary {
        position: static;
    }
    .back-link {
        margin-bottom: 16px;
    }
    .grand-total strong {
        font-size: 23px;
    }
}
@media (max-width: 420px) {
    .address-fields {
        grid-template-columns: 1fr;
    }
    .wide-field {
        grid-column: auto;
    }
    .checkout-steps {
        font-size: 11px;
        gap: 12px;
    }
    .checkout-steps span {
        width: 23px;
        height: 23px;
    }
    .card-heading h2 {
        font-size: 15px;
    }
    .voucher-form {
        gap: 8px;
    }
    .voucher-form button {
        padding: 10px 12px;
    }
    .payment-option {
        padding: 14px 12px;
        gap: 10px;
    }
    .payment-option h3 {
        font-size: 13px;
    }
    .cod-badge {
        display: none;
    }
}
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation: none !important;
        transition: none !important;
    }
}
</style>
