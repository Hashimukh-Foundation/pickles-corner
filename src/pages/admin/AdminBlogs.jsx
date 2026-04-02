import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import BlogForm from '../../components/admin/BlogForm'
import { Plus, Pencil, Trash2, Eye, EyeOff, BookOpen } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editBlog, setEditBlog] = useState(null)

  const fetchBlogs = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('blogs').select('*').order('created_at', { ascending: false })
    setBlogs(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchBlogs() }, [fetchBlogs])

  const handleDelete = async (id, title) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) return
    const { error } = await supabase.from('blogs').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Entry deleted'); fetchBlogs() }
  }

  const togglePublish = async (id, current) => {
    const { error } = await supabase.from('blogs').update({
      is_published: !current,
      published_at: !current ? new Date().toISOString() : null,
    }).eq('id', id)
    if (error) toast.error(error.message)
    else fetchBlogs()
  }

  return (
    <div className="p-4 md:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-[#333] pb-6">
        <div>
          <h1 className="font-bangla-sans text-2xl md:text-3xl font-bold text-white uppercase tracking-wide">
            Journal Entries
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-mono">
            {blogs.length} {blogs.length === 1 ? 'Record Found' : 'Records Found'}
          </p>
        </div>
        <button 
          onClick={() => { setEditBlog(null); setShowForm(true) }} 
          className="bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-3 px-6 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
        >
          <Plus size={14} strokeWidth={3} /> New Entry
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <svg className="animate-spin h-8 w-8 text-[#1F8B4D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <div className="space-y-4">
          {blogs.map(blog => (
            <div key={blog.id} className="bg-[#111] border border-[#333] p-4 flex flex-col md:flex-row md:items-center gap-5 hover:border-gray-500 transition-colors group">
              
              {/* Cover Image */}
              <div className="w-full md:w-20 h-32 md:h-20 bg-black border border-[#333] flex-shrink-0 overflow-hidden relative">
                {blog.cover_image_url ? (
                  <img src={blog.cover_image_url} alt={blog.title} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#333]">
                    <BookOpen size={24} strokeWidth={1} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wide truncate font-bangla-sans">
                    {blog.title}
                  </h3>
                  <span className={`w-fit px-2 py-1 border text-[9px] font-bold uppercase tracking-widest ${
                    blog.is_published 
                      ? 'bg-[#1F8B4D]/10 text-[#1F8B4D] border-[#1F8B4D]/30' 
                      : 'bg-black text-gray-500 border-[#333]'
                  }`}>
                    {blog.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                
                <p className="text-xs text-gray-400 truncate font-bangla-serif font-light mb-2">
                  {blog.excerpt || blog.content?.replace(/[#*`_>]/g, '').slice(0, 120)}...
                </p>
                
                <p className="text-[9px] text-gray-600 uppercase tracking-widest font-mono">
                  {blog.author || 'Admin'} <span className="mx-2">|</span> {new Date(blog.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 md:pt-0 border-t border-[#333] md:border-0 md:pl-4 justify-end flex-shrink-0">
                <button
                  onClick={() => togglePublish(blog.id, blog.is_published)}
                  className={`w-10 h-10 flex items-center justify-center border transition-colors ${
                    blog.is_published 
                      ? 'border-transparent text-gray-500 hover:text-[#C62020] hover:border-[#C62020]/30 hover:bg-[#C62020]/10'
                      : 'border-transparent text-gray-500 hover:text-[#1F8B4D] hover:border-[#1F8B4D]/30 hover:bg-[#1F8B4D]/10'
                  }`}
                  title={blog.is_published ? 'Unpublish to Draft' : 'Publish to Live Site'}
                >
                  {blog.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => { setEditBlog(blog); setShowForm(true) }}
                  className="w-10 h-10 flex items-center justify-center border border-transparent text-gray-500 hover:text-white hover:border-[#333] hover:bg-[#191715] transition-colors"
                  title="Edit Entry"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleDelete(blog.id, blog.title)}
                  className="w-10 h-10 flex items-center justify-center border border-transparent text-gray-500 hover:text-[#C62020] hover:border-[#C62020]/30 hover:bg-[#C62020]/10 transition-colors"
                  title="Delete Entry"
                >
                  <Trash2 size={16} />
                </button>
              </div>

            </div>
          ))}

          {blogs.length === 0 && (
            <div className="bg-[#191715] border border-[#333] p-16 text-center">
              <BookOpen size={32} className="mx-auto text-gray-600 mb-4" strokeWidth={1} />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                No journal entries recorded yet.
              </p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <BlogForm
          blog={editBlog}
          onClose={() => { setShowForm(false); setEditBlog(null) }}
          onSaved={() => { setShowForm(false); setEditBlog(null); fetchBlogs() }}
        />
      )}
    </div>
  )
}