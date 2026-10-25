import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google'

const display = Fraunces({ subsets: ['latin'], variable: '--font-display', axes: ['opsz'] })
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://court.casewinai.com'),
  title: {
    default: 'CaseWin Court — the digital registry for Nigerian courts',
    template: '%s · CaseWin Court',
  },
  description:
    'E-filing, suit numbers, cause lists, hearings and judicial analytics for Nigerian courts.',
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
