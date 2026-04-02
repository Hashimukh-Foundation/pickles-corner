import { Link } from 'react-router-dom'
import { useLang } from '../lib/lang'

export default function Footer() {
  const { isBn, t } = useLang()

  return (
    <footer className="bg-black border-t border-[#333] mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
        
        {/* Brand Info */}
        <div>
          <Link to="/" className="inline-block font-bangla-sans font-bold text-2xl text-white uppercase tracking-widest hover:text-[#1F8B4D] transition-colors mb-6">
            Pickles <span className="text-[#1F8B4D]">Corner</span>
          </Link>
          <p className="font-bangla-serif text-gray-400 text-sm leading-relaxed font-light max-w-sm">
            {t(
              'Authentic, handcrafted pickles made from secret family recipes. Sun-dried and spiced to perfection, delivered straight to your table.',
              'পারিবারিক গোপন রেসিপিতে তৈরি খাঁটি আচার। রোদে শুকানো এবং সম্পূর্ণ মশলাদার, সরাসরি আপনার টেবিলে।'
            )}
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className={`text-[#1F8B4D] text-[10px] font-bold uppercase tracking-widest mb-6 ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Explore', 'এক্সপ্লোর')}
          </h4>
          <ul className="space-y-4">
            <li>
              <Link to="/products" className={`text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors ${isBn ? 'font-bangla-sans' : ''}`}>
                {t('Collection', 'কালেকশন')}
              </Link>
            </li>
            <li>
              <Link to="/blogs" className={`text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors ${isBn ? 'font-bangla-sans' : ''}`}>
                {t('Journal', 'জার্নাল')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className={`text-[#1F8B4D] text-[10px] font-bold uppercase tracking-widest mb-6 ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Contact', 'যোগাযোগ')}
          </h4>
          <ul className="space-y-4 text-gray-500 text-xs font-bold uppercase tracking-widest font-mono">
            <li>
              <a href="mailto:hello@picklescorner.com" className="hover:text-white transition-colors">
                hello@picklescorner.com
              </a>
            </li>
          </ul>
        </div>

      </div>

      {/* Copyright Bar */}
      <div className="border-t border-[#333] bg-[#0a0a0a] py-6 text-center px-4">
        <p className={`text-[10px] text-gray-600 uppercase tracking-widest font-bold ${isBn ? 'font-bangla-sans' : ''}`}>
          © {new Date().getFullYear()} Pickles Corner. {t('All rights reserved.', 'সর্বস্বত্ব সংরক্ষিত।')}
        </p>
      </div>
    </footer>
  )
}