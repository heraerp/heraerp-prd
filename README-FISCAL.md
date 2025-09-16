# HERA Fiscal Settings Documentation

## Overview

The HERA Fiscal Settings system provides enterprise-grade fiscal year and period management using the Sacred Six tables architecture. This system enables organizations to configure fiscal years, manage accounting periods, and execute proper closing procedures with complete audit trails.

## Data Architecture (Sacred Six Only)

All fiscal data is stored in `core_dynamic_data` using organization-scoped policies:

### Policy Keys

1. **`FISCAL.CONFIG.v1`** - Fiscal year configuration
   ```json
   {
     "fiscal_year_start": "2025-01-01",
     "retained_earnings_account": "3200",
     "lock_after_days": 7
   }
   ```

2. **`FISCAL.PERIODS.v1`** - Array of fiscal periods
   ```json
   [
     {
       "code": "2025-01",
       "from": "2025-01-01",
       "to": "2025-01-31",
       "status": "open",
       "locked_at": null,
       "locked_by": null,
       "closed_at": null,
       "closed_by": null
     }
   ]
   ```

3. **`FISCAL.CLOSE.CHECKLIST.v1`** - Period close checklist state
   ```json
   [
     {
       "key": "pos_posted",
       "label": "All POS transactions posted",
       "description": "Ensure all daily sales are recorded",
       "completed": true,
       "completed_at": "2025-01-31T23:45:00Z",
       "completed_by": "john@example.com"
     }
   ]
   ```

## Smart Codes for Procedures

Fiscal actions are recorded as universal transactions with these smart codes:

### Configuration Updates
- `HERA.FIN.FISCAL.CONFIG.UPDATE.v1` - Update fiscal configuration
- `HERA.FIN.FISCAL.PERIODS.UPDATE.v1` - Update fiscal periods
- `HERA.FIN.FISCAL.CHECKLIST.UPDATE.v1` - Update checklist items

### Period Actions
- `HERA.FIN.FISCAL.PERIOD.LOCK.v1` - Lock a fiscal period
- `HERA.FIN.FISCAL.PERIOD.CLOSE.v1` - Close a fiscal period
- `HERA.FIN.FISCAL.YEAR.CLOSE.v1` - Close the fiscal year

## Fiscal Close Checklist

The system includes a comprehensive checklist to ensure all necessary steps are completed before closing a period:

### Default Checklist Items

1. **All POS transactions posted** - Daily sales recorded and verified
2. **All commissions accrued** - Staff commissions calculated and posted
3. **VAT reconciled** - Tax calculations verified against sales
4. **Inventory valuation posted** - Physical counts match system records
5. **Bank accounts reconciled** - All statements matched and cleared
6. **Receivables reviewed** - Customer balances verified
7. **Payables reviewed** - Vendor balances confirmed
8. **Depreciation posted** - Monthly depreciation calculated
9. **Accruals posted** - Prepaid and accrued expenses recorded
10. **Financial reports generated** - P&L, Balance Sheet, Cash Flow completed
11. **System backup completed** - Full data backup performed
12. **Management approval received** - Finance manager review and sign-off

### Checklist Semantics

- Each item must be explicitly marked complete
- Completion timestamps and user attribution are recorded
- Optional notes can be added to each item
- Checklist completion gates period closing
- Items can be customized per organization needs

## Guardrails and Business Rules

### Organization Isolation
- All operations are strictly filtered by `organization_id`
- No cross-organization data access is possible
- Each organization has independent fiscal configuration

### No Schema Changes
- All fiscal data stored in `core_dynamic_data`
- No custom tables or columns required
- Fully compatible with Sacred Six architecture

### Smart Code Audit Trail
- Every fiscal action creates a universal transaction
- Complete audit trail with timestamps and user attribution
- Smart codes enable filtering and reporting
- Idempotent operations prevent duplicate processing

### Period Management Rules

1. **Period Status Flow**:
   - `open` → `locked` → `closed`
   - Open periods can be locked or closed
   - Locked periods can only be closed
   - Closed periods cannot be modified

