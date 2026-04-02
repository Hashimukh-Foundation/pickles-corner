import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, X, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { isDiscountActive, getFinalPrice } from '../../lib/pricing'

const EMPTY_SIZE = { size_grams: '', price_override: '', stock_quantity: 0, sku: '', discount_percent: '', discount_expires_at: '' }

function LangTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg w-fit mb-4">
      <button type="button" onClick={() => onChange('en')}
        className={`px-3 py-1 rounded-md text-xs font-bold transition ${active === 'en' ? 'bg-white shadow text-navy-900' : 'text-gray-500 hover:text-navy-900'}`}>
        EN English
      </button>
      <button type="button" onClick={() => onChange('bn')}
        className={`px-3 py-1 rounded-md text-xs font-bold transition font-[Hind_Siliguri,sans-serif] ${active === 'bn' ? 'bg-indigo-600 shadow text-white' : 'text-gray-500 hover:text-navy-900'}`}
        style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
        বাং বাংলা
      </button>
    </div>
  )
}

export default function ProductForm({ product, onClose, onSaved }) {
  const editing = !!product
  const [lang, setLang] = useState('en')
  const [form, setForm] = useState({
    name: '', description: '', price: '', category: '', image_url: '', is_active: true,
    name_bn: '', description_bn: '', category_bn: '',
    ...product,
  })
  const [sizes, setSizes] = useState([{ ...EMPTY_SIZE }])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (product?.id) {
      supabase.from('product_sizes').select('*').eq('product_id', product.id).then(({ data }) => {
        if (data?.length) setSizes(data.map(s => ({
          ...s,
          discount_expires_at: s.discount_expires_at || '',
          price_override: s.price_override ?? '',
          discount_percent: s.discount_percent ?? '',
        })))
      })
    }
  }, [product])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setSizeField = (i, k, v) => setSizes(s => s.map((x, idx) => idx === i ? { ...x, [k]: v } : x))
  const addSize = () => setSizes(s => [...s, { ...EMPTY_SIZE }])
  const removeSize = (i) => setSizes(s => s.filter((_, idx) => idx !== i))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!sizes.some(s => s.size_grams)) return toast.error('Add at least one size')
    setLoading(true)
    try {
      let productId = product?.id
      const payload = {
        name: form.name.trim(), description: form.description,
        price: parseFloat(form.price), category: form.category,
        image_url: form.image_url, is_active: form.is_active,
        name_bn: form.name_bn || null, description_bn: form.description_bn || null,
        category_bn: form.category_bn || null,
      }
      if (editing) {
        const { error } = await supabase.from('products').update(payload).eq('id', productId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('products').insert(payload).select().single()
        if (error) throw error
        productId = data.id
      }
      if (editing) await supabase.from('product_sizes').delete().eq('product_id', productId)
      const sizeRows = sizes.filter(s => s.size_grams).map(s => ({
        product_id: productId,
        size_grams: parseInt(s.size_grams),
        price_override: s.price_override ? parseFloat(s.price_override) : null,
        stock_quantity: parseInt(s.stock_quantity) || 0,
        sku: s.sku || null,
        discount_percent: s.discount_percent ? parseInt(s.discount_percent) : null,
        discount_expires_at: s.discount_expires_at || null,
      }))
      const { error: sizeErr } = await supabase.from('product_sizes').insert(sizeRows)
      if (sizeErr) throw sizeErr
      toast.success(editing ? 'Product updated!' : 'Product created!')
      onSaved()
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display text-lg font-bold text-navy-900">
            {editing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Language tabs */}
          <LangTabs active={lang} onChange={setLang} />

          {/* EN fields */}
          {lang === 'en' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Product Name (English) *</label>
                <input className="input" value={form.name} onChange={e => setField('name', e.target.value)} required />
              </div>
              <div>
                <label className="label">Base Price (৳) *</label>
                <input className="input" type="number" step="0.01" min="0" value={form.price} onChange={e => setField('price', e.target.value)} required />
              </div>
              <div>
                <label className="label">Category (English)</label>
                <input className="input" value={form.category} onChange={e => setField('category', e.target.value)} placeholder="e.g. Nuts, Mixes" />
              </div>
              <div className="col-span-2">
                <label className="label">Description (English)</label>
                <textarea className="input resize-none h-20" value={form.description} onChange={e => setField('description', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">Image URL</label>
                <input className="input" value={form.image_url} onChange={e => setField('image_url', e.target.value)} placeholder="https://..." />
              </div>
              <div className="col-span-2 flex items-center gap-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setField('is_active', e.target.checked)} className="w-4 h-4 accent-brand-600" />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active (visible on store)</label>
              </div>
            </div>
          )}

          {/* Bangla fields */}
          {lang === 'bn' && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <div className="col-span-2">
                <label className="label" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>পণ্যের নাম (বাংলা)</label>
                <input
                  className="input-bn"
                  style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
                  placeholder="যেমন: প্রিমিয়াম বাদাম"
                  value={form.name_bn}
                  onChange={e => setField('name_bn', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="label" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>বিভাগ (বাংলা)</label>
                <input
                  className="input-bn"
                  style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
                  placeholder="যেমন: বাদাম, মিক্স"
                  value={form.category_bn}
                  onChange={e => setField('category_bn', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="label" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>বিবরণ (বাংলা)</label>
                <textarea
                  className="input-bn resize-none h-24"
                  style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
                  placeholder="পণ্যের বিবরণ লিখুন…"
                  value={form.description_bn}
                  onChange={e => setField('description_bn', e.target.value)}
                />
              </div>
              <div className="col-span-2 text-xs text-indigo-500 bg-indigo-100 rounded-lg px-3 py-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                💡 বাংলা ক্ষেত্রগুলো ঐচ্ছিক। না দিলে ইংরেজি ব্যবহার করা হবে।
              </div>
            </div>
          )}

          {/* Sizes (always shown) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Sizes, Stock & Discounts *</label>
              <button type="button" onClick={addSize} className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
                <Plus size={13} /> Add Size
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">
                <span className="col-span-2">Size (g)</span>
                <span className="col-span-2">Price (৳)</span>
                <span className="col-span-2">Stock</span>
                <span className="col-span-2">SKU</span>
                <span className="col-span-2">Discount %</span>
                <span className="col-span-1">Expires</span>
                <span className="col-span-1" />
              </div>
              {sizes.map((size, i) => {
                const active = size.discount_percent && isDiscountActive({ discount_percent: parseInt(size.discount_percent), discount_expires_at: size.discount_expires_at || null })
                const preview = active ? getFinalPrice({ price_override: size.price_override ? parseFloat(size.price_override) : null, discount_percent: parseInt(size.discount_percent), discount_expires_at: size.discount_expires_at || null }, parseFloat(form.price)) : null
                return (
                  <div key={i} className="space-y-1">
                    <div className="grid grid-cols-12 gap-2 items-center">
                      <input className="input col-span-2 text-sm" type="number" placeholder="250" value={size.size_grams} onChange={e => setSizeField(i, 'size_grams', e.target.value)} />
                      <input className="input col-span-2 text-sm" type="number" step="0.01" placeholder="base" value={size.price_override} onChange={e => setSizeField(i, 'price_override', e.target.value)} />
                      <input className="input col-span-2 text-sm" type="number" min="0" value={size.stock_quantity} onChange={e => setSizeField(i, 'stock_quantity', e.target.value)} />
                      <input className="input col-span-2 text-sm" placeholder="SKU" value={size.sku} onChange={e => setSizeField(i, 'sku', e.target.value)} />
                      <div className="col-span-2 relative">
                        <Tag size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input className="input pl-7 text-sm" type="number" min="0" max="100" placeholder="0" value={size.discount_percent} onChange={e => setSizeField(i, 'discount_percent', e.target.value)} />
                      </div>
                      <input className="input col-span-1 text-xs px-2" type="date"
                        value={size.discount_expires_at ? size.discount_expires_at.split('T')[0] : ''}
                        onChange={e => setSizeField(i, 'discount_expires_at', e.target.value ? e.target.value + 'T23:59:59Z' : '')}
                      />
                      <button type="button" onClick={() => removeSize(i)} disabled={sizes.length === 1} className="col-span-1 text-gray-300 hover:text-red-500 transition disabled:opacity-20 flex justify-center">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {active && preview && (
                      <div className="ml-1 flex items-center gap-1.5 text-xs text-red-600 font-semibold">
                        <span className="inline-flex items-center gap-1 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                          <Tag size={10} /> {size.discount_percent}% OFF → ৳{preview}
                          {size.discount_expires_at && <span className="text-gray-400 font-normal ml-1">until {new Date(size.discount_expires_at).toLocaleDateString()}</span>}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving…' : editing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
