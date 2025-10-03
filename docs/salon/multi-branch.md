# Multi-Branch Operations Guide

> **Enterprise-Scale Branch Management with Universal Architecture**

## 🏢 Overview

The HERA Salon Multi-Branch system enables seamless management of multiple salon locations while maintaining centralized control and local autonomy. Built on the Universal Entity architecture, it provides infinite scalability without schema changes.

```mermaid
graph TB
    subgraph "Multi-Branch Hierarchy"
        O[Organization HQ] --> B1[Downtown Flagship]
        O --> B2[Marina Mall]
        O --> B3[Airport Terminal]
        O --> B4[Beach Walk]
        
        B1 --> S1[Staff Team 1]
        B1 --> I1[Inventory 1]
        B1 --> A1[Appointments 1]
        
        B2 --> S2[Staff Team 2]
        B2 --> I2[Inventory 2]
        B2 --> A2[Appointments 2]
        
        subgraph "Shared Resources"
            SR[Service Catalog]
            PR[Product Catalog]
            CR[Client Database]
        end
        
        B1 -.-> SR
        B2 -.-> SR
        B3 -.-> SR
        B4 -.-> SR
        
        B1 -.-> CR
        B2 -.-> CR
        B3 -.-> CR
        B4 -.-> CR
    end
    
    style O fill:#D4AF37,stroke:#B8860B,stroke-width:3px,color:#000
    style SR fill:#F5E6C8,stroke:#D4AF37,stroke-width:2px,color:#000
    style CR fill:#F5E6C8,stroke:#D4AF37,stroke-width:2px,color:#000
```

## 📊 Branch Data Model

### Entity Relationships

```mermaid
erDiagram
    ORGANIZATION ||--o{ BRANCH : has
    BRANCH ||--o{ STAFF_MEMBER : employs
    BRANCH ||--o{ APPOINTMENT : hosts
    BRANCH ||--o{ INVENTORY_ITEM : stocks
    BRANCH ||--o{ TRANSACTION : processes
    
    SERVICE }o--o{ BRANCH : available_at
    PRODUCT }o--o{ BRANCH : stocked_at
    CLIENT }o--o{ BRANCH : visits
    
    BRANCH {
        uuid id PK
        string entity_type "BRANCH"
        string entity_name
        string entity_code "BR-001"
        jsonb metadata
    }
    
    STAFF_MEMBER {
        uuid id PK
        string entity_type "STAFF"
        relationship MEMBER_OF_BRANCH
    }
    
    SERVICE {
        uuid id PK
        string entity_type "SERVICE"
        relationship AVAILABLE_AT_BRANCH
    }
```

## 🔄 Branch Setup Process

### Step-by-Step Branch Creation

```mermaid
graph LR
    subgraph "Branch Setup Flow"
        A[Create Branch Entity] --> B[Configure Details]
        B --> C[Link Staff]
        C --> D[Set Services]
        D --> E[Configure Inventory]
        E --> F[Enable POS]
        F --> G[Go Live]
    end
    
    subgraph "Configuration Details"
        B --> B1[Address & Contact]
        B --> B2[Operating Hours]
        B --> B3[Timezone]
        B --> B4[Capacity]
    end
    
    subgraph "Staff Linking"
        C --> C1[Assign Managers]
        C --> C2[Link Stylists]
        C --> C3[Set Schedules]
    end
    
    style A fill:#0F6F5C,stroke:#0A4A3F,stroke-width:2px,color:#fff
    style G fill:#D4AF37,stroke:#B8860B,stroke-width:2px,color:#000
```

## 🎯 Branch Management Features

### 1. **Centralized Control Panel**

```mermaid
graph TD
    subgraph "HQ Dashboard"
        H[Central Dashboard] --> M1[Multi-Branch Analytics]
        H --> M2[Comparative Reports]
        H --> M3[Resource Allocation]
        H --> M4[Staff Management]
        
        M1 --> A1[Revenue by Branch]
        M1 --> A2[Appointment Metrics]
        M1 --> A3[Product Performance]
        
        M2 --> C1[Branch vs Branch]
        M2 --> C2[Period Comparisons]
        M2 --> C3[Best Practices]
        
        M3 --> R1[Staff Distribution]
        M3 --> R2[Inventory Levels]
        M3 --> R3[Service Availability]
    end
    
    style H fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
```

