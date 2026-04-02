import { useCart } from '../lib/cart'
import { useLang } from '../lib/lang'
import { toBn } from '../lib/bangla'
import { X, Trash2, Plus, Minus, ShoppingCart, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const DELIVERY_CHARGE = 60 // ৳60 flat delivery

export default function CartDrawer({ open, onClose }) {
  const { items, totalItems, subtotal, removeItem, updateQuantity } = useCart()
  const { isBn, t } = useLang()

  const total = subtotal + (items.length > 0 ? DELIVERY_CHARGE : 0)

  // Format to integer values for cleaner aesthetic
  const fmt = (n) => (isBn ? '৳ ' + toBn(parseFloat(n).toFixed(0)) : 'Tk ' + parseFloat(n).toFixed(0))

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-[#111] border-l border-[#333] shadow-2xl z-50 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#333] bg-black">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-[#1F8B4D]" />
            <h2 className={`font-bold text-white uppercase tracking-widest ${isBn ? 'font-bangla-sans text-sm' : 'font-bangla-sans text-sm'}`}>
              {t('Your Cart', 'আপনার কার্ট')}
            </h2>
            {totalItems > 0 && (
              <span className="bg-[#1F8B4D] text-white text-[10px] font-bold px-2 py-0.5 border border-[#166E3B] flex items-center justify-center font-mono">
                {isBn ? toBn(totalItems) : totalItems}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-[#C62020] transition-colors p-1">
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 text-gray-500">
            <ShoppingCart size={48} className="mb-6 opacity-20" strokeWidth={1} />
            <p className={`font-bold text-sm uppercase tracking-widest text-white mb-2 ${isBn ? 'font-bangla-sans' : ''}`}>
              {t('Your cart is empty', 'কার্টে কিছু নেই')}
            </p>
            <p className={`text-xs font-light tracking-wide mb-8 ${isBn ? 'font-bangla-serif' : 'font-bangla-serif'}`}>
              {t('Add products to get started.', 'পণ্য যোগ করে শুরু করুন।')}
            </p>
            <button onClick={onClose} className={`bg-transparent text-white font-bold py-3 px-8 transition-all border border-[#333] hover:border-[#1F8B4D] uppercase tracking-widest text-[10px] flex items-center gap-2 ${isBn ? 'font-bangla-sans' : ''}`}>
              {t('Browse Collection', 'কালেকশন দেখুন')} <ArrowRight size={14} />
            </button>
          </div>
        )}

        {/* Items */}
        {items.length > 0 && (
          <>
            <div className="flex-1 overflow-y-auto py-2">
              {items.map(item => (
                <div key={item.cartKey} className="flex gap-4 px-6 py-5 border-b border-[#333] last:border-0 hover:bg-[#191715] transition-colors group">
                  
                  {/* Image */}
                  <div className="w-20 h-20 bg-black overflow-hidden flex-shrink-0 border border-[#333]">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600 font-bold text-xl uppercase font-bangla-sans">
                        {item.productName[0]}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <p className={`font-bold text-white text-sm uppercase tracking-wide leading-tight ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
                          {t(item.productName, item.productNameBn)}
                        </p>
                        <button
                          onClick={() => removeItem(item.cartKey)}
                          className="text-gray-600 hover:text-[#C62020] transition-colors p-1 flex-shrink-0"
                          title="Remove Item"
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                      
                      <p className={`text-[10px] text-gray-500 uppercase tracking-widest mt-1 ${isBn ? 'font-bangla-sans' : 'font-mono'}`}>
                        {t('Size:', 'সাইজ:')} {isBn ? toBn(item.sizeGrams) + ' গ্রাম' : item.sizeGrams + 'g'}
                      </p>
                    </div>

                    <div className="flex items-end justify-between mt-3">
                      {/* Qty controls */}
                      <div className="flex items-center border border-[#333] bg-black">
                        <button
                          onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#333] transition-colors disabled:opacity-20 disabled:hover:bg-transparent"
                        >
                          <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className={`text-xs font-bold w-8 text-center text-white ${isBn ? 'font-bangla-sans' : 'font-mono'}`}>
                          {isBn ? toBn(item.quantity) : item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#333] transition-colors"
                        >
                          <Plus size={12} strokeWidth={3} />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className={`text-sm font-bold text-white ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>
                          {fmt(item.unitPrice * item.quantity)}
                        </p>
                        {item.originalPrice > item.unitPrice && (
                          <p className={`text-[10px] text-gray-500 line-through mt-0.5 ${isBn ? 'font-bangla-sans' : 'font-mono'}`}>
                            {fmt(item.originalPrice * item.quantity)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>

            {/* Summary + Checkout */}
            <div className="border-t border-[#333] bg-black px-6 py-6 space-y-4">
              
              <div className="space-y-2 text-xs font-bold uppercase tracking-widest">
                <div className="flex justify-between text-gray-400">
                  <span className={isBn ? 'font-bangla-sans' : ''}>{t('Subtotal', 'মোট')}</span>
                  <span className={isBn ? 'font-bangla-sans' : 'font-mono'}>{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span className={isBn ? 'font-bangla-sans' : ''}>{t('Delivery', 'ডেলিভারি চার্জ')}</span>
                  <span className={isBn ? 'font-bangla-sans' : 'font-mono'}>{fmt(DELIVERY_CHARGE)}</span>
                </div>
                <div className="flex justify-between text-white text-base pt-3 mt-3 border-t border-[#333]">
                  <span className={isBn ? 'font-bangla-sans' : ''}>{t('Total', 'সর্বমোট')}</span>
                  <span className={`text-[#1F8B4D] ${isBn ? 'font-bangla-sans' : 'font-bangla-sans'}`}>{fmt(total)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                onClick={onClose}
                className={`flex items-center justify-center gap-2 bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-4 transition-all uppercase tracking-widest text-[10px] mt-4 w-full ${isBn ? 'font-bangla-sans' : ''}`}
              >
                {t('Proceed to Checkout', 'অর্ডার করুন')} <ArrowRight size={14} />
              </Link>

              <p className={`text-center text-[9px] text-gray-600 uppercase tracking-widest font-bold mt-4 ${isBn ? 'font-bangla-sans' : ''}`}>
                {t('Cash on Delivery Available', 'ক্যাশ অন ডেলিভারি')}
              </p>
              
            </div>
          </>
        )}
      </div>
    </>
  )
}

export { DELIVERY_CHARGE }