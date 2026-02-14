'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, Plus, LogOut, ExternalLink } from 'lucide-react'

type Bookmark = {
  id: string
  title: string
  url: string
  user_id: string
}

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.push('/')
      setUser(user)
    }
    getUser()
    fetchBookmarks()
    
    // REALTIME SUBSCRIPTION
    const channel = supabase
      .channel('realtime bookmarks')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'bookmarks' 
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setBookmarks((prev) => [payload.new as Bookmark, ...prev])
        } else if (payload.eventType === 'DELETE') {
          setBookmarks((prev) => prev.filter(b => b.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, router])

  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setBookmarks(data)
    setLoading(false)
  }

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Optimistic UI update could go here, but we rely on Realtime for this demo
    const { error } = await supabase.from('bookmarks').insert({
      title: newTitle,
      url: newUrl,
      user_id: user.id
    })

    if (!error) {
      setNewTitle('')
      setNewUrl('')
    }
  }

  const deleteBookmark = async (id: string) => {
    await supabase.from('bookmarks').delete().match({ id })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="p-10 text-white">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-10">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Bookmarks</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={addBookmark} className="bg-gray-800 p-6 rounded-xl shadow-lg mb-8 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Title (e.g., My Portfolio)"
              className="flex-1 bg-gray-700 border-none rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
            />
            <input
              type="url"
              placeholder="https://..."
              className="flex-1 bg-gray-700 border-none rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              required
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2">
              <Plus size={20} /> Add
            </button>
          </div>
        </form>

        {/* List */}
        <div className="grid gap-4">
          {bookmarks.map((bookmark) => (
            <div key={bookmark.id} className="bg-gray-800 p-4 rounded-lg flex justify-between items-center border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="overflow-hidden">
                <h3 className="font-semibold text-lg truncate">{bookmark.title}</h3>
                <a href={bookmark.url} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:underline flex items-center gap-1 truncate">
                   {bookmark.url} <ExternalLink size={12} />
                </a>
              </div>
              <button 
                onClick={() => deleteBookmark(bookmark.id)}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                aria-label="Delete bookmark"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {bookmarks.length === 0 && (
            <div className="text-center text-gray-500 py-10">No bookmarks yet. Add one above!</div>
          )}
        </div>
      </div>
    </div>
  )
}