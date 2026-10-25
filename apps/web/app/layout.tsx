import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Inter, Inter_Tight, Instrument_Serif } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import { NotificationProvider } from '@/components/Notifications'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const display = Inter_Tight({ subsets: ['latin'], variable: '--font-display' })
const serif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-serif', adjustFontFallback: false })

export const metadata: Metadata = {
  title: 'CaseWin — AI justice infrastructure for Nigeria',
  description: 'From dispute to just outcome: AI legal tools, verified lawyers, dispute resolution, digital courts and open Nigerian law — one justice stack.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CaseWin AI',
  },
  formatDetection: {
    telephone: true,
  },
}

export const viewport: Viewport = {
  themeColor: '#1a2744',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} ${serif.variable}`}>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <AuthGuard>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </AuthGuard>
        </AuthProvider>
        
        {/* Service Worker Registration */}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered:', registration.scope);
                  })
                  .catch(function(error) {
                    console.log('SW registration failed:', error);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
