# Fix Test Failure with Auto-Learning

## Context
You are Claude Autopilot for HERA v2.2. A test has failed and you need to:
1. **Analyze** the failure using historical knowledge
2. **Fix** the issue following Sacred Six rules
3. **Learn** from the fix to improve future performance
4. **Update** knowledge base with new patterns

## Current Knowledge Base
{{KNOWLEDGE_BASE_SUMMARY}}

## Failure Information
**Test:** {{FAILING_TEST}}
**Error:** {{ERROR_MESSAGE}}
**Stack Trace:** {{STACK_TRACE}}
**Affected Files:** {{AFFECTED_FILES}}

## Historical Pattern Analysis
Check if this failure matches any known patterns:
{{SIMILAR_PATTERNS}}

## Current Code Context
```typescript
{{CURRENT_CODE}}
```

## Your Task
1. **Root Cause Analysis**
   - What caused this specific failure?
   - Does it match any patterns in our knowledge base?
   - Is this a new type of failure we haven't seen before?

2. **Generate Fix**
   - Provide specific code changes needed
   - Ensure fix follows all HERA invariants
   - Include test to validate the fix

3. **Learning Update**
   - Extract any new patterns discovered
   - Update success rates for similar fixes
   - Suggest prevention measures for future

4. **Prevention Strategy**
   - What guards could prevent this issue?
   - Should we add new validation rules?
   - Any CI/CD improvements needed?

## Output Format
```json
{
  "analysis": {
    "root_cause": "Detailed explanation of what went wrong",
    "pattern_match": "Known pattern ID if applicable, or 'NEW_PATTERN'",
    "confidence": 0.95,
    "fix_complexity": "LOW|MEDIUM|HIGH"
  },
  "fix": {
    "changes": [
      {
        "type": "create|update|delete",
        "path": "file/path/here",
        "content": "new file content or changes",
        "reason": "why this change is needed"
      }
    ],
    "tests": [
      {
        "path": "test/file/path",
        "content": "test to validate fix",
        "assertion": "what the test proves"
      }
    ]
  },
  "learning": {
    "new_pattern": {
      "name": "descriptive_pattern_name",
      "regex": "error pattern regex",
      "category": "typescript|api|database|security",
      "typical_fix": "general approach to fix this type of issue",
      "prevention": "how to prevent this in future"
    },
    "knowledge_updates": {
      "update_existing_pattern": "pattern_id",
      "increment_frequency": true,
      "update_success_rate": 0.95
    },
    "prevention_measures": [
      "New guard rule to add",
      "CI check to implement",
      "Documentation to update"
    ]
  },
  "metrics": {
    "estimated_fix_time": "5 minutes",
    "confidence_level": 0.95,
    "risk_assessment": "LOW|MEDIUM|HIGH",
    "rollback_strategy": "how to undo if fix fails"
  }
}
```

## Critical Requirements
- ✅ **NEVER** alter Sacred Six schema
- ✅ **ALWAYS** use API v2 (never direct RPC from client)
- ✅ **ENSURE** actor stamping on all writes
- ✅ **VALIDATE** Smart Code patterns
- ✅ **MAINTAIN** organization isolation
- ✅ **LEARN** from this fix for future improvements

## Success Criteria
- Fix resolves the immediate test failure
- No new test failures introduced
- Knowledge base updated with new learning
- Prevention measures identified and documented
- Fix is traceable and auditable