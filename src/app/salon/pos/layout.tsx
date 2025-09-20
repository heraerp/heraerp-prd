'use client'

import SalonDarkSidebar from '@/components/salon/SalonDarkSidebar'

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen relative overflow-hidden">
      {/* Main background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />
        {/* Animated gradient orbs for depth */}
        <div className="absolute -top-40 -left-40 h-80 w-80 animate-blob rounded-full bg-purple-500 mix-blend-multiply blur-xl opacity-20"></div>
        <div className="absolute -bottom-40 -right-40 h-80 w-80 animate-blob rounded-full bg-pink-500 mix-blend-multiply blur-xl opacity-20 animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/3 h-80 w-80 animate-blob rounded-full bg-indigo-500 mix-blend-multiply blur-xl opacity-20 animation-delay-4000"></div>
      </div>

      {/* Unified Salon Sidebar */}
      <SalonDarkSidebar />

      {/* Main content */}
      <div className="flex-1 relative z-10 ml-20">{children}</div>
    </div>
  )
}
