import Axios from './axios-instance'

export default {
  settings: (admin = false) => Axios.get(admin ? '/admin/shipping/rates' : '/user/shipping/settings'),
  save: data => Axios.put('/admin/shipping/rates', data),
  search: (query, admin = false) => Axios.post(admin ? '/admin/shipping/search' : '/user/shipping/search', { query }),
}
