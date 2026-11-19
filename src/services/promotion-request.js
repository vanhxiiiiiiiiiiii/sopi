import AxiosInstance from './axios-instance'

export default {
  getCampaign(campaign) {
    return AxiosInstance.get(`/promotions/${encodeURIComponent(campaign)}`)
  },
  saveVoucher(id) {
    return AxiosInstance.post(`/user/account/vouchers/${id}/save`)
  },
}
