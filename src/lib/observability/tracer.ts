/**
 * HERA OpenTelemetry Tracer
 * Distributed tracing for all HERA operations
 */

import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import {
  BasicTracerProvider,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  SpanContext
} from '@opentelemetry/sdk-trace-base'
import { Resource } from '@opentelemetry/resources'
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions'
import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { v4 as uuidv4 } from 'uuid'

export class HeraTracer {
  private static instance: HeraTracer
  private sdk?: NodeSDK
  private provider?: BasicTracerProvider

  static getInstance(): HeraTracer {
    if (!this.instance) {
      this.instance = new HeraTracer()
    }
    return this.instance
  }

  /**
   * Initialize OpenTelemetry
   */
  async initialize() {
    // Skip telemetry if disabled for build
    if (process.env.OTEL_DISABLED === '1') {
      console.log('[HERA Tracer] OpenTelemetry disabled for build')
      return
    }

    try {
      // Configure resource
      const resource = new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'hera-enterprise',
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.HERA_VERSION || '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
      })

      // Configure trace provider
      this.provider = new BasicTracerProvider({ resource })

      // Configure exporters - only use OTLP, no Jaeger
      if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
        const otlpExporter = new OTLPTraceExporter({
          url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`
        })
        this.provider.addSpanProcessor(new SimpleSpanProcessor(otlpExporter))
      }

      // Add console exporter in development
      if (process.env.NODE_ENV === 'development') {
        this.provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()))
      }

      // Register provider
      this.provider.register()

      // Configure SDK
      this.sdk = new NodeSDK({
        traceProvider: this.provider,
        instrumentations: [
          getNodeAutoInstrumentations({
            '@opentelemetry/instrumentation-fs': { enabled: false }
          })
        ]
      })

      // Start SDK
      await this.sdk.start()
      console.log('[HERA Tracer] OpenTelemetry initialized successfully')
    } catch (error) {
      console.warn('[HERA Tracer] Failed to initialize OpenTelemetry:', error)
      // Don't throw - tracing failures shouldn't break the app
    }
  }

  /**
   * Create a tracer for a component
   */
  getTracer(componentName: string) {
    return trace.getTracer(componentName, process.env.HERA_VERSION || '1.0.0')
  }

  /**
   * Trace UCR rule evaluation
   */
  async traceUCRResolve<T>(
    organizationId: string,
    ruleId: string,
    context: any,
    fn: () => Promise<T>
  ): Promise<T> {
    const tracer = this.getTracer('ucr-resolver')

    return tracer.startActiveSpan(
      'ucr.resolve',
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'hera.organization_id': organizationId,
          'hera.ucr.rule_id': ruleId,
          'hera.ucr.context': JSON.stringify(context),
          'hera.component': 'ucr'
        }
      },
      async span => {
        try {
          const result = await fn()

          span.setAttributes({
            'hera.ucr.result': JSON.stringify(result),
            'hera.ucr.success': true
          })

          span.setStatus({ code: SpanStatusCode.OK })
          return result
        } catch (error) {
          span.recordException(error as Error)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message
          })
          throw error
        } finally {
          span.end()
        }
      }
    )
  }

  /**
   * Trace guardrail validation
   */
  async traceGuardrailCheck<T>(
    organizationId: string,
    table: string,
    payload: any,
    fn: () => Promise<T>
  ): Promise<T> {
    const tracer = this.getTracer('guardrail-validator')

    return tracer.startActiveSpan(
      'guardrail.validate',
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'hera.organization_id': organizationId,
          'hera.guardrail.table': table,
          'hera.guardrail.payload_size': JSON.stringify(payload).length,
          'hera.component': 'guardrail'
        }
      },
      async span => {
        try {
          const result = await fn()

          span.setAttributes({
            'hera.guardrail.allowed': true,
            'hera.guardrail.fixes_applied': 0 // Will be updated by guardrail
          })

          span.setStatus({ code: SpanStatusCode.OK })
          return result
        } catch (error) {
          span.recordException(error as Error)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message
          })

          span.setAttributes({
            'hera.guardrail.allowed': false,
            'hera.guardrail.error': (error as Error).message
          })

          throw error
        } finally {
          span.end()
        }
      }
    )
  }

  /**
   * Trace database operation
   */
  async traceDB<T>(
    operation: 'select' | 'insert' | 'update' | 'delete',
    table: string,
    organizationId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const tracer = this.getTracer('database')

    return tracer.startActiveSpan(
      `db.${operation}`,
      {
        kind: SpanKind.CLIENT,
        attributes: {
          'db.system': 'postgresql',
          'db.operation': operation,
          'db.sql.table': table,
          'hera.organization_id': organizationId,
          'hera.component': 'database'
        }
      },
      async span => {
        const startTime = Date.now()

        try {
          const result = await fn()
          const duration = Date.now() - startTime

          span.setAttributes({
            'db.rows_affected': Array.isArray(result) ? result.length : 1,
            'hera.db.duration_ms': duration
          })

          span.setStatus({ code: SpanStatusCode.OK })
          return result
        } catch (error) {
          span.recordException(error as Error)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message
          })
          throw error
        } finally {
          span.end()
        }
      }
    )
  }

  /**
   * Trace API request
   */
  async traceAPI<T>(
    method: string,
    path: string,
    organizationId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const tracer = this.getTracer('api')

    return tracer.startActiveSpan(
      `${method} ${path}`,
      {
        kind: SpanKind.SERVER,
        attributes: {
          'http.method': method,
          'http.route': path,
          'hera.organization_id': organizationId,
          'hera.component': 'api'
        }
      },
      async span => {
        const startTime = Date.now()

        try {
          const result = await fn()
          const duration = Date.now() - startTime

          span.setAttributes({
            'http.status_code': 200,
            'hera.api.duration_ms': duration,
            'hera.api.success': true
          })

          span.setStatus({ code: SpanStatusCode.OK })
          return result
        } catch (error) {
          const statusCode = (error as any).statusCode || 500

          span.recordException(error as Error)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message
          })

          span.setAttributes({
            'http.status_code': statusCode,
            'hera.api.success': false,
            'hera.api.error': (error as Error).message
          })

          throw error
        } finally {
          span.end()
        }
      }
    )
  }

  /**
   * Trace report generation
   */
  async traceReportGeneration<T>(
    reportType: string,
    organizationId: string,
    period: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const tracer = this.getTracer('reporting')

    return tracer.startActiveSpan(
      'report.generate',
      {
        kind: SpanKind.INTERNAL,
        attributes: {
          'hera.report.type': reportType,
          'hera.organization_id': organizationId,
          'hera.report.period': period,
          'hera.component': 'reporting'
        }
      },
      async span => {
        const startTime = Date.now()

        try {
          const result = await fn()
          const duration = Date.now() - startTime

          span.setAttributes({
            'hera.report.duration_ms': duration,
            'hera.report.success': true
          })

          span.setStatus({ code: SpanStatusCode.OK })
          return result
        } catch (error) {
          span.recordException(error as Error)
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: (error as Error).message
          })
          throw error
        } finally {
          span.end()
        }
      }
    )
  }

  /**
   * Create custom span
   */
  createSpan(name: string, attributes?: Record<string, any>) {
    const tracer = this.getTracer('hera-custom')
    return tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
      attributes: {
        ...attributes,
        'hera.span.custom': true
      }
    })
  }

  /**
   * Add event to current span
   */
  addEvent(name: string, attributes?: Record<string, any>) {
    const span = trace.getActiveSpan()
    if (span) {
      span.addEvent(name, attributes)
    }
  }

  /**
   * Set attributes on current span
   */
  setAttributes(attributes: Record<string, any>) {
    const span = trace.getActiveSpan()
    if (span) {
      span.setAttributes(attributes)
    }
  }

  /**
   * Generate trace ID
   */
  generateTraceId(): string {
    return uuidv4().replace(/-/g, '')
  }

  /**
   * Extract trace context from headers
   */
  extractContext(headers: Record<string, string>): SpanContext | undefined {
    const traceId = headers['x-trace-id']
    const spanId = headers['x-span-id']
    const traceFlags = headers['x-trace-flags']

    if (!traceId || !spanId) {
      return undefined
    }

    return {
      traceId,
      spanId,
      traceFlags: parseInt(traceFlags || '0'),
      isRemote: true
    }
  }

  /**
   * Inject trace context into headers
   */
  injectContext(headers: Record<string, string>): Record<string, string> {
    const span = trace.getActiveSpan()
    if (!span) return headers

    const spanContext = span.spanContext()
    return {
      ...headers,
      'x-trace-id': spanContext.traceId,
      'x-span-id': spanContext.spanId,
      'x-trace-flags': spanContext.traceFlags.toString()
    }
  }

  /**
   * Shutdown tracer
   */
  async shutdown() {
    if (this.sdk) {
      await this.sdk.shutdown()
    }
  }
}

export const heraTracer = HeraTracer.getInstance()
