import { ProgressiveAuthProvider } from '@/components/auth/ProgressiveAuthProvider'

export default function Layout({
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
