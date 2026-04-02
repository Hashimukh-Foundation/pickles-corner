import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import BlogForm from '../../components/admin/BlogForm'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
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
    if (!confirm(`Delete "${title}"?`)) return
    const { error } = await supabase.from('blogs').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Blog deleted'); fetchBlogs() }
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Blog Posts</h1>
          <p className="text-gray-500 text-sm mt-0.5">{blogs.length} posts</p>
        </div>
        <button onClick={() => { setEditBlog(null); setShowForm(true) }} className="btn-primary">
          <Plus size={15} /> New Post
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {blogs.map(blog => (
            <div key={blog.id} className="card px-5 py-4 flex items-center gap-4">
              {blog.cover_image_url && (
                <img src={blog.cover_image_url} alt={blog.title} className="w-14 h-14 rounded-xl object-cover border border-brand-100 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-semibold text-navy-900 truncate">{blog.title}</h3>
                  <span className={`badge flex-shrink-0 ${blog.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {blog.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">{blog.excerpt || blog.content?.slice(0, 100)}</p>
                <p className="text-xs text-gray-400 mt-1">By {blog.author} · {new Date(blog.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => togglePublish(blog.id, blog.is_published)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                  title={blog.is_published ? 'Unpublish' : 'Publish'}
                >
                  {blog.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button
                  onClick={() => { setEditBlog(blog); setShowForm(true) }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition"
                >
                  <Pencil size={15} />
                </button>
                <button
                  onClick={() => handleDelete(blog.id, blog.title)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {blogs.length === 0 && (
            <div className="card p-12 text-center text-gray-400 text-sm">
              No blog posts yet. Create your first one!
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
