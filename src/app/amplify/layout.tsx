import React from 'react'

export default function AmplifyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      {children}
    </div>
  )
}
