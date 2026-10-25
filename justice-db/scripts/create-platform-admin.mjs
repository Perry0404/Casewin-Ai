// Creates (or promotes) a CaseWin platform admin for court.casewinai.com/admin.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node justice-db/scripts/create-platform-admin.mjs you@casewinai.com "Your Name"
//
// Prints a temporary password for a new account. Change it after first sign-in
// via Supabase (Authentication → Users) or the password-reset flow.

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'node:crypto'

const [email, fullName = 'CaseWin Admin'] = process.argv.slice(2)
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!email || !url || !key) {
  console.error('Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node create-platform-admin.mjs <email> "<name>"')
  process.exit(1)
}

const db = createClient(url, key, { auth: { persistSession: false } })

let userId
let password
const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 })
const existing = list?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
if (existing) {
  userId = existing.id
} else {
  password = randomBytes(12).toString('base64url')
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: fullName } })
  if (error) throw error
  userId = data.user.id
}

const { error } = await db.from('platform_admins').upsert({ user_id: userId, full_name: fullName })
if (error) throw error

console.log(`Platform admin ready: ${email}`)
if (password) console.log(`Temporary password: ${password}`)
console.log('Sign in at https://court.casewinai.com/login')
