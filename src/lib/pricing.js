/**
 * Returns true if a size's discount is currently active.
 */
export function isDiscountActive(size) {
  if (!size.discount_percent || size.discount_percent <= 0) return false
  if (!size.discount_expires_at) return true
  return new Date(size.discount_expires_at) > new Date()
}

/**
 * Returns the effective price for a size, factoring in discounts.
 * Falls back to product base price if no size price_override.
 */
export function getFinalPrice(size, productBasePrice) {
  const base = size.price_override ?? productBasePrice
  if (isDiscountActive(size)) {
    return +(base * (1 - size.discount_percent / 100)).toFixed(2)
  }
  return +parseFloat(base).toFixed(2)
}

/**
 * Original price (before discount) for a size.
 */
export function getOriginalPrice(size, productBasePrice) {
  return +parseFloat(size.price_override ?? productBasePrice).toFixed(2)
}

/**
 * Finds the best (highest discount %) active size for a product.
 * Used for showing the top badge on product cards.
 */
export function getBestDiscount(sizes) {
  return sizes
    .filter(isDiscountActive)
    .reduce((best, s) => (!best || s.discount_percent > best.discount_percent ? s : best), null)
}

/**
 * Formats ৳ price.
 */
export function fmt(price) {
  return `৳${parseFloat(price).toFixed(2)}`
}
