import { Tag } from 'lucide-react'
import { toBn } from '../lib/bangla'

export default function DiscountBadge({ percent, size = 'md', isBn = false, className = '' }) {
  if (!percent) return null
  
  const sizes = {
    sm: 'text-[9px] px-2 py-0.5 gap-1',
    md: 'text-[10px] px-3 py-1 gap-1.5',
    lg: 'text-xs px-4 py-1.5 gap-2',
  }
  
  return (
    <span className={`inline-flex items-center font-bold bg-[#C62020] text-white uppercase tracking-widest font-bangla-sans border border-[#C62020]/50 shadow-sm ${sizes[size]} ${className}`}>
      <Tag size={size === 'lg' ? 14 : (size === 'md' ? 12 : 10)} />
      {isBn ? toBn(percent) : percent}% {isBn ? 'ছাড়' : 'OFF'}
    </span>
  )
}

export function PriceDisplay({ finalPrice, originalPrice, isDiscounted, size = 'md', isBn = false, className = '' }) {
  const finalSizes = { 
    sm: 'text-base font-bold', 
    md: 'text-xl font-bold', 
    lg: 'text-3xl md:text-4xl font-bold' 
  }
  const originalSizes = { 
    sm: 'text-xs', 
    md: 'text-sm', 
    lg: 'text-lg' 
  }

  const fmt = (p) => {
    // Using .toFixed(0) for a cleaner, premium integer look (e.g., Tk 350 instead of Tk 350.00)
    const n = parseFloat(p).toFixed(0) 
    return (isBn ? '৳ ' + toBn(n) : 'Tk ' + n)
  }

  return (
    <div className={`flex items-baseline gap-2 flex-wrap font-bangla-sans ${className}`}>
      <span className={`${isDiscounted ? 'text-[#C62020]' : 'text-white'} ${finalSizes[size]}`}>
        {fmt(finalPrice)}
      </span>
      {isDiscounted && (
        <span className={`text-gray-500 line-through ${originalSizes[size]}`}>
          {fmt(originalPrice)}
        </span>
      )}
    </div>
  )
}