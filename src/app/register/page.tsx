'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/auth/signup')
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Redirecting to registration...</p>
    </div>
  )
}