import { ProgressiveAuthProvider } from '@/components/auth/ProgressiveAuthProvider'

export default function CRMProgressiveLayout({
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