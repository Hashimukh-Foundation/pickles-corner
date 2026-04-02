import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Minus, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StockManager({ product, onClose }) {
  const [sizes, setSizes] = useState([])
  const [adjustments, setAdjustments] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from('product_sizes').select('*').eq('product_id', product.id).order('size_grams')
      .then(({ data }) => {
        setSizes(data ?? [])
        const init = {}
        data?.forEach(s => { init[s.id] = 0 })
        setAdjustments(init)
      })
  }, [product.id])

  const adjust = (id, delta) => setAdjustments(a => ({ ...a, [id]: (a[id] || 0) + delta }))
  const setDirect = (id, val) => setAdjustments(a => ({ ...a, [id]: parseInt(val) || 0 }))

  const handleSave = async () => {
    setLoading(true)
    try {
      for (const size of sizes) {
        const delta = adjustments[size.id] || 0
        if (delta !== 0) {
          const newQty = Math.max(0, size.stock_quantity + delta)
          const { error } = await supabase.from('product_sizes').update({ stock_quantity: newQty }).eq('id', size.id)
          if (error) throw error
        }
      }
      toast.success('Stock updated!')
      onClose(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-display text-lg font-bold text-navy-900">Manage Stock</h2>
            <p className="text-xs text-gray-400">{product.name}</p>
          </div>
          <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-3">
          {sizes.map(size => {
            const adj = adjustments[size.id] || 0
            const preview = Math.max(0, size.stock_quantity + adj)
            return (
              <div key={size.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-navy-900">{size.size_grams}g
                    {size.sku && <span className="ml-2 text-xs text-gray-400">{size.sku}</span>}
                  </p>
                  <p className="text-xs text-gray-500">
                    Current: <span className={size.stock_quantity <= 10 ? 'text-red-500 font-bold' : 'font-semibold'}>{size.stock_quantity}</span>
                    {adj !== 0 && <span className={`ml-2 ${adj > 0 ? 'text-green-600' : 'text-red-500'}`}>→ {preview}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => adjust(size.id, -1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition">
                    <Minus size={12} />
                  </button>
                  <input
                    type="number"
                    className="w-16 text-center border border-gray-200 rounded-lg py-1 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                    value={adj}
                    onChange={e => setDirect(size.id, e.target.value)}
                  />
                  <button onClick={() => adjust(size.id, 1)} className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-200 transition">
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            )
          })}
          {sizes.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No sizes found for this product.</p>}
        </div>

        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={() => onClose(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : 'Save Stock'}
          </button>
        </div>
      </div>
    </div>
  )
}
