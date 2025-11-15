/**
 * React Debug Utilities
 * Comprehensive debugging for React import and component issues
 */

export interface ReactDebugInfo {
  component: string
  file: string
  hasReact: boolean
  hasClientDirective: boolean
  errorMessage?: string
  timestamp: string
}

export const reactDebugLog: ReactDebugInfo[] = []

/**
 * Debug React component loading
 */
export function debugReactComponent(
  componentName: string, 
  file: string, 
  hasReact: boolean = false,
  hasClientDirective: boolean = false
) {
  const debugInfo: ReactDebugInfo = {
    component: componentName,
    file,
    hasReact,
    hasClientDirective,
    timestamp: new Date().toISOString()
  }

  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 React Debug: ${componentName}`)
    console.log('📁 File:', file)
    console.log('⚛️ Has React import:', hasReact ? '✅' : '❌')
    console.log('👤 Has use client:', hasClientDirective ? '✅' : '❌')
    
    if (!hasReact && hasClientDirective) {
      console.error('🚨 POTENTIAL ISSUE: Client component without React import!')
    }
    
    console.groupEnd()
  }

  reactDebugLog.push(debugInfo)
  return debugInfo
}

/**
 * Check if React is properly imported
 */
export function validateReactImport() {
  if (typeof window !== 'undefined') {
    try {
      // Check if React is available globally
      const React = (window as any).React || require('react')
      console.log('✅ React available:', !!React)
      return !!React
    } catch (error) {
      console.error('❌ React import error:', error)
      return false
    }
  }
  return true // Server-side is fine
}

/**
 * Global React error boundary helper
 */
export function setupReactErrorLogging() {
  if (typeof window !== 'undefined') {
    // Capture unhandled React errors
    window.addEventListener('error', (event) => {
      if (event.message?.includes('React is not defined')) {
        console.error('🚨 REACT ERROR DETECTED:', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        })
        
        // Store error for analysis
        reactDebugLog.push({
          component: 'Unknown',
          file: event.filename || 'Unknown',
          hasReact: false,
          hasClientDirective: true,
          errorMessage: event.message,
          timestamp: new Date().toISOString()
        })
      }
    })

    // React DevTools detection
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('🛠️ React DevTools detected')
    }
  }
}

/**
 * Get debug summary
 */
export function getReactDebugSummary() {
  const issues = reactDebugLog.filter(log => !log.hasReact && log.hasClientDirective)
  
  return {
    totalComponents: reactDebugLog.length,
    issuesFound: issues.length,
    issues: issues.map(issue => ({
      component: issue.component,
      file: issue.file,
      error: issue.errorMessage
    }))
  }
}