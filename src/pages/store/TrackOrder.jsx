import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../lib/lang'
import { toBn } from '../../lib/bangla'
import { Search, Package, MapPin, Phone, Clock, ArrowRight, Hash } from 'lucide-react'

const STATUS_META = {
  pending:    { en: 'Pending',    bn: 'অপেক্ষায়',     color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  confirmed:  { en: 'Confirmed',  bn: 'নিশ্চিত',       color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  processing: { en: 'Processing', bn: 'প্রক্রিয়াধীন',  color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  shipped:    { en: 'Shipped',    bn: 'পাঠানো হয়েছে',  color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  delivered:  { en: 'Delivered',  bn: 'পৌঁছে গেছে',   color: 'bg-[#1F8B4D]/10 text-[#1F8B4D] border-[#1F8B4D]/30' },
  cancelled:  { en: 'Cancelled',  bn: 'বাতিল',         color: 'bg-[#C62020]/10 text-[#C62020] border-[#C62020]/30' },
}

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

function StatusProgress({ status, isBn }) {
  if (status === 'cancelled') return (
    <div className="flex items-center justify-center py-6 border-t border-[#333]">
      <span className={`bg-[#C62020]/10 text-[#C62020] border border-[#C62020]/30 text-[10px] font-bold px-4 py-2 uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
        {isBn ? 'এই অর্ডারটি বাতিল করা হয়েছে' : 'This order has been cancelled'}
      </span>
    </div>
  )

  const currentIdx = STATUS_STEPS.indexOf(status)

  return (
    <div className="py-8 border-t border-[#333]">
      <div className="flex items-start">
        {STATUS_STEPS.map((step, i) => {
          const done = i <= currentIdx
          const meta = STATUS_META[step]
          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 border flex items-center justify-center text-[10px] font-bold transition-all
                  ${done
                    ? 'bg-[#1F8B4D]/20 text-[#1F8B4D] border-[#1F8B4D]'
                    : 'bg-black text-gray-700 border-[#333]'
                  }`}>
                  {done ? '✓' : i + 1}
                </div>
                <span className={`text-[9px] mt-3 text-center leading-tight uppercase tracking-widest font-bold
                  ${done ? 'text-[#1F8B4D]' : 'text-gray-600'}
                  ${isBn ? 'font-bangla-sans' : ''}`}
                  style={{ maxWidth: 64 }}>
                  {isBn ? meta.bn : meta.en}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-[1px] mx-2 mb-6 transition-colors
                  ${i < currentIdx ? 'bg-[#1F8B4D]' : 'bg-[#333]'}`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function TrackOrder() {
  const { isBn, t } = useLang()
  const [input, setInput] = useState('')
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [notFound, setNotFound] = useState(false)

  // Premium integer formatting
  const fmt = (n) => (isBn ? '৳ ' + toBn(parseFloat(n).toFixed(0)) : 'Tk ' + parseFloat(n).toFixed(0))

  const handleSearch = async (e) => {
    e?.preventDefault()
    const q = input.trim().toUpperCase()
    if (!q) return
    setLoading(true)
    setNotFound(false)
    setOrder(null)
    setItems([])

    const { data: o } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', q)
      .single()

    if (o) {
      const { data: i } = await supabase.from('order_items').select('*').eq('order_id', o.id)
      setOrder(o)
      setItems(i ?? [])
    } else {
      setNotFound(true)
    }
    setLoading(false)
  }

  const statusMeta = order ? (STATUS_META[order.status] ?? STATUS_META.pending) : null

  return (
    <main className="bg-black min-h-screen py-16 border-t border-[#333]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className={`text-3xl font-bold text-white uppercase tracking-wide mb-2 ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
            {t('Track Order', 'অর্ডার ট্র্যাক করুন')}
          </h1>
          <p className={`text-[10px] text-gray-500 uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Enter your receipt number to check its current status.', 'অর্ডার নম্বর দিয়ে বর্তমান অবস্থা জানুন।')}
          </p>
        </div>

        {/* Search */}
        <div className="bg-[#191715] border border-[#333] p-6 md:p-8 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                className="w-full bg-[#111] border border-[#333] text-white pl-12 pr-4 py-4 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors font-mono tracking-widest uppercase"
                placeholder="PC-A3F8C2D1"
                value={input}
                onChange={e => setInput(e.target.value.toUpperCase())}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-4 px-8 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-[10px] flex-shrink-0 flex items-center justify-center gap-2 h-[54px] sm:h-auto"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <><Search size={14} /><span className={isBn ? 'font-bangla-sans' : ''}>{t('Track', 'ট্র্যাক করুন')}</span></>
              )}
            </button>
          </form>
          <p className={`text-[10px] text-gray-500 uppercase tracking-widest mt-4 font-bold ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Example Format:', 'উদাহরণ:')} <span className="font-mono text-gray-400">PC-A3F8C2D1</span>
          </p>
        </div>

        {/* Not found */}
        {notFound && (
          <div className="bg-[#191715] border border-[#333] p-12 text-center text-gray-500">
            <Search size={48} className="mx-auto mb-6 text-gray-600" strokeWidth={1} />
            <p className={`font-bold text-white uppercase tracking-widest text-sm mb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
              {t('Order not found', 'অর্ডার পাওয়া যায়নি')}
            </p>
            <p className={`text-xs text-gray-500 font-light tracking-wide ${isBn ? 'font-bangla-serif' : 'font-bangla-serif'}`}>
              {t('Check the order number from your confirmation receipt.', 'কনফার্মেশন পেজ থেকে রসিদ নম্বরটি চেক করুন।')}
            </p>
          </div>
        )}

        {/* Order result */}
        {order && (
          <div className="space-y-8">
            
            {/* Status card */}
            <div className="bg-[#191715] border border-[#333] p-6 md:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <p className={`text-[10px] text-gray-500 uppercase tracking-widest mb-1 ${isBn ? 'font-bangla-sans' : ''}`}>
                    {t('Receipt Number', 'রসিদ নম্বর')}
                  </p>
                  <p className="font-bold text-white text-xl md:text-2xl font-mono tracking-widest">
                    #{order.order_number}
                  </p>
                  <p className={`text-[9px] text-gray-500 font-mono tracking-widest mt-2 ${isBn ? 'font-bangla-sans' : ''}`}>
                    {new Date(order.created_at).toLocaleDateString(
                      isBn ? 'bn-BD' : 'en-US',
                      { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                    )}
                  </p>
                </div>
                <div className="flex flex-col sm:items-end">
                  <span className={`inline-flex items-center gap-2 border px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${statusMeta.color} ${isBn ? 'font-bangla-sans' : ''}`}>
                    <Clock size={14} />
                    <span>{isBn ? statusMeta.bn : statusMeta.en}</span>
                  </span>
                </div>
              </div>

              {/* Progress */}
              <StatusProgress status={order.status} isBn={isBn} />
            </div>

            {/* Delivery + Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              <div className="bg-[#191715] border border-[#333] p-6">
                <p className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-[#333] pb-3 ${isBn ? 'font-bangla-sans' : ''}`}>
                  <MapPin size={14} className="text-[#1F8B4D]" /> {t('Delivery Destination', 'ডেলিভারি ঠিকানা')}
                </p>
                <div className={`text-xs text-gray-400 space-y-1 font-light leading-relaxed ${isBn ? 'font-bangla-sans' : ''}`}>
                  <p className="font-bold text-white uppercase tracking-wide">{order.customer_name}</p>
                  <p className="text-gray-500 flex items-center gap-2 font-mono py-1"><Phone size={12} /> {order.customer_phone}</p>
                  <p>{order.customer_address}</p>
                  {order.customer_city && <p>{order.customer_city}</p>}
                </div>
              </div>

              <div className="bg-[#191715] border border-[#333] p-6">
                <p className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-[#333] pb-3 ${isBn ? 'font-bangla-sans' : ''}`}>
                  {t('Payment Summary', 'পেমেন্ট সারসংক্ষেপ')}
                </p>
                <div className={`text-[10px] font-bold uppercase tracking-widest space-y-3 ${isBn ? 'font-bangla-sans' : ''}`}>
                  <div className="flex justify-between text-gray-500">
                    <span>{t('Method', 'পদ্ধতি')}</span>
                    <span className="text-white">{t('Cash on Delivery', 'ক্যাশ অন ডেলিভারি')}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{t('Subtotal', 'মোট')}</span>
                    <span className="font-mono">{fmt(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>{t('Delivery', 'ডেলিভারি')}</span>
                    <span className="font-mono">{fmt(order.delivery_charge)}</span>
                  </div>
                  <div className="flex justify-between text-white text-sm pt-3 mt-3 border-t border-[#333]">
                    <span>{t('Total', 'সর্বমোট')}</span>
                    <span className="text-[#1F8B4D] font-mono">{fmt(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="bg-[#191715] border border-[#333]">
              <div className="px-6 py-5 border-b border-[#333] flex items-center gap-3">
                <Package size={16} className="text-[#1F8B4D]" />
                <h3 className={`font-bold text-white uppercase tracking-widest text-xs ${isBn ? 'font-bangla-sans' : ''}`}>
                  {t('Manifest', 'অর্ডারকৃত পণ্য')} <span className="text-gray-500 font-mono">({isBn ? toBn(items.length) : items.length})</span>
                </h3>
              </div>
              <div className="divide-y divide-[#333]">
                {items.map(item => (
                  <div key={item.id} className="px-6 py-4 flex items-center justify-between gap-6">
                    <div className="flex-1">
                      <p className={`text-xs font-bold text-white uppercase tracking-wide mb-1 ${isBn ? 'font-bangla-sans' : ''}`}>
                        {t(item.product_name, item.product_name_bn)}
                      </p>
                      <p className={`text-[10px] text-gray-500 uppercase tracking-widest ${isBn ? 'font-bangla-sans' : 'font-mono'}`}>
                        {isBn ? toBn(item.size_grams) + ' গ্রাম' : item.size_grams + 'g'} × {isBn ? toBn(item.quantity) : item.quantity}
                      </p>
                    </div>
                    <p className={`text-xs font-bold text-white ${isBn ? 'font-bangla-sans' : 'font-mono'}`}>
                      {fmt(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Links */}
            <div className={`flex flex-col sm:flex-row justify-center gap-4 pt-4 ${isBn ? 'font-bangla-sans' : ''}`}>
              <Link to="/my-orders" className="bg-transparent text-white font-bold py-4 px-8 transition-all border border-[#333] hover:border-white uppercase tracking-widest text-[10px] text-center">
                {t('View All Records', 'সব অর্ডার দেখুন')}
              </Link>
              <Link to="/products" className="bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-4 px-8 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-[10px] text-center">
                {t('Continue Shopping', 'কেনাকাটা চালিয়ে যান')}
              </Link>
            </div>
            
          </div>
        )}
      </div>
    </main>
  )
}