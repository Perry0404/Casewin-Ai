import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', axes: ['opsz'] })
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://legalaid.casewinai.com'),
  title: {
    default: 'CaseWin Legal Aid — a free lawyer for anyone detained in Nigeria',
    template: '%s · CaseWin Legal Aid',
  },
  description:
    'Report a detention or legal problem. A verified volunteer lawyer takes it within 48 hours, and you can follow every step with your reference number.',
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#0F1729',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}
