import { ProgressiveAuthProvider } from '@/components/auth/ProgressiveAuthProvider'

export default function FinancialProgressiveLayout({
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