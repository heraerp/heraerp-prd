import { ProgressiveAuthProvider } from '@/components/auth/ProgressiveAuthProvider'

export default function JewelryProgressiveLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProgressiveAuthProvider>
      {children}
    </ProgressiveAuthProvider>
  )
}