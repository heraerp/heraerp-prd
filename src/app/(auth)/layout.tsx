// ================================================================================
// HERA AUTH LAYOUT
// Smart Code: HERA.LAYOUT.AUTH.v1
// Auth pages layout without navigation
// ================================================================================

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      {children}
    </div>
  )
}
