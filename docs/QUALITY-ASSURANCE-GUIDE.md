# HERA Quality Assurance Guide

## 🎯 Quality Standards for Enterprise-Grade Development

This guide ensures every feature built in HERA maintains the highest quality standards while enabling rapid development.

## 1. 🏗️ Architecture Quality Standards

### Universal Architecture Compliance
- **MUST** use the 6-table architecture (no custom tables)
- **MUST** store business objects in `core_entities`
- **MUST** use `core_dynamic_data` for custom fields
- **MUST** implement proper Smart Codes for all entities
- **MUST** maintain organization_id isolation

### Code Organization
```typescript
// ✅ GOOD - Follows universal patterns
const entity = await universalApi.createEntity({
  entity_type: 'staff',
  smart_code: 'HERA.SALON.STAFF.MANAGER.v1',
  organization_id: currentOrganization.id
})

// ❌ BAD - Creates custom tables
const staff = await db.staff_table.create({...})
```

## 2. 🛡️ Security Standards

### Three-Layer Authorization Pattern (MANDATORY)
Every page MUST implement:
```typescript
// Layer 1: Authentication
if (!isAuthenticated) {
  return <Alert>Please log in to access this page.</Alert>
}

// Layer 2: Context Loading
if (contextLoading) {
  return <LoadingSpinner />
}

// Layer 3: Organization Check
if (!organizationId) {
  return <Alert>No organization context found.</Alert>
}
```

### API Security Checklist
- [ ] Validate organization_id on every request
- [ ] Check user permissions for operations
- [ ] Sanitize all inputs
- [ ] Use parameterized queries
- [ ] Implement rate limiting
- [ ] Log security events

## 3. 🎨 UI/UX Quality Standards

### Component Quality
- **MUST** use HERA design system components
- **MUST** support dark/light themes
- **MUST** be fully responsive
- **MUST** have loading states
- **MUST** show error boundaries
- **MUST** use dynamic currency formatting

### Accessibility Requirements
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation support
- [ ] Screen reader compatibility
- [ ] Proper ARIA labels
- [ ] Color contrast ratios
- [ ] Focus indicators

## 4. 🧪 Testing Standards

### Unit Testing
```typescript
// Every utility function must have tests
describe('formatCurrency', () => {
  it('should format USD correctly', () => {
    expect(formatCurrency(100, 'USD')).toBe('$100.00')
  })
  
  it('should handle null values', () => {
    expect(formatCurrency(null, 'USD')).toBe('$0.00')
  })
})
```

### Integration Testing
```typescript
// Test API endpoints
describe('Staff API', () => {
  it('should enforce organization isolation', async () => {
    const response = await fetch('/api/v1/salon/staff?organization_id=other')
    expect(response.status).toBe(403)
  })
})
```

### E2E Testing Scenarios
- [ ] Complete user journey tests
- [ ] Multi-organization scenarios
- [ ] Currency switching
- [ ] PWA offline functionality
- [ ] Performance benchmarks

## 5. 📊 Performance Standards

### Page Load Targets
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Cumulative Layout Shift: < 0.1
- Largest Contentful Paint: < 2.5s

### API Response Times
- List operations: < 200ms
- Create/Update: < 300ms
- Complex queries: < 500ms
- Batch operations: < 1000ms

### Database Query Optimization
```sql
-- ✅ GOOD - Uses indexes
SELECT * FROM core_entities 
WHERE organization_id = ? 
AND entity_type = ?
AND status != 'deleted'

-- ❌ BAD - Full table scan
SELECT * FROM core_entities 
WHERE metadata->>'field' = ?
```

## 6. 🔍 Code Review Checklist

### Before Every PR
- [ ] No hardcoded values (especially currency)
- [ ] Proper error handling
- [ ] Loading states implemented
- [ ] Mobile responsive
- [ ] Dark mode compatible
- [ ] Organization isolation maintained
- [ ] Smart Codes used correctly
- [ ] Dynamic fields over schema changes
- [ ] Proper TypeScript types
- [ ] No console.log statements

