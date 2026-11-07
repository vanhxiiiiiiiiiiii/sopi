<route lang="yaml">
meta:
    layout: buyer/account/LBDashboard
</route>
<script setup>
import AccountRequest from '~/services/account-request'
import { money, localDate, requestError } from '~/utils/checkout'
const records = ref([])
const loading = ref(true)
const error = ref('')
const copied = ref('')
const query = ref('')
const filter = ref('all')
const tabs = [
    { id: 'all', label: 'Tất cả' },
    { id: 'available', label: 'Có thể dùng' },
    { id: 'upcoming', label: 'Sắp có hiệu lực' },
    { id: 'unavailable', label: 'Hết hiệu lực' },
]
function state(voucher) {
    const now = Date.now()
    if (
        !voucher.is_active ||
        new Date(voucher.ends_at).getTime() < now ||
        voucher.used_count >= voucher.max_uses ||
        voucher.customer_used_count >= voucher.max_uses_per_customer
    )
        return 'unavailable'
    return new Date(voucher.starts_at).getTime() > now ? 'upcoming' : 'available'
}
const visible = computed(() =>
    records.value.filter(
        (voucher) =>
            (filter.value === 'all' || state(voucher) === filter.value) &&
            [voucher.code, voucher.name]
                .join(' ')
                .toLocaleLowerCase('vi')
                .includes(query.value.trim().toLocaleLowerCase('vi')),
    ),
)
async function load() {
    loading.value = true
    error.value = ''
    try {
        const { data } = await AccountRequest.getVouchers()
        records.value = data ?? []
    } catch (failure) {
        error.value = requestError(failure, 'Không tải được voucher.')
    } finally {
        loading.value = false
    }
}
onMounted(load)
async function copy(code) {
    try {
        await navigator.clipboard.writeText(code)
        copied.value = code
    } catch {
        error.value =
            'Không sao chép được mã. Bạn có thể chọn và sao chép mã hiển thị trên voucher.'
    }
}
</script>
<template>
    <section class="account-panel voucher-panel">
        <header class="account-panel-header">
            <div>
                <h1>Kho voucher</h1>
                <p>Chọn ưu đãi phù hợp và nhập mã khi thanh toán</p>
            </div>
            <RouterLink to="/buyer/home" class="account-link">Mua sắm ngay</RouterLink>
        </header>
        <form class="voucher-search" @submit.prevent>
            <label for="voucher-search">Mã voucher</label
            ><input
                id="voucher-search"
                v-model="query"
                placeholder="Tìm theo mã hoặc tên voucher"
            /><button
                type="button"
                class="account-secondary"
                :disabled="!query"
                @click="query = ''"
            >
                Xóa lọc
            </button>
        </form>
        <div class="voucher-tabs" role="group" aria-label="Lọc voucher">
            <button
                v-for="tab in tabs"
                :key="tab.id"
                type="button"
                :aria-pressed="filter === tab.id"
                @click="filter = tab.id"
            >
                {{ tab.label }}
                <span
                    >({{
                        records.filter((voucher) => tab.id === 'all' || state(voucher) === tab.id)
                            .length
                    }})</span
                >
            </button>
        </div>
        <p v-if="error" class="account-error" role="alert">
            {{ error }} <button type="button" class="account-link" @click="load">Thử lại</button>
        </p>
        <p v-if="copied" class="account-success" role="status">
            Đã sao chép mã {{ copied }}. Nhập mã ở bước thanh toán để áp dụng.
        </p>
        <p v-if="loading" class="account-state" role="status">Đang tải voucher…</p>
        <div v-else-if="!visible.length && !error" class="account-empty">
            Chưa có voucher phù hợp.
        </div>
        <div v-else class="voucher-grid">
            <article
                v-for="voucher in visible"
                :key="voucher.id"
                class="voucher-ticket"
                :class="{ 'voucher-disabled': state(voucher) === 'unavailable' }"
            >
                <div class="voucher-stub">
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.2"
                        aria-hidden="true"
                    >
                        <path d="M3 5h18v5a2 2 0 0 0 0 4v5H3v-5a2 2 0 0 0 0-4ZM9 5v14" /></svg
                    ><strong>{{
                        voucher.discount_type === 'percentage'
                            ? voucher.discount_value + '%'
                            : 'ƯU ĐÃI'
                    }}</strong
                    ><span>E-SHOPEE</span>
                </div>
                <div class="voucher-body">
                    <h2>{{ voucher.name }}</h2>
                    <p>
                        Giảm
                        {{
                            voucher.discount_type === 'percentage'
                                ? voucher.discount_value + '%'
                                : money(voucher.discount_value)
                        }}<template v-if="voucher.maximum_discount">
                            · Tối đa {{ money(voucher.maximum_discount) }}</template
                        >
                    </p>
                    <p>Đơn tối thiểu {{ money(voucher.minimum_order_value) }}</p>
                    <code>{{ voucher.code }}</code>
                    <p class="voucher-time">
                        {{
                            state(voucher) === 'upcoming'
                                ? 'Hiệu lực từ ' + localDate(voucher.starts_at)
                                : 'Hạn dùng ' + localDate(voucher.ends_at)
                        }}
                    </p>
                    <div class="voucher-usage">
                        <span
                            :style="{
                                width:
                                    Math.min(
                                        100,
                                        (voucher.used_count / Math.max(1, voucher.max_uses)) * 100,
                                    ) + '%',
                            }"
                        />
                    </div>
                    <p class="voucher-small">
                        Đã dùng {{ voucher.used_count }} / {{ voucher.max_uses }} lượt · Tối đa
                        {{ voucher.max_uses_per_customer }} lượt/người
                    </p>
                    <button
                        type="button"
                        class="account-secondary"
                        :disabled="state(voucher) !== 'available'"
                        @click="copy(voucher.code)"
                    >
                        {{
                            state(voucher) === 'unavailable'
                                ? 'Hết hiệu lực'
                                : state(voucher) === 'upcoming'
                                ? 'Chưa hiệu lực'
                                : copied === voucher.code
                                ? 'Đã sao chép'
                                : 'Sao chép mã'
                        }}
                    </button>
                </div>
            </article>
        </div>
    </section>
</template>
