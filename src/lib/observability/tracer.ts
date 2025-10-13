const isBuilding = process.env.NEXT_PHASE === 'phase-production-build'

type Span = { end: () => void }
const noOpTracer = {
  startActiveSpan: (_name: string, fn: (span: Span) => any) => fn({ end() {} })
}

export const heraTracer = isBuilding
  ? noOpTracer
  : (() => {
      // Real tracer would go here when re-enabled
      // For now, return no-op even at runtime
      return noOpTracer
    })()