import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { ChevronDown, ChevronUp, Search, Package, Phone, MapPin, Clock, Pencil, X } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']

const STATUS_META = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-700 border-blue-200' },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  shipped:    { label: 'Shipped',    color: 'bg-purple-100 text-purple-700 border-purple-200' },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700 border-red-200' },
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status] ?? STATUS_META.pending
  return (
    <span className={`badge border text-xs px-2.5 py-1 ${meta.color}`}>{meta.label}</span>
  )
}

function StatusSelect({ value, onChange, loading }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={loading}
      className="input text-sm py-1.5 cursor-pointer"
      onClick={e => e.stopPropagation()}
    >
      {STATUSES.map(s => (
        <option key={s} value={s}>{STATUS_META[s].label}</option>
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
    // Warn before cancelling — stock will be restored
    if (newStatus === 'cancelled' && order.status !== 'cancelled') {
      const confirmed = window.confirm(
        `Cancel order ${order.order_number}?\n\nThis will automatically restore stock for all items in this order.`
      )
      if (!confirmed) return
    }

    setUpdatingStatus(true)
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', order.id)
    if (error) {
      toast.error(error.message)
    } else {
      if (newStatus === 'cancelled') {
        toast.success('Order cancelled — stock has been restored', { icon: '↩️' })
      } else if (newStatus === 'delivered') {
        toast.success('Marked as delivered', { icon: '✅' })
      } else {
        toast.success('Status updated')
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

  const fmt = (n) => '৳' + parseFloat(n).toFixed(2)

  return (
    <div className="card mb-3 overflow-hidden">
      {/* Row summary */}
      <div
        className="flex flex-wrap items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-gray-50/60 transition-colors"
        onClick={handleExpand}
      >
        <div className="flex-shrink-0">
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>

        <div className="min-w-0">
          <span className="font-bold text-navy-900 font-mono text-sm">{order.order_number}</span>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-navy-900 text-sm truncate">{order.customer_name}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1"><Phone size={10} />{order.customer_phone}</p>
        </div>

        <div className="hidden sm:block text-xs text-gray-400 min-w-[120px]">
          {new Date(order.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </div>

        <div className="font-bold text-brand-700 text-sm min-w-[80px] text-right">
          {fmt(order.total_amount)}
        </div>

        <div onClick={e => e.stopPropagation()} className="min-w-[130px]">
          <StatusSelect value={order.status} onChange={handleStatusChange} loading={updatingStatus} />
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/40">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {/* Delivery */}
            <div className="sm:col-span-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <MapPin size={11} /> Delivery Details
              </p>
              <p className="text-sm text-gray-700">{order.customer_address}</p>
              {order.customer_city && <p className="text-sm text-gray-500">{order.customer_city}</p>}
              {order.delivery_note && (
                <p className="text-xs text-gray-400 italic mt-1">Note: "{order.delivery_note}"</p>
              )}
            </div>

            {/* Totals */}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Summary</p>
              <div className="text-sm space-y-0.5">
                <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Delivery</span><span>{fmt(order.delivery_charge)}</span></div>
                <div className="flex justify-between font-bold text-navy-900 border-t border-gray-200 pt-0.5 mt-0.5"><span>Total</span><span>{fmt(order.total_amount)}</span></div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Payment</span>
                  <span className="capitalize">{order.payment_method} · {order.payment_status}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order items */}
          <div className="mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
              <Package size={11} /> Items
            </p>
            {loadingItems ? (
              <p className="text-xs text-gray-400">Loading…</p>
            ) : (
              <div className="space-y-1.5">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center text-sm bg-white rounded-lg px-3 py-2 border border-gray-100">
                    <span className="text-gray-700 font-medium">{item.product_name}</span>
                    <span className="text-gray-400 text-xs">{item.size_grams}g × {item.quantity}</span>
                    <span className="font-semibold text-brand-700">{fmt(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin note */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Admin Note</p>
              <button onClick={() => setEditNote(v => !v)} className="text-gray-400 hover:text-brand-600 transition">
                {editNote ? <X size={12} /> : <Pencil size={12} />}
              </button>
            </div>
            {editNote ? (
              <div className="flex gap-2">
                <input
                  className="input text-sm flex-1"
                  placeholder="Add a private note…"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
                <button onClick={saveNote} className="btn-primary py-1.5 px-3 text-xs">Save</button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">
                {order.admin_note || <span className="text-gray-300">No note</span>}
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

  // Count per status
  const counts = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1
    return acc
  }, {})

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} total orders</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 overflow-x-auto">
        {['all', ...STATUSES].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
              filter === s
                ? 'bg-white shadow text-navy-900'
                : 'text-gray-500 hover:text-navy-900'
            }`}
          >
            {s === 'all' ? 'All' : STATUS_META[s].label}
            {s !== 'all' && counts[s] ? (
              <span className="ml-1.5 text-[10px] bg-gray-200 rounded-full px-1.5 py-0.5">
                {counts[s]}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search by name, phone, order #…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Orders */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-400 text-sm">
          <Clock size={32} className="mx-auto mb-2 text-gray-200" />
          No orders found.
        </div>
      ) : (
        <div>
          {filtered.map(order => (
            <OrderRow key={order.id} order={order} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  )
}
