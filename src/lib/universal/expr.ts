// src/lib/universal/expr.ts
// Safe expression evaluator using Function constructor
// Avoids eval() while still providing dynamic evaluation

type ExprContext = Record<string, any>

export function expr(expression: string, context: ExprContext = {}): any {
  // Guard against obviously malicious patterns
  const forbidden = [
    'require',
    'import',
    'process',
    'global',
    '__dirname',
    '__filename',
    'module',
    'exports',
    'eval',
    'Function',
    'setTimeout',
    'setInterval',
    'setImmediate'
  ]

  for (const word of forbidden) {
    if (expression.includes(word)) {
      throw new Error(`Expression contains forbidden keyword: ${word}`)
    }
  }

  // Build parameter names and values from context
  const keys = Object.keys(context)
  const values = keys.map(k => context[k])

  try {
    // Create function with context as parameters
    // This is safer than eval but still allows dynamic execution
    const func = new Function(...keys, `return (${expression})`)
    return func(...values)
  } catch (error) {
    throw new Error(`Expression evaluation failed: ${error.message}`)
  }
}

// Type-safe expression with expected return type
export function typedExpr<T>(expression: string, context: ExprContext = {}): T {
  return expr(expression, context) as T
}

// Boolean expression shorthand
export function boolExpr(expression: string, context: ExprContext = {}): boolean {
  return Boolean(expr(expression, context))
}

// Numeric expression shorthand
export function numExpr(expression: string, context: ExprContext = {}): number {
  const result = expr(expression, context)
  if (typeof result !== 'number') {
    throw new Error(`Expression did not return a number: ${result}`)
  }
  return result
}

// String expression shorthand
export function strExpr(expression: string, context: ExprContext = {}): string {
  return String(expr(expression, context))
}
