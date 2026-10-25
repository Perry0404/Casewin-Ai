'use server'

import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { sweepOverdue } from '@/lib/sweep'

export async function releaseOverdue() {
  await requireAdmin()
  redirect(`/admin?released=${await sweepOverdue()}`)
}
