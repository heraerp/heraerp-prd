# Finance DNA v2 - Architecture Diagrams

**Smart Code**: `HERA.ACCOUNTING.DIAGRAMS.ARCHITECTURE.v2`

This document contains Mermaid diagrams illustrating the Finance DNA v2 architecture and data flows.

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "Universal 6-Table Foundation"
        CO[core_organizations<br/>Multi-tenant isolation]
        CE[core_entities<br/>GL accounts, policies, users]
        CD[core_dynamic_data<br/>Account properties, policy config]
        CR[core_relationships<br/>Account hierarchies, policy links]
        UT[universal_transactions<br/>Journal entries, audit logs]
        UL[universal_transaction_lines<br/>GL line items, balances]
    end
    
    subgraph "Finance DNA v2 Core Functions"
        OV[hera_validate_organization_access]
        SC[validate_finance_dna_smart_code]
        AL[hera_audit_operation_v2]
        TB[hera_generate_trial_balance_v2]
        PC[hera_create_financial_policy_v2]
        PE[hera_execute_financial_policy_v2]
    end
    
    subgraph "Smart Code Registry (.v2 format)"
        SJE[HERA.ACCOUNTING.JOURNAL.ENTRY.v2]
        SAC[HERA.ACCOUNTING.CHART.ACCOUNT.v2]
        SAO[HERA.ACCOUNTING.AUDIT.OPERATION.v2]
        SFP[HERA.ACCOUNTING.FINANCIAL.POLICY.v2]
    end
    
    subgraph "Enterprise Features"
        RLS[Row Level Security<br/>Perfect organization isolation]
        PERF[Performance<br/>Sub-second reporting]
        AUDIT[Complete Audit Trail<br/>All operations logged]
        POLICY[Policy-as-Data Engine<br/>Dynamic business rules]
    end
    
    CO --> OV
    CE --> TB
    CD --> PC
    CR --> PE
    UT --> AL
    UL --> TB
    
    OV --> RLS
    TB --> PERF
    AL --> AUDIT
    PC --> POLICY
    
    SJE --> UT
    SAC --> CE
    SAO --> UT
    SFP --> CE
    
    style CO fill:#e1f5fe
    style CE fill:#e8f5e8
    style CD fill:#fff3e0
    style CR fill:#f3e5f5
    style UT fill:#fce4ec
    style UL fill:#e0f2f1
    
    style OV fill:#bbdefb
    style SC fill:#c8e6c9
    style AL fill:#ffcc80
    style TB fill:#ce93d8
    style PC fill:#f8bbd9
    style PE fill:#b2dfdb
```

## 🔄 Data Flow Architecture

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant API as Universal API v2
    participant Validate as Organization Validator
    participant Policy as Policy Engine
    participant Audit as Audit Logger
    participant RLS as Row Level Security
    participant DB as Sacred Six Tables
    
    Client->>API: Request with JWT + org context
    API->>Validate: hera_validate_organization_access()
    Validate->>RLS: Check org permissions
    RLS-->>Validate: ✅ Authorized
    Validate-->>API: ✅ Organization valid
    
    API->>Policy: hera_execute_financial_policy_v2()
    Policy->>DB: Query policy rules
    DB-->>Policy: Policy configuration
    Policy-->>API: ✅ Policy approved
    
    API->>DB: Execute business operation
    DB-->>API: ✅ Operation completed
    
    API->>Audit: hera_audit_operation_v2()
    Audit->>DB: Log to universal_transactions
    DB-->>Audit: ✅ Audit logged
    Audit-->>API: ✅ Audit complete
    
    API-->>Client: ✅ Success + audit trail
```

## 🧬 Smart Code Validation Flow

```mermaid
flowchart TD
    Start([Smart Code Input]) --> Check{Is Finance DNA v2 format?}
    
    Check -->|Yes| V2Format[Match: HERA.ACCOUNTING.*.v2]
    Check -->|No| V1Format[Match: HERA.*.v1]
    Check -->|Invalid| Invalid[❌ Validation Failed]
    
    V2Format --> Business{Business Context Valid?}
    V1Format --> Legacy{Legacy Format Valid?}
    
    Business -->|Yes| V2Valid[✅ Finance DNA v2 Valid]
    Business -->|No| Invalid
    
    Legacy -->|Yes| V1Valid[✅ Legacy Format Valid]
    Legacy -->|No| Invalid
    
    V2Valid --> Store[Store in universal tables]
    V1Valid --> Store
    Invalid --> Reject[❌ Reject Operation]
    
    Store --> AuditLog[Log to audit trail]
    AuditLog --> Success([✅ Operation Complete])
    
    Reject --> Error([❌ Constraint Violation])
    
    style V2Valid fill:#c8e6c9
    style V1Valid fill:#fff3e0
    style Invalid fill:#ffcdd2
    style Success fill:#e8f5e8
    style Error fill:#ffebee
```