### Architecture Review
- [ ] Follows universal patterns
- [ ] Reuses existing components
- [ ] No duplicate code
- [ ] Proper abstraction levels
- [ ] Clear naming conventions

## 7. 🚀 Build Quality Tools

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run lint && npm run type-check",
      "pre-push": "npm run test && npm run build"
    }
  }
}
```

### CI/CD Pipeline
```yaml
# .github/workflows/quality.yml
name: Quality Checks
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Install dependencies
        run: npm ci
      - name: Lint
        run: npm run lint
      - name: Type Check
        run: npm run type-check
      - name: Test
        run: npm run test
      - name: Build
        run: npm run build
      - name: Schema Validation
        run: node mcp-server/schema-introspection.js
```

### Automated Quality Reports
```bash
# Run quality audit
npm run quality:audit

# Generates:
# - Code coverage report
# - Bundle size analysis
# - Performance metrics
# - Security vulnerabilities
# - Accessibility issues
```

## 8. 📈 Quality Metrics

### Track These KPIs
1. **Code Coverage**: Maintain > 80%
2. **Build Success Rate**: > 95%
3. **Bug Density**: < 5 bugs per 1000 lines
4. **Technical Debt Ratio**: < 5%
5. **Performance Score**: > 90/100

### Monthly Quality Review
- [ ] Review error logs
- [ ] Analyze performance metrics
- [ ] Update dependencies
- [ ] Review security alerts
- [ ] Customer feedback analysis

## 9. 🛠️ Development Workflow

### Feature Development Process
1. **Plan**: Create HERA task entity
2. **Design**: Review with universal patterns
3. **Implement**: Follow quality standards
4. **Test**: Unit + Integration tests
5. **Review**: Code review checklist
6. **Deploy**: Automated quality gates

### Quick Quality Wins
```bash
# Before committing
npm run lint:fix          # Fix linting issues
npm run format           # Format code
npm run type-check       # Check TypeScript
npm run test:changed     # Test changed files

# Before deployment
npm run build           # Production build
npm run analyze         # Bundle analysis
npm run lighthouse      # Performance audit
```

## 10. 🎯 Quality Culture

### Best Practices
1. **Refactor regularly** - Don't let technical debt accumulate
2. **Document decisions** - Explain why, not just what
3. **Pair program** - Two eyes catch more issues
4. **Learn from incidents** - Post-mortems improve quality
5. **Celebrate quality** - Recognize good practices

### Quality Champions
- Assign quality champions per module
- Regular quality workshops
- Share learnings across team
- Contribute to documentation

## 11. 🔧 Tooling Setup

### Essential VS Code Extensions
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "formulahendry.auto-rename-tag"
  ]
}
```

### Git Hooks Configuration
```bash
# Setup quality hooks
npm install --save-dev husky lint-staged
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
```

### Lint Staged Config
```json
// .lintstagedrc.json
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

## 12. 🚨 Common Quality Issues

### How to Avoid Them

1. **Hardcoded Values**
   ```typescript
   // ❌ BAD
   const price = "$100"
   
   // ✅ GOOD
   const price = formatCurrency(100, organization.currency)
   ```

2. **Missing Error Handling**
   ```typescript
   // ❌ BAD
   const data = await fetch(url).then(r => r.json())
   
   // ✅ GOOD
   try {
     const response = await fetch(url)
     if (!response.ok) throw new Error(`HTTP ${response.status}`)
     const data = await response.json()
   } catch (error) {
     toast({ title: 'Error', description: error.message })
   }
   ```

3. **Schema Changes**
   ```typescript
   // ❌ BAD - Adding columns
   ALTER TABLE core_entities ADD COLUMN status VARCHAR;
   
   // ✅ GOOD - Using relationships
   await createRelationship({
     relationship_type: 'has_status',
     from_entity_id: entity.id,
     to_entity_id: statusEntity.id
   })
   ```

## Conclusion

Quality is not a one-time effort but a continuous process. By following these standards and using the provided tools, every developer can contribute to maintaining HERA's enterprise-grade quality while still enjoying rapid development.

Remember: **Quality enables speed, not hinders it**. Well-structured code is easier to modify, debug, and extend.