### 2. **Branch-Specific Operations**

Each branch operates with local autonomy while maintaining organization standards:

- **Independent Scheduling**: Branch-specific appointment books
- **Local Inventory**: Separate stock levels and reordering
- **Custom Pricing**: Location-based price adjustments
- **Staff Schedules**: Branch-specific working hours
- **Local Promotions**: Targeted marketing campaigns

### 3. **Cross-Branch Features**

```mermaid
graph LR
    subgraph "Client Experience"
        C[Client] --> B1[Books at Branch 1]
        B1 --> H[Service History]
        H --> B2[Visits Branch 2]
        B2 --> P[Preferences Maintained]
    end
    
    subgraph "Staff Flexibility"
        S[Stylist] --> W1[Works Monday at Branch 1]
        W1 --> W2[Works Tuesday at Branch 2]
        W2 --> CM[Commissions Tracked]
    end
    
    subgraph "Inventory Sharing"
        I1[Branch 1 Low Stock] --> T[Transfer Request]
        T --> I2[Branch 2 Surplus]
        I2 --> A[Approved Transfer]
    end
```

## 📈 Branch Analytics

### Performance Metrics Dashboard

```mermaid
graph TD
    subgraph "Branch KPIs"
        K[Key Metrics] --> R[Revenue]
        K --> U[Utilization]
        K --> C[Client Metrics]
        K --> S[Staff Performance]
        
        R --> R1[Daily Revenue]
        R --> R2[Service vs Retail]
        R --> R3[YoY Growth]
        
        U --> U1[Chair Utilization]
        U --> U2[Peak Hours]
        U --> U3[Capacity Planning]
        
        C --> C1[New vs Returning]
        C --> C2[Average Ticket]
        C --> C3[Retention Rate]
        
        S --> S1[Productivity]
        S --> S2[Commission Earned]
        S --> S3[Client Satisfaction]
    end
    
    style K fill:#4169E1,stroke:#000080,stroke-width:2px,color:#fff
```

### Comparative Analysis

```mermaid
pie title Revenue Distribution by Branch
    "Downtown Flagship" : 35
    "Marina Mall" : 28
    "Airport Terminal" : 20
    "Beach Walk" : 17
```

## 🔐 Branch Security Model

### Access Control Matrix

```mermaid
graph TB
    subgraph "Role-Based Branch Access"
        CEO[CEO/Owner] --> ALL[All Branches]
        RM[Regional Manager] --> REGION[Regional Branches]
        BM[Branch Manager] --> SINGLE[Single Branch]
        STAFF[Staff Member] --> ASSIGNED[Assigned Branches]
        
        ALL --> V1[View All Data]
        ALL --> E1[Edit All Settings]
        
        REGION --> V2[View Region Data]
        REGION --> E2[Edit Region Settings]
        
        SINGLE --> V3[View Branch Data]
        SINGLE --> E3[Edit Branch Settings]
        
        ASSIGNED --> V4[View Schedule]
        ASSIGNED --> E4[Manage Appointments]
    end
    
    style CEO fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
    style ALL fill:#D4AF37,stroke:#B8860B,stroke-width:2px,color:#000
```

## 🚀 Implementation Guide

### Phase 1: Initial Setup

```typescript
// Create Branch Entity
const branch = await apiV2.post('entities', {
  entity_type: 'BRANCH',
  entity_name: 'Downtown Flagship',
  entity_code: 'BR-001',
  organization_id: orgId,
  smart_code: 'HERA.SALON.LOCATION.ENTITY.BRANCH.V1',
  metadata: {
    is_flagship: true,
    capacity: 12,
    operating_hours: {
      monday: { open: '09:00', close: '21:00' },
      // ... other days
    }
  }
})

// Set Dynamic Fields
await apiV2.post('entities/dynamic-data', {
  entity_id: branch.id,
  field_name: 'address',
  field_value: '123 Main Street, Downtown Dubai',
  field_type: 'text',
  smart_code: 'HERA.SALON.LOCATION.DYN.ADDRESS.V1'
})
```

### Phase 2: Staff Assignment

```typescript
// Link Staff to Branch
await apiV2.post('relationships', {
  from_entity_id: staffId,
  to_entity_id: branchId,
  relationship_type: 'STAFF_MEMBER_OF',
  organization_id: orgId,
  smart_code: 'HERA.SALON.STAFF.REL.MEMBER_OF.V1'
})
```

