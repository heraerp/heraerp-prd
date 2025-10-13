// Never statically import '@opentelemetry/sdk-node' here.
// Only use dynamic import inside the guarded block below.

import { trace } from '@opentelemetry/api'

// Export a tracer getter for callers (middleware imports this)
export const heraTracer = () => trace.getTracer('hera')

// Gate any SDK init so it does not run in the Next.js build worker or when exporters are disabled
const isNode = process.env.NEXT_RUNTIME === 'nodejs'
const isProdBuild = !!process.env.NEXT_PHASE?.includes('phase-production-build')
const exportersDisabled = process.env.OTEL_TRACES_EXPORTER === 'none'

if (isNode && !isProdBuild && !exportersDisabled) {
  ;(async () => {
    const { NodeSDK } = await import('@opentelemetry/sdk-node') // dynamic import, never at top-level
    // Optionally import instrumentations/exporters dynamically too
    // const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');

    const sdk = new NodeSDK({
      // instrumentations: [getNodeAutoInstrumentations()],
      // configure resource/exporters here if you actually use them at runtime
    })

    await sdk.start()
    // Do NOT export sdk — callers should use heraTracer() which is API-only
  })().catch(console.error)
}

export {} // make this module side-effect only and tree-shakeable