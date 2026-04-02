import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../lib/lang'
import { toBn } from '../../lib/bangla'
import { CheckCircle, Package, Phone, MapPin, Clock } from 'lucide-react'

const STATUS_LABELS = {
  pending:    { en: 'Pending',    bn: 'অপেক্ষায়',    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  confirmed:  { en: 'Confirmed',  bn: 'নিশ্চিত',      color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  processing: { en: 'Processing', bn: 'প্রক্রিয়াধীন', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  shipped:    { en: 'Shipped',    bn: 'পাঠানো হয়েছে', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  delivered:  { en: 'Delivered',  bn: 'পৌঁছে গেছে',  color: 'bg-[#1F8B4D]/10 text-[#1F8B4D] border-[#1F8B4D]/30' },
  cancelled:  { en: 'Cancelled',  bn: 'বাতিল',        color: 'bg-[#C62020]/10 text-[#C62020] border-[#C62020]/30' },
}

export default function OrderConfirmation() {
  const { orderNumber } = useParams()
  const { isBn, t } = useLang()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  // Premium integer formatting
  const fmt = (n) => (isBn ? '৳ ' + toBn(parseFloat(n).toFixed(0)) : 'Tk ' + parseFloat(n).toFixed(0))

  useEffect(() => {
    const fetch = async () => {
      const { data: o } = await supabase.from('orders').select('*').eq('order_number', orderNumber).single()
      if (o) {
        setOrder(o)
        const { data: i } = await supabase.from('order_items').select('*').eq('order_id', o.id)
        setItems(i ?? [])
      }
      setLoading(false)
    }
    fetch()
  }, [orderNumber])

  if (loading) return (
    <div className="bg-black min-h-screen border-t border-[#333] flex items-center justify-center py-32">
      <svg className="animate-spin h-8 w-8 text-[#1F8B4D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  )

  if (!order) return (
    <div className="bg-black min-h-screen border-t border-[#333] flex items-center justify-center p-6">
      <div className="max-w-md w-full border border-[#333] bg-[#191715] p-12 text-center">
        <p className={`font-bold text-white uppercase tracking-widest text-sm mb-6 ${isBn ? 'font-bangla-sans' : ''}`}>
          {t('Order not found.', 'অর্ডার পাওয়া যায়নি।')}
        </p>
        <Link to="/" className={`inline-block bg-transparent text-white font-bold py-3 px-8 transition-all border border-[#333] hover:border-[#1F8B4D] uppercase tracking-widest text-[10px] ${isBn ? 'font-bangla-sans' : ''}`}>
          {t('Return Home', 'হোমে ফিরে যান')}
        </Link>
      </div>
    </div>
  )

  const statusInfo = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending

  return (
    <main className="bg-black min-h-screen py-16 border-t border-[#333]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Success header */}
        <div className="text-center mb-12">
          <CheckCircle size={56} className="mx-auto text-[#1F8B4D] mb-6" strokeWidth={1.5} />
          <h1 className={`text-4xl font-bold text-white uppercase tracking-wide mb-4 ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
            {t('Order Confirmed', 'অর্ডার সফল!')}
          </h1>
          <p className={`text-sm text-gray-400 font-light tracking-wide ${isBn ? 'font-bangla-serif' : 'font-bangla-serif'}`}>
            {t('Thank you for your purchase. We will contact you shortly.', 'আপনার অর্ডারের জন্য ধন্যবাদ। আমরা শীঘ্রই যোগাযোগ করব।')}
          </p>
        </div>

        {/* Order number + status */}
        <div className="bg-[#191715] border border-[#333] p-6 md:p-8 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333] pb-6 mb-6">
            <div>
              <p className={`text-[10px] text-gray-500 uppercase tracking-widest mb-1 ${isBn ? 'font-bangla-sans' : ''}`}>
                {t('Receipt Number', 'রসিদ নম্বর')}
              </p>
              <p className="font-bold text-white text-xl md:text-2xl font-mono tracking-widest">
                #{order.order_number}
              </p>
            </div>
            <div className="flex flex-col sm:items-end">
              <span className={`inline-flex items-center gap-2 border px-4 py-2 text-[10px] font-bold uppercase tracking-widest ${statusInfo.color} ${isBn ? 'font-bangla-sans' : ''}`}>
                <Clock size={14} />
                <span>{isBn ? statusInfo.bn : statusInfo.en}</span>
              </span>
            </div>
          </div>
          <p className={`text-[10px] text-gray-500 uppercase tracking-widest font-mono ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Issued on:', 'অর্ডারের সময়:')} {new Date(order.created_at).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Delivery info */}
          <div className="bg-[#191715] border border-[#333] p-6 md:p-8">
            <h3 className={`font-bold text-white mb-6 flex items-center gap-3 border-b border-[#333] pb-4 uppercase tracking-widest ${isBn ? 'font-bangla-sans text-xs' : 'font-bangla-sans text-xs'}`}>
              <MapPin size={16} className="text-[#1F8B4D]" />
              {t('Delivery Destination', 'ডেলিভারি ঠিকানা')}
            </h3>
            <div className={`space-y-2 text-xs text-gray-400 leading-relaxed font-light ${isBn ? 'font-bangla-sans' : ''}`}>
              <p className="font-bold text-white uppercase tracking-wide">{order.customer_name}</p>
              <p className="flex items-center gap-2 text-gray-500 font-mono py-1">
                <Phone size={14} /> {order.customer_phone}
              </p>
              <p>{order.customer_address}</p>
              {order.customer_city && <p>{order.customer_city}</p>}
              {order.delivery_note && (
                <p className="italic text-gray-500 mt-4 border-l-2 border-[#333] pl-3">
                  "{order.delivery_note}"
                </p>
              )}
            </div>
          </div>

          {/* Payment */}
          <div className="bg-[#191715] border border-[#333] p-6 md:p-8">
            <h3 className={`font-bold text-white mb-6 border-b border-[#333] pb-4 uppercase tracking-widest ${isBn ? 'font-bangla-sans text-xs' : 'font-bangla-sans text-xs'}`}>
              {t('Payment Summary', 'পেমেন্ট সারসংক্ষেপ')}
            </h3>
            <div className={`space-y-3 text-[10px] font-bold uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
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
              <div className="flex justify-between text-white text-sm pt-4 mt-4 border-t border-[#333]">
                <span>{t('Total', 'সর্বমোট')}</span>
                <span className="text-[#1F8B4D] font-mono">{fmt(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-[#191715] border border-[#333] mb-12">
          <div className="px-6 py-5 border-b border-[#333] flex items-center gap-3">
            <Package size={16} className="text-[#1F8B4D]" />
            <h3 className={`font-bold text-white uppercase tracking-widest text-xs ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
              {t('Manifest', 'অর্ডারকৃত পণ্য')} <span className="text-gray-500 font-mono">({isBn ? toBn(items.length) : items.length})</span>
            </h3>
          </div>
          <div className="divide-y divide-[#333]">
            {items.map(item => (
              <div key={item.id} className="px-6 py-5 flex items-center justify-between gap-6">
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

        {/* CTA */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Link to="/my-orders" className={`bg-transparent text-white font-bold py-4 px-8 transition-all border border-[#333] hover:border-white uppercase tracking-widest text-[10px] text-center ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('View History', 'আমার সব অর্ডার')}
          </Link>
          <Link to="/products" className={`bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-4 px-8 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-[10px] text-center ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Continue Shopping', 'কেনাকাটা চালিয়ে যান')}
          </Link>
        </div>

        {/* Track hint */}
        <div className="text-center p-6 border border-[#333] bg-[#111]">
          <p className={`text-[10px] text-gray-500 uppercase tracking-widest font-bold ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Save your receipt number to track anytime:', 'অর্ডার নম্বরটি সেভ করুন:')}
            <br className="sm:hidden" />
            {' '}<span className="text-white font-mono mt-2 sm:mt-0 inline-block">#{order.order_number}</span>
          </p>
        </div>

      </div>
    </main>
  )
}