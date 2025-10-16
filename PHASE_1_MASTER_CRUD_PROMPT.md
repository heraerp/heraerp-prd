# 🚀 Phase 1: Master CRUD v2 Implementation - Claude CLI Prompt

## 📋 Ready-to-Use Implementation Prompt

**Copy the prompt below and use it with Claude CLI to implement Master CRUD v2 in your HERA ERP system.**

---

## 🎯 Claude CLI Prompt

```
I need you to implement the Master CRUD v2 system for our HERA ERP application. This will create atomic, high-performance data operations that replace the current multi-step API calls with single atomic transactions.

GOAL: Implement Master CRUD v2 that achieves 73% performance improvement (300ms → 80ms) by creating atomic operations for entity + dynamic data + relationships.

REQUIREMENTS:

1. **Create Master CRUD v2 API System**
   - Single atomic operations for complete entity management
   - ACID compliance for all operations
   - 80ms target response time for typical operations
   - Support for entities, dynamic data, and relationships in one call

2. **Core Operations to Implement**
   - createEntityComplete: Entity + dynamic data + relationships atomically
   - updateEntityComplete: Update entity with all related data atomically
   - deleteEntityComplete: Remove entity and all related data atomically
   - queryEntityComplete: Retrieve entity with all related data efficiently

3. **Technical Specifications**
   - Use existing HERA Sacred Six schema (entities, dynamic_data, relationships tables)
   - Maintain organization_id filtering (sacred boundary)
   - Use RPC functions for database operations
   - Preserve all existing functionality while adding atomic operations
   - Support smart code integration
   - Include proper error handling and rollback

4. **API Interface Requirements**
   ```typescript
   // Target interface for createEntityComplete
   const result = await masterCrudV2.createEntityComplete({
     entityType: 'customer',
     entityName: 'ACME Corp',
     smartCode: 'HERA.CRM.CUSTOMER.ENTITY.PROFILE.V1',
     dynamicData: {
       email: 'contact@acme.com',
       phone: '+1-555-0123',
       industry: 'Technology',
       revenue: 5000000
     },
     relationships: [
       {
         type: 'ASSIGNED_TO',
         targetEntityId: salesRepId,
         metadata: { assigned_date: new Date().toISOString() }
       },
       {
         type: 'HAS_STATUS',
         targetSmartCode: 'HERA.CRM.STATUS.ACTIVE.V1'
       }
     ],
     organizationId: orgId
   })
   ```

5. **Performance Requirements**
   - Target 80ms response time for typical operations
   - Reduce from current 5 API calls to 1 atomic operation
   - Implement proper database transaction management
   - Use efficient RPC functions for bulk operations

6. **Implementation Strategy**
   - Create new API routes under /api/v2/master-crud/
   - Implement RPC functions for atomic operations
   - Add TypeScript interfaces for all operations
   - Include comprehensive error handling
   - Maintain backward compatibility with existing APIs

7. **File Locations to Create/Modify**
   - /src/app/api/v2/master-crud/ (new API routes)
   - /src/lib/master-crud-v2/ (core implementation)
   - /src/types/ (TypeScript interfaces)
   - Database RPC functions (if needed)

8. **Validation Requirements**
   - Ensure organization_id is included in all operations
   - Validate smart codes follow HERA format
   - Check entity_type against allowed values
   - Validate relationship types
   - Ensure data types match schema requirements

9. **Testing Approach**
   - Create test cases for atomic operations
   - Verify performance improvements
   - Test rollback functionality on errors
   - Validate data consistency

CONTEXT: 
This is Phase 1 of a 5-phase journey to create Claude Brain integration. The Master CRUD v2 system will serve as the foundation for AI-powered business intelligence. We need atomic, high-performance operations that can support both current use cases and future Claude Brain integration.

Our current HERA ERP uses the Sacred Six schema (entities, dynamic_data, relationships, transactions, transaction_lines, organizations) with Universal API V2 patterns. All operations must maintain organization_id filtering and use smart codes for business context.

Please implement this system step by step, ensuring each component works correctly before moving to the next. Focus on creating a robust foundation that delivers immediate performance benefits while preparing for future AI integration.
```

---

## 📚 Supporting Context Files

### Before Running the Prompt
Make sure Claude has access to these key files for context:

1. **Schema Reference**: `/docs/schema/hera-sacred-six-schema.yaml`
2. **Current API Patterns**: Check existing `/src/app/api/v2/` routes
3. **Type Definitions**: `/src/types/hera-database.types.ts`
4. **Universal API**: `/src/lib/client/fetchV2.ts`

### Claude CLI Command
```bash
# Navigate to your HERA project
cd /path/to/your/hera-project

# Start Claude CLI session
claude code

# Copy and paste the prompt above
# Claude will implement the Master CRUD v2 system
```

---

## 🎯 Expected Implementation Steps

Claude will likely follow these steps:

### Step 1: Analysis & Planning (5 minutes)
- Review existing codebase structure
- Analyze current API patterns
- Plan atomic operation architecture
- Define TypeScript interfaces

### Step 2: Core Implementation (45 minutes)
- Create Master CRUD v2 API routes
- Implement atomic operation functions
- Add proper error handling and rollback
- Create TypeScript interfaces

### Step 3: Integration & Testing (30 minutes)
- Test atomic operations
- Verify performance improvements
- Validate data consistency
- Ensure backward compatibility

### Step 4: Documentation & Validation (20 minutes)
- Document new API patterns
- Create usage examples
- Verify all requirements met
- Run quality checks

