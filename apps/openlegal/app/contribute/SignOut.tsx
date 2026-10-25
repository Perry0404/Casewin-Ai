'use client'

import { createBrowserClient } from '@supabase/ssr'

export default function SignOut() {
  return (
    <button
      onClick={async () => {
        await createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!).auth.signOut()
        location.reload()
      }}
      className="rounded-md border border-ink-line px-2.5 py-1 text-[13px] text-ink-2 transition-colors hover:bg-white hover:text-ink"
    >
      Sign out
    </button>
  )
}
