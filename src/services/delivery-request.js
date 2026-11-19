import Axios from './axios-instance'

export default {
  login: payload => Axios.post('/delivery/auth/sign-in', payload),
  me: () => Axios.get('/delivery/me'),
  logout: () => Axios.post('/delivery/auth/sign-out'),
  dashboard: admin => Axios.get(admin ? '/admin/shipments/dashboard' : '/delivery/dashboard'),
  list: (admin, params) => Axios.get(admin ? '/admin/shipments' : '/delivery/shipments', { params }),
  detail: (admin, id) => Axios.get((admin ? '/admin/shipments/' : '/delivery/shipments/') + id),
  history: page => Axios.get('/delivery/history', { params: { page } }),
  change: (id, data) => Axios.post(`/delivery/shipments/${id}/status`, data),
  collect: (id, data) => Axios.post(`/delivery/shipments/${id}/collect-cod`, data),
  assign: (id, data) => Axios.post(`/admin/shipments/${id}/assign`, data),
  requestReturn: (id, data) => Axios.post(`/admin/shipments/${id}/request-return`, data),
  providers: () => Axios.get('/admin/shipping/providers'),
  saveProvider: (id, data) => id ? Axios.put(`/admin/shipping/providers/${id}`, data) : Axios.post('/admin/shipping/providers', data),
  staff: params => Axios.get('/admin/shipping/staff', { params }),
  saveStaff: (id, data) => id ? Axios.put(`/admin/shipping/staff/${id}`, data) : Axios.post('/admin/shipping/staff', data),
}
