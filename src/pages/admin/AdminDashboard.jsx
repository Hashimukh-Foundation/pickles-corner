import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Package, BookOpen, Star, TrendingUp, AlertTriangle, ShoppingCart, DollarSign, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

const STATUS_META = {
  pending:    { label: 'Pending',    color: 'bg-yellow-100 text-yellow-700' },
  confirmed:  { label: 'Confirmed',  color: 'bg-blue-100 text-blue-700' },
  processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-700' },
  shipped:    { label: 'Shipped',    color: 'bg-purple-100 text-purple-700' },
  delivered:  { label: 'Delivered',  color: 'bg-green-100 text-green-700' },
  cancelled:  { label: 'Cancelled',  color: 'bg-red-100 text-red-700' },
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, blogs: 0, pendingReviews: 0, lowStock: 0, newOrders: 0, totalRevenue: 0 })
  const [lowStockItems, setLowStockItems] = useState([])
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    const fetchAll = async () => {
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
    }
    fetchAll()
  }, [])

  const cards = [
    { label: 'New Orders Today',  value: stats.newOrders,       icon: ShoppingCart,   color: 'bg-brand-50 text-brand-600',  to: '/admin/orders' },
    { label: 'Revenue (Delivered)',value: '৳' + stats.totalRevenue.toFixed(0), icon: DollarSign, color: 'bg-green-50 text-green-600', to: '/admin/orders' },
    { label: 'Total Products',    value: stats.products,        icon: Package,        color: 'bg-blue-50 text-blue-600',    to: '/admin/products' },
    { label: 'Pending Reviews',   value: stats.pendingReviews,  icon: Star,           color: 'bg-yellow-50 text-yellow-600', to: '/admin/reviews' },
  ]

  return (
    <div className="p-8">
      <div className="mb-7">
        <h1 className="font-display text-2xl font-bold text-navy-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's your store overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, to }) => (
          <Link key={label} to={to} className="card p-5 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={18} />
            </div>
            <p className="text-2xl font-bold text-navy-900">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="px-5 py-4 border-b border-brand-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-brand-500" />
              <h2 className="font-semibold text-sm text-navy-900">Recent Orders</h2>
            </div>
            <Link to="/admin/orders" className="text-xs text-brand-600 hover:text-brand-700 font-semibold">View all →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400 text-sm">No orders yet.</div>
          ) : (
            <div className="divide-y divide-brand-50">
              {recentOrders.map(order => {
                const meta = STATUS_META[order.status] ?? STATUS_META.pending
                return (
                  <div key={order.id} className="px-5 py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-bold text-navy-900 font-mono text-xs">{order.order_number}</p>
                      <p className="text-gray-500 text-xs">{order.customer_name} · {order.customer_phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-brand-700">৳{parseFloat(order.total_amount).toFixed(2)}</p>
                      <span className={`badge text-xs ${meta.color}`}>{meta.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Low Stock */}
        <div className="card">
          <div className="px-5 py-4 border-b border-brand-100 flex items-center gap-2">
            <AlertTriangle size={16} className={stats.lowStock > 0 ? 'text-red-500' : 'text-green-500'} />
            <h2 className="font-semibold text-sm text-navy-900">
              {stats.lowStock > 0 ? `Low Stock Alerts (≤10 units)` : 'Stock Levels'}
            </h2>
          </div>
          {lowStockItems.length > 0 ? (
            <div className="divide-y divide-brand-50">
              {lowStockItems.map(item => (
                <div key={item.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span className="font-medium">{item.products?.name}</span>
                  <span className="text-gray-500">{item.size_grams}g</span>
                  <span className={`badge ${item.stock_quantity === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {item.stock_quantity} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-gray-400">
              <TrendingUp size={28} className="mx-auto mb-2 text-green-400" />
              <p className="text-sm font-medium">All stock levels are healthy!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
