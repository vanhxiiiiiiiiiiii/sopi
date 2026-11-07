<route lang="yaml">
meta:
    layout: buyer/LBOrder
</route>

<script setup>
import OrderRequest from '~/services/order-request'
import {
    addressLine,
    localDate,
    money,
    orderItems,
    orderStatuses,
    paymentStatuses,
    requestError,
} from '~/utils/checkout'
import { fallbackProductImage, getResources } from '~/utils/resources'

const route = useRoute()
const router = useRouter()
const order = ref(null)
const loading = ref(true)
const error = ref('')
const cancelling = ref(false)
const confirmCancel = ref(false)
const recipient = computed(() => order.value?.recipient_snapshot ?? order.value?.received_address)

async function cancel() {
    if (cancelling.value || !order.value) return
    const id = order.value.id
    cancelling.value = true
    error.value = ''
    try {
        await OrderRequest.markOrdersCancelUser(id, {})
        if (String(route.params.order) === String(id))
            order.value = (await OrderRequest.getOrdersById(id)).data
    } catch (failure) {
        error.value = requestError(failure, 'Không thể hủy đơn hàng.')
    } finally {
        cancelling.value = false
        confirmCancel.value = false
    }
}

onMounted(() => {
    if (!localStorage.getItem('token')) {
        router.replace('/buyer/login')
        return
    }
    watch(
        () => route.params.order,
        async (id, _, onCleanup) => {
            let active = true
            onCleanup(() => {
                active = false
            })
            order.value = null
            confirmCancel.value = false
            loading.value = true
            error.value = ''
            try {
                const { data } = await OrderRequest.getOrdersById(id)
                if (active) order.value = data
            } catch (failure) {
                if (active)
                    error.value =
                        failure.response?.status === 404
                            ? 'Không tìm thấy đơn hàng.'
                            : requestError(failure, 'Không tải được đơn hàng.')
            } finally {
                if (active) loading.value = false
            }
        },
        { immediate: true },
    )
})

const stages = [1, 2, 3, 4]
const events = computed(() => order.value?.progresses ?? [])
const descriptions = {
    1: 'Đơn hàng đã được ghi nhận và đang chờ cửa hàng xác nhận.',
    2: 'Cửa hàng đang chuẩn bị các sản phẩm trong đơn hàng của bạn.',
    3: 'Đơn hàng đang trên đường đến địa chỉ nhận hàng.',
    4: 'Đơn hàng đã được giao thành công.',
    5: 'Đơn hàng đã được hủy. Xem lịch sử xử lý bên dưới để biết thêm chi tiết.',
    6: 'Đơn hàng đã được trả lại. Trạng thái thanh toán được hiển thị bên dưới.',
}
function stageReached(id) {
    const state = Number(order.value?.status_id)
    return (
        id === 1 ||
        events.value.some((event) => Number(event.status_id) === id) ||
        (state !== 5 && (state === 6 || state >= id))
    )
}
</script>

