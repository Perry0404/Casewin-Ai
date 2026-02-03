'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { SavedDocument } from '@/types/database'

export default function DocumentsPage() {
  const { user, loading } = useAuth()
  const [documents, setDocuments] = useState<SavedDocument[]>([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (user) {
      fetchDocuments()
    }
  }, [user])

  const fetchDocuments = async () => {
    if (!user) return
    const supabase = createClient()
    
    const { data } = await supabase
      .from('saved_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setDocuments(data || [])
    setLoadingDocs(false)
  }

  const toggleFavorite = async (doc: SavedDocument) => {
    const supabase = createClient()
    await supabase
      .from('saved_documents')
      .update({ is_favorite: !doc.is_favorite })
      .eq('id', doc.id)
    
    fetchDocuments()
  }

  const deleteDocument = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    
    const supabase = createClient()
    await supabase
      .from('saved_documents')
      .delete()
      .eq('id', docId)
    
    fetchDocuments()
  }

  const filteredDocs = filter === 'all' 
    ? documents 
    : filter === 'favorites' 
      ? documents.filter(d => d.is_favorite)
      : documents.filter(d => d.document_type === filter)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please Log In</h1>
          <p className="text-gray-400 mb-6">You need to be logged in to view your documents.</p>
          <Link href="/auth/login" className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Documents</h1>
            <p className="text-gray-400 mt-2">Access your saved legal documents</p>
          </div>
          <Link 
            href="/tools/draft"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <span>+</span> Create New
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'favorites', 'contract', 'letter', 'pleading', 'affidavit', 'mou'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                filter === f
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {f === 'all' ? 'All Documents' : f === 'favorites' ? '⭐ Favorites' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Documents Grid */}
        {loadingDocs ? (
          <div className="text-center py-12 text-gray-400">Loading documents...</div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
            <div className="text-5xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-white mb-2">No Documents Yet</h3>
            <p className="text-gray-400 mb-6">Create your first legal document using our AI tools</p>
            <Link 
              href="/tools/draft"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
            >
              Create Document
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div 
                key={doc.id} 
                className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-green-500 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleFavorite(doc)}
                      className={`text-xl ${doc.is_favorite ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}
                    >
                      ⭐
                    </button>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="text-gray-500 hover:text-red-400"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <h3 className="font-semibold text-white mb-1 truncate">{doc.title}</h3>
                <p className="text-green-400 text-sm capitalize mb-3">{doc.document_type}</p>
                
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                  {doc.content.substring(0, 100)}...
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  <button className="text-green-400 hover:text-green-300">
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
