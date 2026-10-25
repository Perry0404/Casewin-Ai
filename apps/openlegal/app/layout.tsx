import './globals.css'
import DemoBar from '@/components/DemoBar'
import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google'

const serif = Source_Serif_4({ subsets: ['latin'], variable: '--font-serif', style: ['normal', 'italic'] })
const sans = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700'] })
const mono = IBM_Plex_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://openlegal.casewinai.com'),
  title: {
    default: 'OpenLegal Nigeria — free, searchable Nigerian law',
    template: '%s · OpenLegal Nigeria',
  },
  description: 'Judgments published by Nigerian courts and the laws they apply — free to read, search and build on, with an open API and MCP server for AI tools.',
  icons: { icon: '/icon.svg' },
  robots: process.env.NEXT_PUBLIC_DEMO === '1' ? { index: false, follow: false } : undefined,
  openGraph: { siteName: 'OpenLegal Nigeria', type: 'website' },
}

export const viewport: Viewport = { themeColor: '#ffffff', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans text-[15px] leading-relaxed">
        <DemoBar />
        {children}
      </body>
    </html>
  )
}
