import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Package, BookOpen, Star, TrendingUp, AlertTriangle, ShoppingCart, DollarSign, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const STATUS_META = {
  pending:    { label: 'Pending',    color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
  processing: { label: 'Processing', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  shipped:    { label: 'Shipped',    color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  delivered:  { label: 'Delivered',  color: 'bg-[#1F8B4D]/10 text-[#1F8B4D] border-[#1F8B4D]/30' },
  cancelled:  { label: 'Cancelled',  color: 'bg-[#C62020]/10 text-[#C62020] border-[#C62020]/30' },
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, blogs: 0, pendingReviews: 0, lowStock: 0, newOrders: 0, totalRevenue: 0 })
  const [lowStockItems, setLowStockItems] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      const today = new Date(); today.setHours(0,0,0,0)

      const [p, b, r, ls, orders, revenue] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('blogs').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('product_sizes').select('id, size_grams, stock_quantity, product_id, products(name)').lte('stock_quantity', 10),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('orders').select('total_amount').eq('status', 'delivered'),
      ])

      const newOrdersCount = (orders.data ?? []).filter(o => new Date(o.created_at) >= today).length
      const totalRevenue = (revenue.data ?? []).reduce((sum, o) => sum + parseFloat(o.total_amount), 0)

      setStats({
        products: p.count ?? 0,
        blogs: b.count ?? 0,
        pendingReviews: r.count ?? 0,
        lowStock: ls.data?.length ?? 0,
        newOrders: newOrdersCount,
        totalRevenue,
      })
      setLowStockItems(ls.data ?? [])
      setRecentOrders(orders.data ?? [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const cards = [
    { label: 'Orders Today',  value: stats.newOrders,       icon: ShoppingCart,   color: 'text-[#1F8B4D]',  to: '/admin/orders' },
    { label: 'Net Revenue',   value: '৳' + stats.totalRevenue.toFixed(0), icon: DollarSign, color: 'text-white', to: '/admin/orders' },
    { label: 'Inventory Size',    value: stats.products,        icon: Package,        color: 'text-gray-400',    to: '/admin/products' },
    { label: 'Pending Reviews',   value: stats.pendingReviews,  icon: Star,           color: 'text-yellow-500', to: '/admin/reviews' },
  ]

  if (loading) return (
    <div className="flex justify-center py-32 bg-black min-h-screen">
      <svg className="animate-spin h-8 w-8 text-[#1F8B4D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
  )

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">
      
      {/* Header */}
      <div className="mb-8 border-b border-[#333] pb-6">
        <h1 className="font-bangla-sans text-2xl md:text-3xl font-bold text-white uppercase tracking-wide">
          Mission Control
        </h1>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-mono">
          System Overview & Metrics
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {cards.map(({ label, value, icon: Icon, color, to }) => (
          <Link key={label} to={to} className="bg-[#111] border border-[#333] p-6 hover:border-gray-500 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{label}</p>
              <Icon size={16} className={`${color} group-hover:scale-110 transition-transform`} strokeWidth={2} />
            </div>
            <p className="text-3xl font-bold text-white font-mono">{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Recent Orders */}
        <div className="bg-[#111] border border-[#333]">
          <div className="px-6 py-5 border-b border-[#333] flex items-center justify-between bg-black">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-[#1F8B4D]" />
              <h2 className="font-bold text-white uppercase tracking-widest text-xs">Recent Orders</h2>
            </div>
            <Link to="/admin/orders" className="text-[9px] text-gray-500 hover:text-white uppercase tracking-widest font-bold transition-colors">
              View All →
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="px-6 py-12 text-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
              No recent activity.
            </div>
          ) : (
            <div className="divide-y divide-[#333]">
              {recentOrders.map(order => {
                const meta = STATUS_META[order.status] ?? STATUS_META.pending
                return (
                  <div key={order.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#191715] transition-colors">
                    <div>
                      <p className="font-bold text-white font-mono text-sm tracking-wider mb-1">#{order.order_number}</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{order.customer_name} <span className="mx-1">|</span> {order.customer_phone}</p>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                      <p className="font-bold text-[#1F8B4D] font-mono">৳{parseFloat(order.total_amount).toFixed(0)}</p>
                      <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-widest ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-[#111] border border-[#333]">
          <div className="px-6 py-5 border-b border-[#333] flex items-center justify-between bg-black">
            <div className="flex items-center gap-3">
              <AlertTriangle size={16} className={stats.lowStock > 0 ? 'text-[#C62020]' : 'text-[#1F8B4D]'} />
              <h2 className="font-bold text-white uppercase tracking-widest text-xs">
                {stats.lowStock > 0 ? 'Critical Inventory (≤10)' : 'Inventory Status'}
              </h2>
            </div>
            <Link to="/admin/products" className="text-[9px] text-gray-500 hover:text-white uppercase tracking-widest font-bold transition-colors">
              Manage →
            </Link>
          </div>
          
          {lowStockItems.length > 0 ? (
            <div className="divide-y divide-[#333] max-h-[350px] overflow-y-auto">
              {lowStockItems.map(item => (
                <div key={item.id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#191715] transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white uppercase tracking-wide text-xs truncate mb-1">
                      {item.products?.name}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono">Variant: {item.size_grams}g</p>
                  </div>
                  <span className={`flex-shrink-0 px-2 py-1 border text-[10px] font-bold uppercase tracking-widest font-mono ${
                    item.stock_quantity === 0 
                      ? 'bg-[#C62020]/10 text-[#C62020] border-[#C62020]/30' 
                      : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                  }`}>
                    QTY: {item.stock_quantity}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-16 text-center text-gray-500">
              <TrendingUp size={32} className="mx-auto mb-4 text-[#1F8B4D] opacity-80" strokeWidth={1.5} />
              <p className="text-[10px] uppercase tracking-widest font-bold">All stock levels are optimal.</p>
            </div>
          )}
        </div>
        
      </div>
    </div>
  )
}