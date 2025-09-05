# HERA Universal Calendar System

## Standard Calendar Component

**`HeraDnaUniversalResourceCalendar`** is the official HERA universal calendar component. It's a Teams-inspired multi-resource calendar that adapts to any business vertical.

### Import Methods

```typescript
// Method 1: Import as UniversalCalendar (Recommended)
import { UniversalCalendar } from '@/components/calendar/UniversalCalendar'

// Method 2: Import directly
import { HeraDnaUniversalResourceCalendar } from '@/components/calendar/HeraDnaUniversalResourceCalendar'

// Method 3: Import with business-specific alias
import { TeamsCalendar } from '@/components/calendar/UniversalCalendar'
import { ResourceCalendar } from '@/components/calendar/UniversalCalendar'
```

### Usage Examples

#### Salon Implementation
```tsx
<UniversalCalendar
  businessType="salon"
  resourceType="stylist"
  appointmentType="service"
  organizations={salonBranches}
  currentOrganizationId={currentOrg.id}
/>
```

#### Healthcare Implementation
```tsx
<UniversalCalendar
  businessType="healthcare"
  resourceType="doctor"
  appointmentType="consultation"
  organizations={clinicBranches}
  currentOrganizationId={currentOrg.id}
/>
```

#### Manufacturing Implementation
```tsx
<UniversalCalendar
  businessType="manufacturing"
  resourceType="machine"
  appointmentType="job"
  organizations={factories}
  currentOrganizationId={currentOrg.id}
/>
```

### Key Features

1. **Multi-Resource View**: Display multiple resources (stylists, doctors, machines) as columns
2. **Teams-Inspired UI**: Microsoft Teams-like interface with modern design
3. **Business Agnostic**: Works for any business vertical through configuration
4. **HERA Integration**: Uses the universal 6-table architecture
5. **Multi-Organization**: Support for viewing multiple branches/locations
6. **Drag & Drop**: Move appointments between resources and time slots
7. **Conflict Prevention**: Built-in conflict detection and resolution
8. **Responsive Design**: Works on desktop, tablet, and mobile

### Migration Guide

If you're using any of these deprecated calendars, switch to UniversalCalendar:

- `SalonCalendar` → Use `UniversalCalendar` with `businessType="salon"`
- `ModernSalonCalendar` → Use `UniversalCalendar` with `businessType="salon"`
- `SimpleCalendar` → Use `UniversalCalendar` with appropriate business type
- `MicrosoftSalonCalendar` → Use `UniversalCalendar` (it has Teams UI built-in)

### Standard Props

| Prop | Type | Description |
|------|------|-------------|
| `businessType` | string | Type of business (salon, healthcare, manufacturing, etc.) |
| `resourceType` | string | Type of resource (stylist, doctor, machine, etc.) |
| `appointmentType` | string | Type of appointment (service, consultation, job, etc.) |
| `organizations` | array | List of organizations/branches to display |
| `currentOrganizationId` | string | Current selected organization ID |

## DO NOT CREATE NEW CALENDAR COMPONENTS

Always use `HeraDnaUniversalResourceCalendar` (imported as `UniversalCalendar`) for any calendar needs. It's designed to handle all business cases through configuration.