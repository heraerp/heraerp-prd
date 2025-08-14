import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import educationConfig from '../../config/education.config'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: educationConfig.name,
  description: `AI-powered learning platform for ${educationConfig.subject}`,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
