import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart } from '../../lib/cart'
import { useLang } from '../../lib/lang'
import { toBn } from '../../lib/bangla'
import { supabase } from '../../lib/supabase'
import { DELIVERY_CHARGE } from '../../components/CartDrawer'
import { saveCustomerInfo, getCustomerInfo } from '../../lib/customer'
import { ChevronLeft, ShoppingCart, MapPin, Phone, User, MessageSquare, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart()
  const { isBn, t } = useLang()
  const navigate = useNavigate()

  const [form, setForm] = useState(() => {
    const saved = getCustomerInfo()
    return {
      customer_name: saved?.name || '',
      customer_phone: saved?.phone || '',
      customer_address: '',
      customer_city: '',
      delivery_note: '',
    }
  })
  const [loading, setLoading] = useState(false)

  const total = subtotal + DELIVERY_CHARGE
  
  // Clean integer formatting for the premium look
  const fmt = (n) => (isBn ? '৳ ' + toBn(parseFloat(n).toFixed(0)) : 'Tk ' + parseFloat(n).toFixed(0))
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  if (items.length === 0) {
    return (
      <div className="bg-black min-h-screen border-t border-[#333] flex items-center justify-center p-6">
        <div className="max-w-md w-full border border-[#333] bg-[#191715] p-12 text-center">
          <ShoppingCart size={48} className="mx-auto mb-6 text-gray-600" strokeWidth={1} />
          <h2 className={`font-bold text-white uppercase tracking-widest text-lg mb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Your cart is empty', 'কার্টে কিছু নেই')}
          </h2>
          <p className={`text-xs text-gray-500 font-light tracking-wide mb-8 ${isBn ? 'font-bangla-serif' : 'font-bangla-serif'}`}>
            {t('Add products to get started.', 'পণ্য যোগ করে শুরু করুন।')}
          </p>
          <Link to="/products" className={`inline-block bg-transparent text-white font-bold py-3 px-8 transition-all border border-[#333] hover:border-[#1F8B4D] uppercase tracking-widest text-[10px] ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Browse Collection', 'কালেকশন দেখুন')}
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert({
          customer_name:    form.customer_name.trim(),
          customer_phone:   form.customer_phone.trim(),
          customer_address: form.customer_address.trim(),
          customer_city:    form.customer_city.trim() || null,
          delivery_note:    form.delivery_note.trim() || null,
          subtotal:         subtotal,
          delivery_charge:  DELIVERY_CHARGE,
          total_amount:     total,
          payment_method:   'cod',
          payment_status:   'unpaid',
          status:           'pending',
        })
        .select()
        .single()

      if (orderErr) throw orderErr

      const orderItems = items.map(item => ({
        order_id:       order.id,
        product_id:     item.productId,
        product_size_id: item.sizeId,
        product_name:   item.productName,
        product_name_bn: item.productNameBn || null,
        size_grams:     item.sizeGrams,
        unit_price:     item.unitPrice,
        original_price: item.originalPrice,
        quantity:       item.quantity,
        subtotal:       item.unitPrice * item.quantity,
      }))

      const { error: itemsErr } = await supabase.from('order_items').insert(orderItems)
      if (itemsErr) throw itemsErr

      saveCustomerInfo({ name: form.customer_name.trim(), phone: form.customer_phone.trim() })
      clearCart()
      navigate(`/order-confirmation/${order.order_number}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="bg-black min-h-screen py-10 border-t border-[#333]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link to="/products" className={`inline-flex items-center gap-2 text-[10px] md:text-xs text-gray-500 hover:text-[#1F8B4D] uppercase tracking-widest mb-8 transition-colors ${isBn ? 'font-bangla-sans font-bold' : ''}`}>
          <ChevronLeft size={16} /> {t('Continue Shopping', 'কেনাকাটা চালিয়ে যান')}
        </Link>

        <h1 className={`text-3xl font-bold text-white uppercase tracking-wide mb-8 border-b border-[#333] pb-6 ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
          {t('Secure Checkout', 'সিকিউর চেকআউট')}
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

            {/* ── Left: Delivery form ────────────────────────── */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-[#191715] border border-[#333] p-6 md:p-8">
                <h2 className={`font-bold text-white mb-6 flex items-center gap-3 border-b border-[#333] pb-4 uppercase tracking-widest ${isBn ? 'font-bangla-sans text-sm' : 'font-bangla-sans text-sm'}`}>
                  <MapPin size={18} className="text-[#1F8B4D]" />
                  {t('Delivery Details', 'ডেলিভারি তথ্য')}
                </h2>

                <div className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className={`block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
                      {t('Full Name', 'পুরো নাম')} *
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input
                        className={`w-full bg-[#111] border border-[#333] text-white pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors ${isBn ? 'font-bangla-sans' : ''}`}
                        placeholder={t('Your full name', 'আপনার পুরো নাম')}
                        value={form.customer_name}
                        onChange={e => setField('customer_name', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={`block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
                      {t('Phone Number', 'ফোন নম্বর')} *
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input
                        className="w-full bg-[#111] border border-[#333] text-white pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors font-mono tracking-widest"
                        type="tel"
                        placeholder="01XXXXXXXXX"
                        value={form.customer_phone}
                        onChange={e => setField('customer_phone', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div>
                    <label className={`block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
                      {t('Delivery Address', 'ডেলিভারি ঠিকানা')} *
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-4 top-4 text-gray-600" />
                      <textarea
                        className={`w-full bg-[#111] border border-[#333] text-white pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors resize-y min-h-[100px] leading-relaxed ${isBn ? 'font-bangla-sans' : ''}`}
                        placeholder={t('House, road, area...', 'বাড়ি, রাস্তা, এলাকা...')}
                        value={form.customer_address}
                        onChange={e => setField('customer_address', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* City */}
                  <div>
                    <label className={`block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
                      {t('City / District', 'শহর / জেলা')}
                    </label>
                    <div className="relative">
                      <Building2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                      <input
                        className={`w-full bg-[#111] border border-[#333] text-white pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors ${isBn ? 'font-bangla-sans' : ''}`}
                        placeholder={t('e.g. Dhaka, Chittagong', 'যেমন: ঢাকা, চট্টগ্রাম')}
                        value={form.customer_city}
                        onChange={e => setField('customer_city', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Note */}
                  <div>
                    <label className={`block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
                      {t('Delivery Note (optional)', 'ডেলিভারি নোট (ঐচ্ছিক)')}
                    </label>
                    <div className="relative">
                      <MessageSquare size={16} className="absolute left-4 top-4 text-gray-600" />
                      <textarea
                        className={`w-full bg-[#111] border border-[#333] text-white pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors resize-none h-24 leading-relaxed ${isBn ? 'font-bangla-sans' : ''}`}
                        placeholder={t('Any special instructions...', 'বিশেষ নির্দেশনা...')}
                        value={form.delivery_note}
                        onChange={e => setField('delivery_note', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment method badge */}
              <div className="bg-[#191715] border border-[#333] p-6 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-black border border-[#1F8B4D]/50 flex items-center justify-center text-[#1F8B4D] text-xl font-bold font-mono">
                    ৳
                  </div>
                  <div>
                    <p className={`font-bold text-white text-sm uppercase tracking-wide mb-1 ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
                      {t('Cash on Delivery', 'ক্যাশ অন ডেলিভারি')}
                    </p>
                    <p className={`text-[10px] text-gray-500 uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
                      {t('Pay when your order arrives', 'পণ্য পেলে টাকা দিন')}
                    </p>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span className={`bg-[#1F8B4D]/10 border border-[#1F8B4D]/30 text-[#1F8B4D] text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
                    {t('Selected', 'নির্বাচিত')}
                  </span>
                </div>
              </div>

            </div>

            {/* ── Right: Order summary ───────────────────────── */}
            <div className="lg:col-span-5">
              <div className="bg-[#191715] border border-[#333] p-6 md:p-8 sticky top-28">
                <h2 className={`font-bold text-white mb-6 border-b border-[#333] pb-4 uppercase tracking-widest ${isBn ? 'font-bangla-sans text-sm' : 'font-bangla-sans text-sm'}`}>
                  {t('Order Summary', 'অর্ডার সারসংক্ষেপ')}
                </h2>

                {/* Items */}
                <div className="space-y-4 mb-8">
                  {items.map(item => (
                    <div key={item.cartKey} className="flex gap-4 items-start pb-4 border-b border-[#333]/50 last:border-0 last:pb-0">
                      
                      <div className="w-14 h-14 bg-black overflow-hidden flex-shrink-0 border border-[#333]">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt="" className="w-full h-full object-cover opacity-80" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-sm uppercase font-bangla-sans">
                            {item.productName[0]}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold text-white truncate uppercase tracking-wide mb-1 ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
                          {t(item.productName, item.productNameBn)}
                        </p>
                        <p className={`text-[10px] text-gray-500 uppercase tracking-widest ${isBn ? 'font-bangla-sans' : 'font-mono'}`}>
                          {isBn ? toBn(item.sizeGrams) + ' গ্রাম' : item.sizeGrams + 'g'} × {isBn ? toBn(item.quantity) : item.quantity}
                        </p>
                      </div>
                      
                      <p className={`text-xs font-bold text-white flex-shrink-0 ${isBn ? 'font-bangla-sans' : 'font-mono'}`}>
                        {fmt(item.unitPrice * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-[#333] pt-6 space-y-3 text-xs font-bold uppercase tracking-widest">
                  <div className="flex justify-between text-gray-400">
                    <span className={isBn ? 'font-bangla-sans' : ''}>{t('Subtotal', 'পণ্যের মোট')}</span>
                    <span className={isBn ? 'font-bangla-sans' : 'font-mono'}>{fmt(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span className={isBn ? 'font-bangla-sans' : ''}>{t('Delivery', 'ডেলিভারি চার্জ')}</span>
                    <span className={isBn ? 'font-bangla-sans' : 'font-mono'}>{fmt(DELIVERY_CHARGE)}</span>
                  </div>
                  <div className="flex justify-between text-white text-base pt-4 mt-4 border-t border-[#333]">
                    <span className={isBn ? 'font-bangla-sans' : ''}>{t('Total', 'সর্বমোট')}</span>
                    <span className={`text-[#1F8B4D] ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>{fmt(total)}</span>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-4 transition-all uppercase tracking-widest text-[10px] mt-8 disabled:opacity-70 disabled:cursor-not-allowed ${isBn ? 'font-bangla-sans' : ''}`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('Processing...', 'অর্ডার হচ্ছে...')}
                    </>
                  ) : (
                    t('Confirm Order', 'অর্ডার নিশ্চিত করুন')
                  )}
                </button>

                <p className={`text-center text-[9px] text-gray-500 uppercase tracking-widest mt-4 font-bold ${isBn ? 'font-bangla-sans' : ''}`}>
                  {t('Pay on delivery • No advance required', 'কোনো অগ্রিম পেমেন্ট নেই')}
                </p>
              </div>
            </div>

          </div>
        </form>
      </div>
    </main>
  )
}