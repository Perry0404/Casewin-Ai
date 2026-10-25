import './globals.css'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google'

const sans = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700'] })
const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif', style: ['normal', 'italic'] })
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://court.casewinai.com'),
  title: {
    default: 'CaseWin Court — registry services for Nigerian courts',
    template: '%s · CaseWin Court',
  },
  description: 'E-filing, suit numbers, cause lists, hearings, judgments and judicial analytics for Nigerian courts.',
  icons: { icon: '/icon.svg' },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans text-[15px] leading-relaxed">{children}</body>
    </html>
  )
}
