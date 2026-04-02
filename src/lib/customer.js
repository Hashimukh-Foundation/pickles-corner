const KEY = 'customer_info'

/**
 * Save customer details to localStorage after a successful order.
 * We store name + phone so future visits auto-fill checkout
 * and My Orders pre-fills the phone lookup.
 */
export function saveCustomerInfo({ name, phone }) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ name, phone }))
  } catch {}
}

/**
 * Retrieve saved customer info.
 * Returns { name, phone } or null.
 */
export function getCustomerInfo() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

/**
 * Clear saved customer info (if they want to "log out").
 */
export function clearCustomerInfo() {
  try { localStorage.removeItem(KEY) } catch {}
}
