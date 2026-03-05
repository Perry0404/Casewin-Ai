'use client'

import LawyerGuard from '@/components/LawyerGuard'

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <LawyerGuard>{children}</LawyerGuard>
}
