export type RetryOptions = { retries?: number; delayMs?: number; factor?: number }

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3
  const factor = opts.factor ?? 2
  const base = opts.delayMs ?? 250

  let attempt = 0,
    lastErr: any
  while (attempt <= retries) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt === retries) break
      const wait = base * Math.pow(factor, attempt)
      await new Promise(r => setTimeout(r, wait))
      attempt++
    }
  }
  throw lastErr
}
