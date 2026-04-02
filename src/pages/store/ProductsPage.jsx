import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart } from 'lucide-react'
import DiscountBadge, { PriceDisplay } from '../../components/DiscountBadge'
import { getBestDiscount, getFinalPrice, getOriginalPrice } from '../../lib/pricing'
import { useLang } from '../../lib/lang'
import { bn as BN, toBn } from '../../lib/bangla'
import { useCart } from '../../lib/cart'
import toast from 'react-hot-toast'

function ProductCard({ product }) {
  const { isBn, t } = useLang()
  const { addItem } = useCart()
  const sizes = product.product_sizes ?? []
  const bestDiscount = getBestDiscount(sizes)

  // Cheapest in-stock size
  const cheapestSize = sizes
    .filter(s => s.stock_quantity > 0)
    .sort((a, b) => getFinalPrice(a, product.price) - getFinalPrice(b, product.price))[0]

  const minFinalPrice = sizes.length
    ? sizes.reduce((min, s) => { const p = getFinalPrice(s, product.price); return p < min ? p : min }, Infinity)
    : product.price
  const minOriginalPrice = sizes.length
    ? sizes.reduce((min, s) => { const p = getOriginalPrice(s, product.price); return p < min ? p : min }, Infinity)
    : product.price
    
  const totalStock = sizes.reduce((s, x) => s + x.stock_quantity, 0)
  const inStock = totalStock > 0

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!cheapestSize) return
    addItem({
      cartKey: `${product.id}_${cheapestSize.id}`,
      productId: product.id,
      productName: product.name,
      productNameBn: product.name_bn || null,
      imageUrl: product.image_url || null,
      sizeId: cheapestSize.id,
      sizeGrams: cheapestSize.size_grams,
      unitPrice: getFinalPrice(cheapestSize, product.price),
      originalPrice: getOriginalPrice(cheapestSize, product.price),
    })
    toast.success(t('Added to cart!', 'কার্টে যোগ হয়েছে!'))
  }

  return (
    <div className={`bg-[#191715] border border-[#333333] hover:border-[#1F8B4D] transition-colors duration-300 flex flex-col group relative ${!inStock ? 'opacity-75' : ''}`}>
      
      <Link to={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-[#111]">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={t(product.name, product.name_bn)} 
            className={`object-cover w-full h-full transition-transform duration-500 opacity-90 ${inStock ? 'group-hover:scale-105 group-hover:opacity-100' : 'grayscale'}`} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-700 text-4xl uppercase tracking-widest font-bangla-sans">
            {t(product.name, product.name_bn)?.[0]}
          </div>
        )}

        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {!inStock && (
            <span className="bg-black/90 text-white text-[10px] font-bold px-2.5 py-1 uppercase tracking-widest border border-gray-600 font-bangla-sans">
              {t('Sold Out', 'স্টক আউট')}
            </span>
          )}
          {inStock && bestDiscount && (
            <DiscountBadge percent={bestDiscount.discount_percent} size="md" isBn={isBn} />
          )}
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-grow text-center">
        {(product.category || product.category_bn) && (
          <span className={`text-[#1F8B4D] text-[10px] font-bold uppercase tracking-widest mb-1.5 ${isBn ? 'font-bangla-sans' : ''}`}>
            {t(product.category, product.category_bn)}
          </span>
        )}
        
        <h3 className="text-xl font-bold text-white mb-2 leading-tight font-bangla-sans">
          <Link to={`/products/${product.id}`} className="hover:text-[#1F8B4D] transition-colors">
            {t(product.name, product.name_bn)}
          </Link>
        </h3>

        <div className="mb-5 flex flex-col items-center justify-center gap-1.5 font-bangla-sans mt-auto">
          <div className="flex items-center gap-2">
            {bestDiscount ? (
              <>
                <span className="text-gray-500 line-through text-sm">Tk {isBn ? toBn(minOriginalPrice) : minOriginalPrice.toFixed(0)}</span>
                <span className="text-[#C62020] text-lg font-bold">Tk {isBn ? toBn(minFinalPrice) : minFinalPrice.toFixed(0)}</span>
              </>
            ) : (
              <>
                <span className="text-gray-400 text-xs uppercase tracking-widest">{t('From', 'শুরু')}</span> 
                <span className="text-white text-lg font-bold">Tk {isBn ? toBn(minFinalPrice) : minFinalPrice.toFixed(0)}</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">
            {isBn ? `${toBn(sizes.length)} ${BN.sizesAvailable}` : `${sizes.length} sizes`}
          </span>
        </div>
        
        <div className="mt-auto border-t border-[#333] pt-4">
          {inStock ? (
            <button 
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 text-gray-400 hover:text-white font-bold py-2 transition-colors uppercase text-[10px] tracking-widest font-bangla-sans"
            >
              <ShoppingCart size={14} />
              {t('Add to Cart', 'কার্টে যোগ করুন')}
            </button>
          ) : (
            <button disabled className="w-full text-gray-600 font-bold py-2 uppercase text-[10px] tracking-widest cursor-not-allowed font-bangla-sans">
              {t('Unavailable', 'পাওয়া যাচ্ছে না')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const { isBn, t } = useLang()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [onSale, setOnSale] = useState(false)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    supabase.from('products')
      .select('*, product_sizes(id, size_grams, price_override, stock_quantity, discount_percent, discount_expires_at)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProducts(data ?? [])
        const seen = new Set()
        const cats = []
        for (const p of (data ?? [])) {
          if (p.category && !seen.has(p.category)) {
            seen.add(p.category)
            cats.push({ en: p.category, bn: p.category_bn })
          }
        }
        setCategories(cats)
        setLoading(false)
      })
  }, [])

  const filtered = products.filter(p => {
    const name = (t(p.name, p.name_bn) || '').toLowerCase()
    const matchSearch = name.includes(search.toLowerCase())
    const matchCat = !category || p.category === category
    const matchSale = !onSale || !!getBestDiscount(p.product_sizes ?? [])
    return matchSearch && matchCat && matchSale
  })

  const saleCount = products.filter(p => getBestDiscount(p.product_sizes ?? [])).length

  return (
    <main className="bg-black min-h-screen py-12 border-t border-[#333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-10 border-b border-[#333] pb-6">
          <h1 className={`text-3xl font-bold text-white uppercase tracking-wide mb-2 ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
            {t('Complete Collection', BN.allProducts)}
          </h1>
          <p className={`text-xs text-gray-500 uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
            {isBn ? `${toBn(products.length)} টি পণ্য উপলব্ধ` : `${products.length} Items Available`}
          </p>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCategory('')}
              className={`px-4 py-2 border text-[10px] font-bold uppercase tracking-widest transition-colors ${isBn ? 'font-bangla-sans' : ''} ${
                !category 
                  ? 'bg-[#1F8B4D] border-[#1F8B4D] text-white' 
                  : 'bg-[#111] border-[#333] text-gray-500 hover:text-white hover:border-gray-500'
              }`}
            >
              {t('All', 'সব')}
            </button>
            {categories.map(cat => (
              <button
                key={cat.en}
                onClick={() => setCategory(cat.en)}
                className={`px-4 py-2 border text-[10px] font-bold uppercase tracking-widest transition-colors ${isBn ? 'font-bangla-sans' : ''} ${
                  category === cat.en 
                    ? 'bg-[#1F8B4D] border-[#1F8B4D] text-white' 
                    : 'bg-[#111] border-[#333] text-gray-500 hover:text-white hover:border-gray-500'
                }`}
              >
                {t(cat.en, cat.bn)}
              </button>
            ))}
            
            {saleCount > 0 && (
              <button
                onClick={() => setOnSale(v => !v)}
                className={`flex items-center gap-2 px-4 py-2 border text-[10px] font-bold uppercase tracking-widest transition-colors ml-auto md:ml-0 ${isBn ? 'font-bangla-sans' : ''} ${
                  onSale 
                    ? 'bg-[#C62020] border-[#C62020] text-white' 
                    : 'bg-transparent border-[#C62020]/50 text-[#C62020] hover:bg-[#C62020]/10'
                }`}
              >
                🔥 {t('ON SALE', BN.onSale)}
                <span className={`text-[9px] px-1.5 py-0.5 border ${onSale ? 'bg-white/20 border-white/30' : 'bg-[#C62020]/10 border-[#C62020]/30'}`}>
                  {isBn ? toBn(saleCount) : saleCount}
                </span>
              </button>
            )}
          </div>

          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
            <input
              className={`w-full bg-[#111] border border-[#333] text-white pl-12 pr-4 py-3 text-[10px] focus:outline-none focus:border-[#1F8B4D] transition-colors uppercase tracking-widest ${isBn ? 'font-bangla-sans placeholder-gray-600' : 'placeholder-gray-600'}`}
              placeholder={t('Search Inventory...', BN.searchProducts)}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

        </div>

        {loading ? (
          <div className="flex justify-center py-32">
            <svg className="animate-spin h-8 w-8 text-[#1F8B4D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-24">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-24 border border-[#333] bg-[#191715]">
                <p className={`text-gray-500 text-xs font-bold uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
                  {t('No matches found in inventory.', BN.noProductsFound)}
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  )
}