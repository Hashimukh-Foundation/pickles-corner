import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import ProductForm from '../../components/admin/ProductForm'
import StockManager from '../../components/admin/StockManager'
import { Plus, Pencil, Trash2, Layers, Search, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [stockProduct, setStockProduct] = useState(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*, product_sizes(id, size_grams, stock_quantity)')
      .order('created_at', { ascending: false })
    setProducts(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Record purged'); fetchProducts() }
  }

  const toggleActive = async (id, current) => {
    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', id)
    if (error) toast.error(error.message)
    else fetchProducts()
  }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  )

  const totalStock = (p) => p.product_sizes?.reduce((s, x) => s + x.stock_quantity, 0) ?? 0

  return (
    <div className="p-4 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[#333] pb-6">
        <div>
          <h1 className="font-bangla-sans text-2xl md:text-3xl font-bold text-white uppercase tracking-wide">
            Inventory Management
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-mono">
            {products.length} {products.length === 1 ? 'Record Found' : 'Records Found'}
          </p>
        </div>
        <button 
          onClick={() => { setEditProduct(null); setShowForm(true) }} 
          className="bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-3 px-6 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
        >
          <Plus size={14} strokeWidth={3} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          className="w-full bg-[#111] border border-[#333] text-white pl-10 pr-4 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-[#1F8B4D] transition-colors placeholder-gray-600"
          placeholder="Search by Name or Category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-32">
          <svg className="animate-spin h-8 w-8 text-[#1F8B4D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="bg-[#111] border border-[#333] overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-black border-b border-[#333] text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                <th className="px-6 py-4">Item Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Base Price</th>
                <th className="px-6 py-4">Variants</th>
                <th className="px-6 py-4">Aggregated Stock</th>
                <th className="px-6 py-4 text-center">Visibility</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#333]">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-[#191715] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      {p.image_url ? (
                        <div className="w-10 h-10 bg-black border border-[#333] overflow-hidden flex-shrink-0">
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-black border border-[#333] flex items-center justify-center text-gray-700 font-bold text-sm uppercase font-bangla-sans flex-shrink-0">
                          {p.name[0]}
                        </div>
                      )}
                      <span className="font-bold text-white uppercase tracking-wide text-xs font-bangla-sans">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest">{p.category || '—'}</td>
                  <td className="px-6 py-4 font-bold text-[#1F8B4D] font-mono text-sm">৳{parseFloat(p.price).toFixed(0)}</td>
                  <td className="px-6 py-4 text-[10px] text-gray-400 font-mono uppercase tracking-widest">{p.product_sizes?.length ?? 0} Sizes</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-2 py-1 border text-[10px] font-bold uppercase tracking-widest font-mono ${
                      totalStock(p) === 0 
                        ? 'bg-[#C62020]/10 text-[#C62020] border-[#C62020]/30' 
                        : totalStock(p) <= 20 
                          ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' 
                          : 'bg-[#1F8B4D]/10 text-[#1F8B4D] border-[#1F8B4D]/30'
                    }`}>
                      QTY: {totalStock(p)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => toggleActive(p.id, p.is_active)} 
                      className={`inline-flex items-center justify-center w-8 h-8 border transition-colors ${
                        p.is_active 
                          ? 'border-transparent text-gray-500 hover:text-[#C62020] hover:bg-[#C62020]/10 hover:border-[#C62020]/30' 
                          : 'border-transparent text-gray-600 hover:text-[#1F8B4D] hover:bg-[#1F8B4D]/10 hover:border-[#1F8B4D]/30'
                      }`}
                      title={p.is_active ? 'Hide from Store' : 'Publish to Store'}
                    >
                      {p.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setStockProduct(p)}
                        className="w-8 h-8 flex items-center justify-center border border-transparent text-gray-500 hover:text-white hover:border-[#333] hover:bg-black transition-colors"
                        title="Manage Inventory"
                      >
                        <Layers size={14} />
                      </button>
                      <button
                        onClick={() => { setEditProduct(p); setShowForm(true) }}
                        className="w-8 h-8 flex items-center justify-center border border-transparent text-gray-500 hover:text-white hover:border-[#333] hover:bg-black transition-colors"
                        title="Edit Record"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="w-8 h-8 flex items-center justify-center border border-transparent text-gray-500 hover:text-[#C62020] hover:border-[#C62020]/30 hover:bg-[#C62020]/10 transition-colors"
                        title="Purge Record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-500 border-t border-[#333]">
                    <Search size={24} className="mx-auto mb-3 opacity-50" strokeWidth={1.5} />
                    <span className="text-[10px] uppercase tracking-widest font-bold">No products match your criteria.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {showForm && (
        <ProductForm
          product={editProduct}
          onClose={() => { setShowForm(false); setEditProduct(null) }}
          onSaved={() => { setShowForm(false); setEditProduct(null); fetchProducts() }}
        />
      )}
      {stockProduct && (
        <StockManager
          product={stockProduct}
          onClose={(refresh) => { setStockProduct(null); if (refresh) fetchProducts() }}
        />
      )}
    </div>
  )
}