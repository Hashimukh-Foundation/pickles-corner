import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

function LangTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg w-fit mb-4">
      <button type="button" onClick={() => onChange('en')}
        className={`px-3 py-1 rounded-md text-xs font-bold transition ${active === 'en' ? 'bg-white shadow text-navy-900' : 'text-gray-500'}`}>
        EN English
      </button>
      <button type="button" onClick={() => onChange('bn')}
        className={`px-3 py-1 rounded-md text-xs font-bold transition ${active === 'bn' ? 'bg-indigo-600 text-white shadow' : 'text-gray-500'}`}
        style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
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
      toast.success(editing ? 'Blog updated!' : 'Blog created!')
      onSaved()
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-display text-lg font-bold text-navy-900">
            {editing ? 'Edit Blog Post' : 'New Blog Post'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <LangTabs active={lang} onChange={setLang} />

          {/* EN fields */}
          {lang === 'en' && (
            <>
              <div>
                <label className="label">Title (English) *</label>
                <input className="input" value={form.title} onChange={e => handleTitleChange(e.target.value)} required />
              </div>
              <div>
                <label className="label">Slug *</label>
                <input className="input font-mono text-xs" value={form.slug} onChange={e => setField('slug', e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Author</label>
                  <input className="input" value={form.author} onChange={e => setField('author', e.target.value)} />
                </div>
                <div>
                  <label className="label">Cover Image URL</label>
                  <input className="input" value={form.cover_image_url} onChange={e => setField('cover_image_url', e.target.value)} placeholder="https://..." />
                </div>
              </div>
              <div>
                <label className="label">Excerpt (English)</label>
                <textarea className="input resize-none h-16" value={form.excerpt} onChange={e => setField('excerpt', e.target.value)} placeholder="Short summary…" />
              </div>
              <div>
                <label className="label">Content (English) *</label>
                <textarea className="input resize-none h-48 font-mono text-xs leading-relaxed" value={form.content} onChange={e => setField('content', e.target.value)} required placeholder="Write your blog content here…" />
              </div>
            </>
          )}

          {/* Bangla fields */}
          {lang === 'bn' && (
            <div className="space-y-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <div>
                <label className="label" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>শিরোনাম (বাংলা)</label>
                <input
                  className="input-bn"
                  style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
                  placeholder="বাংলায় শিরোনাম লিখুন…"
                  value={form.title_bn}
                  onChange={e => setField('title_bn', e.target.value)}
                />
              </div>
              <div>
                <label className="label" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>সংক্ষিপ্ত বিবরণ (বাংলা)</label>
                <textarea
                  className="input-bn resize-none h-16"
                  style={{ fontFamily: 'Hind Siliguri, sans-serif' }}
                  placeholder="সংক্ষিপ্ত বিবরণ লিখুন…"
                  value={form.excerpt_bn}
                  onChange={e => setField('excerpt_bn', e.target.value)}
                />
              </div>
              <div>
                <label className="label" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>মূল বিষয়বস্তু (বাংলা)</label>
                <textarea
                  className="input-bn resize-none h-52 leading-relaxed"
                  style={{ fontFamily: 'Hind Siliguri, sans-serif', fontSize: '14px' }}
                  placeholder="বাংলায় ব্লগ পোস্ট লিখুন…"
                  value={form.content_bn}
                  onChange={e => setField('content_bn', e.target.value)}
                />
              </div>
              <div className="text-xs text-indigo-500 bg-indigo-100 rounded-lg px-3 py-2" style={{ fontFamily: 'Hind Siliguri, sans-serif' }}>
                💡 বাংলা ক্ষেত্রগুলো ঐচ্ছিক। না দিলে ইংরেজি ব্যবহার করা হবে।
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_published" checked={form.is_published} onChange={e => setField('is_published', e.target.checked)} className="w-4 h-4 accent-brand-600" />
            <label htmlFor="is_published" className="text-sm font-medium text-gray-700">Publish immediately</label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Saving…' : editing ? 'Save Changes' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
