export function voucherState(voucher, now = Date.now()) {
  if (!voucher.is_active || new Date(voucher.ends_at).getTime() < now
    || Number(voucher.used_count) >= Number(voucher.max_uses)
    || Number(voucher.customer_used_count || 0) >= Number(voucher.max_uses_per_customer))
    return 'unavailable'
  return new Date(voucher.starts_at).getTime() > now ? 'upcoming' : 'available'
}

export function remainingUses(voucher) {
  return Math.max(0, Number(voucher.max_uses) - Number(voucher.used_count))
}
