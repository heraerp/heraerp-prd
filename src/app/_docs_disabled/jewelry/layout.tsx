import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    template: '%s - HERA Jewelry ERP Documentation',
    default: 'HERA Jewelry ERP Documentation'
  },
  description:
    "Comprehensive documentation for HERA Jewelry ERP - the world's most advanced jewelry business management platform.",
  keywords: [
    'jewelry',
    'ERP',
    'documentation',
    'inventory',
    'POS',
    'customer management',
    'repair services',
    'analytics'
  ],
  openGraph: {
    type: 'website',
    siteName: 'HERA Jewelry ERP Documentation',
    title: 'HERA Jewelry ERP Documentation',
    description: 'Complete guides for jewelry business management system'
  },
  robots: {
    index: true,
    follow: true
  }
}

export default function JewelryDocsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>
}
