'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { Profile, Wallet } from '@/types/database'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  wallet: Wallet | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string, userType: string) => Promise<{ error: any; user: User | null }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  refreshWallet: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  const fetchWallet = async (userId: string) => {
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single()
    setWallet(data)
  }

  useEffect(() => {
    // Timeout to prevent hanging if Supabase is unreachable
    const timeout = setTimeout(() => {
      setLoading(false)
    }, 3000)

    // Get initial session
    supabase.auth.getSession().then(({ data }: { data: { session: any } }) => {
      clearTimeout(timeout)
      setUser(data.session?.user ?? null)
      if (data.session?.user) {
        // Fetch profile and wallet in parallel for speed
        Promise.all([
          fetchProfile(data.session.user.id),
          fetchWallet(data.session.user.id)
        ]).finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    }).catch(() => {
      clearTimeout(timeout)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          // Fetch both in parallel
          await Promise.all([
            fetchProfile(session.user.id),
            fetchWallet(session.user.id)
          ])
        } else {
          setProfile(null)
          setWallet(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, fullName: string, userType: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          user_type: userType,
        },
      },
    })
    return { error, user: data?.user ?? null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setWallet(null)
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const refreshWallet = async () => {
    if (user) {
      await fetchWallet(user.id)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      wallet,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      refreshWallet,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
