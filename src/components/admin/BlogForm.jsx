import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

function LangTabs({ active, onChange }) {
  return (
    <div className="flex bg-[#111] border border-[#333] w-fit mb-6">
      <button 
        type="button" 
        onClick={() => onChange('en')}
        className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
          active === 'en' 
            ? 'bg-[#1F8B4D] text-white' 
            : 'text-gray-500 hover:text-white hover:bg-white/5'
        }`}
      >
        EN English
      </button>
      <button 
        type="button" 
        onClick={() => onChange('bn')}
        className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors font-bangla-sans ${
          active === 'bn' 
            ? 'bg-[#1F8B4D] text-white' 
            : 'text-gray-500 hover:text-white hover:bg-white/5'
        }`}
      >
        বাং বাংলা
      </button>
    </div>
  )
}

export default function BlogForm({ blog, onClose, onSaved }) {
  const editing = !!blog
  const [lang, setLang] = useState('en')
  const [form, setForm] = useState({
    title: '', slug: '', content: '', excerpt: '', author: 'Admin',
    cover_image_url: '', is_published: false,
    title_bn: '', excerpt_bn: '', content_bn: '',
    ...blog,
  })
  const [loading, setLoading] = useState(false)
  
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleTitleChange = (v) => {
    setForm(f => ({ ...f, title: v, slug: editing ? f.slug : slugify(v) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        title: form.title.trim(), slug: form.slug.trim(),
        content: form.content, excerpt: form.excerpt,
        author: form.author, cover_image_url: form.cover_image_url,
        is_published: form.is_published,
        published_at: form.is_published ? (blog?.published_at || new Date().toISOString()) : null,
        title_bn:   form.title_bn   || null,
        excerpt_bn: form.excerpt_bn || null,
        content_bn: form.content_bn || null,
      }
      let error
      if (editing) {
        ({ error } = await supabase.from('blogs').update(payload).eq('id', blog.id))
      } else {
        ({ error } = await supabase.from('blogs').insert(payload))
      }
      if (error) throw error
      toast.success(editing ? 'Journal entry updated!' : 'Journal entry created!')
      onSaved()
    } catch (err) { 
      toast.error(err.message) 
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#191715] border border-[#333] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#333] bg-[#111] sticky top-0 z-10">
          <h2 className="font-bangla-sans text-xl font-bold text-white uppercase tracking-wide">
            {editing ? 'Edit Journal Entry' : 'New Journal Entry'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-[#C62020] transition-colors p-1">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
          
          {/* Language Tabs */}
          <LangTabs active={lang} onChange={setLang} />

          {/* EN fields */}
          <div className={lang === 'en' ? 'space-y-6' : 'hidden'}>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Title (English) *</label>
              <input 
                className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[#1F8B4D] transition-colors font-bangla-sans text-lg" 
                value={form.title} 
                onChange={e => handleTitleChange(e.target.value)} 
                required={lang === 'en'} 
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">URL Slug *</label>
              <input 
                className="w-full bg-[#111] border border-[#333] text-gray-400 px-4 py-3 text-xs focus:outline-none focus:border-[#1F8B4D] transition-colors font-mono" 
                value={form.slug} 
                onChange={e => setField('slug', e.target.value)} 
                required 
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Author</label>
                <input 
                  className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors font-bangla-sans" 
                  value={form.author} 
                  onChange={e => setField('author', e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Cover Image URL</label>
                <input 
                  className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors" 
                  value={form.cover_image_url} 
                  onChange={e => setField('cover_image_url', e.target.value)} 
                  placeholder="https://..." 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Excerpt (English)</label>
              <textarea 
                className="w-full bg-[#111] border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors resize-none h-20 font-bangla-serif" 
                value={form.excerpt} 
                onChange={e => setField('excerpt', e.target.value)} 
                placeholder="Short summary…" 
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Content (English) *</label>
              <textarea 
                className="w-full bg-[#111] border border-[#333] text-gray-300 px-4 py-4 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors resize-y min-h-[250px] font-bangla-serif leading-relaxed" 
                value={form.content} 
                onChange={e => setField('content', e.target.value)} 
                required={lang === 'en'} 
                placeholder="Write your blog content here… (Markdown supported)" 
              />
            </div>
          </div>

          {/* Bangla fields */}
          <div className={lang === 'bn' ? 'space-y-6 bg-[#111] border border-[#333] p-6' : 'hidden'}>
            
            <div className="text-[10px] text-[#1F8B4D] bg-[#1F8B4D]/10 border border-[#1F8B4D]/30 px-4 py-3 uppercase tracking-widest font-bangla-sans font-bold flex items-center gap-2">
              <span className="text-lg leading-none">💡</span> 
              <span>বাংলা ক্ষেত্রগুলো ঐচ্ছিক। না দিলে ইংরেজি ব্যবহার করা হবে।</span>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-bangla-sans">শিরোনাম (বাংলা)</label>
              <input
                className="w-full bg-black border border-[#333] text-white px-4 py-3 focus:outline-none focus:border-[#1F8B4D] transition-colors font-bangla-sans text-lg"
                placeholder="বাংলায় শিরোনাম লিখুন…"
                value={form.title_bn}
                onChange={e => setField('title_bn', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-bangla-sans">সংক্ষিপ্ত বিবরণ (বাংলা)</label>
              <textarea
                className="w-full bg-black border border-[#333] text-white px-4 py-3 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors resize-none h-20 font-bangla-serif"
                placeholder="সংক্ষিপ্ত বিবরণ লিখুন…"
                value={form.excerpt_bn}
                onChange={e => setField('excerpt_bn', e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 font-bangla-sans">মূল বিষয়বস্তু (বাংলা)</label>
              <textarea
                className="w-full bg-black border border-[#333] text-gray-300 px-4 py-4 text-sm focus:outline-none focus:border-[#1F8B4D] transition-colors resize-y min-h-[250px] font-bangla-serif leading-relaxed"
                placeholder="বাংলায় ব্লগ পোস্ট লিখুন…"
                value={form.content_bn}
                onChange={e => setField('content_bn', e.target.value)}
              />
            </div>
            
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center gap-3 p-4 border border-[#333] bg-[#111]">
            <input 
              type="checkbox" 
              id="is_published" 
              checked={form.is_published} 
              onChange={e => setField('is_published', e.target.checked)} 
              className="w-4 h-4 accent-[#1F8B4D] cursor-pointer bg-black border-[#333]" 
            />
            <label htmlFor="is_published" className="text-xs font-bold text-white uppercase tracking-widest cursor-pointer">
              Publish immediately
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-[#333]">
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-transparent text-gray-400 font-bold py-3 px-6 transition-all border border-[#333] hover:border-white hover:text-white uppercase tracking-widest text-[10px]"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-3 px-8 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-[10px]"
            >
              {loading ? 'Saving…' : editing ? 'Save Changes' : 'Create Post'}
            </button>
          </div>
        </form>
        
      </div>
    </div>
  )
}