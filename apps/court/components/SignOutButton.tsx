'use client'

import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  return (
    <button
      onClick={async () => {
        await createClient().auth.signOut()
        window.location.href = '/login'
      }}
      className="rounded-lg px-3 py-2 text-sm text-ink-300 transition hover:bg-white/5 hover:text-white"
    >
      Sign out
    </button>
  )
}
