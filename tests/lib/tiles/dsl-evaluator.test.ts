/**
 * HERA Universal Tile System - DSL Evaluator Unit Tests
 * Comprehensive test suite for condition evaluation and dynamic value resolution
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { DSLEvaluator } from '@/lib/tiles/dsl-evaluator'
import type { ConditionExpression, EvaluationContext } from '@/lib/tiles/dsl-types'

describe('DSLEvaluator', () => {
  let evaluator: DSLEvaluator

  beforeEach(() => {
    evaluator = new DSLEvaluator()
  })

  describe('Basic Condition Evaluation', () => {
    const mockContext: EvaluationContext = {
      user: {
        user_id: 'user-123',
        email: 'john@example.com',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        metadata: {
          department: 'engineering',
          level: 'senior'
        }
      },
      organization: {
        organization_id: 'org-456',
        name: 'Test Corp',
        plan: 'enterprise',
        settings: {
          features: ['analytics', 'api_access'],
          limits: {
            users: 1000,
            storage: 500
          }
        }
      },
      entity: {
        entity_id: 'entity-789',
        entity_type: 'CUSTOMER',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z'
      },
      variables: {
        current_time: '2024-01-20T15:30:00Z',
        last_7_days: '2024-01-13T15:30:00Z'
      }
    }

    describe('Equals Operator', () => {
      it('evaluates string equality correctly', () => {
        const condition: ConditionExpression = {
          field: 'user.role',
          operator: 'equals',
          value: 'admin'
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })

      it('evaluates string inequality correctly', () => {
        const condition: ConditionExpression = {
          field: 'user.role',
          operator: 'equals',
          value: 'user'
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(false)
      })

      it('evaluates numeric equality correctly', () => {
        const condition: ConditionExpression = {
          field: 'organization.settings.limits.users',
          operator: 'equals',
          value: 1000
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })
    })

    describe('Not Equals Operator', () => {
      it('evaluates string not equals correctly', () => {
        const condition: ConditionExpression = {
          field: 'user.role',
          operator: 'not_equals',
          value: 'user'
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })

      it('evaluates false when values are equal', () => {
        const condition: ConditionExpression = {
          field: 'user.role',
          operator: 'not_equals',
          value: 'admin'
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(false)
      })
    })

    describe('Comparison Operators', () => {
      it('evaluates greater_than correctly', () => {
        const condition: ConditionExpression = {
          field: 'organization.settings.limits.users',
          operator: 'greater_than',
          value: 500
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })

      it('evaluates less_than correctly', () => {
        const condition: ConditionExpression = {
          field: 'organization.settings.limits.storage',
          operator: 'less_than',
          value: 1000
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })

      it('evaluates greater_than_or_equal correctly', () => {
        const condition: ConditionExpression = {
          field: 'organization.settings.limits.users',
          operator: 'greater_than_or_equal',
          value: 1000
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })

      it('evaluates less_than_or_equal correctly', () => {
        const condition: ConditionExpression = {
          field: 'organization.settings.limits.storage',
          operator: 'less_than_or_equal',
          value: 500
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })
    })

    describe('Array Operators', () => {
      it('evaluates contains correctly', () => {
        const condition: ConditionExpression = {
          field: 'user.permissions',
          operator: 'contains',
          value: 'write'
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })

      it('evaluates not_contains correctly', () => {
        const condition: ConditionExpression = {
          field: 'user.permissions',
          operator: 'not_contains',
          value: 'admin'
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })

      it('evaluates in correctly with array values', () => {
        const condition: ConditionExpression = {
          field: 'user.role',
          operator: 'in',
          value: ['admin', 'manager', 'user']
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })

      it('evaluates not_in correctly with array values', () => {
        const condition: ConditionExpression = {
          field: 'user.role',
          operator: 'not_in',
          value: ['guest', 'visitor']
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })
    })

    describe('Exists Operator', () => {
      it('evaluates exists correctly for existing fields', () => {
        const condition: ConditionExpression = {
          field: 'user.metadata.department',
          operator: 'exists',
          value: true
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })

      it('evaluates exists correctly for non-existing fields', () => {
        const condition: ConditionExpression = {
          field: 'user.metadata.nonexistent',
          operator: 'exists',
          value: true
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(false)
      })

      it('evaluates not exists correctly', () => {
        const condition: ConditionExpression = {
          field: 'user.metadata.nonexistent',
          operator: 'exists',
          value: false
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })
    })

    describe('Date Operators', () => {
      it('evaluates date_after correctly', () => {
        const condition: ConditionExpression = {
          field: 'entity.created_at',
          operator: 'date_after',
          value: '2024-01-10T00:00:00Z'
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })

      it('evaluates date_before correctly', () => {
        const condition: ConditionExpression = {
          field: 'entity.created_at',
          operator: 'date_before',
          value: '2024-01-20T00:00:00Z'
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })
    })

    describe('Pattern Matching', () => {
      it('evaluates starts_with correctly', () => {
        const condition: ConditionExpression = {
          field: 'user.email',
          operator: 'starts_with',
          value: 'john'
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })

      it('evaluates ends_with correctly', () => {
        const condition: ConditionExpression = {
          field: 'user.email',
          operator: 'ends_with',
          value: 'example.com'
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })

      it('evaluates contains_text correctly', () => {
        const condition: ConditionExpression = {
          field: 'user.email',
          operator: 'contains_text',
          value: '@'
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })

      it('evaluates regex_match correctly', () => {
        const condition: ConditionExpression = {
          field: 'user.email',
          operator: 'regex_match',
          value: '^[a-z]+@[a-z]+\\.[a-z]+$'
        }

        expect(evaluator.evaluateCondition(condition, mockContext)).toBe(true)
      })
    })
  })

  describe('Dynamic Value Resolution', () => {
    const mockContext: EvaluationContext = {
      user: {
        user_id: 'user-123',
        role: 'admin'
      },
      organization: {
        organization_id: 'org-456',
        name: 'Test Corp'
      },
      entity: {
        entity_id: 'entity-789'
      },
      variables: {
        current_date: '2024-01-20',
        api_base_url: 'https://api.example.com'
      }
    }

    it('resolves user context variables', () => {
      expect(evaluator.resolveValue('$user.user_id', mockContext)).toBe('user-123')
      expect(evaluator.resolveValue('$user.role', mockContext)).toBe('admin')
    })

    it('resolves organization context variables', () => {
      expect(evaluator.resolveValue('$organization.organization_id', mockContext)).toBe('org-456')
      expect(evaluator.resolveValue('$organization.name', mockContext)).toBe('Test Corp')
    })

    it('resolves entity context variables', () => {
      expect(evaluator.resolveValue('$entity.entity_id', mockContext)).toBe('entity-789')
    })

    it('resolves custom variables', () => {
      expect(evaluator.resolveValue('{{current_date}}', mockContext)).toBe('2024-01-20')
      expect(evaluator.resolveValue('{{api_base_url}}', mockContext)).toBe('https://api.example.com')
    })

    it('resolves complex template strings', () => {
      const template = '/api/users/$user.user_id/organizations/$organization.organization_id'
      const resolved = evaluator.resolveValue(template, mockContext)
      expect(resolved).toBe('/api/users/user-123/organizations/org-456')
    })

    it('resolves mixed template with variables', () => {
      const template = '{{api_base_url}}/users/$user.user_id'
      const resolved = evaluator.resolveValue(template, mockContext)
      expect(resolved).toBe('https://api.example.com/users/user-123')
    })

    it('returns original value when no template markers found', () => {
      expect(evaluator.resolveValue('simple-string', mockContext)).toBe('simple-string')
      expect(evaluator.resolveValue(123, mockContext)).toBe(123)
      expect(evaluator.resolveValue(true, mockContext)).toBe(true)
    })

    it('handles missing context values gracefully', () => {
      expect(evaluator.resolveValue('$user.nonexistent', mockContext)).toBe('')
      expect(evaluator.resolveValue('{{missing_var}}', mockContext)).toBe('')
    })
  })

  describe('Complex Condition Sets', () => {
    const complexContext: EvaluationContext = {
      user: {
        user_id: 'user-123',
        role: 'manager',
        permissions: ['read', 'write'],
        metadata: {
          department: 'sales',
          tenure_years: 3
        }
      },
      organization: {
        organization_id: 'org-456',
        plan: 'professional',
        settings: {
          features: ['analytics', 'reporting'],
          limits: { users: 250 }
        }
      },
      entity: {
        entity_type: 'CUSTOMER',
        status: 'active'
      },
      variables: {}
    }

    it('evaluates multiple conditions with AND logic', () => {
      const conditions: ConditionExpression[] = [
        {
          field: 'user.role',
          operator: 'equals',
          value: 'manager'
        },
        {
          field: 'user.permissions',
          operator: 'contains',
          value: 'write'
        },
        {
          field: 'organization.plan',
          operator: 'not_equals',
          value: 'free'
        }
      ]

      expect(evaluator.evaluateConditions(conditions, complexContext)).toBe(true)
    })

    it('evaluates multiple conditions where one fails', () => {
      const conditions: ConditionExpression[] = [
        {
          field: 'user.role',
          operator: 'equals',
          value: 'admin' // This will fail
        },
        {
          field: 'user.permissions',
          operator: 'contains',
          value: 'write'
        }
      ]

      expect(evaluator.evaluateConditions(conditions, complexContext)).toBe(false)
    })

    it('handles empty conditions array', () => {
      expect(evaluator.evaluateConditions([], complexContext)).toBe(true)
    })

    it('evaluates nested object field access', () => {
      const condition: ConditionExpression = {
        field: 'user.metadata.tenure_years',
        operator: 'greater_than',
        value: 2
      }

      expect(evaluator.evaluateCondition(condition, complexContext)).toBe(true)
    })

    it('evaluates deeply nested object field access', () => {
      const condition: ConditionExpression = {
        field: 'organization.settings.limits.users',
        operator: 'greater_than',
        value: 100
      }

      expect(evaluator.evaluateCondition(condition, complexContext)).toBe(true)
    })
  })

  describe('Error Handling', () => {
    const mockContext: EvaluationContext = {
      user: { user_id: 'test' },
      organization: { organization_id: 'test' },
      entity: {},
      variables: {}
    }

    it('handles invalid field paths gracefully', () => {
      const condition: ConditionExpression = {
        field: 'invalid.deeply.nested.field',
        operator: 'equals',
        value: 'test'
      }

      expect(evaluator.evaluateCondition(condition, mockContext)).toBe(false)
    })

    it('handles unsupported operators gracefully', () => {
      const condition: ConditionExpression = {
        field: 'user.user_id',
        operator: 'unsupported_operator' as any,
        value: 'test'
      }

      expect(() => evaluator.evaluateCondition(condition, mockContext)).toThrow()
    })

    it('handles null/undefined values in context', () => {
      const contextWithNulls: EvaluationContext = {
        user: { user_id: null, role: undefined },
        organization: { organization_id: 'test' },
        entity: {},
        variables: {}
      }

      const condition: ConditionExpression = {
        field: 'user.user_id',
        operator: 'equals',
        value: null
      }

      expect(evaluator.evaluateCondition(condition, contextWithNulls)).toBe(true)
    })

    it('handles type coercion for comparisons', () => {
      const condition: ConditionExpression = {
        field: 'user.user_id',
        operator: 'equals',
        value: '123'
      }

      const contextWithNumber: EvaluationContext = {
        user: { user_id: 123 },
        organization: { organization_id: 'test' },
        entity: {},
        variables: {}
      }

      expect(evaluator.evaluateCondition(condition, contextWithNumber)).toBe(false) // Strict comparison
    })
  })

  describe('Performance and Edge Cases', () => {
    it('handles very deep object nesting', () => {
      const deepContext: EvaluationContext = {
        user: {
          metadata: {
            settings: {
              preferences: {
                ui: {
                  theme: {
                    color: {
                      primary: '#3B82F6'
                    }
                  }
                }
              }
            }
          }
        },
        organization: { organization_id: 'test' },
        entity: {},
        variables: {}
      }

      const condition: ConditionExpression = {
        field: 'user.metadata.settings.preferences.ui.theme.color.primary',
        operator: 'equals',
        value: '#3B82F6'
      }

      expect(evaluator.evaluateCondition(condition, deepContext)).toBe(true)
    })

    it('handles array field access', () => {
      const contextWithArray: EvaluationContext = {
        user: {
          tags: ['admin', 'power_user', 'beta_tester']
        },
        organization: { organization_id: 'test' },
        entity: {},
        variables: {}
      }

      // Note: Array index access would need to be supported in the evaluator
      // This tests the contains operator with arrays
      const condition: ConditionExpression = {
        field: 'user.tags',
        operator: 'contains',
        value: 'beta_tester'
      }

      expect(evaluator.evaluateCondition(condition, contextWithArray)).toBe(true)
    })

    it('handles large condition sets efficiently', () => {
      const largeConditionSet: ConditionExpression[] = Array.from({ length: 100 }, (_, i) => ({
        field: 'user.user_id',
        operator: 'not_equals' as const,
        value: `invalid-${i}`
      }))

      const mockContext: EvaluationContext = {
        user: { user_id: 'valid-user' },
        organization: { organization_id: 'test' },
        entity: {},
        variables: {}
      }

      // All conditions should pass (user_id is not equal to any invalid-X)
      const start = Date.now()
      const result = evaluator.evaluateConditions(largeConditionSet, mockContext)
      const duration = Date.now() - start

      expect(result).toBe(true)
      expect(duration).toBeLessThan(100) // Should complete quickly
    })

    it('handles complex template resolution with multiple variables', () => {
      const complexTemplate = 'Hello $user.name, your organization {{org_display_name}} has {{feature_count}} features enabled. Visit {{base_url}}/dashboard/$organization.organization_id'
      
      const contextWithVars: EvaluationContext = {
        user: { name: 'John Doe' },
        organization: { organization_id: 'org-123' },
        entity: {},
        variables: {
          org_display_name: 'ACME Corp',
          feature_count: '15',
          base_url: 'https://app.example.com'
        }
      }

      const resolved = evaluator.resolveValue(complexTemplate, contextWithVars)
      expect(resolved).toBe('Hello John Doe, your organization ACME Corp has 15 features enabled. Visit https://app.example.com/dashboard/org-123')
    })
  })
})