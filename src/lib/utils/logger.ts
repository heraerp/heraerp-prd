/**
 * Simple logger utility for HERA application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: Date
  metadata?: Record<string, any>
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      metadata
    }

    // In production, you might want to send to a logging service
    // For now, we'll use console methods
    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(`[DEBUG] ${message}`, metadata || '')
        }
        break
      case 'info':
        console.info(`[INFO] ${message}`, metadata || '')
        break
      case 'warn':
        console.warn(`[WARN] ${message}`, metadata || '')
        break
      case 'error':
        console.error(`[ERROR] ${message}`, metadata || '')
        break
    }
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log('debug', message, metadata)
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log('info', message, metadata)
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log('warn', message, metadata)
  }

  error(message: string, metadata?: Record<string, any>) {
    this.log('error', message, metadata)
  }
}

// Export a singleton instance
export const logger = new Logger()

// Export the class for testing or custom instances
export { Logger }
