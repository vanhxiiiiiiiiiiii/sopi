export function normalizeRating(value) {
  const rating = Number(value)
  return Number.isFinite(rating) ? Math.round(Math.min(5, Math.max(0, rating)) * 10) / 10 : 0
}