2. **Closing Prerequisites**:
   - All checklist items must be completed
   - User must have appropriate permissions
   - Organization must be in valid state

3. **Year Close Requirements**:
   - All periods in the year must be closed
   - Retained earnings account must be configured
   - Explicit confirmation required
   - Posts net income to retained earnings

## Rollback and Adjustments

### Important: No Direct Reopening
Once a period is closed, it cannot be reopened. This ensures:
- Audit trail integrity
- Compliance with accounting principles
- Prevention of unauthorized changes

### Adjustment Procedures
For post-close corrections:
1. Create adjustment entries in the current open period
2. Reference the original period in transaction metadata
3. Use appropriate adjustment smart codes
4. Document reason for adjustment

### Emergency Procedures
In extreme cases requiring period reopening:
1. Contact system administrator
2. Document business justification
3. Execute database-level reversal (requires elevated privileges)
4. Recreate audit trail entries

## Implementation Best Practices

### Period Generation
- Generate all 12 periods at fiscal year start
- Verify date ranges match business calendar
- Consider holidays and business closures
- Set appropriate auto-lock thresholds

### Checklist Management
- Review checklist items with finance team
- Customize based on business processes
- Add organization-specific requirements
- Train staff on completion procedures

### Month-End Procedures
1. Complete all operational tasks
2. Work through checklist systematically
3. Perform reconciliations and reviews
4. Generate required reports
5. Obtain management approval
6. Execute period close

### Year-End Procedures
1. Ensure all periods are closed
2. Verify retained earnings account
3. Review annual financial statements
4. Document any adjustments needed
5. Execute year close with appropriate authorization
6. Begin new fiscal year setup

## Security Considerations

### Permission Requirements
- `manage_finances` permission for configuration changes
- `manage_settings` permission for period management
- Owner/manager roles typically have full access
- Implement additional approval workflows as needed

### Data Protection
- All fiscal data encrypted at rest
- Audit trails cannot be modified
- Automatic backup before major operations
- Complete activity logging for compliance

## API Integration

The fiscal system exposes these operations:

### Configuration Management
```typescript
await fiscalApi.getConfig(organizationId)
await fiscalApi.setConfig(organizationId, config)
```

### Period Operations
```typescript
await fiscalApi.getPeriods(organizationId)
await fiscalApi.generatePeriods(fiscalYearStart)
await fiscalApi.lockPeriod(organizationId, periodCode)
await fiscalApi.closePeriod(organizationId, periodCode)
```

### Checklist Management
```typescript
await fiscalApi.getChecklist(organizationId)
await fiscalApi.updateChecklistItem(key, completed)
```

### Year-End Processing
```typescript
await fiscalApi.closeYear(organizationId, {
  fiscal_year: "2025",
  retained_earnings_account: "3200",
  confirm_all_periods_closed: true,
  notes: "Annual closing"
})
```

## Troubleshooting

### Common Issues

1. **Cannot close period**
   - Verify all checklist items are complete
   - Check user has appropriate permissions
   - Ensure period is not already closed

2. **Cannot close year**
   - Verify all periods are closed
   - Check retained earnings account is configured
   - Ensure confirmation checkbox is checked

3. **Period dates overlap**
   - Review period generation logic
   - Check for manual period modifications
   - Regenerate periods if necessary

4. **Checklist not saving**
   - Verify organization context is set
   - Check for network connectivity
   - Review browser console for errors

### Support Procedures

For fiscal system issues:
1. Document the specific error message
2. Note the organization ID and period
3. Capture browser console logs
4. Contact support with details

## Future Enhancements

Planned improvements to the fiscal system:

1. **Multi-Currency Support** - Handle foreign currency translations
2. **Automated Closing** - Schedule automatic period closes
3. **Approval Workflows** - Multi-level approval for closes
4. **Custom Checklists** - Industry-specific templates
5. **Closing Reports** - Automated report generation
6. **Integration APIs** - External system notifications