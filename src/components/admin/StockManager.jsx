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
      toast.success('Inventory updated successfully')
      onClose(true)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#191715] border border-[#333] w-full max-w-md shadow-2xl">
        
        {/* Header */}
        <div className="flex items-start justify-between px-8 py-6 border-b border-[#333] bg-[#111]">
          <div>
            <h2 className="font-bangla-sans text-xl font-bold text-white uppercase tracking-wide">
              Inventory Adjustment
            </h2>
            <p className="text-[10px] text-[#1F8B4D] font-mono uppercase tracking-widest mt-1">
              {product.name}
            </p>
          </div>
          <button 
            onClick={() => onClose(false)} 
            className="text-gray-500 hover:text-[#C62020] transition-colors p-1"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {sizes.map(size => {
            const adj = adjustments[size.id] || 0
            const preview = Math.max(0, size.stock_quantity + adj)
            
            return (
              <div key={size.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-[#333] bg-[#111]">
                
                <div className="flex-1">
                  <p className="text-sm font-bold text-white uppercase tracking-wide font-bangla-sans flex items-center gap-2">
                    {size.size_grams}G
                    {size.sku && <span className="text-[9px] bg-black border border-[#333] px-1.5 py-0.5 text-gray-500 font-mono">{size.sku}</span>}
                  </p>
                  
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-1.5 font-mono flex items-center gap-2">
                    <span>On Hand: <span className={size.stock_quantity <= 10 ? 'text-[#C62020] font-bold' : 'text-white'}>{size.stock_quantity}</span></span>
                    
                    {adj !== 0 && (
                      <span className="flex items-center gap-2">
                        <span>→</span>
                        <span className={`px-1.5 py-0.5 font-bold ${adj > 0 ? 'bg-[#1F8B4D]/10 text-[#1F8B4D]' : 'bg-[#C62020]/10 text-[#C62020]'}`}>
                          FINAL: {preview}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => adjust(size.id, -1)} 
                    className="w-8 h-8 bg-black border border-[#333] flex items-center justify-center text-gray-400 hover:text-[#C62020] hover:border-[#C62020]/50 transition-colors"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <input
                    type="number"
                    className="w-14 bg-black border border-[#333] text-white text-center py-1.5 text-xs font-mono focus:outline-none focus:border-[#1F8B4D] transition-colors"
                    value={adj}
                    onChange={e => setDirect(size.id, e.target.value)}
                  />
                  <button 
                    onClick={() => adjust(size.id, 1)} 
                    className="w-8 h-8 bg-black border border-[#333] flex items-center justify-center text-gray-400 hover:text-[#1F8B4D] hover:border-[#1F8B4D]/50 transition-colors"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>

              </div>
            )
          })}
          
          {sizes.length === 0 && (
            <div className="text-center py-8 border border-[#333] bg-[#111]">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                No size variants found for this product.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-4 px-8 py-6 border-t border-[#333] bg-[#111]">
          <button 
            onClick={() => onClose(false)} 
            className="bg-transparent text-gray-400 font-bold py-3 px-6 transition-all border border-[#333] hover:border-white hover:text-white uppercase tracking-widest text-[10px]"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={loading} 
            className="bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-3 px-8 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-[10px] flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Committing...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
        
      </div>
    </div>
  )
}