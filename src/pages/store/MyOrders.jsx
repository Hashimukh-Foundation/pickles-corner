import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useLang } from '../../lib/lang'
import { toBn } from '../../lib/bangla'
import { getCustomerInfo, clearCustomerInfo } from '../../lib/customer'
import {
  Phone, Package, MapPin, ChevronDown, ChevronUp,
  Clock, Search, LogOut, ShoppingBag, ArrowRight
} from 'lucide-react'

const STATUS_META = {
  pending:    { en: 'Pending',    bn: 'অপেক্ষায়',     color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  confirmed:  { en: 'Confirmed',  bn: 'নিশ্চিত',       color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  processing: { en: 'Processing', bn: 'প্রক্রিয়াধীন',  color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  shipped:    { en: 'Shipped',    bn: 'পাঠানো হয়েছে',  color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  delivered:  { en: 'Delivered',  bn: 'পৌঁছে গেছে',   color: 'bg-[#1F8B4D]/10 text-[#1F8B4D] border-[#1F8B4D]/30' },
  cancelled:  { en: 'Cancelled',  bn: 'বাতিল',         color: 'bg-[#C62020]/10 text-[#C62020] border-[#C62020]/30' },
}

// Order status progress steps
const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

function StatusBadge({ status, isBn }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 border text-[9px] font-bold uppercase tracking-widest ${meta.color} ${isBn ? 'font-bangla-sans' : ''}`}>
      {isBn ? meta.bn : meta.en}
    </span>
  )
}

function StatusProgress({ status, isBn }) {
  if (status === 'cancelled') return null
  const currentIdx = STATUS_STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-0 mt-4 mb-2">
      {STATUS_STEPS.map((step, i) => {
        const done = i <= currentIdx
        const meta = STATUS_META[step]
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={`w-6 h-6 border flex items-center justify-center text-[10px] font-bold transition-all
                ${done ? 'bg-[#1F8B4D]/20 text-[#1F8B4D] border-[#1F8B4D]' : 'bg-black text-gray-700 border-[#333]'}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[9px] mt-2 text-center uppercase tracking-widest leading-tight ${done ? 'text-[#1F8B4D] font-bold' : 'text-gray-600'} ${isBn ? 'font-bangla-sans' : ''}`}
                style={{ maxWidth: 52 }}>
                {isBn ? meta.bn : meta.en}
              </span>
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`flex-1 h-[1px] mx-2 mb-5 transition-colors ${i < currentIdx ? 'bg-[#1F8B4D]' : 'bg-[#333]'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function OrderCard({ order, defaultExpanded = false, isBn, t }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [items, setItems] = useState(order.order_items ?? [])
  const [loadingItems, setLoadingItems] = useState(false)

  const fmt = (n) => (isBn ? '৳ ' + toBn(parseFloat(n).toFixed(0)) : 'Tk ' + parseFloat(n).toFixed(0))

  const handleExpand = async () => {
    setExpanded(v => !v)
    if (!expanded && items.length === 0) {
      setLoadingItems(true)
      const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id)
      setItems(data ?? [])
      setLoadingItems(false)
    }
  }

  return (
    <div className="bg-[#191715] border border-[#333] transition-colors duration-300">
      {/* Order header — always visible */}
      <div
        className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer hover:bg-[#111] transition-colors"
        onClick={handleExpand}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <span className="font-bold text-white font-mono text-sm tracking-wider">#{order.order_number}</span>
            <StatusBadge status={order.status} isBn={isBn} />
          </div>
          <p className={`text-[10px] text-gray-500 uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
            {new Date(order.created_at).toLocaleDateString(
              isBn ? 'bn-BD' : 'en-US',
              { day: 'numeric', month: 'short', year: 'numeric' }
            )}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className={`font-bold text-[#1F8B4D] text-sm ${isBn ? 'font-bangla-sans' : 'font-mono'}`}>{fmt(order.total_amount)}</p>
          <p className={`text-[9px] text-gray-500 uppercase tracking-widest mt-0.5 ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('COD', 'ক্যাশ অন ডেলিভারি')}
          </p>
        </div>
        <div className="text-gray-500 flex-shrink-0">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[#333] bg-[#111] px-6 py-6 space-y-8">
          
          {/* Progress bar */}
          <StatusProgress status={order.status} isBn={isBn} />

          {/* Delivery address */}
          <div className="flex gap-3 text-sm bg-black border border-[#333] p-4">
            <MapPin size={16} className="text-[#1F8B4D] mt-0.5 flex-shrink-0" />
            <div className={isBn ? 'font-bangla-sans' : ''}>
              <p className="font-bold text-white uppercase tracking-wide text-xs">{order.customer_name}</p>
              <p className="text-gray-400 text-xs leading-relaxed mt-1 font-light">
                {order.customer_address}{order.customer_city ? `, ${order.customer_city}` : ''}
              </p>
              {order.delivery_note && (
                <p className="text-xs text-gray-500 italic mt-2 border-l-2 border-[#333] pl-2">
                  "{order.delivery_note}"
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <p className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2 ${isBn ? 'font-bangla-sans' : ''}`}>
              <Package size={14} /> {t('Order Items', 'অর্ডার করা পণ্য')}
            </p>
            
            {loadingItems ? (
              <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest">
                <svg className="animate-spin h-3 w-3 text-[#1F8B4D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                {t('Loading items...', 'লোড হচ্ছে...')}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-4 bg-black px-4 py-3 border border-[#333]">
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold text-white uppercase tracking-wide truncate ${isBn ? 'font-bangla-sans' : ''}`}>
                        {t(item.product_name, item.product_name_bn)}
                      </p>
                      <p className={`text-[10px] text-gray-500 uppercase tracking-widest mt-0.5 ${isBn ? 'font-bangla-sans' : 'font-mono'}`}>
                        {isBn ? toBn(item.size_grams) + ' গ্রাম' : item.size_grams + 'g'} × {isBn ? toBn(item.quantity) : item.quantity}
                      </p>
                    </div>
                    <p className={`text-xs font-bold text-white flex-shrink-0 ${isBn ? 'font-bangla-sans' : 'font-mono'}`}>
                      {fmt(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="border-t border-[#333] pt-4 space-y-2 text-[10px] font-bold uppercase tracking-widest">
            <div className={`flex justify-between text-gray-500 ${isBn ? 'font-bangla-sans' : ''}`}>
              <span>{t('Subtotal', 'পণ্যের মোট')}</span>
              <span className="font-mono">{fmt(order.subtotal)}</span>
            </div>
            <div className={`flex justify-between text-gray-500 ${isBn ? 'font-bangla-sans' : ''}`}>
              <span>{t('Delivery', 'ডেলিভারি')}</span>
              <span className="font-mono">{fmt(order.delivery_charge)}</span>
            </div>
            <div className={`flex justify-between text-white text-sm pt-3 mt-3 border-t border-[#333] ${isBn ? 'font-bangla-sans' : ''}`}>
              <span>{t('Total', 'সর্বমোট')}</span>
              <span className="text-[#1F8B4D] font-mono">{fmt(order.total_amount)}</span>
            </div>
          </div>

          {/* Track link */}
          <div className="pt-2 text-center">
            <Link
              to={`/order-confirmation/${order.order_number}`}
              className={`inline-flex items-center gap-2 text-[10px] text-gray-400 hover:text-white font-bold uppercase tracking-widest transition-colors ${isBn ? 'font-bangla-sans' : ''}`}
            >
              {t('View Detailed Receipt', 'রসিদ দেখুন')} <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MyOrders() {
  const { isBn, t } = useLang()
  const [phone, setPhone] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [savedCustomer, setSavedCustomer] = useState(null)

  useEffect(() => {
    const info = getCustomerInfo()
    if (info) {
      setSavedCustomer(info)
      setPhone(info.phone)
    }
  }, [])

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!phone.trim()) return
    setLoading(true)
    setSearched(false)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_phone', phone.trim())
      .order('created_at', { ascending: false })
    setOrders(data ?? [])
    setSearched(true)
    setLoading(false)
  }

  useEffect(() => {
    const info = getCustomerInfo()
    if (info?.phone) {
      setPhone(info.phone)
      supabase
        .from('orders')
        .select('*')
        .eq('customer_phone', info.phone)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          setOrders(data ?? [])
          setSearched(true)
        })
    }
  }, [])

  const handleClear = () => {
    clearCustomerInfo()
    setSavedCustomer(null)
    setPhone('')
    setOrders([])
    setSearched(false)
  }

  return (
    <main className="bg-black min-h-screen py-12 border-t border-[#333]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className={`text-3xl font-bold text-white uppercase tracking-wide mb-2 ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
            {t('Order History', 'আমার অর্ডার')}
          </h1>
          <p className={`text-xs text-gray-500 uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Enter your phone number to track past purchases', 'আপনার ফোন নম্বর দিয়ে সব অর্ডার দেখুন')}
          </p>
        </div>

        {/* Phone search */}
        <div className="bg-[#191715] border border-[#333] p-6 mb-10">
          {savedCustomer && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-black border border-[#333] px-5 py-4">
              <div>
                <p className={`text-xs font-bold text-white uppercase tracking-widest mb-1 ${isBn ? 'font-bangla-sans' : ''}`}>
                  {t('Welcome back', 'স্বাগতম')}, <span className="text-[#1F8B4D]">{savedCustomer.name}</span>
                </p>
                <p className={`text-[10px] text-gray-500 font-mono tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
                  {t('Showing records for:', 'রেকর্ড দেখাচ্ছে:')} {savedCustomer.phone}
                </p>
              </div>
              <button
                onClick={handleClear}
                className="flex items-center gap-2 text-[10px] text-gray-500 hover:text-[#C62020] uppercase tracking-widest font-bold transition-colors border border-transparent hover:border-[#C62020]/30 hover:bg-[#C62020]/10 px-3 py-2"
              >
                <LogOut size={14} />
                <span className={isBn ? 'font-bangla-sans' : ''}>{t('Not you?', 'আপনি নন?')}</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
              <input
                className="w-full bg-[#111] border border-[#333] text-white pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors font-mono tracking-widest"
                type="tel"
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading} 
              className="bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-3 px-8 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-[10px] flex-shrink-0 flex items-center justify-center gap-2 h-[46px]"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <><Search size={14} /><span className={isBn ? 'font-bangla-sans' : ''}>{t('Search', 'খুঁজুন')}</span></>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && (
          orders.length === 0 ? (
            <div className="bg-[#191715] border border-[#333] p-12 text-center">
              <ShoppingBag size={48} className="mx-auto mb-6 text-gray-600" strokeWidth={1} />
              <p className={`font-bold text-white uppercase tracking-widest text-sm mb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
                {t('No orders found', 'কোনো অর্ডার নেই')}
              </p>
              <p className={`text-xs text-gray-500 font-light tracking-wide mb-8 ${isBn ? 'font-bangla-serif' : 'font-bangla-serif'}`}>
                {t('Double-check the phone number used when ordering.', 'অর্ডারের সময় ব্যবহৃত নম্বরটি আবার দেখুন।')}
              </p>
              <Link to="/products" className={`inline-block bg-transparent text-white font-bold py-3 px-8 transition-all border border-[#333] hover:border-[#1F8B4D] uppercase tracking-widest text-[10px] ${isBn ? 'font-bangla-sans' : ''}`}>
                {t('Start Shopping', 'কেনাকাটা শুরু করুন')}
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <p className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-[#333] pb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
                {isBn
                  ? `${toBn(orders.length)} টি অর্ডার পাওয়া গেছে`
                  : `${orders.length} ORDER${orders.length !== 1 ? 'S' : ''} FOUND`}
              </p>
              {orders.map((order, i) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  defaultExpanded={i === 0}
                  isBn={isBn}
                  t={t}
                />
              ))}
            </div>
          )
        )}

        {/* Before search — helpful prompt */}
        {!searched && !savedCustomer && (
          <div className="text-center py-16 border border-[#333] bg-[#111]">
            <Clock size={40} className="mx-auto mb-4 text-[#1F8B4D] opacity-80" strokeWidth={1.5} />
            <p className={`text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
              {t('Awaiting Input', 'ইনপুটের অপেক্ষায়')}
            </p>
            <p className={`text-[10px] text-gray-600 uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
              {t('Use the same phone number provided during checkout.', 'চেকআউটের সময় দেওয়া ফোন নম্বরটি ব্যবহার করুন।')}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}