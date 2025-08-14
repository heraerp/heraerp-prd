'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Gem, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function JewelryLoginPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to main jewelry page after 2 seconds
    const timer = setTimeout(() => {
      router.push('/jewelry-progressive')
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [router])
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <Card className="p-8 text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center animate-pulse">
          <Gem className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">JewelryMaster Pro</h2>
        <p className="text-gray-600 mb-6">Redirecting to your jewelry dashboard...</p>
        <Button 
          onClick={() => router.push('/jewelry-progressive')}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
        >
          Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </Card>
    </div>
  )
}