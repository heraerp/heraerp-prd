'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function MatrixIndex() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/matrix/home')
  }, [router])
  return null
}

