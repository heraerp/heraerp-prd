import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals-migration-test.css'
import { HERAAuthProvider } from '@/components/auth/HERAAuthProvider'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'HERA Universal ERP',
  description: 'Run your entire business in one beautiful platform'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-inter antialiased">
        <HERAAuthProvider>
          {children}
        </HERAAuthProvider>
      </body>
    </html>
  )
}