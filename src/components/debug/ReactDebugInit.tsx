'use client'

import React, { useEffect } from 'react'
import { setupReactErrorLogging, validateReactImport, getReactDebugSummary } from '@/lib/debug/react-debug'

/**
 * React Debug Initialization Component
 * Sets up global React error tracking and debugging
 */
export default function ReactDebugInit() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Initializing React Debug System...')
      
      // Setup error logging
      setupReactErrorLogging()
      
      // Validate React availability
      const reactAvailable = validateReactImport()
      
      if (reactAvailable) {
        console.log('✅ React Debug System: Initialized successfully')
      } else {
        console.error('❌ React Debug System: React not available!')
      }
      
      // Add debug commands to window for manual testing
      if (typeof window !== 'undefined') {
        (window as any).heraDebug = {
          checkReact: validateReactImport,
          getDebugSummary: getReactDebugSummary,
          clearLog: () => {
            const { reactDebugLog } = require('@/lib/debug/react-debug')
            reactDebugLog.length = 0
            console.log('🧹 React debug log cleared')
          }
        }
        
        console.log('🛠️ Debug commands available: window.heraDebug')
        console.log('  - window.heraDebug.checkReact() - Check React availability')
        console.log('  - window.heraDebug.getDebugSummary() - Get debug summary')
        console.log('  - window.heraDebug.clearLog() - Clear debug log')
      }
    }
  }, [])

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div style={{ display: 'none' }}>
      {/* Hidden debug component - just for initialization */}
    </div>
  )
}