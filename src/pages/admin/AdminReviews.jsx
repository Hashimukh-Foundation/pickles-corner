import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../lib/supabase'
import { Check, Trash2, Star, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star 
          key={i} 
          size={14} 
          className={i <= rating ? 'fill-[#1F8B4D] text-[#1F8B4D]' : 'text-gray-700'} 
        />
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
    else { toast.success('Feedback Approved'); fetchReviews() }
  }

  const remove = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this review?')) return
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) toast.error(error.message)
    else { toast.success('Feedback Deleted'); fetchReviews() }
  }

  return (
    <div className="p-4 md:p-8">
      
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 border-b border-[#333] pb-6">
        <div>
          <h1 className="font-bangla-sans text-2xl md:text-3xl font-bold text-white uppercase tracking-wide">
            Customer Feedback
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-mono">
            Moderation Queue
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-[#111] border border-[#333] w-fit overflow-x-auto overflow-y-hidden scrollbar-hide">
          {['pending', 'approved', 'all'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap border-r border-[#333] last:border-r-0 ${
                filter === f
                  ? 'bg-[#1F8B4D] text-white'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {f === 'all' ? 'All Records' : f}
              {filter === f && (
                <span className="px-1.5 py-0.5 font-mono text-[9px] bg-black/30">
                  {reviews.length}
                </span>
              )}
            </button>
          ))}
        </div>
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
          {reviews.map(review => (
            <div key={review.id} className="bg-[#111] border border-[#333] p-6 hover:border-gray-500 transition-colors flex flex-col md:flex-row gap-6">
              
              <div className="flex-1">
                <div className="flex items-start gap-4 mb-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-black border border-[#333] flex items-center justify-center text-white font-bold text-xs uppercase font-bangla-sans flex-shrink-0">
                    {review.customer_name[0]}
                  </div>
                  
                  {/* Header Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-white uppercase tracking-wide font-bangla-sans">
                        {review.customer_name}
                      </span>
                      <StarRating rating={review.rating} />
                      <span className={`w-fit px-2 py-0.5 border text-[9px] font-bold uppercase tracking-widest ml-0 sm:ml-auto ${
                        review.is_approved 
                          ? 'bg-[#1F8B4D]/10 text-[#1F8B4D] border-[#1F8B4D]/30' 
                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                      }`}>
                        {review.is_approved ? 'Approved' : 'Pending Review'}
                      </span>
                    </div>
                    
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                      {review.products?.name && (
                        <span className="mr-3">
                          Item: <span className="text-gray-300">{review.products.name}</span>
                        </span>
                      )}
                      Date: {new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Comment Body */}
                {review.comment ? (
                  <div className="bg-[#191715] border border-[#333] p-4 relative">
                    <div className="text-[#1F8B4D] text-3xl absolute top-2 right-4 font-serif opacity-20">"</div>
                    <p className="text-sm text-gray-400 font-bangla-serif leading-relaxed font-light relative z-10">
                      {review.comment}
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold italic mt-2">
                    No written comment provided.
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex md:flex-col items-center justify-end gap-2 pt-4 md:pt-0 border-t border-[#333] md:border-t-0 md:border-l md:pl-6 flex-shrink-0">
                {!review.is_approved && (
                  <button
                    onClick={() => approve(review.id)}
                    className="w-full md:w-12 h-10 md:h-12 flex items-center justify-center border border-transparent text-gray-500 hover:text-[#1F8B4D] hover:border-[#1F8B4D]/30 hover:bg-[#1F8B4D]/10 transition-colors"
                    title="Approve & Publish"
                  >
                    <Check size={18} strokeWidth={2.5} />
                  </button>
                )}
                <button
                  onClick={() => remove(review.id)}
                  className="w-full md:w-12 h-10 md:h-12 flex items-center justify-center border border-transparent text-gray-500 hover:text-[#C62020] hover:border-[#C62020]/30 hover:bg-[#C62020]/10 transition-colors"
                  title="Delete Record"
                >
                  <Trash2 size={18} />
                </button>
              </div>

            </div>
          ))}
          
          {reviews.length === 0 && (
            <div className="bg-[#191715] border border-[#333] p-16 text-center">
              <MessageSquare size={32} className="mx-auto text-gray-600 mb-4" strokeWidth={1} />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                No {filter === 'all' ? '' : filter} reviews found in the system.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}