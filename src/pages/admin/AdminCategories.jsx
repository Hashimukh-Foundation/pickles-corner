import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Pencil, Trash2, GripVertical, Save, X, Image, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'

const EMPTY_FORM = { name: '', name_bn: '', image_url: '' }

function CategoryCard({ cat, index, total, onEdit, onDelete, onMoveUp, onMoveDown }) {
  return (
    <div className="bg-[#111] border border-[#333] hover:border-[#555] transition-colors">
      {/* Preview banner */}
      <div className="relative h-32 overflow-hidden bg-[#1e1c1a]">
        <div className="absolute inset-0 bg-black/40 z-10" />
        {cat.image_url ? (
          <img
            src={cat.image_url}
            alt={cat.name}
            className="w-full h-full object-cover opacity-60"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Image size={32} className="text-gray-600" />
          </div>
        )}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <h3 className="text-lg font-bold text-white uppercase tracking-widest drop-shadow">{cat.name}</h3>
        </div>
      </div>

      {/* Info row */}
      <div className="px-4 py-3 flex items-center gap-3">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <button
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            className="text-gray-600 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={() => onMoveDown(index)}
            disabled={index === total - 1}
            className="text-gray-600 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowDown size={13} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-bold uppercase tracking-wide truncate">{cat.name}</p>
          {cat.name_bn && <p className="text-gray-500 text-[11px] font-bangla-sans truncate">{cat.name_bn}</p>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(cat)}
            className="p-2 text-gray-500 hover:text-[#1F8B4D] hover:bg-[#1F8B4D]/10 border border-transparent hover:border-[#1F8B4D]/30 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(cat)}
            className="p-2 text-gray-500 hover:text-[#C62020] hover:bg-[#C62020]/10 border border-transparent hover:border-[#C62020]/30 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

function CategoryFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const isEdit = !!initial?.id

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      name_bn: form.name_bn.trim() || null,
      image_url: form.image_url.trim() || null,
    }
    let error
    if (isEdit) {
      ;({ error } = await supabase.from('homepage_categories').update(payload).eq('id', initial.id))
    } else {
      ;({ error } = await supabase.from('homepage_categories').insert(payload))
    }
    setSaving(false)
    if (error) { toast.error(error.message); return }
    toast.success(isEdit ? 'Category updated!' : 'Category added!')
    onSave()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#111] border border-[#333] w-full max-w-md">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#333] flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-widest">
            {isEdit ? 'Edit Category' : 'Add Category'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">
          {/* Image URL with preview */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Image URL
            </label>
            <input
              type="text"
              value={form.image_url}
              onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
              placeholder="https://..."
              className="w-full bg-black border border-[#333] focus:border-[#1F8B4D] text-white text-sm px-4 py-3 outline-none transition-colors placeholder-gray-600 font-mono"
            />
            {form.image_url && (
              <div className="mt-3 relative h-28 border border-[#333] overflow-hidden bg-[#1e1c1a]">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <img
                  src={form.image_url}
                  alt="preview"
                  className="w-full h-full object-cover opacity-60"
                  onError={e => { e.currentTarget.style.display = 'none' }}
                />
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                  <span className="text-white text-xs font-bold uppercase tracking-widest opacity-70">Preview</span>
                </div>
              </div>
            )}
          </div>

          {/* English name */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Name (English) <span className="text-[#C62020]">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Pickles"
              className="w-full bg-black border border-[#333] focus:border-[#1F8B4D] text-white text-sm px-4 py-3 outline-none transition-colors placeholder-gray-600"
            />
          </div>

          {/* Bangla name */}
          <div>
            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
              Name (বাংলা)
            </label>
            <input
              type="text"
              value={form.name_bn}
              onChange={e => setForm(f => ({ ...f, name_bn: e.target.value }))}
              placeholder="e.g. আচার"
              className="w-full bg-black border border-[#333] focus:border-[#1F8B4D] text-white text-sm px-4 py-3 outline-none transition-colors placeholder-gray-600 font-bangla-sans"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-[#1F8B4D] hover:bg-[#166E3B] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest py-3 px-4 transition-colors"
          >
            <Save size={14} />
            {saving ? 'Saving...' : (isEdit ? 'Update Category' : 'Add Category')}
          </button>
          <button
            onClick={onClose}
            className="px-5 py-3 border border-[#333] text-gray-500 hover:text-white hover:border-[#555] text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | { mode: 'add' | 'edit', data?: cat }
  const [deleteConfirm, setDeleteConfirm] = useState(null) // cat to delete

  const fetch = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('homepage_categories')
      .select('*')
      .order('sort_order', { ascending: true })
    setCategories(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  const handleMoveUp = async (index) => {
    if (index === 0) return
    const updated = [...categories]
    ;[updated[index - 1], updated[index]] = [updated[index], updated[index - 1]]
    setCategories(updated)
    await saveOrder(updated)
  }

  const handleMoveDown = async (index) => {
    if (index === categories.length - 1) return
    const updated = [...categories]
    ;[updated[index], updated[index + 1]] = [updated[index + 1], updated[index]]
    setCategories(updated)
    await saveOrder(updated)
  }

  const saveOrder = async (ordered) => {
    const updates = ordered.map((cat, i) =>
      supabase.from('homepage_categories').update({ sort_order: i + 1 }).eq('id', cat.id)
    )
    await Promise.all(updates)
    toast.success('Order saved')
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return
    const { error } = await supabase.from('homepage_categories').delete().eq('id', deleteConfirm.id)
    if (error) { toast.error(error.message); return }
    toast.success('Category deleted')
    setDeleteConfirm(null)
    fetch()
  }

  return (
    <div className="p-4 md:p-8 bg-black min-h-screen">

      {/* Header */}
      <div className="mb-8 border-b border-[#333] pb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-bangla-sans text-2xl md:text-3xl font-bold text-white uppercase tracking-wide">
            Homepage Categories
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-mono">
            Edit the three featured category cards shown on the homepage
          </p>
        </div>
        <button
          onClick={() => setModal({ mode: 'add' })}
          className="flex-shrink-0 flex items-center gap-2 bg-[#1F8B4D] hover:bg-[#166E3B] text-white text-[10px] font-bold uppercase tracking-widest px-4 py-3 transition-colors"
        >
          <Plus size={14} />
          Add Category
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-[#1F8B4D]/10 border border-[#1F8B4D]/20 px-4 py-3 mb-8 flex items-start gap-3">
        <Image size={16} className="text-[#1F8B4D] flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-gray-400 leading-relaxed">
          These cards appear in the <span className="text-white font-bold">grid section</span> on the homepage, between the sale ticker and the main product listing. Changes are reflected on the storefront immediately.
        </p>
      </div>

      {/* Category grid */}
      {loading ? (
        <div className="flex justify-center py-24">
          <svg className="animate-spin h-8 w-8 text-[#1F8B4D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-24 border border-[#333] bg-[#111]">
          <Image size={40} className="mx-auto mb-4 text-gray-700" strokeWidth={1.5} />
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">No categories yet</p>
          <button
            onClick={() => setModal({ mode: 'add' })}
            className="inline-flex items-center gap-2 bg-[#1F8B4D] hover:bg-[#166E3B] text-white text-[10px] font-bold uppercase tracking-widest px-5 py-3 transition-colors"
          >
            <Plus size={13} />
            Add First Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, i) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              index={i}
              total={categories.length}
              onEdit={cat => setModal({ mode: 'edit', data: cat })}
              onDelete={cat => setDeleteConfirm(cat)}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modal && (
        <CategoryFormModal
          initial={modal.mode === 'edit' ? modal.data : null}
          onSave={() => { setModal(null); fetch() }}
          onClose={() => setModal(null)}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-[#333] w-full max-w-sm p-6">
            <h2 className="text-xs font-bold text-white uppercase tracking-widest mb-3">Delete Category?</h2>
            <p className="text-sm text-gray-400 mb-6">
              Remove <span className="text-white font-bold">"{deleteConfirm.name}"</span> from the homepage? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 bg-[#C62020] hover:bg-red-700 text-white text-xs font-bold uppercase tracking-widest py-3 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-[#333] text-gray-500 hover:text-white hover:border-[#555] text-xs font-bold uppercase tracking-widest py-3 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
