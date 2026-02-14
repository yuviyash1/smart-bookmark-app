'use client'
import { createClient } from '@/utils/supabase/client'
import { Bookmark } from 'lucide-react'

export default function Login() {
  const supabase = createClient()

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Bookmark className="h-16 w-16 text-blue-500" />
        </div>
        <h1 className="text-4xl font-bold">Smart Bookmarks</h1>
        <p className="text-gray-400">Save your links. Sync everywhere.</p>
        <button
          onClick={handleLogin}
          className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-all"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}