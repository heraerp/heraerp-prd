// ============================================================================
// HERA • Lexo-rank utility for Kanban ordering
// ============================================================================

const MIN = '0'
const MAX = 'z'

export function between(a?: string, b?: string): string {
  // If no neighbors, return 'm'
  if (!a && !b) return 'm'
  if (!a) return decrement(b!)
  if (!b) return increment(a)

  // normalize to same length
  const len = Math.max(a.length, b.length)
  const aa = pad(a, len)
  const bb = pad(b, len)

  if (aa >= bb) {
    // expand right side and retry
    return between(a, bb + 'm')
  }

  // find first diff char
  let i = 0
  while (i < len && aa[i] === bb[i]) i++

  const left = aa.slice(0, i)
  const x = aa[i]
  const y = bb[i]
  const mid = midChar(x, y)

  if (mid) return left + mid

  return left + aa[i] + between(aa.slice(i + 1), '')
}

function pad(s: string, len: number) {
  return s + MIN.repeat(Math.max(0, len - s.length))
}

function midChar(a: string, b: string) {
  const ca = a.charCodeAt(0)
  const cb = b.charCodeAt(0)
  if (cb - ca <= 1) return ''
  const mid = Math.floor((ca + cb) / 2)
  return String.fromCharCode(mid)
}

function increment(s: string): string {
  if (!s) return 'm1'

  const lastChar = s[s.length - 1]
  const lastCharCode = lastChar.charCodeAt(0)

  if (lastChar === MAX) {
    return s + '1'
  }

  return s.slice(0, -1) + String.fromCharCode(lastCharCode + 1)
}

function decrement(s: string): string {
  if (!s) return 'l'

  const lastChar = s[s.length - 1]
  const lastCharCode = lastChar.charCodeAt(0)

  if (lastChar === MIN) {
    return decrement(s.slice(0, -1)) + MAX
  }

  return s.slice(0, -1) + String.fromCharCode(lastCharCode - 1)
}

// Helper to generate a rank based on time for initial positioning
export function rankByTime(date: string, time: string): string {
  // Convert HH:MM to a rank like 'h08m30' for stable time-based ordering
  const [hours, minutes] = time.split(':')
  return `h${hours}m${minutes}`
}
