import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'See Your Future ERP Working in Two Weeks | HERA',
  description:
    'Stop imagining. Start seeing your actual business running on HERA. While others show demos, we show your reality.',
  keywords: 'ERP, business software, fast implementation, HERA, enterprise resource planning',
  openGraph: {
    title: 'See Your Future ERP Working in Two Weeks',
    description: 'Stop imagining. Start seeing your actual business running on HERA.',
    images: ['/og-landing.jpg']
  }
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  )
}
