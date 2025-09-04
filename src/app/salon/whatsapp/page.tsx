'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronLeft,
  MessageCircle
} from 'lucide-react'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { SalonWhatsAppManager } from '@/components/salon/SalonWhatsAppManager'

export default function SalonWhatsAppPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900 flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/salon')}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  WhatsApp Business (HERA DNA)
                </h1>
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Universal messaging system with salon-specific templates
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800 border border-green-300">
                  <MessageCircle className="w-3 h-3 mr-1" />
                  HERA DNA Powered
                </Badge>
              </div>
            </div>
          </div>
          
          {/* HERA DNA WhatsApp Manager */}
          <SalonWhatsAppManager />
        </div>
      </div>
    </div>
  )
}