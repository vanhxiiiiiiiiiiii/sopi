import { ref } from 'vue'
import Axios from '~/services/axios-instance'

export const adminIdentity = ref(null)
export const adminRoles = [
  { code: 'super_admin', name: 'Super Admin', permission: 'super', description: 'Quản lý tài khoản quản trị, phân quyền và truy cập toàn hệ thống.', path: '/admin/administrators' },
  { code: 'logistics_admin', name: 'Admin vận chuyển', permission: 'logistics', description: 'Quản lý đơn vị, nhân viên, phân công vận đơn và xử lý giao nhận.', path: '/admin/shipping/shipments' },
  { code: 'commerce_admin', name: 'Admin mua bán', permission: 'commerce', description: 'Quản lý người mua, người bán, sản phẩm, đơn hàng và voucher.', path: '/admin/commerce' },
]
export const canAdmin = permission => adminIdentity.value?.permissions?.includes(permission) === true
export const adminHome = data => data?.permissions?.includes('super') ? '/admin/dashboard' : data?.permissions?.includes('logistics') ? '/admin/shipping/shipments' : '/admin/commerce'
export function adminPagePermission(path) {
  if (path.startsWith('/admin/shipping/')) return 'logistics'
  if (path.startsWith('/admin/administrators')) return 'super'
  if (path.startsWith('/admin/commerce') || path.startsWith('/admin/sellers') || path.startsWith('/admin/category/')) return 'commerce'
  return null
}
export async function refreshAdmin() {
  const { data } = await Axios.get('/admin/me')
  return data
}
