export const shipmentStatuses = {
  PENDING: 'Chờ xử lý',
  READY_FOR_PICKUP: 'Chờ lấy hàng',
  ASSIGNED: 'Đã phân công',
  PICKED_UP: 'Đã lấy hàng',
  IN_TRANSIT: 'Đang vận chuyển',
  OUT_FOR_DELIVERY: 'Đang giao hàng',
  DELIVERED: 'Giao thành công',
  DELIVERY_FAILED: 'Giao thất bại',
  RETURNING: 'Đang hoàn hàng',
  RETURNED: 'Đã hoàn hàng',
  CANCELLED: 'Đã hủy',
}
export const sellerStatuses = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', preparing: 'Đang chuẩn bị hàng', ready_for_pickup: 'Sẵn sàng bàn giao', handed_over: 'Đã bàn giao vận chuyển' }
export const shipmentActions = { PICKED_UP: 'Xác nhận đã lấy hàng', IN_TRANSIT: 'Xác nhận đang vận chuyển', OUT_FOR_DELIVERY: 'Bắt đầu giao hàng', DELIVERED: 'Xác nhận giao thành công', DELIVERY_FAILED: 'Báo giao thất bại', RETURNING: 'Bắt đầu hoàn hàng', RETURNED: 'Xác nhận đã hoàn hàng' }
export const deliveryRoles = { SYSTEM: 'Hệ thống', ADMIN: 'Quản trị viên', SELLER: 'Người bán', SHIPPER: 'Nhân viên vận chuyển', CUSTOMER: 'Khách hàng' }
export const failedReasons = ['Không liên lạc được người nhận', 'Người nhận hẹn giao lại', 'Địa chỉ không chính xác', 'Người nhận từ chối nhận hàng', 'Hàng bị hư hỏng', 'Lý do khác']

export function deliveryLoginOnError(failure, router, admin = false) {
  if ([401, 403].includes(failure.response?.status)) {
    localStorage.removeItem(admin ? 'admin_token' : 'delivery_token')
    router.replace(admin ? '/admin/login' : '/delivery/login')
    return true
  }
  return false
}
