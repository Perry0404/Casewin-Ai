'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

const SESSION_MARKER_KEY = 'casewin_session_active'

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: string | null; needsEmailConfirm?: boolean }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = useMemo(() => createClient(), [])
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return

      // Force re-login if browser was closed (sessionStorage cleared)
      const marker = typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_MARKER_KEY) : null

      if (!error && data.session) {
        if (!marker) {
          // Browser was reopened — force sign out for security
          await supabase.auth.signOut()
          setSession(null)
          setUser(null)
          setLoading(false)
          return
        }
        setSession(data.session)
        setUser(data.session.user)
      }
      setLoading(false)
    }

    init()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error && typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_MARKER_KEY, 'true')
    }
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    })

    if (error) {
      return { error: error.message }
    }

    const needsEmailConfirm = !data.session
    if (!needsEmailConfirm && typeof window !== 'undefined') {
      sessionStorage.setItem(SESSION_MARKER_KEY, 'true')
    }
    return { error: null, needsEmailConfirm }
  }

  const signOut = async () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_MARKER_KEY)
    }
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
