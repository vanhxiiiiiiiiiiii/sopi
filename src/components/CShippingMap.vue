<script setup>
import 'leaflet/dist/leaflet.css'
import ShippingRequest from '~/services/shipping-request'
import { requestError } from '~/utils/checkout'

const props = defineProps({
  modelValue: { type: Object, default: null },
  hub: { type: Object, default: null },
  geometry: { type: Object, default: null },
  searchText: { type: String, default: '' },
  admin: Boolean,
  autoQuote: Boolean,
  disabled: Boolean,
})
const emit = defineEmits(['update:modelValue'])
const canvas = ref(null)
const query = ref(props.searchText)
const results = ref([])
const searching = ref(false)
const error = ref('')
let L, map, marker, hubMarker, line, observer
let searchRevision = 0
const valid = point => point && Number.isFinite(Number(point.latitude)) && Number.isFinite(Number(point.longitude))
  && point.latitude !== null && point.longitude !== null
const coords = point => [Number(point.latitude), Number(point.longitude)]
function pick(latitude, longitude) {
  if (props.disabled) return
  if (latitude < 8 || latitude > 24 || longitude < 102 || longitude > 110) {
    error.value = 'Vui lòng chọn vị trí giao hàng tại Việt Nam.'
    if (marker && valid(props.modelValue)) marker.setLatLng(coords(props.modelValue))
    return
  }
  error.value = ''
  emit('update:modelValue', { latitude: Number(latitude.toFixed(7)), longitude: Number(longitude.toFixed(7)) })
}
function draw() {
  if (!map) return
  if (marker) { map.removeLayer(marker); marker = null }
  if (hubMarker) { map.removeLayer(hubMarker); hubMarker = null }
  if (line) { map.removeLayer(line); line = null }
  if (valid(props.modelValue)) {
    marker = L.marker(coords(props.modelValue), { draggable: !props.disabled,
      title: 'Vị trí đã chọn. Kéo ghim để điều chỉnh.',
      icon: L.divIcon({ className: 'shipping-map-pin', html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 12] }),
    }).addTo(map)
    marker.on('dragend', () => { const point = marker.getLatLng(); pick(point.lat, point.lng) })
  }
  if (valid(props.hub)) hubMarker = L.circleMarker(coords(props.hub), { radius: 8, color: '#234f80', fillOpacity: 1 }).addTo(map).bindTooltip('Kho phân loại trung tâm')
  if (props.geometry?.type === 'LineString' && props.geometry.coordinates?.length) {
    line = L.geoJSON(props.geometry, { style: { color: '#d94323', weight: 4 } }).addTo(map)
    map.fitBounds(line.getBounds(), { padding: [24, 24], maxZoom: 15, animate: false })
  }
  else if (valid(props.modelValue)) map.setView(coords(props.modelValue), 15, { animate: false })
}
async function search() {
  if (searching.value || props.disabled || query.value.trim().length < 3) return
  searching.value = true
  const revision = ++searchRevision
  error.value = ''
  results.value = []
  try {
    const { data } = await ShippingRequest.search(query.value.trim(), props.admin)
    if (revision !== searchRevision) return
    results.value = data
    if (!results.value.length) error.value = 'Chưa tìm thấy địa chỉ. Thử thêm phường, thành phố hoặc chọn trực tiếp trên bản đồ.'
  }
  catch (failure) { if (revision === searchRevision) error.value = requestError(failure, 'Không tìm được địa chỉ. Bạn vẫn có thể chọn điểm trên bản đồ.') }
  finally { if (revision === searchRevision) searching.value = false }
}
function choose(result) {
  pick(result.latitude, result.longitude)
  results.value = []
}
watch(() => props.searchText, value => { searchRevision++; searching.value = false; query.value = value; results.value = []; error.value = '' })
watch(() => [props.modelValue, props.hub, props.geometry, props.disabled], draw, { deep: true })
onMounted(async () => {
  try {
    L = await import('leaflet')
    map = L.map(canvas.value, { scrollWheelZoom: false, zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false })
      .setView(valid(props.hub) ? coords(props.hub) : [20.9809427, 105.7870861], 13)
    L.tileLayer(import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)
    map.on('click', event => pick(event.latlng.lat, event.latlng.lng))
    observer = new ResizeObserver(() => map?.invalidateSize())
    observer.observe(canvas.value)
    draw()
  }
  catch { error.value = 'Không tải được bản đồ. Vui lòng tải lại trang.' }
})
onBeforeUnmount(() => { searchRevision++; observer?.disconnect(); map?.remove(); map = null })
</script>

