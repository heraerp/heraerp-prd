# CivicFlow Demo Organization Setup

## Overview

CivicFlow is HERA's Public Sector CRM module, demonstrating how government services can be managed using the Sacred Six tables architecture. This demo includes constituent management, program eligibility, grants processing, case management, and outreach campaigns.

## Demo Organization Details

- **Organization ID**: `8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77`
- **Name**: CivicFlow Demo Org
- **Code**: DEMO-CIVICFLOW
- **Demo Mode**: Enabled (blocks external communications)

## Demo Users

| Email | Roles | Purpose |
|-------|-------|---------|
| demo-admin@demo.heraerp.com | Admin, PlaybookAuthor | Full system access |
| demo-operator@demo.heraerp.com | Operator | Run playbooks |
| demo-reviewer@demo.heraerp.com | Reviewer | Review and approve |
| demo-auditor@demo.heraerp.com | Auditor, ReadOnly | View-only access |

## Seed Data

The demo includes realistic government service data:

### Entities
- **100 Constituents**: Citizens with various eligibility flags (Medicaid, SNAP, Housing, Veterans, etc.)
- **20 Organizations**: Government departments and agencies
- **10 Programs**: Healthcare, Housing, Education, Employment, etc.
- **20 Grant Rounds**: Q1-Q4 2024 funding opportunities
- **10 Communication Templates**: Email/SMS templates for notifications

### Playbooks
1. **Constituents Intake Process** (5 steps)
   - Identity verification → Profile creation → Eligibility screening → Service assignment → Welcome packet

2. **Services Eligibility Assessment** (6 steps)
   - Initial screening → Document collection → Income verification → Eligibility calculation → Decision → Notification

3. **Grants Intake and Processing** (5 steps)
   - Application review → Eligibility check → Document verification → Scoring → Award decision

4. **Case Lifecycle Management** (6 steps)
   - Case triage → Assignment → Investigation → Resolution → Quality check → Case closure

5. **Outreach Notification Campaign** (5 steps)
   - Audience selection → Content preparation → Channel selection → Message sending → Response tracking

### Sample Runs
- **6 In-Progress Runs**: Active workflows across all playbook types
- **12 Completed Runs**: Historical data showing various outcomes

## Setup Instructions

### 1. Load Seed Data

```bash
# Load organization and users
psql $DATABASE_URL < seeds/civicflow-demo-org.json

# Load entities
psql $DATABASE_URL < seeds/civicflow-demo-entities.json

# Load dynamic data
psql $DATABASE_URL < seeds/civicflow-demo-dynamic-data.json

# Load playbooks
psql $DATABASE_URL < seeds/civicflow-demo-playbooks.json

# Load sample runs
psql $DATABASE_URL < seeds/civicflow-demo-runs.json
```

### 2. Access the Demo

Navigate to `/civicflow` in your HERA application. The demo organization will be automatically selected if no organization is currently active.

### 3. Demo Features

#### Demo Banner
When viewing the demo org, a banner appears at the top indicating demo mode is active.

#### Communication Guards
All external communications (email, SMS, webhooks) are blocked and logged:
- Attempts are recorded in `universal_transactions` with smart code `HERA.PUBLICSECTOR.CRM.OUTBOUND.DEMO_BLOCK.v1`
- The UI simulates successful sending for testing workflows

#### Sample Scenarios

**Constituent Intake**:
1. New resident Maria Garcia applies for services
2. Identity verified through API
3. Profile created with eligibility flags
4. Automatically enrolled in eligible programs

**Grant Processing**:
1. Community organization applies for $250K infrastructure grant
2. Application reviewed and scored
3. Documents verified
4. Grant awarded with conditions

**Case Management**:
1. Constituent requests emergency home repair assistance
2. Case triaged as high priority
3. Assigned to case worker
4. Resolution implemented
5. Follow-up scheduled

## Reset Demo Data

To reset the demo to its initial state:

```bash
cd scripts
npm run ts-node reset-civicflow-demo.ts
```

This will:
- Preserve the organization and users
- Delete all demo-generated data
- Reload the original seed data
- Maintain published playbooks

## Architecture

All CivicFlow data follows HERA's Sacred Six tables:

| Table | Usage |
|-------|-------|
| `core_organizations` | Demo organization with settings |
| `core_entities` | Constituents, orgs, programs, cases, templates |
| `core_dynamic_data` | All entity attributes and custom fields |
| `core_relationships` | Program-grant links, case subjects, etc. |
| `universal_transactions` | Playbook runs, grant applications, communications |
| `universal_transaction_lines` | Step executions, application details |

## Smart Codes

Every operation uses smart codes from the PUBLIC SECTOR CRM catalog:

- Entities: `HERA.PUBLICSECTOR.CRM.ENTITY.{TYPE}.v1`
- Playbooks: `HERA.PUBLICSECTOR.CRM.PLAYBOOK.DEF.{NAME}.v1`
- Transactions: `HERA.PUBLICSECTOR.CRM.TXN.{TYPE}.v1`
- Relationships: `HERA.PUBLICSECTOR.CRM.{FROM}.{RELATIONSHIP}`

## Development

### Using Demo Guard

```typescript
import { useDemoGuard } from '@/hooks/use-demo-guard';

function MyComponent() {
  const { isDemoMode, blockExternalComm } = useDemoGuard();

  const sendNotification = async () => {
    if (isDemoMode) {
      await blockExternalComm('email', 'user@example.com');
      // Show success UI but don't actually send
    } else {
      // Production sending logic
    }
  };
}
```

### Adding New Demo Data

1. Add entities to `seeds/civicflow-demo-entities.json`
2. Add dynamic fields to `seeds/civicflow-demo-dynamic-data.json`
3. Ensure all smart codes match the catalog
4. Run the reset script to reload

## Troubleshooting

**Demo banner not showing**: Check that organization has `metadata.settings.demo_mode = true`

**Communications not blocked**: Ensure the service uses `useDemoGuard` hook

**Data not loading**: Verify organization_id matches in all seed files

**Reset failing**: Check for foreign key constraints - the script deletes in correct order