import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Star, ChevronLeft, CheckCircle, Clock, ShoppingCart, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import DiscountBadge, { PriceDisplay } from '../../components/DiscountBadge'
import { isDiscountActive, getFinalPrice, getOriginalPrice } from '../../lib/pricing'
import { useLang } from '../../lib/lang'
import { bn as BN, fmtGrams, toBn } from '../../lib/bangla'
import { useCart } from '../../lib/cart'

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-2">
      {[1,2,3,4,5].map(i => (
        <button 
          key={i} 
          type="button" 
          onMouseEnter={() => setHover(i)} 
          onMouseLeave={() => setHover(0)} 
          onClick={() => onChange(i)} 
          className="transition-transform hover:scale-110 focus:outline-none"
        >
          <Star size={24} className={i <= (hover || value) ? 'fill-[#1F8B4D] text-[#1F8B4D]' : 'text-gray-700'} />
        </button>
      ))}
    </div>
  )
}

function CountdownTimer({ expiresAt, isBn }) {
  const [timeLeft, setTimeLeft] = useState('')
  
  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt) - new Date()
      if (diff <= 0) { setTimeLeft(isBn ? 'মেয়াদ শেষ' : 'Expired'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      if (h > 48) {
        const days = Math.floor(h / 24)
        const str = `${days}D ${h % 24}H LEFT`
        setTimeLeft(isBn ? toBn(days) + 'দিন ' + toBn(h % 24) + 'ঘণ্টা বাকি' : str)
      } else {
        setTimeLeft(isBn
          ? `${toBn(h)}ঘ ${toBn(m)}মি ${toBn(s)}সে বাকি`
          : `${h}h ${m}m ${s}s LEFT`)
      }
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [expiresAt, isBn])

  return (
    <span className={`inline-flex items-center gap-1.5 text-[9px] font-bold text-[#C62020] bg-[#C62020]/10 border border-[#C62020]/30 px-2 py-1 uppercase tracking-widest ${isBn ? 'font-bangla-sans' : 'font-mono'}`}>
      <Clock size={10} />{timeLeft}
    </span>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const { isBn, t } = useLang()
  const { addItem, isInCart } = useCart()
  const [product, setProduct] = useState(null)
  const [sizes, setSizes] = useState([])
  const [reviews, setReviews] = useState([])
  const [selectedSize, setSelectedSize] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reviewForm, setReviewForm] = useState({ customer_name: '', customer_email: '', rating: 0, comment: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: p }, { data: s }, { data: r }] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('product_sizes').select('*').eq('product_id', id).order('size_grams'),
        supabase.from('reviews').select('*').eq('product_id', id).eq('is_approved', true).order('created_at', { ascending: false }),
      ])
      setProduct(p); setSizes(s ?? []); setReviews(r ?? [])
      if (s?.length) setSelectedSize(s[0])
      setLoading(false)
    }
    fetchAll()
  }, [id])

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!reviewForm.rating) return toast.error(t('Please select a rating', 'রেটিং বেছে নিন'))
    setSubmitting(true)
    const { error } = await supabase.from('reviews').insert({
      product_id: id,
      customer_name: reviewForm.customer_name,
      customer_email: reviewForm.customer_email || null,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      is_approved: false,
    })
    if (error) toast.error(error.message)
    else setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) return (
    <div className="bg-black min-h-screen border-t border-[#333] flex items-center justify-center py-32">
      <svg className="animate-spin h-8 w-8 text-[#1F8B4D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  )

  if (!product) return (
    <div className="bg-black min-h-screen border-t border-[#333] flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-[#333] bg-[#191715] p-12 text-center">
        <p className={`font-bold text-white uppercase tracking-widest text-sm mb-6 ${isBn ? 'font-bangla-sans' : ''}`}>
          {t('Product not found.', 'পণ্য পাওয়া যায়নি।')}
        </p>
        <Link to="/products" className={`inline-block bg-transparent text-white font-bold py-3 px-8 transition-all border border-[#333] hover:border-[#1F8B4D] uppercase tracking-widest text-[10px] ${isBn ? 'font-bangla-sans' : ''}`}>
          {t('Back to Collection', 'কালেকশনে ফিরে যান')}
        </Link>
      </div>
    </div>
  )

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null
  const selectedDiscountActive = selectedSize ? isDiscountActive(selectedSize) : false
  const selectedFinalPrice = selectedSize ? getFinalPrice(selectedSize, product.price) : product.price
  const selectedOriginalPrice = selectedSize ? getOriginalPrice(selectedSize, product.price) : product.price
  const savings = (selectedOriginalPrice - selectedFinalPrice).toFixed(0)

  return (
    <main className="bg-black min-h-screen py-10 border-t border-[#333]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <Link to="/products" className={`inline-flex items-center gap-2 text-[10px] md:text-xs text-gray-500 hover:text-[#1F8B4D] uppercase tracking-widest mb-10 transition-colors ${isBn ? 'font-bangla-sans font-bold' : ''}`}>
          <ChevronLeft size={16} /> {t('Back to Collection', 'কালেকশনে ফিরে যান')}
        </Link>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 mb-24">
          
          {/* Image */}
          <div className="relative">
            {selectedDiscountActive && (
              <div className="absolute top-4 left-4 z-10">
                <DiscountBadge percent={selectedSize.discount_percent} size="lg" isBn={isBn} />
              </div>
            )}
            <div className="aspect-square bg-[#111] border border-[#333] overflow-hidden group">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={t(product.name, product.name_bn)} 
                  className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bangla-sans text-8xl font-bold text-gray-700 uppercase">
                  {t(product.name, product.name_bn)?.[0]}
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col">
            {(product.category || product.category_bn) && (
              <span className={`text-[10px] font-bold text-[#1F8B4D] uppercase tracking-widest mb-3 ${isBn ? 'font-bangla-sans' : ''}`}>
                {t(product.category, product.category_bn)}
              </span>
            )}
            
            <h1 className={`text-3xl md:text-5xl font-bold text-white mb-4 leading-tight ${isBn ? 'font-bangla-sans' : 'font-bangla-sans uppercase tracking-wide'}`}>
              {t(product.name, product.name_bn)}
            </h1>

            {/* Ratings */}
            {avgRating && (
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#333]">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => <Star key={i} size={14} className={i <= Math.round(avgRating) ? 'fill-[#1F8B4D] text-[#1F8B4D]' : 'text-gray-700'} />)}
                </div>
                <span className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest ${isBn ? 'font-bangla-sans' : 'font-mono'}`}>
                  {isBn ? toBn(avgRating) : avgRating} / 5.0 
                  <span className="mx-2 text-gray-700">|</span> 
                  {isBn ? toBn(reviews.length) : reviews.length} {t('Reviews', 'টি রিভিউ')}
                </span>
              </div>
            )}

            {/* Description */}
            <p className={`text-gray-400 leading-relaxed font-light mb-8 ${isBn ? 'font-bangla-serif text-base' : 'font-bangla-serif text-lg'}`}>
              {t(product.description, product.description_bn)}
            </p>

            {/* Size selector */}
            {sizes.length > 0 && (
              <div className="mb-10">
                <p className={`text-[10px] font-bold text-white uppercase tracking-widest mb-4 flex items-center justify-between ${isBn ? 'font-bangla-sans' : ''}`}>
                  <span>{t('Select Variant', 'সাইজ বেছে নিন')}</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {sizes.map(size => {
                    const inStock = size.stock_quantity > 0
                    const discountOn = isDiscountActive(size)
                    const finalP = getFinalPrice(size, product.price)
                    const origP = getOriginalPrice(size, product.price)

                    const fmtP = (v) => {
                      const n = parseFloat(v).toFixed(0)
                      return (isBn ? '৳' + toBn(n) : 'Tk ' + n)
                    }

                    return (
                      <button
                        key={size.id}
                        onClick={() => inStock && setSelectedSize(size)}
                        disabled={!inStock}
                        className={`relative p-3 border transition-colors flex flex-col items-start justify-center text-left
                          ${selectedSize?.id === size.id 
                            ? 'border-[#1F8B4D] bg-[#1F8B4D]/10' 
                            : 'border-[#333] bg-[#111] hover:border-gray-500'}
                          ${!inStock ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        <span className={`block font-bold text-white text-sm uppercase tracking-wide mb-1 ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
                          {fmtGrams(size.size_grams, isBn)}
                        </span>
                        
                        <span className={`block text-[10px] font-mono tracking-widest ${discountOn ? 'text-[#C62020]' : 'text-gray-400'}`}>
                          {discountOn ? (
                            <span className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold">{fmtP(finalP)}</span>
                              <span className="line-through text-gray-600">{fmtP(origP)}</span>
                            </span>
                          ) : (
                            <span>{fmtP(origP)}</span>
                          )}
                        </span>
                        
                        {size.stock_quantity <= 5 && size.stock_quantity > 0 && (
                          <span className={`block text-[9px] text-yellow-500 font-bold uppercase tracking-widest mt-2 ${isBn ? 'font-bangla-sans' : ''}`}>
                            {isBn ? toBn(size.stock_quantity) + ' টি ' + BN.left : `ONLY ${size.stock_quantity} LEFT`}
                          </span>
                        )}
                        {discountOn && (
                          <span className="absolute -top-2 -right-2">
                            <DiscountBadge percent={size.discount_percent} size="sm" isBn={isBn} />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Price box & Actions */}
            <div className={`mt-auto border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 ${selectedDiscountActive ? 'bg-[#191715] border-[#C62020]/30' : 'bg-[#191715] border-[#333]'}`}>
              
              <div>
                <PriceDisplay
                  finalPrice={selectedFinalPrice}
                  originalPrice={selectedOriginalPrice}
                  isDiscounted={selectedDiscountActive}
                  size="lg"
                  isBn={isBn}
                />
                
                {selectedDiscountActive && (
                  <div className="mt-2 flex flex-col gap-2">
                    <span className={`text-[10px] text-[#1F8B4D] font-bold uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
                      {isBn ? `সাশ্রয়: ৳${toBn(savings)}` : `SAVE TK ${savings}`}
                    </span>
                    {selectedSize?.discount_expires_at && (
                      <CountdownTimer expiresAt={selectedSize.discount_expires_at} isBn={isBn} />
                    )}
                  </div>
                )}
                
                {selectedSize && !selectedDiscountActive && (
                  <p className={`text-[9px] text-gray-500 uppercase tracking-widest mt-2 font-bold ${isBn ? 'font-bangla-sans' : ''}`}>
                    {selectedSize.stock_quantity > 0
                      ? (isBn ? 'স্টকে আছে' : 'IN STOCK & READY TO SHIP')
                      : t('Out of stock', BN.outOfStock)}
                  </p>
                )}
              </div>

              {/* Add to Cart Button */}
              {(() => {
                if (!selectedSize || selectedSize.stock_quantity === 0) {
                  return (
                    <button disabled className="w-full sm:w-auto flex-shrink-0 bg-[#111] border border-[#333] text-gray-600 font-bold py-4 px-8 uppercase tracking-widest text-[10px] cursor-not-allowed font-bangla-sans">
                      {t('Out of Stock', 'স্টক আউট')}
                    </button>
                  )
                }
                const cartKey = `${product.id}_${selectedSize.id}`
                const inCart = isInCart(cartKey)
                
                return (
                  <button
                    onClick={() => {
                      addItem({
                        cartKey,
                        productId: product.id,
                        productName: product.name,
                        productNameBn: product.name_bn || null,
                        imageUrl: product.image_url || null,
                        sizeId: selectedSize.id,
                        sizeGrams: selectedSize.size_grams,
                        unitPrice: selectedFinalPrice,
                        originalPrice: selectedOriginalPrice,
                      })
                      toast.success(t('Added to cart!', 'কার্টে যোগ হয়েছে!'))
                    }}
                    className={`w-full sm:w-auto flex-shrink-0 font-bold py-4 px-8 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] ${isBn ? 'font-bangla-sans' : ''}
                      ${inCart
                        ? 'bg-transparent text-[#1F8B4D] border border-[#1F8B4D]'
                        : 'bg-[#1F8B4D] hover:bg-[#166E3B] text-white border border-transparent hover:border-green-400'
                      }`}
                  >
                    {inCart ? (
                      <><Check size={16} strokeWidth={3} /> {t('Added to Cart', 'কার্টে আছে')}</>
                    ) : (
                      <><ShoppingCart size={16} strokeWidth={2} /> {t('Add to Cart', 'কার্টে যোগ করুন')}</>
                    )}
                  </button>
                )
              })()}
            </div>

          </div>
        </div>

        {/* Reviews Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 pt-16 border-t border-[#333]">
          
          {/* List of Reviews */}
          <div>
            <div className="flex items-center justify-between mb-8 border-b border-[#333] pb-4">
              <h2 className={`text-xl font-bold text-white uppercase tracking-wide ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
                {t('Testimonials', BN.customerReviews)}
              </h2>
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest font-mono">
                {isBn ? toBn(reviews.length) : reviews.length} {t('Reviews', 'রিভিউ')}
              </span>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-[#111] border border-[#333] p-10 text-center">
                <p className={`text-gray-500 uppercase tracking-widest text-[10px] font-bold ${isBn ? 'font-bangla-sans' : ''}`}>
                  {t('No reviews yet. Be the first to share your experience.', 'এখনো কোনো রিভিউ নেই। প্রথম হোন!')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(r => (
                  <div key={r.id} className="bg-[#191715] border border-[#333] p-6 hover:border-[#444] transition-colors relative">
                    <div className="text-[#1F8B4D] text-3xl absolute top-4 right-6 font-serif opacity-20">"</div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-[#111] border border-[#333] flex items-center justify-center text-white font-bold text-xs uppercase font-bangla-sans">
                        {r.customer_name[0]}
                      </div>
                      <div>
                        <p className={`text-sm font-bold text-white uppercase tracking-wide mb-1 ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
                          {r.customer_name}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map(i => <Star key={i} size={10} className={i <= r.rating ? 'fill-[#1F8B4D] text-[#1F8B4D]' : 'text-gray-700'} />)}
                          </div>
                          <span className={`text-[9px] text-gray-600 uppercase tracking-widest font-mono ${isBn ? 'font-bangla-sans' : ''}`}>
                            {new Date(r.created_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {r.comment && (
                      <p className={`text-gray-400 leading-relaxed font-light text-sm ${isBn ? 'font-bangla-serif' : 'font-bangla-serif'}`}>
                        "{r.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review Form */}
          <div>
            <h2 className={`text-xl font-bold text-white uppercase tracking-wide mb-8 border-b border-[#333] pb-4 ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
              {t('Write a Review', BN.writeReview)}
            </h2>

            {submitted ? (
              <div className="bg-[#191715] border border-[#333] p-12 text-center">
                <CheckCircle size={48} className="text-[#1F8B4D] mx-auto mb-6" strokeWidth={1.5} />
                <h3 className={`font-bold text-white uppercase tracking-widest text-sm mb-2 ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
                  {t('Thank You!', BN.reviewThankYou)}
                </h3>
                <p className={`text-xs text-gray-500 font-light tracking-wide ${isBn ? 'font-bangla-serif' : 'font-bangla-serif'}`}>
                  {t('Your review is pending moderation.', BN.reviewPending)}
                </p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="bg-[#191715] border border-[#333] p-6 md:p-8 space-y-6">
                <div>
                  <label className={`block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 ${isBn ? 'font-bangla-sans' : ''}`}>
                    {t('Rating *', BN.yourRating + ' *')}
                  </label>
                  <StarPicker value={reviewForm.rating} onChange={v => setReviewForm(f => ({ ...f, rating: v }))} />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
                      {t('Name *', BN.yourName + ' *')}
                    </label>
                    <input 
                      className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors font-bangla-sans" 
                      value={reviewForm.customer_name} 
                      onChange={e => setReviewForm(f => ({ ...f, customer_name: e.target.value }))} 
                      required 
                      placeholder={t('John Doe', 'আপনার নাম')}
                    />
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
                      {t('Email', BN.email)} <span className="text-gray-700">(Optional)</span>
                    </label>
                    <input 
                      className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors font-mono" 
                      type="email" 
                      value={reviewForm.customer_email} 
                      onChange={e => setReviewForm(f => ({ ...f, customer_email: e.target.value }))} 
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
                    {t('Experience', BN.comment)}
                  </label>
                  <textarea
                    className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors resize-none h-32 font-bangla-serif leading-relaxed"
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                    placeholder={t('Share details of your own experience at this place...', 'আপনার অভিজ্ঞতা শেয়ার করুন…')}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={submitting} 
                  className={`w-full bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-4 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-[10px] mt-4 ${isBn ? 'font-bangla-sans' : ''}`}
                >
                  {submitting ? t('Submitting...', BN.submitting) : t('Submit Review', BN.submitReview)}
                </button>
              </form>
            )}
          </div>
          
        </div>

      </div>
    </main>
  )
}