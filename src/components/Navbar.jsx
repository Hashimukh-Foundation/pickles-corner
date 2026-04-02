import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { ShoppingCart, ClipboardList } from 'lucide-react'
import { useLang } from '../lib/lang'
import { useCart } from '../lib/cart'
import { toBn } from '../lib/bangla'
import { getCustomerInfo } from '../lib/customer'
import CartDrawer from './CartDrawer'

export default function Navbar() {
  const { isBn, toggle, t } = useLang()
  const { totalItems } = useCart()
  const [cartOpen, setCartOpen] = useState(false)
  const [hasCustomer, setHasCustomer] = useState(false)

  useEffect(() => {
    setHasCustomer(!!getCustomerInfo()?.phone)
  }, [])

  const navLinks = [
    ['/', t('Home', 'হোম')],
    ['/products', t('Collection', 'কালেকশন')],
    ['/blogs', t('Journal', 'জার্নাল')],
  ]

  return (
    <>
      <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-[#333] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <span className="font-bangla-sans font-bold text-xl md:text-2xl text-white uppercase tracking-widest transition-colors group-hover:text-[#1F8B4D]">
              Pickles <span className="text-[#1F8B4D] group-hover:text-white transition-colors">Corner</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden sm:flex items-center gap-6 md:gap-10">
            {navLinks.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all py-2 border-b-2 ${isBn ? 'font-bangla-sans' : ''} ${
                    isActive 
                      ? 'text-[#1F8B4D] border-[#1F8B4D]' 
                      : 'text-gray-500 border-transparent hover:text-white hover:border-gray-500'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right Controls: Lang Toggle + My Orders + Cart */}
          <div className="flex items-center gap-3 md:gap-4">
            
            {/* Language toggle */}
            <button
              onClick={toggle}
              title={isBn ? 'Switch to English' : 'বাংলায় দেখুন'}
              className="flex items-center border border-[#333] bg-[#111] transition-colors"
            >
              <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${!isBn ? 'bg-[#1F8B4D] text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                EN
              </span>
              <span className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors font-bangla-sans ${isBn ? 'bg-[#1F8B4D] text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                বাং
              </span>
            </button>

            {/* My Orders icon */}
            <Link
              to="/my-orders"
              className="relative p-2 text-gray-500 hover:text-[#1F8B4D] transition-colors"
              title={t('My Orders', 'আমার অর্ডার')}
            >
              <ClipboardList size={20} />
              {hasCustomer && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#1F8B4D] border border-black" />
              )}
            </Link>

            {/* Cart button */}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 text-gray-500 hover:text-[#1F8B4D] transition-colors"
              title={t('Cart', 'কার্ট')}
            >
              <ShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#C62020] text-white text-[10px] font-bold px-1.5 py-0.5 border border-black shadow-sm font-mono flex items-center justify-center">
                  {isBn ? toBn(totalItems) : totalItems}
                </span>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* Slide-out Cart Drawer */}
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  )
}