<template>
  <div class="shipping-map-block">
    <label class="shipping-search-label">Tìm vị trí trên bản đồ
      <span class="shipping-map-search">
        <input v-model="query" type="search" maxlength="255" placeholder="Số nhà, đường, phường, thành phố" :disabled="disabled || searching" @keydown.enter.prevent="search">
        <button type="button" :disabled="disabled || searching || query.trim().length < 3" @click="search">{{ searching ? 'Đang tìm…' : 'Tìm địa chỉ' }}</button>
      </span>
    </label>
    <ul v-if="results.length" class="shipping-map-results" aria-label="Kết quả tìm địa chỉ">
      <li v-for="(result, index) in results" :key="index"><button type="button" :disabled="disabled" @click="choose(result)">{{ result.label }}</button></li>
    </ul>
    <p v-if="error" class="shipping-map-error" role="alert">{{ error }}</p>
    <div ref="canvas" class="shipping-map-canvas" aria-label="Bản đồ chọn vị trí và tuyến đường giao hàng" />
    <p class="shipping-map-help">Nhấn trên bản đồ hoặc kéo ghim màu cam đến đúng vị trí. <template v-if="hub">Điểm xanh là kho trung tâm. <template v-if="autoQuote">Phí và tổng tiền tự cập nhật sau mỗi lần chọn vị trí.</template></template><template v-else>Ghim là điểm xuất phát dùng để tính quãng đường giao hàng.</template></p>
    <p v-if="valid(modelValue)" class="shipping-map-help">Vị trí đã chọn: {{ Number(modelValue.latitude).toFixed(6) }}, {{ Number(modelValue.longitude).toFixed(6) }}</p>
  </div>
</template>

<style>
.shipping-map-block { text-align: left; width: 100%; margin: 18px 0; }
.shipping-search-label { display: grid; gap: 8px; font-weight: 600; color: #30343b; }
.shipping-map-search { display: flex; gap: 10px; }
.shipping-map-search input { flex: 1; min-width: 0; border: 1px solid #dcdfe3; border-radius: 4px; padding: 11px 12px; background: #fff; color: #333; font: inherit; }
.shipping-map-search button { padding: 10px 16px; background: #d94323; color: #fff; border-radius: 4px; white-space: nowrap; }
.shipping-map-search button:disabled { opacity: .55; cursor: not-allowed; }
.shipping-map-canvas { height: 310px; width: 100%; margin-top: 12px; border: 1px solid #e4e6e9; border-radius: 6px; z-index: 0; }
.shipping-map-help { font-size: 12px; color: #606975; line-height: 1.6; margin: 8px 0 0; }
.shipping-map-error { color: #a82819; margin: 10px 0; }
.shipping-map-results { list-style: none; padding: 0; margin: 8px 0; border: 1px solid #e4e6e9; border-radius: 4px; max-height: 200px; overflow: auto; }
.shipping-map-results button { display: block; text-align: left; width: 100%; padding: 12px; color: #30343b; background: white; border-bottom: 1px solid #eee; }
.shipping-map-results button:hover { background: #fff0eb; }
.shipping-map-pin span { display: block; width: 24px; height: 24px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); background: #d94323; border: 3px solid white; box-shadow: 0 1px 5px #555; }
.shipping-map-block :focus-visible { outline: 2px solid #a93820; outline-offset: 3px; }
@media(max-width:600px) { .shipping-map-search { flex-wrap: wrap; } .shipping-map-search input { flex-basis: 100%; } .shipping-map-canvas { height: 260px; } }
</style>
