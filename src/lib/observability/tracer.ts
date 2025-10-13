/**
 * HERA OpenTelemetry Tracer
 * Distributed tracing for all HERA operations
 */

import { trace, SpanStatusCode, SpanKind } from '@opentelemetry/api'
import { v4 as uuidv4 } from 'uuid'

// Runtime gate to prevent any static imports of OTEL SDK
const isNode = process.env.NEXT_RUNTIME === 'nodejs'
const isProdBuild = !!process.env.NEXT_PHASE?.includes('phase-production-build')
const exportersDisabled = process.env.OTEL_TRACES_EXPORTER === 'none'

if (isNode && !isProdBuild && !exportersDisabled) {
  ;(async () => {
    const { NodeSDK } = await import('@opentelemetry/sdk-node')
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node')
    const { BasicTracerProvider, ConsoleSpanExporter, SimpleSpanProcessor } = await import('@opentelemetry/sdk-trace-base')
    const { Resource } = await import('@opentelemetry/resources')
    const { SemanticResourceAttributes } = await import('@opentelemetry/semantic-conventions')
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http')

    // Configure resource
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'hera-enterprise',
      [SemanticResourceAttributes.SERVICE_VERSION]: process.env.HERA_VERSION || '1.0.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
    })

    // Configure trace provider
    const provider = new BasicTracerProvider({ resource })

    // Configure exporters - only use OTLP, no Jaeger
    if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      const otlpExporter = new OTLPTraceExporter({
        url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`
      })
      provider.addSpanProcessor(new SimpleSpanProcessor(otlpExporter))
    }

    // Add console exporter in development
    if (process.env.NODE_ENV === 'development') {
      provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()))
    }

    // Register provider
    provider.register()

    // Configure and start SDK
    const sdk = new NodeSDK({
      traceProvider: provider,
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false }
        })
      ]
    })

    await sdk.start()
    console.log('[HERA Tracer] OpenTelemetry initialized successfully')
  })().catch(console.error)
}

// Export helper functions for manual tracing
export const getTracer = (componentName: string) => {
  return trace.getTracer(componentName, process.env.HERA_VERSION || '1.0.0')
}

export const generateTraceId = (): string => {
  return uuidv4().replace(/-/g, '')
}

// Ensure treeshakeable side-effect module
export {}