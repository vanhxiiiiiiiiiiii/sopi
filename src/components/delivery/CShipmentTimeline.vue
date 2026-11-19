<script setup>
import { localDate } from '~/utils/checkout'
import { deliveryRoles, shipmentStatuses } from '~/utils/delivery'
defineProps({ events: { type: Array, default: () => [] } })
</script>
<template>
  <ol v-if="events.length" class="shipment-timeline">
    <li v-for="event in events" :key="event.id">
      <span class="timeline-point" aria-hidden="true" /><div>
        <strong>{{ event.event_type === 'cod' ? 'Đã xác nhận thu COD' : shipmentStatuses[event.new_status] || event.new_status }}</strong><small>{{ localDate(event.created_at) }} · {{ deliveryRoles[event.actor_role] || 'Hệ thống' }}<span v-if="event.actor_id"> #{{ event.actor_id }}</span></small><p v-if="event.note">
          {{ event.note }}
        </p>
      </div>
    </li>
  </ol><p v-else class="operations-muted">
    Chưa có lịch sử vận chuyển.
  </p>
</template>
<style scoped>
.shipment-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  text-align: left;
  font: inherit;
}
.shipment-timeline li {
  position: relative;
  display: flex;
  gap: 16px;
  padding: 0 0 24px;
}
.shipment-timeline li:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 5px;
  top: 11px;
  bottom: 0;
  width: 1px;
  background: #ead9cf;
}
.timeline-point {
  position: relative;
  top: 5px;
  width: 11px;
  height: 11px;
  flex-shrink: 0;
  border-radius: 50%;
  background: #ee4d2d;
  box-shadow: 0 0 0 3px #fff1e9;
}
.shipment-timeline strong {
  display: block;
  font-size: 13px;
  font-weight: 600;
}
.shipment-timeline small {
  display: block;
  color: #888;
  font-size: 11px;
  line-height: 1.8;
  margin-top: 4px;
}
.shipment-timeline p {
  font-size: 12px;
  line-height: 1.7;
  margin: 5px 0 0;
  color: #666;
  overflow-wrap: anywhere;
}
</style>
