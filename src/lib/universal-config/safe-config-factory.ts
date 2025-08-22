/**
 * Safe Configuration Factory Wrapper
 * Handles initialization errors gracefully
 */

import { NextRequest, NextResponse } from 'next/server'
import { ConfigurationFactory, ConfigType } from './config-factory'

export function createSafeRouteHandlers(config: ConfigType) {
  // Create a lazy-initialized factory
  let factory: ConfigurationFactory | null = null
  let initError: Error | null = null

  const initFactory = () => {
    if (!factory && !initError) {
      try {
        factory = new ConfigurationFactory()
      } catch (error) {
        initError = error as Error
        console.error('Failed to initialize ConfigurationFactory:', error)
      }
    }
  }

  const handleError = (method: string) => {
    return async (request: NextRequest) => {
      // Try to initialize if not already done
      initFactory()

      if (initError) {
        console.error(`[${method}] Configuration Factory initialization failed:`, initError.message)
        return NextResponse.json(
          { 
            error: 'Configuration error', 
            message: 'The server is not properly configured. Please contact support.',
            details: process.env.NODE_ENV === 'development' ? initError.message : undefined
          },
          { status: 503 }
        )
      }

      if (!factory) {
        return NextResponse.json(
          { error: 'Internal server error' },
          { status: 500 }
        )
      }

      try {
        const handlers = factory.createRouteHandlers(config)
        return await handlers[method as keyof typeof handlers](request)
      } catch (error: any) {
        console.error(`[${method}] Request error:`, error)
        return NextResponse.json(
          { 
            error: 'Request failed', 
            message: error.message || 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
          },
          { status: 500 }
        )
      }
    }
  }

  return {
    GET: handleError('GET'),
    POST: handleError('POST'),
    PUT: handleError('PUT'),
    DELETE: handleError('DELETE')
  }
}