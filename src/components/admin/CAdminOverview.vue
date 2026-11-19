<script setup>
import Axios from '~/services/axios-instance'
import { adminIdentity, adminRoles, canAdmin } from '~/composables/admin-access'
import { requestError } from '~/utils/checkout'
const counts = ref({})
const error = ref('')
const loading = ref(true)
const labels = { administrators: 'Quản trị viên', users: 'Người mua', shops: 'Cửa hàng', products: 'Sản phẩm', orders: 'Đơn hàng', shipments: 'Vận đơn', delivery_staff: 'Nhân viên vận chuyển', shipping_providers: 'Đơn vị vận chuyển' }
onMounted(async() => {
  try { counts.value = (await Axios.get('/admin/overview')).data.counts }
  catch (failure) { error.value = requestError(failure, 'Không tải được số liệu.') }
  finally { loading.value = false }
})
</script>
<template>
  <section class="account-panel">
    <header class="account-panel-header">
      <div><h1>Tổng quan quản trị</h1><p>Xin chào {{ adminIdentity?.username }}. Vai trò hiện tại: <strong>{{ adminIdentity?.role.name }}</strong>.</p></div>
    </header>
    <p>Người bán quản lý cửa hàng riêng ở Kênh bán hàng. Quản trị viên quản lý hoạt động toàn sàn trong phạm vi được phân quyền.</p>
    <p v-if="error" class="account-error" role="alert">
      {{ error }}
    </p><p v-if="loading" class="account-state" role="status">
      Đang tải số liệu…
    </p>
    <div class="admin-metrics">
      <div v-for="(value, key) in counts" :key="key" class="admin-metric">
        <strong>{{ value }}</strong><span>{{ labels[key] }}</span>
      </div>
    </div>
    <div class="admin-role-grid">
      <article v-for="role in adminRoles" :key="role.code" class="admin-role-card">
        <h2>{{ role.name }}</h2><p>{{ role.description }}</p><RouterLink v-if="canAdmin(role.permission)" :to="role.path">
          Mở chức năng →
        </RouterLink><span v-else class="operations-muted">Ngoài phạm vi tài khoản hiện tại</span>
      </article>
    </div>
  </section>
</template>
