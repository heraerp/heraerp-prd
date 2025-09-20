# HERA Salon Settings System

## Overview

The Salon Settings system provides a comprehensive configuration interface for salon operations using HERA's universal 6-table architecture with Playbook procedures.

Settings are stored as an `org_config` anchor entity with dynamic JSON fields per section, enabling flexible configuration without schema changes.

## Architecture

### Data Model
- **Anchor Entity**: `core_entities` with `entity_type = 'org_config'` and `entity_name = 'Salon Settings'`
- **Dynamic Storage**: `core_dynamic_data` with field names like `salon.settings.{section}.{key}`
- **Audit Trail**: `universal_transactions` with smart code `HERA.UNIV.AUDIT.CONFIG.CHANGE.V1`

### Settings Sections

1. **General** - Basic salon information (name, timezone, currency, locale)
2. **POS Policies** - VAT profile, pricing, tips, rounding, discounts
3. **Appointment Defaults** - Duration, buffer, booking policies, reminders
4. **Commission Rules** - Base calculation, rates, role overrides
5. **Inventory** - Stock policies, reservations, returns
6. **Membership** - Tiers, discounts, renewal settings
7. **WhatsApp** - Messaging configuration and templates
8. **Hardware** - Printer settings, barcodes, POS devices
9. **Workflow Toggles** - Business process enablement
10. **Feature Flags** - Playbook mode controls

## Playbook Smart Codes

### Config Operations
- `HERA.SALON.CONFIG.READ.V1` - Read settings (all sections or specific section)
- `HERA.SALON.CONFIG.UPSERT.V1` - Update settings section atomically
- `HERA.SALON.CONFIG.ENTITY.V1` - Config anchor entity

### Field-Level Smart Codes
- `HERA.SALON.CONFIG.FIELD.{SECTION}.{KEY}.V1` - Individual field changes
- `HERA.UNIV.AUDIT.CONFIG.CHANGE.V1` - Configuration change audit

## API Endpoints

### GET /api/v1/salon/settings
Retrieve salon settings for an organization.

**Parameters:**
- `organization_id` (required) - Organization UUID
- `section` (optional) - Specific section to retrieve

**Response:**
```json
{
  "_mode": "playbook",
  "settings": {
    "sections": {
      "general": {
        "display_name": "General",
        "keys": {
          "salon_name": "Hair Talkz",
          "timezone": "Europe/London",
          "currency": "GBP",
          "locale": "en-GB"
        }
      }
    }
  }
}
```

### PUT /api/v1/salon/settings/:section
Update a specific settings section.

**Headers:**
- `Content-Type: application/json`
- `Idempotency-Key: {uuid}` (recommended)

**Body:**
```json
{
  "organization_id": "0fd09e31-d257-4329-97eb-7d7f522ed6f0",
  "patch": {
    "auto_reprice_debounce_ms": 220,
    "tip_enabled": true
  }
}
```

**Response:**
```json
{
  "_mode": "playbook",
  "success": true,
  "section": "pos",
  "version": 1672531200000
}
```

## Default Configuration

### POS Section Example
```json
{
  "vat_profile": "UK_VAT_STANDARD",
  "price_includes_tax": false,
  "tip_enabled": true,
  "tip_methods": ["cash", "card"],
  "rounding_mode": "BANKERS_2DP",
  "discount_cap_percent": 50,
  "auto_reprice_debounce_ms": 180
}
```

### Feature Flags Example
```json
{
  "playbook_mode": {
    "pos_cart": true,
    "pos_lines": false,
    "checkout": false,
    "appointments": false,
    "whatsapp": true,
    "returns": false,
    "calendar": false
  }
}
```

## Integration Points

### POS System
- `vat_profile` and `tip_enabled` feed pricing playbooks
- `auto_reprice_debounce_ms` controls UI performance
- `rounding_mode` affects final calculations

### Appointments
- `default_duration_min` sets booking defaults
- `reminder_minutes_before` configures notifications
- `auto_status_on_checkin` defines workflow behavior

### WhatsApp
- `sender_id` and `template_defaults` used by messaging system
- `daily_send_cap` enforces rate limiting

### Feature Flags
- `playbook_mode.*` toggles control strangler fig migration
- Enables gradual rollout of new Playbook-based features

## Audit Trail

All settings changes create audit transactions with:
- **Smart Code**: `HERA.UNIV.AUDIT.CONFIG.CHANGE.V1`
- **Metadata**: Section, changes, user, timestamp
- **Organization Isolation**: Perfect multi-tenant security

Query audit trail:
```sql
SELECT * FROM universal_transactions 
WHERE smart_code = 'HERA.UNIV.AUDIT.CONFIG.CHANGE.V1'
  AND organization_id = 'your-org-id'
ORDER BY created_at DESC;
```

## UI Features

### Automatic Saving
- 300ms debounced saves on field changes
- Visual feedback with toast notifications
- Optimistic UI updates for responsive feel

### Organization Isolation
- Settings scoped to Hair Talkz org: `0fd09e31-d257-4329-97eb-7d7f522ed6f0`
- Complete data isolation between organizations
- Playbook mode badge indicates active engine

### Responsive Design
- Tabbed interface matching finance settings UX
- Mobile-friendly with collapsible sidebar
- Consistent with HERA design system

## Testing

### Smoke Test
```bash
./scripts/salon-settings-smoke.sh
```

### UAT Suite
```bash
# Run UAT tests
./tests/salon-settings.uat.yml
```

### Manual Testing
1. Navigate to `/salon/settings`
2. Verify all 10 sections load
3. Test field changes with auto-save
4. Confirm audit trail creation
5. Check multi-tab behavior

## Performance

- **Load Time**: <300ms for full settings page
- **Save Operations**: Debounced, atomic, with idempotency
- **Caching**: Settings cached in browser for session
- **Database Impact**: Minimal - uses indexed org queries

## Security

- **Organization Isolation**: Sacred `organization_id` boundary
- **Audit Trail**: Complete change tracking
- **Idempotency**: Prevents duplicate operations
- **Validation**: Field-level validation before persistence