## 📊 Policy Engine Architecture

```mermaid
graph LR
    subgraph "Policy Creation"
        PC[Policy Request] --> CE[Create Entity]
        CE --> CD[Add Dynamic Config]
        CD --> CR[Link Relationships]
    end
    
    subgraph "Policy Storage (Sacred Six)"
        E[core_entities<br/>Policy entity]
        D[core_dynamic_data<br/>Rules & thresholds]
        R[core_relationships<br/>Policy dependencies]
    end
    
    subgraph "Policy Execution"
        PE[Policy Request] --> QP[Query Policies]
        QP --> ER[Evaluate Rules]
        ER --> AD[Apply Decision]
        AD --> AL[Audit Log]
    end
    
    subgraph "Business Rules Engine"
        AMT[Amount Validation]
        AUTH[Authorization Rules]
        WF[Workflow Controls]
        COMP[Compliance Checks]
    end
    
    CE --> E
    CD --> D
    CR --> R
    
    QP --> E
    QP --> D
    QP --> R
    
    ER --> AMT
    ER --> AUTH
    ER --> WF
    ER --> COMP
    
    style E fill:#e8f5e8
    style D fill:#fff3e0
    style R fill:#f3e5f5
    style AL fill:#fce4ec
```

## ⚡ Performance Architecture

```mermaid
graph TB
    subgraph "Query Optimization"
        CTE[CTE-Based Queries<br/>No schema changes]
        IDX[Strategic Indexes<br/>org_id + entity_type]
        RLS[RLS Policies<br/>Automatic filtering]
    end
    
    subgraph "Reporting Performance"
        TB[Trial Balance<br/>18 accounts in 83ms]
        PL[P&L Generation<br/>Sub-second performance]
        BS[Balance Sheet<br/>Real-time calculation]
    end
    
    subgraph "Data Architecture"
        S6[Sacred Six Tables<br/>Universal foundation]
        SC[Smart Codes<br/>Business intelligence]
        ORG[Organization Isolation<br/>Perfect multi-tenancy]
    end
    
    CTE --> TB
    IDX --> PL
    RLS --> BS
    
    S6 --> CTE
    SC --> IDX
    ORG --> RLS
    
    TB --> GRADE[A-Grade Performance<br/>Well under 2s target]
    PL --> GRADE
    BS --> GRADE
    
    style TB fill:#c8e6c9
    style PL fill:#c8e6c9
    style BS fill:#c8e6c9
    style GRADE fill:#e8f5e8
```

## 🔐 Security Architecture

```mermaid
graph TB
    subgraph "Authentication Layer"
        JWT[JWT Token<br/>org_id + user context]
        ORG[Organization Validation<br/>hera_validate_organization_access]
        RLS[Row Level Security<br/>Automatic org filtering]
    end
    
    subgraph "Authorization Layer"
        POLICY[Policy Engine<br/>Dynamic permissions]
        ROLES[Role-Based Access<br/>Entity relationships]
        AUDIT[Audit Trail<br/>Complete logging]
    end
    
    subgraph "Data Layer"
        FILTER[Organization Filtering<br/>Sacred boundary]
        ISOLATE[Perfect Isolation<br/>Zero data leakage]
        ENCRYPT[Smart Code Encryption<br/>Business intelligence]
    end
    
    JWT --> ORG
    ORG --> RLS
    RLS --> FILTER
    
    POLICY --> ROLES
    ROLES --> AUDIT
    AUDIT --> ISOLATE
    
    FILTER --> SECURE[🔒 Enterprise Security<br/>Production Ready]
    ISOLATE --> SECURE
    ENCRYPT --> SECURE
    
    style JWT fill:#e3f2fd
    style SECURE fill:#e8f5e8
    style AUDIT fill:#fff3e0
```

---

## 📋 Diagram Export Instructions

To export these diagrams as SVG files for documentation:

1. Copy each Mermaid diagram code
2. Use Mermaid Live Editor: https://mermaid.live/
3. Export as SVG
4. Save to `/docs/mermaid/svg/` directory

**Generated Diagrams:**
- `finance-dna-v2-architecture.svg`
- `finance-dna-v2-dataflow.svg`
- `finance-dna-v2-smartcode-validation.svg`
- `finance-dna-v2-policy-engine.svg`
- `finance-dna-v2-performance.svg`
- `finance-dna-v2-security.svg`