---

## 🔧 Implementation Checklist

### Core Features ✅
- [ ] Atomic entity creation with dynamic data and relationships
- [ ] Single API call replaces 3-5 separate calls
- [ ] ACID compliance for all operations
- [ ] 80ms target response time achieved
- [ ] Organization isolation maintained
- [ ] Smart code integration working

### API Routes ✅
- [ ] `/api/v2/master-crud/create-entity-complete`
- [ ] `/api/v2/master-crud/update-entity-complete`
- [ ] `/api/v2/master-crud/delete-entity-complete`
- [ ] `/api/v2/master-crud/query-entity-complete`

### Database Operations ✅
- [ ] RPC functions for atomic operations
- [ ] Transaction management implemented
- [ ] Rollback functionality working
- [ ] Performance optimizations applied

### TypeScript Support ✅
- [ ] Complete type definitions
- [ ] Interface exports
- [ ] Type safety for all operations
- [ ] IntelliSense support

### Error Handling ✅
- [ ] Comprehensive error messages
- [ ] Automatic rollback on failures
- [ ] Validation of all inputs
- [ ] Graceful failure modes

### Testing ✅
- [ ] Unit tests for core functions
- [ ] Integration tests for API routes
- [ ] Performance benchmarks
- [ ] Data consistency validation

---

## 📊 Success Validation

### Performance Metrics to Verify
```typescript
// Before Master CRUD v2
console.time('legacy-operation')
// 5 API calls: entity + 3 dynamic fields + 1 relationship
console.timeEnd('legacy-operation') // Expected: ~430ms

// After Master CRUD v2
console.time('master-crud-v2')
const result = await masterCrudV2.createEntityComplete({...})
console.timeEnd('master-crud-v2') // Target: ~80ms
```

### Data Integrity Checks
```typescript
// Verify atomic operations
try {
  const result = await masterCrudV2.createEntityComplete({
    // Intentionally invalid data to trigger rollback
    entityType: 'customer',
    dynamicData: { invalid_field: 'should_fail' }
  })
} catch (error) {
  // Verify no partial data was created
  const orphanedData = await checkForOrphanedRecords()
  assert(orphanedData.length === 0, 'Rollback failed')
}
```

### Quality Gates
```bash
# Run these commands after implementation
npm run lint          # Code quality check
npm run typecheck     # TypeScript validation
npm run test          # Unit test validation
npm run build         # Production build test
```

---

## 🚨 Common Implementation Pitfalls

### Avoid These Mistakes
1. **Forgetting organization_id**: Every operation must include organization filtering
2. **Skipping validation**: Validate all inputs before database operations
3. **Missing rollback**: Ensure atomic operations rollback completely on failure
4. **Performance oversights**: Use efficient RPC functions, not multiple queries
5. **Type safety gaps**: Ensure complete TypeScript coverage

### Debug Tips
```typescript
// Add performance logging
console.time('master-crud-operation')
const result = await masterCrudV2.createEntityComplete(data)
console.timeEnd('master-crud-operation')

// Validate atomicity
const beforeCount = await getRecordCount()
try {
  await masterCrudV2.createEntityComplete(invalidData)
} catch (error) {
  const afterCount = await getRecordCount()
  assert(beforeCount === afterCount, 'Atomicity violated')
}
```

---

## 🔄 Post-Implementation Actions

### Immediate Testing (30 minutes)
1. **Performance Benchmark**: Measure actual vs. target response times
2. **Data Consistency**: Verify atomic operations work correctly
3. **Error Handling**: Test rollback functionality
4. **Integration**: Ensure existing functionality preserved

### Integration Planning (Next Steps)
1. **Gradual Rollout**: Start with one entity type
2. **Performance Monitoring**: Track improvements in production
3. **Feature Flag**: Allow rollback to legacy operations if needed
4. **Documentation**: Update team on new capabilities

### Phase 2 Preparation
1. **Claude Brain Service**: Foundation ready for AI integration
2. **Natural Language Processing**: APIs ready for Claude interaction
3. **Business Context**: Smart codes provide AI context
4. **Performance**: Sub-100ms operations enable real-time AI

---

## 🎯 Success Criteria

### Phase 1 Complete When:
- ✅ Single atomic operations replace multi-step processes
- ✅ 73% performance improvement achieved (300ms → 80ms)
- ✅ Full ACID compliance for all operations
- ✅ Zero breaking changes to existing functionality
- ✅ Complete TypeScript support and documentation
- ✅ Ready for Phase 2 (Claude Brain Service) integration

### Immediate Benefits:
- **Faster Operations**: Users experience 73% speed improvement
- **Better Reliability**: Zero data inconsistency issues
- **Simpler Code**: Developers use 60% less code for operations
- **Future Ready**: Foundation prepared for AI integration

---

## 📞 Support & Next Steps

### If You Encounter Issues:
1. **Check CLAUDE.md**: Review HERA development guidelines
2. **Verify Schema**: Ensure field names match actual database
3. **Test Organization Context**: Confirm organization_id filtering
4. **Validate Smart Codes**: Check format compliance

### After Successful Implementation:
1. **Measure Results**: Document actual performance improvements
2. **Plan Rollout**: Gradually migrate existing operations
3. **Prepare Phase 2**: Review Claude Brain Service requirements
4. **Share Success**: Document lessons learned for team

**Ready to transform your HERA ERP with 73% faster operations? Copy the prompt above and start your Claude CLI session!**