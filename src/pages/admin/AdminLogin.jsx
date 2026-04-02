import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Lock, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Authentication Successful')
      navigate('/admin')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#1F8B4D]/5 via-black to-black z-0"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-bangla-sans text-3xl md:text-4xl font-bold text-white uppercase tracking-widest mb-3">
            Pickles <span className="text-[#1F8B4D]">Corner</span>
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[1px] w-12 bg-[#333]"></div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">
              System Authentication
            </p>
            <div className="h-[1px] w-12 bg-[#333]"></div>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-[#111] border border-[#333] p-8 md:p-10 shadow-2xl">
          <div className="space-y-6">
            
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                Operator ID / Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="email"
                  className="w-full bg-black border border-[#333] text-white pl-12 pr-4 py-4 text-xs focus:outline-none focus:border-[#1F8B4D] transition-colors font-mono tracking-widest placeholder-gray-800"
                  placeholder="admin@picklescorner.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                Security Key
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="password"
                  className="w-full bg-black border border-[#333] text-white pl-12 pr-4 py-4 text-xs focus:outline-none focus:border-[#1F8B4D] transition-colors font-mono tracking-widest placeholder-gray-800"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-4 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-[10px] mt-8 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authorizing...
                </>
              ) : (
                'Initialize Session'
              )}
            </button>
            
          </div>
        </form>

        {/* Footer */}
        <p className="text-center text-[9px] text-gray-600 uppercase tracking-widest mt-8 font-mono">
          Restricted Access · Authorized Personnel Only
        </p>
        
      </div>
    </div>
  )
}