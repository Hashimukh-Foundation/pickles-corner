import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Trash2, X, Tag } from 'lucide-react'
import toast from 'react-hot-toast'
import { isDiscountActive, getFinalPrice } from '../../lib/pricing'

const EMPTY_SIZE = { size_grams: '', price_override: '', stock_quantity: 0, sku: '', discount_percent: '', discount_expires_at: '' }

function LangTabs({ active, onChange }) {
  return (
    <div className="flex bg-[#111] border border-[#333] w-fit mb-6">
      <button 
        type="button" 
        onClick={() => onChange('en')}
        className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
          active === 'en' 
            ? 'bg-[#1F8B4D] text-white' 
            : 'text-gray-500 hover:text-white hover:bg-white/5'
        }`}
      >
        EN English
      </button>
      <button 
        type="button" 
        onClick={() => onChange('bn')}
        className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors font-bangla-sans ${
          active === 'bn' 
            ? 'bg-[#1F8B4D] text-white' 
            : 'text-gray-500 hover:text-white hover:bg-white/5'
        }`}
      >
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
    } catch (err) { 
      toast.error(err.message) 
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#191715] border border-[#333] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#333] bg-[#111] sticky top-0 z-10">
          <h2 className="font-bangla-sans text-xl font-bold text-white uppercase tracking-wide">
            {editing ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-[#C62020] transition-colors p-1">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8">
          
          {/* Language Tabs */}
          <LangTabs active={lang} onChange={setLang} />

          {/* EN fields */}
          <div className={lang === 'en' ? 'grid grid-cols-1 md:grid-cols-2 gap-6' : 'hidden'}>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Product Name (English) *</label>
              <input 
                className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[#1F8B4D] transition-colors font-bangla-sans text-lg" 
                value={form.name} 
                onChange={e => setField('name', e.target.value)} 
                required={lang === 'en'} 
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Base Price (Tk) *</label>
              <input 
                className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors font-mono" 
                type="number" step="0.01" min="0" 
                value={form.price} 
                onChange={e => setField('price', e.target.value)} 
                required 
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Category (English)</label>
              <input 
                className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors font-bangla-sans" 
                value={form.category} 
                onChange={e => setField('category', e.target.value)} 
                placeholder="e.g. Pickles, Sauces" 
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Description (English)</label>
              <textarea 
                className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors resize-y min-h-[100px] font-bangla-serif leading-relaxed" 
                value={form.description} 
                onChange={e => setField('description', e.target.value)} 
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Image URL</label>
              <input 
                className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors" 
                value={form.image_url} 
                onChange={e => setField('image_url', e.target.value)} 
                placeholder="https://..." 
              />
            </div>
            
            <div className="md:col-span-2 flex items-center gap-3 p-4 border border-[#333] bg-[#111]">
              <input 
                type="checkbox" 
                id="is_active" 
                checked={form.is_active} 
                onChange={e => setField('is_active', e.target.checked)} 
                className="w-4 h-4 accent-[#1F8B4D] cursor-pointer bg-black border-[#333]" 
              />
              <label htmlFor="is_active" className="text-xs font-bold text-white uppercase tracking-widest cursor-pointer">
                Active (Visible on store)
              </label>
            </div>
          </div>

          {/* Bangla fields */}
          <div className={lang === 'bn' ? 'grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#111] border border-[#333] p-6' : 'hidden'}>
            
            <div className="md:col-span-2 text-[10px] text-[#1F8B4D] bg-[#1F8B4D]/10 border border-[#1F8B4D]/30 px-4 py-3 uppercase tracking-widest font-bangla-sans font-bold flex items-center gap-2">
              <span className="text-lg leading-none">💡</span> 
              <span>বাংলা ক্ষেত্রগুলো ঐচ্ছিক। না দিলে ইংরেজি ব্যবহার করা হবে।</span>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-bangla-sans">পণ্যের নাম (বাংলা)</label>
              <input
                className="w-full bg-black border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[#1F8B4D] transition-colors font-bangla-sans text-lg"
                placeholder="যেমন: প্রিমিয়াম আচার"
                value={form.name_bn}
                onChange={e => setField('name_bn', e.target.value)}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-bangla-sans">বিভাগ (বাংলা)</label>
              <input
                className="w-full bg-black border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[#1F8B4D] transition-colors font-bangla-sans text-sm"
                placeholder="যেমন: আচার, সস"
                value={form.category_bn}
                onChange={e => setField('category_bn', e.target.value)}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-bangla-sans">বিবরণ (বাংলা)</label>
              <textarea
                className="w-full bg-black border border-[#333] text-gray-300 px-4 py-4 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors resize-y min-h-[100px] font-bangla-serif leading-relaxed"
                placeholder="পণ্যের বিবরণ লিখুন…"
                value={form.description_bn}
                onChange={e => setField('description_bn', e.target.value)}
              />
            </div>
            
          </div>

          {/* Sizes (always shown) */}
          <div className="border-t border-[#333] pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-xs font-bold text-white uppercase tracking-widest">Sizes, Stock & Discounts *</label>
              <button 
                type="button" 
                onClick={addSize} 
                className="text-[10px] text-[#1F8B4D] hover:text-white font-bold uppercase tracking-widest flex items-center gap-2 transition-colors bg-[#1F8B4D]/10 hover:bg-[#1F8B4D] border border-[#1F8B4D]/30 px-3 py-1.5"
              >
                <Plus size={12} strokeWidth={3} /> Add Size Variant
              </button>
            </div>

            <div className="space-y-4">
              {/* Column headers (Hidden on small screens) */}
              <div className="hidden md:grid grid-cols-12 gap-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest px-1">
                <span className="col-span-2">Size (g)</span>
                <span className="col-span-2">Price (Tk)</span>
                <span className="col-span-2">Stock</span>
                <span className="col-span-2">SKU</span>
                <span className="col-span-2">Discount %</span>
                <span className="col-span-2">Expires</span>
              </div>

              {sizes.map((size, i) => {
                const active = size.discount_percent && isDiscountActive({ discount_percent: parseInt(size.discount_percent), discount_expires_at: size.discount_expires_at || null })
                const preview = active ? getFinalPrice({ price_override: size.price_override ? parseFloat(size.price_override) : null, discount_percent: parseInt(size.discount_percent), discount_expires_at: size.discount_expires_at || null }, parseFloat(form.price)) : null
                
                return (
                  <div key={i} className="space-y-2 bg-[#111] border border-[#333] p-3 relative group">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      
                      {/* Size Input */}
                      <div className="col-span-2 flex flex-col md:block">
                        <label className="md:hidden text-[9px] text-gray-500 uppercase mb-1">Size (g)</label>
                        <input 
                          className="w-full bg-black border border-[#333] text-white px-3 py-2 text-xs focus:outline-none focus:border-[#1F8B4D] transition-colors" 
                          type="number" placeholder="250" 
                          value={size.size_grams} 
                          onChange={e => setSizeField(i, 'size_grams', e.target.value)} 
                        />
                      </div>
                      
                      {/* Price Input */}
                      <div className="col-span-2 flex flex-col md:block">
                        <label className="md:hidden text-[9px] text-gray-500 uppercase mb-1">Price (Tk)</label>
                        <input 
                          className="w-full bg-black border border-[#333] text-white px-3 py-2 text-xs focus:outline-none focus:border-[#1F8B4D] transition-colors" 
                          type="number" step="0.01" placeholder="Base" 
                          value={size.price_override} 
                          onChange={e => setSizeField(i, 'price_override', e.target.value)} 
                        />
                      </div>
                      
                      {/* Stock Input */}
                      <div className="col-span-2 flex flex-col md:block">
                        <label className="md:hidden text-[9px] text-gray-500 uppercase mb-1">Stock</label>
                        <input 
                          className="w-full bg-black border border-[#333] text-white px-3 py-2 text-xs focus:outline-none focus:border-[#1F8B4D] transition-colors" 
                          type="number" min="0" placeholder="0"
                          value={size.stock_quantity} 
                          onChange={e => setSizeField(i, 'stock_quantity', e.target.value)} 
                        />
                      </div>
                      
                      {/* SKU Input */}
                      <div className="col-span-2 flex flex-col md:block">
                        <label className="md:hidden text-[9px] text-gray-500 uppercase mb-1">SKU</label>
                        <input 
                          className="w-full bg-black border border-[#333] text-gray-400 px-3 py-2 text-xs focus:outline-none focus:border-[#1F8B4D] transition-colors font-mono" 
                          placeholder="SKU-123" 
                          value={size.sku} 
                          onChange={e => setSizeField(i, 'sku', e.target.value)} 
                        />
                      </div>

                      {/* Discount % Input */}
                      <div className="col-span-2 flex flex-col md:block relative">
                        <label className="md:hidden text-[9px] text-gray-500 uppercase mb-1">Discount %</label>
                        <Tag size={12} className="absolute left-3 top-[34px] md:top-1/2 md:-translate-y-1/2 text-gray-500 z-10" />
                        <input
                          className="w-full bg-black border border-[#333] text-white pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-[#1F8B4D] transition-colors"
                          type="number" min="0" max="100" placeholder="0"
                          value={size.discount_percent}
                          onChange={e => setSizeField(i, 'discount_percent', e.target.value)}
                        />
                      </div>

                      {/* Expiry Date Input */}
                      <div className="col-span-2 flex items-end md:items-center gap-2">
                        <div className="flex-1 flex flex-col md:block">
                           <label className="md:hidden text-[9px] text-gray-500 uppercase mb-1">Expiry Date</label>
                           <input
                            className="w-full bg-black border border-[#333] text-gray-400 px-2 py-2 text-[10px] focus:outline-none focus:border-[#1F8B4D] transition-colors [color-scheme:dark]"
                            type="date"
                            value={size.discount_expires_at ? size.discount_expires_at.split('T')[0] : ''}
                            onChange={e => setSizeField(i, 'discount_expires_at', e.target.value ? e.target.value + 'T23:59:59Z' : '')}
                            title="Discount expiry (leave blank = no expiry)"
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeSize(i)} 
                          disabled={sizes.length === 1} 
                          className="text-gray-500 hover:text-[#C62020] transition-colors disabled:opacity-20 flex-shrink-0 p-2 border border-transparent hover:border-[#C62020]/30 hover:bg-[#C62020]/10"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Discount preview pill */}
                    {active && preview && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 bg-[#C62020]/10 border border-[#C62020]/30 text-[#C62020] px-2 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                          <Tag size={10} />
                          {size.discount_percent}% OFF → Tk {preview}
                          {size.discount_expires_at && (
                            <span className="text-gray-500 ml-1">
                              until {new Date(size.discount_expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-[#333]">
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-transparent text-gray-400 font-bold py-3 px-6 transition-all border border-[#333] hover:border-white hover:text-white uppercase tracking-widest text-[10px]"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-3 px-8 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-[10px]"
            >
              {loading ? 'Saving…' : editing ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  )
}