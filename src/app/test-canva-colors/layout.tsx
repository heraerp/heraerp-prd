import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HERA ERP - Test Canva Colors',
  description: 'Testing Canva-inspired color scheme for HERA ERP',
}

export default function TestCanvaColorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <link 
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@700;800;900&family=Inter:wght@400;500;600;700;800;900&display=swap" 
        rel="stylesheet" 
      />
      {children}
    </>
  )
}