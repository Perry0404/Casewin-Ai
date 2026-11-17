import { cookies } from 'next/headers'

/** A one-time link handed to the admin who made it (2-minute httpOnly cookie; see admin/actions.ts). */
export function readLink(): { label: string; link: string } | null {
  try {
    const v = cookies().get('linkhandover')?.value
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}
