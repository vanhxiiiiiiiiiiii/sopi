<route lang="yaml">
meta:
    layout: seller/LSDashBoard
</route>
<script setup>
import Axios from '~/services/axios-instance'
import { money, localDate, orderStatuses, requestError } from '~/utils/checkout'
const data = ref(null)
const error = ref('')
onMounted(async () => {
    try {
        data.value = (await Axios.get('/shop/dashboard')).data
    } catch (failure) {
        error.value = requestError(failure, 'Không tải được tổng quan.')
    }
})
</script>
<template>
    <div>
        <h1>Tổng quan cửa hàng</h1>
        <p v-if="error" role="alert">{{ error }}</p>
        <p v-else-if="!data" role="status">Đang tải dữ liệu…</p>
        <template v-else
            ><section class="seller-stats">
                <RouterLink v-for="id in [1, 2, 3, 5]" :key="id" to="/seller/orders/all"
                    ><strong>{{ data.counts[id] || 0 }}</strong
                    ><span>{{ orderStatuses[id] }}</span></RouterLink
                >
                <div>
                    <strong>{{ data.products }}</strong
                    ><span>Sản phẩm</span>
                </div>
                <div>
                    <strong>{{ money(data.revenue) }}</strong
                    ><span>Doanh thu đơn đã giao</span>
                </div>
            </section>
            <section class="seller-panel">
                <h2>Đơn hàng gần đây</h2>
                <p v-if="!data.recent.length">
                    Chưa có đơn hàng. Bắt đầu bằng việc thêm sản phẩm cho cửa hàng.
                </p>
                <table v-else>
                    <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Ngày đặt</th>
                            <th>Trạng thái</th>
                            <th>Thành tiền</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="order in data.recent" :key="order.id">
                            <td>{{ order.order_code || order.id }}</td>
                            <td>{{ localDate(order.created_at) }}</td>
                            <td>{{ orderStatuses[order.status_id] }}</td>
                            <td>{{ money(order.payment_total) }}</td>
                        </tr>
                    </tbody>
                </table>
            </section></template
        >
    </div>
</template>
