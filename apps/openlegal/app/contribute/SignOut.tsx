'use client'

import { createBrowserClient } from '@supabase/ssr'

export default function SignOut() {
  return (
    <button
      onClick={async () => {
        await createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!).auth.signOut()
        location.reload()
      }}
      className="rounded-lg px-2.5 py-1 text-xs text-naija-100/80 ring-1 ring-white/15 transition hover:bg-white/10 hover:text-white"
    >
      Sign out
    </button>
  )
}
