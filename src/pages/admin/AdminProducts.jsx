import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import ProductForm from '../../components/admin/ProductForm'
import StockManager from '../../components/admin/StockManager'
import { Plus, Pencil, Trash2, Layers, Search, ToggleLeft, ToggleRight } from 'lucide-react'
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
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Product deleted'); fetchProducts() }
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
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">{products.length} total products</p>
        </div>
        <button onClick={() => { setEditProduct(null); setShowForm(true) }} className="btn-primary">
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search products…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-semibold">Product</th>
                <th className="text-left px-4 py-3 font-semibold">Category</th>
                <th className="text-left px-4 py-3 font-semibold">Base Price</th>
                <th className="text-left px-4 py-3 font-semibold">Sizes</th>
                <th className="text-left px-4 py-3 font-semibold">Total Stock</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-right px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-brand-50/40 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-brand-100" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-400 font-bold text-sm">
                          {p.name[0]}
                        </div>
                      )}
                      <span className="font-medium text-navy-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{p.category || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-brand-700">৳{parseFloat(p.price).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500">{p.product_sizes?.length ?? 0} sizes</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${totalStock(p) === 0 ? 'bg-red-100 text-red-700' : totalStock(p) <= 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {totalStock(p)} units
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(p.id, p.is_active)} className="flex items-center gap-1.5 text-xs font-medium transition-colors">
                      {p.is_active
                        ? <><ToggleRight size={18} className="text-green-500" /><span className="text-green-600">Active</span></>
                        : <><ToggleLeft size={18} className="text-gray-400" /><span className="text-gray-400">Hidden</span></>
                      }
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setStockProduct(p)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Manage Stock"
                      >
                        <Layers size={15} />
                      </button>
                      <button
                        onClick={() => { setEditProduct(p); setShowForm(true) }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-gray-400 text-sm">
                    No products found.
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
