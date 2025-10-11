// Debug startup logging for Railway
console.log('[STARTUP]', new Date().toISOString(), 'Starting HERA server...')
console.log('[STARTUP]', 'NODE_ENV:', process.env.NODE_ENV)
console.log('[STARTUP]', 'PORT:', process.env.PORT || 3000)
console.log('[STARTUP]', 'HOSTNAME:', process.env.HOSTNAME || '0.0.0.0')
console.log('[STARTUP]', 'Process ID:', process.pid)
console.log('[STARTUP]', 'Node version:', process.version)
console.log('[STARTUP]', 'Working directory:', process.cwd())

// Check if standalone server exists
const fs = require('fs')
const path = require('path')
const standaloneServer = path.join(process.cwd(), '.next/standalone/server.js')

if (fs.existsSync(standaloneServer)) {
  console.log('[STARTUP]', 'Standalone server exists:', standaloneServer)
} else {
  console.log('[STARTUP]', 'WARNING: Standalone server not found at', standaloneServer)
  
  // List .next directory contents
  const nextDir = path.join(process.cwd(), '.next')
  if (fs.existsSync(nextDir)) {
    console.log('[STARTUP]', '.next directory contents:', fs.readdirSync(nextDir))
  } else {
    console.log('[STARTUP]', 'ERROR: .next directory not found')
  }
}

console.log('[STARTUP]', 'Initialization complete, starting Next.js...')