import Axios from './axios-instance'

export default {
  methods: () => Axios.get('/user/payment-methods'),
  setup: () => Axios.post('/user/payment-methods/setup'),
}
