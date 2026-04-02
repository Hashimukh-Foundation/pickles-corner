import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { useLang } from '../../lib/lang'
import { bn as BN } from '../../lib/bangla'

export default function BlogsPage() {
  const { isBn, t } = useLang()
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('blogs')
      .select('*')
      .eq('is_published', true)
      .order('published_at', { ascending: false })
      .then(({ data }) => { 
        setBlogs(data ?? [])
        setLoading(false) 
      })
  }, [])

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

  return (
    <main className="bg-black min-h-screen py-12 border-t border-[#333]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12 border-b border-[#333] pb-6">
          <h1 className="font-bangla-sans text-3xl font-bold text-white uppercase tracking-wide mb-2">
            {t('Journal & Recipes', 'জার্নাল ও রেসিপি')}
          </h1>
          <p className={`text-xs text-gray-500 uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Stories, insights, and the heritage behind authentic tastes', 'খাঁটি স্বাদের পেছনের গল্প, অন্তর্দৃষ্টি এবং ঐতিহ্য')}
          </p>
        </div>

        {/* Blog Grid */}
        {blogs.length === 0 ? (
          <div className="text-center py-32 border border-[#333] bg-[#191715]">
            <p className={`text-gray-500 text-sm uppercase tracking-widest mb-6 ${isBn ? 'font-bangla-sans' : ''}`}>
              {t('No entries published yet.', 'এখনো কোনো লেখা প্রকাশিত হয়নি।')}
            </p>
            <Link to="/products" className={`inline-block bg-transparent text-white font-bold py-3 px-10 border border-[#333] hover:border-[#1F8B4D] uppercase tracking-widest text-xs transition-colors ${isBn ? 'font-bangla-sans' : ''}`}>
              {t('Return to Store', 'স্টোরে ফিরে যান')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {blogs.map(blog => {
              const title   = t(blog.title,   blog.title_bn)
              const excerpt = t(blog.excerpt, blog.excerpt_bn)

              return (
                <div key={blog.id} className="bg-[#191715] border border-[#333333] hover:border-[#1F8B4D] transition-colors duration-300 flex flex-col group relative p-8">
                  
                  {/* Content */}
                  <div className="flex flex-col flex-grow">
                    <div className="flex items-center justify-between mb-5">
                      <span className={`text-[#1F8B4D] text-[10px] font-bold uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
                        {blog.author || t('Editorial Team', 'এডিটোরিয়াল টিম')}
                      </span>
                      <span className={`text-gray-600 text-[10px] uppercase tracking-widest ${isBn ? 'font-bangla-sans' : ''}`}>
                        {new Date(blog.published_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    <h2 className="font-bangla-sans text-2xl font-bold text-white mb-4 leading-tight group-hover:text-[#1F8B4D] transition-colors">
                      <Link to={`/blogs/${blog.slug}`}>{title}</Link>
                    </h2>
                    
                    {excerpt && (
                      <p className="font-bangla-serif text-gray-400 text-sm leading-relaxed font-light mb-8 line-clamp-4">
                        {excerpt}
                      </p>
                    )}
                    
                    {/* Read More Footer */}
                    <div className="mt-auto border-t border-[#333] pt-5">
                      <Link 
                        to={`/blogs/${blog.slug}`} 
                        className={`inline-flex items-center gap-2 text-[#1F8B4D] text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors ${isBn ? 'font-bangla-sans' : ''}`}
                      >
                        {t('Read Article', 'আর্টিকেলটি পড়ুন')} 
                        <span className="transition-transform group-hover:translate-x-1">→</span>
                      </Link>
                    </div>
                  </div>

                </div>
              )
            })}
          </div>
        )}

      </div>
    </main>
  )
}