import React from 'react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Auth Header */}
      <header className="py-6 bg-white/80 backdrop-blur-sm border-b border-gray-100/50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center">
                <span className="text-lg font-bold text-white">H</span>
              </div>
              <div>
                <span className="text-2xl font-light">HERA</span>
                <span className="text-sm text-gray-500 ml-2">Central Auth</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Auth Content */}
      <main className="flex-1">{children}</main>

      {/* Auth Footer */}
      <footer className="py-8 text-center text-sm text-gray-500">
        <p>© 2025 HERA. Enterprise ERP for Everyone.</p>
      </footer>
    </div>
  )
}
