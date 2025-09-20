'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { RotateCcw, Zap } from 'lucide-react'

interface DemoResetButtonProps {
  onReset?: () => void
  className?: string
}

export function DemoResetButton({ onReset, className = '' }: DemoResetButtonProps) {
  const [isResetting, setIsResetting] = useState(false)

  const handleReset = async () => {
    setIsResetting(true)

    try {
      // Clear any localStorage data
      if (typeof window !== 'undefined') {
        const keysToKeep = ['auth-token', 'user-preferences']
        const allKeys = Object.keys(localStorage)

        allKeys.forEach(key => {
          if (!keysToKeep.includes(key) && key.includes('crm')) {
            localStorage.removeItem(key)
          }
        })
      }

      // Call parent reset function if provided
      if (onReset) {
        onReset()
      }

      // Refresh the page to reload demo data
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('Error resetting demo:', error)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 ${className}`}
          disabled={isResetting}
        >
          {isResetting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600 mr-2" />
              Resetting...
            </>
          ) : (
            <>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Demo
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-600" />
            Reset Demo Environment
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              This will reset the CRM demo to its original state with fresh TechVantage Solutions
              data:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>5 professional contacts with realistic business scenarios</li>
              <li>$1.8M pipeline with enterprise opportunities</li>
              <li>Active tasks and upcoming meetings</li>
              <li>Performance metrics and sales analytics</li>
            </ul>
            <p className="text-sm font-medium text-emerald-700 mt-3">
              Perfect for starting fresh presentations and customer demos.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleReset} className="bg-emerald-600 hover:bg-emerald-700">
            Reset Demo Data
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
