import { ToastProvider } from '@/components/ui/use-toast'
import AuthenticatedLayout from './AuthenticatedLayout'

export default function SalonLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <AuthenticatedLayout>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </AuthenticatedLayout>
    </ToastProvider>
  )
}