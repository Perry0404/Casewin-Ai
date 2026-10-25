'use client'

import { usePathname } from 'next/navigation'
import LawyerGuard from '@/components/LawyerGuard'

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  // The /tools index is a public catalogue; every individual tool stays guarded.
  if (usePathname() === '/tools') return <>{children}</>
  return <LawyerGuard>{children}</LawyerGuard>
}
