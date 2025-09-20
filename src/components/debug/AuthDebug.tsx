'use client'

import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export function AuthDebug() {
  const auth = useHERAAuth()

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md text-xs font-mono">
      <div className="font-bold mb-2">🧬 HERA Auth Debug</div>
      <pre>
        {JSON.stringify(
          {
            isAuthenticated: auth.isAuthenticated,
            isLoading: auth.isLoading,
            sessionType: auth.sessionType,
            user: auth.user
              ? {
                  id: auth.user.id,
                  entity_id: auth.user.entity_id,
                  role: auth.user.role,
                  session_type: auth.user.session_type
                }
              : null,
            organization: auth.organization,
            scopesCount: auth.scopes.length,
            timeRemaining: Math.round(auth.timeRemaining / 1000),
            isExpired: auth.isExpired
          },
          null,
          2
        )}
      </pre>
    </div>
  )
}
