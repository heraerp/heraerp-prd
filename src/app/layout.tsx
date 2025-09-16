import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { QueryProvider } from '@/src/components/providers/QueryProvider'
import { HeraThemeProvider } from '@/src/components/universal/ui/HeraThemeProvider'
import { MultiOrgAuthProvider } from '@/src/components/auth/MultiOrgAuthProvider'
// import { DemoAuthHandler } from '@/src/components/auth/DemoAuthHandler"; // Temporarily disabled due to runtime error
import { ToastProvider } from '@/src/components/ui/use-toast'
// import "./globals.css"; // Original - temporarily disabled for migration testing
import './globals-migration-test.css' // Migration test - imports both styles
// import "../styles/intro.css"; // Temporarily disabled for SSR compatibility

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'HERA Universal ERP',
  description:
    'Run your entire business in one beautiful platform. From day one to enterprise scale.',
  authors: [{ name: 'HERA Team' }],
  creator: 'HERA Corporation',
  publisher: 'HERA Corporation',
  formatDetection: {
    telephone: false
  },
  openGraph: {
    title: 'HERA Universal ERP',
    description:
      'Run your entire business in one beautiful platform. From day one to enterprise scale.',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HERA Universal ERP',
    description:
      'Run your entire business in one beautiful platform. From day one to enterprise scale.'
  },
  icons: {
    icon: [
      { url: '/favicon-16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon-32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    apple: [{ url: '/apple-touch-icon.svg', sizes: '180x180', type: 'image/svg+xml' }],
    shortcut: '/favicon.svg'
  }
}

export const viewport: Viewport = {
  themeColor: '#1E293B',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA functionality has been removed from HERA for multi-tenant safety */}
        {/* Setting cache control headers for multi-tenant security */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning={true}
      >
        <HeraThemeProvider defaultTheme="dark">
          <QueryProvider>
            <MultiOrgAuthProvider>
              <ToastProvider>{children}</ToastProvider>
            </MultiOrgAuthProvider>
          </QueryProvider>
        </HeraThemeProvider>
      </body>
    </html>
  )
}
