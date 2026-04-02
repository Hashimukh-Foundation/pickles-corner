import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

// Store pages
import Home from './pages/store/Home'
import ProductsPage from './pages/store/ProductsPage'
import ProductDetail from './pages/store/ProductDetail'
import BlogsPage from './pages/store/BlogsPage'
import BlogDetail from './pages/store/BlogDetail'
import Checkout from './pages/store/Checkout'
import OrderConfirmation from './pages/store/OrderConfirmation'
import MyOrders from './pages/store/MyOrders'
import TrackOrder from './pages/store/TrackOrder'

// Admin pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminBlogs from './pages/admin/AdminBlogs'
import AdminReviews from './pages/admin/AdminReviews'
import AdminOrders from './pages/admin/AdminOrders'

// Layout
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import AdminLayout from './components/admin/AdminLayout'

function ProtectedRoute({ session, children }) {
  if (!session) return <Navigate to="/admin/login" replace />
  return children
}

const StoreLayout = ({ children }) => <><Navbar />{children}<Footer /></>

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <Routes>
      {/* ── Store ──────────────────────────────────────── */}
      <Route path="/" element={<StoreLayout><Home /></StoreLayout>} />
      <Route path="/products" element={<StoreLayout><ProductsPage /></StoreLayout>} />
      <Route path="/products/:id" element={<StoreLayout><ProductDetail /></StoreLayout>} />
      <Route path="/blogs" element={<StoreLayout><BlogsPage /></StoreLayout>} />
      <Route path="/blogs/:slug" element={<StoreLayout><BlogDetail /></StoreLayout>} />
      <Route path="/checkout" element={<StoreLayout><Checkout /></StoreLayout>} />
      <Route path="/order-confirmation/:orderNumber" element={<StoreLayout><OrderConfirmation /></StoreLayout>} />
      <Route path="/my-orders" element={<StoreLayout><MyOrders /></StoreLayout>} />
      <Route path="/track-order" element={<StoreLayout><TrackOrder /></StoreLayout>} />

      {/* ── Admin ──────────────────────────────────────── */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={
        <ProtectedRoute session={session}>
          <AdminLayout session={session} />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="blogs" element={<AdminBlogs />} />
        <Route path="reviews" element={<AdminReviews />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
