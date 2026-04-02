import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { ChevronDown, ChevronUp, Search, Package, Phone, MapPin, Clock, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_META = {
  pending:    { label: 'Pending',    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  processing: { label: 'Processing', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  shipped:    { label: 'Shipped',    color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  delivered:  { label: 'Delivered',  color: 'bg-[#1F8B4D]/10 text-[#1F8B4D] border-[#1F8B4D]/30' },
  cancelled:  { label: 'Cancelled',  color: 'bg-[#C62020]/10 text-[#C62020] border-[#C62020]/30' },
}

function StatusSelect({ value, onChange, loading }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={loading}
      className={`bg-black border text-[9px] font-bold uppercase tracking-widest px-2 py-1.5 focus:outline-none transition-colors cursor-pointer disabled:opacity-50
        ${STATUS_META[value]?.color || 'text-white border-[#333]'}`}
      onClick={e => e.stopPropagation()}
    >
      {STATUSES.map(s => (
        <option key={s} value={s} className="bg-black text-white">{STATUS_META[s].label}</option>
      ))}
    </select>
  )
}

function OrderRow({ order, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const [items, setItems] = useState([])
  const [loadingItems, setLoadingItems] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [editNote, setEditNote] = useState(false)
  const [note, setNote] = useState(order.admin_note || '')

  const loadItems = async () => {
    if (items.length) return
    setLoadingItems(true)
    const { data } = await supabase.from('order_items').select('*').eq('order_id', order.id)
    setItems(data ?? [])
    setLoadingItems(false)
  }

  const handleExpand = () => {
    setExpanded(v => !v)
    if (!expanded) loadItems()
  }

  const handleStatusChange = async (newStatus) => {
    if (newStatus === 'cancelled' && order.status !== 'cancelled') {
      const confirmed = window.confirm(
        `Are you sure you want to cancel order #${order.order_number}?\n\nThis will automatically restore stock for all items in this order.`
      )
      if (!confirmed) return
    }

    setUpdatingStatus(true)
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id)
    if (error) {
      toast.error(error.message)
    } else {
      if (newStatus === 'cancelled') {
        toast.success('Order cancelled. Stock restored.', { icon: '↩️' })
      } else if (newStatus === 'delivered') {
        toast.success('Marked as delivered.', { icon: '✅' })
      } else {
        toast.success('Status updated.')
      }
      onStatusChange(order.id, newStatus)
    }
    setUpdatingStatus(false)
  }

  const saveNote = async () => {
    const { error } = await supabase.from('orders').update({ admin_note: note || null }).eq('id', order.id)
    if (error) toast.error(error.message)
    else { toast.success('Note saved'); setEditNote(false) }
  }

  const fmt = (n) => '৳' + parseFloat(n).toFixed(0)

  return (
    <div className="bg-[#111] border border-[#333] mb-4 overflow-hidden transition-colors duration-300">
      
      {/* Row summary */}
      <div
        className="flex flex-wrap md:flex-nowrap items-center gap-4 px-6 py-4 cursor-pointer hover:bg-[#191715] transition-colors"
        onClick={handleExpand}
      >
        <div className="flex-shrink-0 text-gray-500">
          {expanded ? <ChevronUp size={16} strokeWidth={2.5} /> : <ChevronDown size={16} strokeWidth={2.5} />}
        </div>

        <div className="w-24 flex-shrink-0">
          <span className="font-bold text-white font-mono text-sm tracking-wider">#{order.order_number}</span>
        </div>

        <div className="flex-1 min-w-[200px]">
          <p className="font-bold text-white uppercase tracking-wide text-xs truncate font-bangla-sans">{order.customer_name}</p>
          <p className="text-[10px] text-gray-500 flex items-center gap-1.5 mt-1 font-mono uppercase tracking-widest"><Phone size={10} />{order.customer_phone}</p>
        </div>

        <div className="hidden md:block text-[9px] text-gray-500 font-mono uppercase tracking-widest w-32 flex-shrink-0 text-center">
          {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
          <br />
          {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>

        <div className="font-bold text-[#1F8B4D] font-mono text-sm w-20 flex-shrink-0 text-right">
          {fmt(order.total_amount)}
        </div>

        <div onClick={e => e.stopPropagation()} className="w-32 flex-shrink-0 ml-auto md:ml-0 flex justify-end">
          <StatusSelect value={order.status} onChange={handleStatusChange} loading={updatingStatus} />
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-[#333] bg-black px-6 py-6 space-y-6">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Delivery Details */}
            <div className="lg:col-span-2 bg-[#111] border border-[#333] p-5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2 border-b border-[#333] pb-2">
                <MapPin size={12} className="text-[#1F8B4D]" /> Delivery Destination
              </p>
              <p className="text-xs text-white font-bangla-sans leading-relaxed">{order.customer_address}</p>
              {order.customer_city && <p className="text-[10px] text-gray-400 font-mono mt-1 uppercase tracking-widest">{order.customer_city}</p>}
              {order.delivery_note && (
                <p className="text-[10px] text-gray-500 italic mt-3 border-l-2 border-[#333] pl-2 font-bangla-serif">
                  Note: "{order.delivery_note}"
                </p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="bg-[#111] border border-[#333] p-5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-[#333] pb-2">
                Financial Summary
              </p>
              <div className="text-[10px] uppercase tracking-widest font-bold space-y-2">
                <div className="flex justify-between text-gray-500"><span>Subtotal</span><span className="font-mono">{fmt(order.subtotal)}</span></div>
                <div className="flex justify-between text-gray-500"><span>Delivery</span><span className="font-mono">{fmt(order.delivery_charge)}</span></div>
                <div className="flex justify-between text-white border-t border-[#333] pt-2 mt-2"><span>Total</span><span className="text-[#1F8B4D] font-mono">{fmt(order.total_amount)}</span></div>
                <div className="flex justify-between text-[9px] text-gray-600 mt-3 pt-2">
                  <span>Payment Method</span>
                  <span className="font-mono text-[#C62020]">{order.payment_method} / {order.payment_status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-[#111] border border-[#333]">
            <div className="px-5 py-3 border-b border-[#333] flex items-center gap-2 bg-black">
              <Package size={14} className="text-[#1F8B4D]" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Manifest
              </p>
            </div>
            
            {loadingItems ? (
              <div className="px-5 py-6 flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                <svg className="animate-spin h-3 w-3 text-[#1F8B4D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Retrieving items...
              </div>
            ) : (
              <div className="divide-y divide-[#333]">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-xs px-5 py-3 hover:bg-[#191715] transition-colors">
                    <div className="flex-1 min-w-0 pr-4">
                      <span className="text-white font-bold uppercase tracking-wide truncate block font-bangla-sans">{item.product_name}</span>
                    </div>
                    <span className="text-gray-500 text-[10px] font-mono uppercase tracking-widest flex-shrink-0 w-24 text-right">{item.size_grams}g × {item.quantity}</span>
                    <span className="font-bold text-[#1F8B4D] font-mono flex-shrink-0 w-20 text-right">{fmt(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin Note */}
          <div className="bg-[#191715] border border-[#333] p-5">
            <div className="flex items-center gap-3 mb-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Internal Operator Note</p>
              <button 
                onClick={() => setEditNote(v => !v)} 
                className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest transition-colors px-2 py-0.5 border ${editNote ? 'bg-[#C62020]/10 text-[#C62020] border-[#C62020]/30 hover:bg-[#C62020]/20' : 'bg-[#1F8B4D]/10 text-[#1F8B4D] border-[#1F8B4D]/30 hover:bg-[#1F8B4D]/20'}`}
              >
                {editNote ? <><X size={10} /> Cancel</> : <><Pencil size={10} /> Edit</>}
              </button>
            </div>
            
            {editNote ? (
              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                <input
                  className="w-full bg-black border border-[#333] text-white px-3 py-2 text-xs focus:outline-none focus:border-[#1F8B4D] transition-colors font-mono placeholder-gray-600"
                  placeholder="Enter private operator note..."
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
                <button 
                  onClick={saveNote} 
                  className="bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold px-6 py-2 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-[9px] whitespace-nowrap"
                >
                  Save Note
                </button>
              </div>
            ) : (
              <p className={`text-xs mt-1 ${order.admin_note ? 'text-gray-300 font-mono' : 'text-gray-600 italic uppercase tracking-widest font-bold text-[9px]'}`}>
                {order.admin_note || 'No notes attached to this record.'}
              </p>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (filter !== 'all') q = q.eq('status', filter)
    const { data } = await q
    setOrders(data ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
  }

  const filtered = orders.filter(o => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      o.order_number.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      o.customer_phone.includes(q)
    )
  })

  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-4 md:p-8">
      
      {/* Header */}
      <div className="mb-8 border-b border-[#333] pb-6">
        <h1 className="font-bangla-sans text-2xl md:text-3xl font-bold text-white uppercase tracking-wide">
          Order Management
        </h1>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-mono">
          {orders.length} {orders.length === 1 ? 'Record Found' : 'Records Found'}
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        
        {/* Status Filter Tabs */}
        <div className="flex bg-[#111] border border-[#333] w-fit overflow-x-auto overflow-y-hidden scrollbar-hide">
          {['all', ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`flex items-center gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap border-r border-[#333] last:border-r-0 ${
                filter === s
                  ? 'bg-[#1F8B4D] text-white'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {s === 'all' ? 'All Records' : STATUS_META[s].label}
              {s !== 'all' && counts[s] ? (
                <span className={`px-1.5 py-0.5 font-mono text-[9px] ${filter === s ? 'bg-black/30' : 'bg-[#333]'}`}>
                  {counts[s]}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72 flex-shrink-0">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            className="w-full bg-[#111] border border-[#333] text-white pl-10 pr-4 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-[#1F8B4D] transition-colors placeholder-gray-600"
            placeholder="Search ID, Name, Phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-32">
          <svg className="animate-spin h-8 w-8 text-[#1F8B4D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-[#191715] border border-[#333] p-16 text-center">
          <Clock size={32} className="mx-auto text-gray-600 mb-4" strokeWidth={1} />
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            No matching records found.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(order => (
            <OrderRow key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}