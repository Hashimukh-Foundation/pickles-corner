import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const CartContext = createContext(null)

/**
 * Cart item shape:
 * {
 *   cartKey:        string   — unique key = `${productId}_${sizeId}`
 *   productId:      string
 *   productName:    string
 *   productNameBn:  string | null
 *   imageUrl:       string | null
 *   sizeId:         string
 *   sizeGrams:      number
 *   unitPrice:      number   — final price after discount
 *   originalPrice:  number   — price before discount
 *   quantity:       number
 * }
 */

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })

  // Persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items))
  }, [items])

  // ── Derived values ───────────────────────────────────────
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal   = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)

  // ── Actions ──────────────────────────────────────────────
  const addItem = useCallback((item) => {
    setItems(prev => {
      const existing = prev.find(i => i.cartKey === item.cartKey)
      if (existing) {
        return prev.map(i =>
          i.cartKey === item.cartKey
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        )
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }]
    })
  }, [])

  const removeItem = useCallback((cartKey) => {
    setItems(prev => prev.filter(i => i.cartKey !== cartKey))
  }, [])

  const updateQuantity = useCallback((cartKey, quantity) => {
    if (quantity < 1) return
    setItems(prev => prev.map(i => i.cartKey === cartKey ? { ...i, quantity } : i))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const isInCart = useCallback((cartKey) => items.some(i => i.cartKey === cartKey), [items])

  return (
    <CartContext.Provider value={{
      items, totalItems, subtotal,
      addItem, removeItem, updateQuantity, clearCart, isInCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