### Phase 3: Service Configuration

```typescript
// Make Services Available at Branch
await apiV2.post('relationships', {
  from_entity_id: serviceId,
  to_entity_id: branchId,
  relationship_type: 'SERVICE_AVAILABLE_AT',
  organization_id: orgId,
  smart_code: 'HERA.SALON.SERVICE.REL.AVAILABLE_AT.V1',
  metadata: {
    branch_specific_price: 150,
    branch_specific_duration: 60
  }
})
```

## 📊 Branch Reporting

### Financial Consolidation

```mermaid
graph TB
    subgraph "Branch P&L Consolidation"
        B1[Branch 1 P&L] --> C[Consolidated P&L]
        B2[Branch 2 P&L] --> C
        B3[Branch 3 P&L] --> C
        B4[Branch 4 P&L] --> C
        
        C --> M[Management Reports]
        C --> T[Tax Filing]
        C --> I[Investor Reports]
    end
    
    subgraph "Metrics"
        M --> M1[Revenue by Branch]
        M --> M2[Expense Analysis]
        M --> M3[Profit Margins]
        M --> M4[Growth Trends]
    end
    
    style C fill:#228B22,stroke:#006400,stroke-width:2px,color:#fff
```

### Operational Reports

- **Daily Branch Summary**: Opening/closing stats
- **Weekly Performance**: Comparative analysis
- **Monthly Consolidation**: Full financial picture
- **Quarterly Reviews**: Strategic planning data
- **Annual Reports**: Compliance and growth metrics

## 🎯 Best Practices

### 1. **Branch Naming Convention**
```
Format: BR-XXX (e.g., BR-001, BR-002)
Name: Location Descriptor (e.g., "Downtown Flagship")
```

### 2. **Service Standardization**
- Maintain core service menu across branches
- Allow branch-specific add-ons
- Coordinate pricing strategies
- Sync service updates

### 3. **Inventory Management**
```mermaid
graph LR
    subgraph "Inventory Strategy"
        C[Central Purchasing] --> D1[Branch 1 Distribution]
        C --> D2[Branch 2 Distribution]
        C --> D3[Branch 3 Distribution]
        
        D1 --> M1[Monitor Levels]
        D2 --> M2[Monitor Levels]
        D3 --> M3[Monitor Levels]
        
        M1 --> R[Reorder Point]
        M2 --> R
        M3 --> R
    end
    
    style C fill:#32CD32,stroke:#228B22,stroke-width:2px,color:#000
```

### 4. **Staff Scheduling**
- Central schedule visibility
- Cross-branch coverage
- Skill-based allocation
- Commission consistency

## 🔧 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| **Branch not visible** | Check relationship status and user permissions |
| **Services not showing** | Verify SERVICE_AVAILABLE_AT relationships |
| **Staff can't access** | Confirm STAFF_MEMBER_OF relationship active |
| **Inventory mismatch** | Run branch inventory reconciliation |
| **Reports incomplete** | Ensure all transactions have branch_id |

## 📈 Scaling Considerations

```mermaid
graph TD
    subgraph "Scaling Path"
        S1[1-5 Branches] --> S2[6-20 Branches]
        S2 --> S3[21-100 Branches]
        S3 --> S4[100+ Branches]
        
        S1 --> T1[Manual Management]
        S2 --> T2[Regional Structure]
        S3 --> T3[Automated Systems]
        S4 --> T4[AI Optimization]
    end
    
    style S4 fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
```

## 🚀 Advanced Features

### 1. **Smart Staff Allocation**
- AI-powered scheduling across branches
- Skill-based routing
- Demand prediction

### 2. **Inventory Optimization**
- Automatic transfer recommendations
- Predictive ordering
- Waste reduction analytics

### 3. **Dynamic Pricing**
- Location-based adjustments
- Demand-based pricing
- Competitor analysis integration

### 4. **Client Journey Tracking**
- Cross-branch visit patterns
- Preference synchronization
- Targeted marketing by location

---

<div align="center">

**Multi-Branch Excellence** | **Infinite Scalability** | **Zero Complexity**

[← Back to Overview](./README.md) | [Branch Analytics →](./analytics.md)

</div>