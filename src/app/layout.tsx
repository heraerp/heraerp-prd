import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { HeraThemeProvider } from '@/components/universal/ui/HeraThemeProvider'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'
// import { DemoAuthHandler } from '@/components/auth/DemoAuthHandler'; // Temporarily disabled due to runtime error
import { ToastProvider } from '@/components/ui/useToast'
import { Toaster } from '@/components/ui/toaster'
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
    <html lang="en" className="dark" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        {/* PWA functionality has been removed from HERA for multi-tenant safety */}
        {/* Setting cache control headers for multi-tenant security */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        {/* Ensure dark theme is applied immediately to prevent flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Always apply dark theme on initial load
                document.documentElement.classList.add('dark');
                // If no theme is saved, save dark theme
                if (!localStorage.getItem('hera-theme')) {
                  localStorage.setItem('hera-theme', 'dark');
                }
              })();
            `
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
        style={{
          backgroundColor: 'var(--hera-black)',
          color: 'var(--hera-light-text)',
          minHeight: '100vh'
        }}
        suppressHydrationWarning={true}
      >
        <HeraThemeProvider defaultTheme="dark">
          <QueryProvider>
            <HERAAuthProvider>
              <ToastProvider>
                {children}
                <Toaster />
              </ToastProvider>
            </HERAAuthProvider>
          </QueryProvider>
        </HeraThemeProvider>
      </body>
    </html>
  )
}
