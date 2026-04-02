import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { ChevronLeft } from 'lucide-react'
import { useLang } from '../../lib/lang'
import { bn as BN } from '../../lib/bangla'

export default function BlogDetail() {
  const { slug } = useParams()
  const { isBn, t } = useLang()
  const [blog, setBlog] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('blogs')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()
      .then(({ data }) => { 
        setBlog(data)
        setLoading(false) 
      })
  }, [slug])

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center py-32 border-t border-[#333]">
        <svg className="animate-spin h-8 w-8 text-[#1F8B4D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="bg-black min-h-screen max-w-7xl mx-auto px-6 py-32 text-center border-t border-[#333]">
        <p className={`text-gray-500 uppercase tracking-widest mb-6 ${isBn ? 'font-bangla-sans' : ''}`}>
          {t('Journal entry not found.', 'পোস্ট পাওয়া যায়নি।')}
        </p>
        <Link to="/blogs" className={`inline-block bg-transparent text-white font-bold py-3 px-10 transition-all border border-[#333] hover:border-[#1F8B4D] uppercase tracking-widest text-xs ${isBn ? 'font-bangla-sans' : ''}`}>
          {t('Back to Journal', BN.backToBlog || 'জার্নালে ফিরে যান')}
        </Link>
      </div>
    )
  }

  const title = t(blog.title, blog.title_bn)
  const excerpt = t(blog.excerpt, blog.excerpt_bn)
  const content = t(blog.content, blog.content_bn)

  return (
    <main className="bg-black min-h-screen py-12 border-t border-[#333]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Navigation */}
        <Link 
          to="/blogs" 
          className={`inline-flex items-center gap-2 text-[10px] md:text-xs text-gray-500 hover:text-[#1F8B4D] uppercase tracking-widest mb-10 transition-colors ${isBn ? 'font-bangla-sans font-bold' : ''}`}
        >
          <ChevronLeft size={16} /> {t('Back to Journal', BN.backToBlog || 'জার্নালে ফিরে যান')}
        </Link>

        {/* Article Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#333]">
            <span className={`text-[#1F8B4D] text-[10px] font-bold uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
              {blog.author || t('Editorial Team', 'এডিটোরিয়াল টিম')}
            </span>
            <span className={`text-gray-500 text-[10px] uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
              {new Date(blog.published_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>

          <h1 className="font-bangla-sans text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-8">
            {title}
          </h1>

          {excerpt && (
            <p className="font-bangla-serif text-xl md:text-2xl text-gray-400 leading-relaxed font-light italic border-l-4 border-[#1F8B4D] pl-6 md:pl-8">
              {excerpt}
            </p>
          )}
        </header>

        {/* Optional Cover Image */}
        {blog.cover_image_url && (
          <div className="relative border border-[#333] bg-[#1e1c1a] p-2 aspect-video mb-12">
            <div className="w-full h-full overflow-hidden bg-[#111]">
              <img 
                src={blog.cover_image_url} 
                alt={title} 
                className="w-full h-full object-cover opacity-90" 
              />
            </div>
          </div>
        )}

        {/* Article Content */}
        <article className="border-t border-[#333] pt-12 pb-24">
          <div className="font-bangla-serif text-gray-300 text-base md:text-lg leading-loose tracking-wide max-w-none">
            {(content || '').split('\n').map((para, i) =>
              para.trim() ? (
                <p key={i} className="mb-6 font-light">{para}</p>
              ) : (
                <br key={i} className="mb-4" />
              )
            )}
          </div>
        </article>

        {/* Footer Action */}
        <div className="border-t border-[#333] pt-12 text-center pb-12">
          <p className={`text-[10px] text-gray-500 uppercase tracking-widest mb-6 block font-bold ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Enjoyed this reading?', 'পড়তে ভালো লেগেছে?')}
          </p>
          <Link to="/products" className={`inline-block bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-4 px-10 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-[10px] ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Explore Our Collection', 'আমাদের কালেকশন দেখুন')}
          </Link>
        </div>

      </div>
    </main>
  )
}