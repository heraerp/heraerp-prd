/**
 * ESLint Rule: smart-code-validator
 *
 * Enforces HERA DNA smart code standards:
 * - Version must be lowercase (.v1 not .V1)
 * - Must have 6-10 segments
 * - Must match HERA pattern
 *
 * @example
 * // ❌ Bad
 * smart_code: 'HERA.SALON.POS.SALE.V1'
 *
 * // ✅ Good
 * smart_code: 'HERA.SALON.POS.SALE.COMMIT.v1'
 */

const SMART_CODE_PATTERN = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce HERA DNA smart code standards',
      category: 'Best Practices',
      recommended: true
    },
    fixable: 'code',
    schema: [],
    messages: {
      uppercaseVersion: 'Smart code version must be lowercase (.v{{version}} not .V{{version}})',
      invalidSegments: 'Smart code must have 6-10 segments, found {{count}}',
      invalidPattern: 'Smart code does not match HERA DNA pattern',
      useConstant: 'Use HERA_SMART_CODES constants instead of hardcoded strings'
    }
  },

  create(context) {
    return {
      // Check string literals
      Literal(node) {
        if (typeof node.value !== 'string') return
        if (!node.value.startsWith('HERA.')) return

        const code = node.value

        // Check uppercase version
        const uppercaseMatch = code.match(/\.V(\d+)$/)
        if (uppercaseMatch) {
          context.report({
            node,
            messageId: 'uppercaseVersion',
            data: { version: uppercaseMatch[1] },
            fix(fixer) {
              const fixed = code.replace(/\.V(\d+)$/, '.v$1')
              return fixer.replaceText(node, `'${fixed}'`)
            }
          })
          return
        }

        // Check segment count
        const segments = code.split('.')
        if (segments.length < 6 || segments.length > 10) {
          context.report({
            node,
            messageId: 'invalidSegments',
            data: { count: segments.length }
          })
          return
        }

        // Check pattern
        if (!SMART_CODE_PATTERN.test(code)) {
          context.report({
            node,
            messageId: 'invalidPattern'
          })
        }
      },

      // Check template literals
      TemplateLiteral(node) {
        if (node.quasis.length === 1) {
          const value = node.quasis[0].value.raw
          if (value.startsWith('HERA.') && /\.V\d+/.test(value)) {
            context.report({
              node,
              messageId: 'uppercaseVersion',
              data: { version: value.match(/\.V(\d+)/)?.[1] || '1' }
            })
          }
        }
      }
    }
  }
}
