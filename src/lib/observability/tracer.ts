const ENABLE_OTEL = process.env.HERA_OTEL === 'true';
export function initTracer() {
  if (!ENABLE_OTEL) return;
  try {
    // Lazy require so webpack doesn't resolve at build:
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const sdk = new NodeSDK({});
    sdk.start();
  } catch (e) {
    console.warn('OTEL disabled or exporter missing:', e?.message || e);
  }
}