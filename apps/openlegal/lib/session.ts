import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { contributorByUser } from './contrib'

// Contributors sign in with the same account they use on CaseWin.
export function sessionClient() {
  const store = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get: (name: string) => store.get(name)?.value,
      set(name: string, value: string, options: CookieOptions) {
        try {
          store.set({ name, value, ...options })
        } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try {
          store.set({ name, value: '', ...options })
        } catch {}
      },
    },
  })
}

export async function currentUser() {
  const {
    data: { user },
  } = await sessionClient().auth.getUser()
  if (user?.email?.endsWith('@demo.casewinai.com') && process.env.NEXT_PUBLIC_DEMO !== '1') return null
  return user
}

export async function currentContributor() {
  const user = await currentUser()
  if (!user) return { user: null, contributor: null }
  return { user, contributor: await contributorByUser(user.id) }
}
