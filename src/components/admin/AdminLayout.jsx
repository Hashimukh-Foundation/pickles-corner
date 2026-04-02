import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { LayoutDashboard, Package, BookOpen, Star, LogOut, ShoppingCart, Menu, X } from 'lucide-react'
import toast from 'react-hot-toast'

const nav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { to: '/admin/products', icon: Package, label: 'Inventory' },
  { to: '/admin/blogs', icon: BookOpen, label: 'Journal' },
  { to: '/admin/reviews', icon: Star, label: 'Feedback' },
]

export default function AdminLayout({ session }) {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Session Terminated')
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-black flex flex-col md:flex-row text-white">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-[#111] border-b border-[#333] p-4 sticky top-0 z-40">
        <div className="font-bangla-sans font-bold text-lg text-white uppercase tracking-widest">
          Pickles <span className="text-[#1F8B4D]">Corner</span>
        </div>
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="text-gray-400 hover:text-white transition-colors p-1"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111] border-r border-[#333] flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="px-6 py-6 border-b border-[#333] flex items-center justify-between">
          <div>
            <div className="font-bangla-sans font-bold text-xl text-white uppercase tracking-widest leading-none mb-1">
              Pickles <span className="text-[#1F8B4D]">Corner</span>
            </div>
            <p className="text-[8px] text-gray-500 uppercase tracking-widest">Control Panel</p>
          </div>
          
          {/* Close button for mobile */}
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="md:hidden text-gray-500 hover:text-[#C62020] transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Session Info */}
        <div className="px-6 py-4 border-b border-[#333] bg-black/20">
           <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1 font-bold">Active User</p>
           <p className="text-[10px] text-[#1F8B4D] font-mono truncate">{session?.user?.email || 'admin@picklescorner.com'}</p>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setSidebarOpen(false)} // Close sidebar on mobile after clicking
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors border ${
                  isActive
                    ? 'bg-[#1F8B4D]/10 text-[#1F8B4D] border-[#1F8B4D]/30'
                    : 'bg-transparent text-gray-500 border-transparent hover:text-white hover:bg-white/5 hover:border-[#333]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#333]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-transparent hover:text-[#C62020] hover:bg-[#C62020]/10 hover:border-[#C62020]/30 transition-colors"
          >
            <LogOut size={16} />
            Terminate Session
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 min-h-screen bg-black overflow-x-hidden relative">
        <Outlet />
      </main>
      
    </div>
  )
}