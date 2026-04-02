import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Check, X, Trash2, Star } from 'lucide-react'
import toast from 'react-hot-toast'

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={12} className={i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
      ))}
    </div>
  )
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending') // 'pending' | 'approved' | 'all'

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    let q = supabase.from('reviews').select('*, products(name)').order('created_at', { ascending: false })
    if (filter === 'pending') q = q.eq('is_approved', false)
    else if (filter === 'approved') q = q.eq('is_approved', true)
    const { data } = await q
    setReviews(data ?? [])
    setLoading(false)
  }, [filter])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const approve = async (id) => {
    const { error } = await supabase.from('reviews').update({ is_approved: true }).eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Review approved'); fetchReviews() }
  }

  const remove = async (id) => {
    if (!confirm('Delete this review?')) return
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Review deleted'); fetchReviews() }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy-900">Customer Reviews</h1>
          <p className="text-gray-500 text-sm mt-0.5">Moderate customer feedback</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {['pending', 'approved', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition ${filter === f ? 'bg-white shadow text-navy-900' : 'text-gray-500 hover:text-navy-900'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map(review => (
            <div key={review.id} className="card px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold">
                      {review.customer_name[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-navy-900">{review.customer_name}</span>
                        <StarRating rating={review.rating} />
                        <span className={`badge text-xs ${review.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {review.is_approved ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {review.products?.name && <span className="mr-2">on <span className="font-medium">{review.products.name}</span></span>}
                        {new Date(review.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!review.is_approved && (
                    <button
                      onClick={() => approve(review.id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition"
                      title="Approve"
                    >
                      <Check size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => remove(review.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="card p-12 text-center text-gray-400 text-sm">
              No {filter === 'all' ? '' : filter} reviews found.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
