import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { HeraThemeProvider } from '@/components/universal/ui/HeraThemeProvider'
import { ThemeProviderDNA } from '@/lib/dna/theme/theme-provider-dna'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'
import { DemoAuthHandler } from '@/components/auth/DemoAuthHandler'
import { ToastProvider } from '@/components/ui/use-toast'
// import "./globals.css"; // Original - temporarily disabled for migration testing
import './globals-migration-test.css' // Migration test - imports both styles

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
    'Run your entire business in one beautiful platform. From day one to enterprise scale.'
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
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning={true}
      >
        <HeraThemeProvider defaultTheme="light">
          {/* Add DNA theme provider as inner wrapper during migration */}
          <ThemeProviderDNA defaultTheme="ice-cream-enterprise" defaultMode="system">
            <QueryProvider>
              <HERAAuthProvider>
                <DemoAuthHandler>
                  <ToastProvider>{children}</ToastProvider>
                </DemoAuthHandler>
              </HERAAuthProvider>
            </QueryProvider>
          </ThemeProviderDNA>
        </HeraThemeProvider>
      </body>
    </html>
  )
}
