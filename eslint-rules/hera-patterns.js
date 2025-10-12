/**
 * Custom ESLint Rules for HERA Patterns
 * Enforces HERA coding standards and architectural principles
 */

module.exports = {
  rules: {
    'smart-code-format': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Enforce HERA smart code format pattern',
          category: 'HERA Standards'
        },
        fixable: 'code',
        schema: []
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === 'string' && node.value.startsWith('HERA.')) {
              const smartCodePattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.V[0-9]+$/
              
              if (!smartCodePattern.test(node.value)) {
                context.report({
                  node,
                  message: 'Smart code must follow HERA pattern: HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.V{VERSION}',
                  fix(fixer) {
                    // Auto-fix lowercase version numbers
                    const fixed = node.value.replace(/\.v([0-9]+)$/, '.V$1')
                    return fixer.replaceText(node, `'${fixed}'`)
                  }
                })
              }
            }
          }
        }
      }
    },

    'api-response-format': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Enforce standard API response format',
          category: 'HERA Standards'
        },
        schema: []
      },
      create(context) {
        return {
          CallExpression(node) {
            if (
              node.callee?.object?.name === 'NextResponse' &&
              node.callee?.property?.name === 'json' &&
              node.arguments[0]?.type === 'ObjectExpression'
            ) {
              const props = node.arguments[0].properties
              const hasSuccess = props.some(prop => 
                prop.key?.name === 'success' || prop.key?.value === 'success'
              )
              
              if (!hasSuccess) {
                context.report({
                  node,
                  message: 'API responses should include "success" field for consistency'
                })
              }
            }
          }
        }
      }
    },

    'no-status-columns': {
      meta: {
        type: 'error',
        docs: {
          description: 'Prevent status columns in favor of relationships',
          category: 'HERA Architecture'
        },
        schema: []
      },
      create(context) {
        return {
          TemplateElement(node) {
            if (node.value.raw.includes('status') && 
                node.value.raw.includes('varchar') &&
                !node.value.raw.includes('--')) {
              context.report({
                node,
                message: 'Use core_relationships for status tracking instead of status columns'
              })
            }
          }
        }
      }
    },

    'require-organization-id': {
      meta: {
        type: 'error',
        docs: {
          description: 'Require organization_id in database queries',
          category: 'HERA Security'
        },
        schema: []
      },
      create(context) {
        return {
          TemplateElement(node) {
            if (node.value.raw.includes('FROM core_entities') &&
                !node.value.raw.includes('organization_id')) {
              context.report({
                node,
                message: 'Database queries must include organization_id filter for multi-tenant isolation'
              })
            }
          }
        }
      }
    },

    'consistent-exports': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Enforce consistent export patterns',
          category: 'HERA Standards'
        },
        schema: []
      },
      create(context) {
        let hasDefaultExport = false
        let namedExportCount = 0
        
        return {
          ExportDefaultDeclaration() {
            hasDefaultExport = true
          },
          ExportNamedDeclaration() {
            namedExportCount++
          },
          'Program:exit'() {
            if (hasDefaultExport && namedExportCount > 1) {
              context.report({
                message: 'Avoid mixing default export with multiple named exports'
              })
            }
          }
        }
      }
    },

    'smart-code-constants': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prefer smart code constants over string literals',
          category: 'HERA Standards'
        },
        schema: []
      },
      create(context) {
        return {
          Literal(node) {
            if (typeof node.value === 'string' && 
                node.value.startsWith('HERA.') &&
                node.parent?.type !== 'Property') {
              context.report({
                node,
                message: 'Consider using smart code constants instead of string literals'
              })
            }
          }
        }
      }
    },

    'hera-naming-convention': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Enforce HERA component naming conventions',
          category: 'HERA Standards'
        },
        schema: []
      },
      create(context) {
        return {
          FunctionDeclaration(node) {
            if (node.id?.name) {
              // Check for component naming pattern
              if (node.id.name.match(/^[A-Z]/) && 
                  !node.id.name.match(/^(Salon|Civic|Hera|Universal)/)) {
                context.report({
                  node,
                  message: 'Component names should start with domain prefix (Salon, Civic, Hera, Universal)'
                })
              }
            }
          }
        }
      }
    },

    'require-error-handling': {
      meta: {
        type: 'error',
        docs: {
          description: 'Require error handling in API routes',
          category: 'HERA Security'
        },
        schema: []
      },
      create(context) {
        return {
          ExportNamedDeclaration(node) {
            if (node.declaration?.type === 'FunctionDeclaration' &&
                node.declaration.async &&
                (node.declaration.id?.name === 'GET' ||
                 node.declaration.id?.name === 'POST' ||
                 node.declaration.id?.name === 'PUT' ||
                 node.declaration.id?.name === 'DELETE')) {
              
              const hasErrorHandling = node.declaration.body.body.some(stmt =>
                stmt.type === 'TryStatement'
              )
              
              if (!hasErrorHandling) {
                context.report({
                  node,
                  message: 'API route functions must include error handling (try-catch)'
                })
              }
            }
          }
        }
      }
    }
  }
}