<template>
    <div class="purchase-page">
        <div class="detail-frame">
            <RouterLink to="/buyer/account/orders" class="back-link">← Quay lại đơn mua</RouterLink>
            <p v-if="loading" class="order-card state-card" role="status">
                Đang tải chi tiết đơn hàng…
            </p>
            <div v-if="error" class="purchase-alert" role="alert">{{ error }}</div>
            <template v-if="order && !loading">
                <div class="page-title">
                    <div>
                        <p class="eyebrow">CHI TIẾT ĐƠN HÀNG</p>
                        <h1>{{ order.order_code || '#' + order.id }}</h1>
                        <p class="subheading">Đặt lúc {{ localDate(order.created_at) }}</p>
                    </div>
                    <span class="status-badge" :data-status="order.status_id">{{
                        orderStatuses[order.status_id]
                    }}</span>
                </div>
                <section class="order-card tracking-card" aria-labelledby="tracking-title">
                    <div class="tracking-message" :data-status="order.status_id">
                        <div class="tracking-symbol" aria-hidden="true">
                            {{
                                Number(order.status_id) === 5
                                    ? '×'
                                    : Number(order.status_id) === 4
                                    ? '✓'
                                    : '↗'
                            }}
                        </div>
                        <div>
                            <h2 id="tracking-title">{{ orderStatuses[order.status_id] }}</h2>
                            <p>{{ descriptions[order.status_id] }}</p>
                        </div>
                    </div>
                    <ol class="order-stages" aria-label="Tiến trình giao hàng">
                        <li
                            v-for="(stage, index) in stages"
                            :key="stage"
                            :class="{
                                reached: stageReached(stage),
                                current: Number(order.status_id) === stage,
                            }"
                            :aria-current="Number(order.status_id) === stage ? 'step' : undefined"
                        >
                            <span class="stage-dot" aria-hidden="true">{{
                                stageReached(stage) ? '✓' : index + 1
                            }}</span
                            ><span>{{ orderStatuses[stage] }}</span>
                        </li>
                    </ol>
                </section>
                <div class="detail-grid">
                    <div>
                        <section class="order-card" aria-labelledby="detail-products">
                            <header class="section-heading">
                                <h2 id="detail-products">Sản phẩm trong đơn</h2>
                                <span class="muted">{{ order.product?.shop?.name }}</span>
                            </header>
                            <div class="order-products">
                                <div
                                    v-for="item in orderItems(order)"
                                    :key="item.id"
                                    class="order-product"
                                >
                                    <img
                                        :src="
                                            getResources(
                                                item.product?.images?.[0] ??
                                                    (item.product_id === order.product_id
                                                        ? order.product?.images?.[0]
                                                        : null),
                                            )
                                        "
                                        :alt="item.product_name"
                                        width="84"
                                        height="84"
                                        @error="fallbackProductImage"
                                    />
                                    <div class="product-description">
                                        <RouterLink
                                            v-if="item.product_id"
                                            :to="'/product/' + item.product_id"
                                            class="product-title"
                                            >{{ item.product_name }}</RouterLink
                                        >
                                        <p v-else class="product-title">{{ item.product_name }}</p>
                                        <p class="product-options">
                                            {{
                                                item.variations?.join(' / ') || 'Phân loại mặc định'
                                            }}
                                        </p>
                                        <p class="product-quantity">
                                            {{ money(item.unit_price) }} × {{ item.quantity }}
                                        </p>
                                    </div>
                                    <strong class="product-price">{{
                                        money(item.line_total)
                                    }}</strong>
                                </div>
                            </div>
                        </section>
                        <section class="order-card" aria-labelledby="history-title">
                            <header class="section-heading">
                                <h2 id="history-title">Lịch sử xử lý</h2>
                                <span class="muted">{{ events.length }} cập nhật</span>
                            </header>
                            <ol v-if="events.length" class="event-list">
                                <li
                                    v-for="(event, index) in events"
                                    :key="index"
                                    :class="{ 'latest-event': index === events.length - 1 }"
                                >
                                    <div>
                                        <h3>
                                            {{
                                                orderStatuses[event.status_id] ||
                                                event.status?.name ||
                                                'Cập nhật đơn hàng'
                                            }}
                                        </h3>
                                        <time>{{ localDate(event.created_at) }}</time>
                                        <p v-if="event.note">{{ event.note }}</p>
                                    </div>
                                </li>
                            </ol>
                            <p v-else class="section-empty">
                                Chưa có lịch sử cập nhật cho đơn hàng này.
                            </p>
                        </section>
                    </div>
                    <aside class="detail-aside">
                        <section class="order-card" aria-labelledby="recipient-title">
                            <header class="section-heading">
                                <h2 id="recipient-title">Địa chỉ nhận hàng</h2>
                                <span class="small-icon" aria-hidden="true">⌖</span>
                            </header>
                            <div class="recipient-details">
                                <h3>
                                    {{ recipient?.full_name || 'Chưa có thông tin người nhận' }}
                                </h3>
                                <p>{{ recipient?.phone }}</p>
                                <p>{{ addressLine(recipient) }}</p>
                            </div>
                        </section>
                        <section v-if="order.shipment" class="order-card">
                            <header class="section-heading"><h2>Thông tin vận chuyển</h2></header>
                            <dl class="info-lines">
                                <div>
                                    <dt>Mã vận đơn</dt>
                                    <dd>{{ order.shipment.tracking_code }}</dd>
                                </div>
                                <div>
                                    <dt>Đơn vị vận chuyển</dt>
                                    <dd>
                                        {{
                                            order.shipment.carrier === 'Pending assignment'
                                                ? 'Đang phân công'
                                                : order.shipment.carrier
                                        }}
                                    </dd>
                                </div>
                                <div v-if="order.shipment.estimated_delivery_at">
                                    <dt>Dự kiến giao</dt>
                                    <dd>{{ localDate(order.shipment.estimated_delivery_at) }}</dd>
                                </div>
                            </dl>
                        </section>
                        <section class="order-card" aria-labelledby="payment-title">
                            <header class="section-heading">
                                <h2 id="payment-title">Thanh toán</h2>
                            </header>
                            <div class="payment-details">
                                <div
                                    v-for="payment in order.payments"
                                    :key="payment.id"
                                    class="payment-record"
                                >
                                    <h3>
                                        {{
                                            payment.method === 'cod'
                                                ? 'Thanh toán khi nhận hàng (COD)'
                                                : payment.method
                                        }}
                                    </h3>
                                    <p>{{ paymentStatuses[payment.status] || payment.status }}</p>
                                </div>
                                <p v-if="!order.payments?.length" class="muted">
                                    Chưa có thông tin thanh toán.
                                </p>
                            </div>
                            <dl class="info-lines">
                                <div>
                                    <dt>Tiền hàng</dt>
                                    <dd>{{ money(order.subtotal ?? order.total) }}</dd>
                                </div>
                                <div>
                                    <dt>Phí vận chuyển</dt>
                                    <dd>{{ money(order.shipping_fee) }}</dd>
                                </div>
                                <div>
                                    <dt>Giảm giá</dt>
                                    <dd class="discount">
                                        {{ order.discount_amount > 0 ? '− ' : ''
                                        }}{{ money(order.discount_amount) }}
                                    </dd>
                                </div>
                            </dl>
                            <div class="detail-total">
                                <span>Tổng thanh toán</span
                                ><strong>{{
                                    money(order.payment_total ?? order.grand_total)
                                }}</strong>
                            </div>
                            <div v-if="Number(order.status_id) === 1" class="cancel-area">
                                <button
                                    v-if="!confirmCancel"
                                    type="button"
                                    class="button-secondary cancel-button"
                                    @click="confirmCancel = true"
                                >
                                    Hủy đơn hàng
                                </button>
                                <div v-else role="group" aria-label="Xác nhận hủy đơn hàng">
                                    <p>Bạn muốn hủy đơn hàng này?</p>
                                    <div class="confirm-actions">
                                        <button
                                            type="button"
                                            class="button-primary"
                                            :disabled="cancelling"
                                            @click="cancel"
                                        >
                                            {{ cancelling ? 'Đang hủy…' : 'Xác nhận hủy' }}</button
                                        ><button
                                            type="button"
                                            class="button-secondary"
                                            :disabled="cancelling"
                                            @click="confirmCancel = false"
                                        >
                                            Giữ đơn
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </template>
        </div>
    </div>
</template>

<style scoped src="~/styles/purchases.css"></style>
