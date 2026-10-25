import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Newsreader } from 'next/font/google'

const serif = Newsreader({ subsets: ['latin'], variable: '--font-serif', style: ['normal', 'italic'], axes: ['opsz'], adjustFontFallback: false })
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://openlegal.casewinai.com'),
  title: {
    default: 'OpenLegal Nigeria — free, searchable Nigerian law',
    template: '%s · OpenLegal Nigeria',
  },
  description: 'Judgments published by Nigerian courts and the laws they apply — free to read, search and build on, with an open API and MCP server for AI tools.',
  icons: { icon: '/icon.svg' },
  openGraph: { siteName: 'OpenLegal Nigeria', type: 'website' },
}

export const viewport: Viewport = { themeColor: '#FBFAF6', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  )
}
