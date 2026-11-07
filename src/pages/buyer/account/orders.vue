<route lang="yaml">
meta:
    layout: buyer/account/LBDashboard
</route>

<script setup>
import OrderRequest from '~/services/order-request'
import { localDate, money, orderItems, orderStatuses, requestError } from '~/utils/checkout'

import { fallbackProductImage, getResources } from '~/utils/resources'

const router = useRouter()
const status = ref('')
const attempt = ref(0)
function selectStatus(value) {
    status.value = String(value)
    page.value = 1
}
const page = ref(1)
const result = ref(null)
const loading = ref(true)
const error = ref('')

onMounted(() => {
    if (!localStorage.getItem('token')) {
        router.replace('/buyer/login')
        return
    }
    watch(
        [status, page, attempt],
        async (_, __, onCleanup) => {
            let active = true
            onCleanup(() => {
                active = false
            })
            loading.value = true
            error.value = ''
            try {
                const { data } = await OrderRequest.getOrders({
                    params: { limit: 10, page: page.value, status_id: status.value || undefined },
                })
                if (active) result.value = data
            } catch (failure) {
                if (active) error.value = requestError(failure, 'Không tải được lịch sử đơn hàng.')
            } finally {
                if (active) loading.value = false
            }
        },
        { immediate: true },
    )
})
</script>

<template>
    <div class="purchase-page">
        <div class="purchase-layout">
            <section class="purchase-content" aria-labelledby="purchase-title">
                <div class="page-title">
                    <div>
                        <h1 id="purchase-title">Đơn mua của tôi</h1>
                        <p class="subheading">Theo dõi và quản lý các đơn hàng của bạn.</p>
                    </div>
                    <RouterLink to="/buyer/home" class="text-link"
                        >Tiếp tục mua sắm <span aria-hidden="true">↗</span></RouterLink
                    >
                </div>
                <div class="status-tabs" role="group" aria-label="Lọc theo trạng thái đơn hàng">
                    <button type="button" :aria-pressed="status === ''" @click="selectStatus('')">
                        Tất cả
                    </button>
                    <button
                        v-for="(label, id) in orderStatuses"
                        :key="id"
                        type="button"
                        :aria-pressed="String(status) === String(id)"
                        @click="selectStatus(id)"
                    >
                        {{ label }}
                    </button>
                </div>
                <div class="list-caption">
                    <p>{{ status ? orderStatuses[status] : 'Tất cả đơn hàng' }}</p>
                    <span v-if="!loading && !error">{{ result?.total ?? 0 }} đơn hàng</span>
                </div>
                <div v-if="error" class="purchase-alert" role="alert">
                    <p>{{ error }}</p>
                    <button type="button" class="button-secondary" @click="attempt++">
                        Thử lại
                    </button>
                </div>
                <div v-if="loading" class="order-card state-card" role="status">
                    <span class="loader" aria-hidden="true" />
                    <h2>Đang tải đơn hàng</h2>
                    <p>Đang lấy lịch sử mua sắm của bạn…</p>
                </div>
                <template v-else-if="!error">
                    <div v-if="!result?.data?.length" class="order-card state-card">
                        <span class="empty-icon" aria-hidden="true">□</span>
                        <h2>Chưa có đơn hàng ở đây</h2>
                        <p>Các đơn hàng thuộc trạng thái này sẽ xuất hiện tại đây.</p>
                        <RouterLink to="/buyer/home" class="button-primary"
                            >Khám phá sản phẩm</RouterLink
                        >
                    </div>
                    <article
                        v-for="record in result?.data ?? []"
                        :key="record.id"
                        class="order-card"
                    >
                        <header class="order-card-header">
                            <div>
                                <p class="shop-name">
                                    {{ record.product?.shop?.name || 'Đơn hàng của bạn' }}
                                </p>
                                <p class="order-meta">
                                    {{ record.order_code || '#' + record.id }} <span>·</span>
                                    {{ localDate(record.created_at) }}
                                </p>
                            </div>
                            <span class="status-badge" :data-status="record.status_id">{{
                                orderStatuses[record.status_id] || 'Đang cập nhật'
                            }}</span>
                        </header>
                        <div class="order-products">
                            <div
                                v-for="item in orderItems(record)"
                                :key="item.id"
                                class="order-product"
                            >
                                <img
                                    :src="
                                        getResources(
                                            item.product?.images?.[0] ??
                                                (item.product_id === record.product_id
                                                    ? record.product?.images?.[0]
                                                    : null),
                                        )
                                    "
                                    :alt="item.product_name"
                                    width="84"
                                    height="84"
                                    loading="lazy"
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
                                        {{ item.variations?.join(' / ') || 'Phân loại mặc định' }}
                                    </p>
                                    <span class="product-quantity"
                                        >Số lượng × {{ item.quantity }}</span
                                    >
                                </div>
                                <strong class="product-price">{{ money(item.line_total) }}</strong>
                            </div>
                        </div>
                        <footer class="order-card-footer">
                            <p class="order-footnote">
                                {{
                                    Number(record.status_id) === 5
                                        ? 'Đơn hàng đã được hủy.'
                                        : Number(record.status_id) === 6
                                        ? 'Đơn hàng đã được trả lại.'
                                        : 'Xem chi tiết để theo dõi cập nhật mới nhất.'
                                }}
                            </p>
                            <div class="order-actions">
                                <p class="order-total">
                                    Thành tiền
                                    <strong>{{
                                        money(record.payment_total ?? record.grand_total)
                                    }}</strong>
                                </p>
                                <RouterLink :to="'/buyer/order/' + record.id" class="button-primary"
                                    >Xem chi tiết <span aria-hidden="true">→</span></RouterLink
                                >
                            </div>
                        </footer>
                    </article>
                    <nav
                        v-if="result?.last_page > 1"
                        class="order-pagination"
                        aria-label="Phân trang đơn hàng"
                    >
                        <button
                            type="button"
                            class="button-secondary"
                            :disabled="page <= 1"
                            @click="page--"
                        >
                            ← Trước</button
                        ><span>Trang {{ page }} / {{ result.last_page }}</span
                        ><button
                            type="button"
                            class="button-secondary"
                            :disabled="page >= result.last_page"
                            @click="page++"
                        >
                            Sau →
                        </button>
                    </nav>
                </template>
            </section>
        </div>
    </div>
</template>

<style scoped src="~/styles/purchases.css"></style>
