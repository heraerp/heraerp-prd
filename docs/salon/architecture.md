# HERA Salon Architecture Guide

> **Enterprise-Grade Architecture on Universal Foundation**

## 🏗️ System Architecture Overview

```mermaid
graph TB
    subgraph "Client Layer"
        C1[Web Browser]
        C2[Mobile PWA]
        C3[Tablet POS]
        C4[Digital Displays]
    end
    
    subgraph "Application Layer"
        A1[Next.js App Router]
        A2[React Server Components]
        A3[API Routes]
        A4[WebSocket Handler]
    end
    
    subgraph "Business Logic Layer"
        B1[Universal API v2]
        B2[Smart Code Engine]
        B3[Security Middleware]
        B4[Auto-Journal DNA]
        B5[Workflow Engine]
        B6[Notification Service]
    end
    
    subgraph "Data Access Layer"
        D1[Supabase Client]
        D2[Row Level Security]
        D3[Real-time Subscriptions]
        D4[Connection Pooling]
    end
    
    subgraph "Database Layer"
        E1[(core_organizations)]
        E2[(core_entities)]
        E3[(core_dynamic_data)]
        E4[(core_relationships)]
        E5[(universal_transactions)]
        E6[(universal_transaction_lines)]
    end
    
    C1 --> A1
    C2 --> A1
    C3 --> A1
    C4 --> A4
    
    A1 --> B1
    A3 --> B1
    A4 --> B6
    
    B1 --> D1
    B3 --> D2
    B6 --> D3
    
    D1 --> E1
    D1 --> E2
    D1 --> E3
    D1 --> E4
    D1 --> E5
    D1 --> E6
    
    style B1 fill:#D4AF37,stroke:#B8860B,stroke-width:3px,color:#000
    style E1 fill:#F5E6C8,stroke:#D4AF37,stroke-width:2px,color:#000
    style E2 fill:#F5E6C8,stroke:#D4AF37,stroke-width:2px,color:#000
    style E3 fill:#F5E6C8,stroke:#D4AF37,stroke-width:2px,color:#000
    style E4 fill:#F5E6C8,stroke:#D4AF37,stroke-width:2px,color:#000
    style E5 fill:#F5E6C8,stroke:#D4AF37,stroke-width:2px,color:#000
    style E6 fill:#F5E6C8,stroke:#D4AF37,stroke-width:2px,color:#000
```

## 📊 Data Model Architecture

### Universal Entity Model for Salon

```mermaid
erDiagram
    ORGANIZATION ||--o{ BRANCH : has
    ORGANIZATION ||--o{ STAFF : employs
    ORGANIZATION ||--o{ CLIENT : serves
    ORGANIZATION ||--o{ SERVICE : offers
    
    BRANCH ||--o{ APPOINTMENT : hosts
    BRANCH ||--o{ INVENTORY : stocks
    BRANCH ||--o{ TRANSACTION : processes
    
    STAFF ||--o{ APPOINTMENT : performs
    STAFF ||--o{ TRANSACTION : handles
    STAFF ||--o{ COMMISSION : earns
    
    CLIENT ||--o{ APPOINTMENT : books
    CLIENT ||--o{ TRANSACTION : pays
    CLIENT ||--o{ LOYALTY : accumulates
    
    SERVICE ||--o{ APPOINTMENT : included_in
    SERVICE ||--o{ TRANSACTION_LINE : sold_as
    
    APPOINTMENT ||--o{ TRANSACTION : generates
    TRANSACTION ||--o{ TRANSACTION_LINE : contains
    TRANSACTION ||--o{ PAYMENT : settled_by
    
    ORGANIZATION {
        uuid id PK
        string name
        jsonb metadata
    }
    
    BRANCH {
        uuid id PK
        string entity_type "BRANCH"
        string entity_name
        jsonb metadata
    }
    
    STAFF {
        uuid id PK
        string entity_type "STAFF"
        string entity_name
        jsonb metadata
    }
```

## 🔄 Request Flow Architecture

```mermaid
sequenceDiagram
    participant Client
    participant NextJS
    participant Middleware
    participant API
    participant Security
    participant Database
    participant Cache
    
    Client->>NextJS: HTTPS Request
    NextJS->>Middleware: Process Request
    Middleware->>Middleware: Rate Limiting
    Middleware->>Middleware: JWT Validation
    Middleware->>Security: Check Permissions
    Security->>Security: Organization Context
    Security->>Security: RBAC Validation
    Security->>API: Authorized Request
    API->>Cache: Check Cache
    
    alt Cache Hit
        Cache-->>API: Cached Response
    else Cache Miss
        API->>Database: Query with RLS
        Database-->>API: Data
        API->>Cache: Update Cache
    end
    
    API-->>NextJS: JSON Response
    NextJS-->>Client: Rendered Page
```

## 🎯 Component Architecture

### Frontend Component Hierarchy

```mermaid
graph TD
    subgraph "Page Components"
        P1[Dashboard Page]
        P2[Appointments Page]
        P3[Clients Page]
        P4[Services Page]
        P5[POS Page]
        P6[Reports Page]
    end
    
    subgraph "Feature Components"
        F1[AppointmentCalendar]
        F2[ClientProfile]
        F3[ServiceCatalog]
        F4[POSInterface]
        F5[BranchSelector]
    end
    
    subgraph "Shared Components"
        S1[DataTable]
        S2[FormBuilder]
        S3[ChartRenderer]
        S4[NotificationBar]
    end
    
    subgraph "DNA Components"
        D1[UniversalForm]
        D2[SmartTable]
        D3[SecureProvider]
        D4[ThemeProvider]
    end
    
    P1 --> F1
    P1 --> F5
    P2 --> F1
    P3 --> F2
    P4 --> F3
    P5 --> F4
    
    F1 --> S1
    F2 --> S2
    F3 --> S1
    F4 --> S4
    
    S1 --> D2
    S2 --> D1
    S3 --> D4
    S4 --> D3
    
    style D1 fill:#D4AF37,stroke:#B8860B,stroke-width:2px,color:#000
    style D2 fill:#D4AF37,stroke:#B8860B,stroke-width:2px,color:#000
    style D3 fill:#D4AF37,stroke:#B8860B,stroke-width:2px,color:#000
    style D4 fill:#D4AF37,stroke:#B8860B,stroke-width:2px,color:#000
```

## 🔐 Security Architecture

### Multi-Layer Security Model

```mermaid
graph TB
    subgraph "Request Security Flow"
        R[Incoming Request]
        R --> L1[Layer 1: Rate Limiting]
        L1 --> L2[Layer 2: Authentication]
        L2 --> L3[Layer 3: Organization Check]
        L3 --> L4[Layer 4: Permission Check]
        L4 --> L5[Layer 5: RLS Enforcement]
        L5 --> DB[(Database)]
    end
    
    subgraph "Security Checks"
        L1 --> C1{Rate OK?}
        C1 -->|No| E1[429 Too Many Requests]
        C1 -->|Yes| L2
        
        L2 --> C2{Valid JWT?}
        C2 -->|No| E2[401 Unauthorized]
        C2 -->|Yes| L3
        
        L3 --> C3{Org Access?}
        C3 -->|No| E3[403 Forbidden]
        C3 -->|Yes| L4
        
        L4 --> C4{Permission?}
        C4 -->|No| E4[403 Forbidden]
        C4 -->|Yes| L5
        
        L5 --> C5{RLS Pass?}
        C5 -->|No| E5[404 Not Found]
        C5 -->|Yes| S[Success]
    end
    
    style L1 fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
    style L2 fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
    style L3 fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
    style L4 fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
    style L5 fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
```

## 🚀 Performance Architecture

### Caching Strategy

```mermaid
graph LR
    subgraph "Cache Layers"
        C1[Browser Cache]
        C2[CDN Cache]
        C3[API Cache]
        C4[Database Cache]
    end
    
    subgraph "Cache Policies"
        P1[Static Assets: 1 year]
        P2[API Routes: 5 minutes]
        P3[User Data: 1 minute]
        P4[Reports: 1 hour]
    end
    
    C1 --> P1
    C2 --> P1
    C3 --> P2
    C3 --> P3
    C4 --> P4
    
    style C3 fill:#0F6F5C,stroke:#0A4A3F,stroke-width:2px,color:#fff
```

### Load Distribution

```mermaid
pie title Request Distribution
    "Static Assets" : 45
    "API Calls" : 30
    "Real-time Updates" : 15
    "Background Jobs" : 10
```

## 📈 Scalability Architecture

### Horizontal Scaling Model

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[HAProxy/AWS ALB]
    end
    
    subgraph "Application Instances"
        A1[Instance 1]
        A2[Instance 2]
        A3[Instance 3]
        AN[Instance N]
    end
    
    subgraph "Shared Services"
        R[(Redis Cluster)]
        Q[Message Queue]
        S[Session Store]
    end
    
    subgraph "Database Cluster"
        M[(Primary)]
        R1[(Read Replica 1)]
        R2[(Read Replica 2)]
    end
    
    LB --> A1
    LB --> A2
    LB --> A3
    LB --> AN
    
    A1 --> R
    A2 --> R
    A3 --> Q
    AN --> S
    
    A1 --> M
    A2 --> R1
    A3 --> R2
    
    style LB fill:#4169E1,stroke:#000080,stroke-width:2px,color:#fff
    style M fill:#228B22,stroke:#006400,stroke-width:2px,color:#fff
```

## 🔄 Integration Architecture

### External System Integration

```mermaid
graph LR
    subgraph "HERA Salon Core"
        H[Universal API]
    end
    
    subgraph "Payment Systems"
        P1[Stripe]
        P2[Square]
        P3[PayPal]
    end
    
    subgraph "Communication"
        C1[Twilio SMS]
        C2[SendGrid Email]
        C3[WhatsApp Business]
    end
    
    subgraph "Analytics"
        A1[Google Analytics]
        A2[Mixpanel]
        A3[Custom BI]
    end
    
    subgraph "Accounting"
        AC1[QuickBooks]
        AC2[Xero]
        AC3[SAP]
    end
    
    H --> P1
    H --> P2
    H --> P3
    
    H --> C1
    H --> C2
    H --> C3
    
    H --> A1
    H --> A2
    H --> A3
    
    H --> AC1
    H --> AC2
    H --> AC3
    
    style H fill:#D4AF37,stroke:#B8860B,stroke-width:3px,color:#000
```

## 🎯 Deployment Architecture

### Production Deployment Model

```mermaid
graph TB
    subgraph "Development"
        D1[Local Dev]
        D2[Feature Branch]
    end
    
    subgraph "Testing"
        T1[CI/CD Pipeline]
        T2[Automated Tests]
        T3[Staging Deploy]
    end
    
    subgraph "Production"
        P1[Blue Environment]
        P2[Green Environment]
        P3[Database Migration]
    end
    
    subgraph "Monitoring"
        M1[Prometheus]
        M2[Grafana]
        M3[Sentry]
    end
    
    D1 --> D2
    D2 --> T1
    T1 --> T2
    T2 --> T3
    T3 --> P1
    P1 -.->|Switch| P2
    P1 --> M1
    P1 --> M2
    P1 --> M3
    
    style P1 fill:#32CD32,stroke:#228B22,stroke-width:2px,color:#000
    style P2 fill:#87CEEB,stroke:#4682B4,stroke-width:2px,color:#000
```

## 📋 Architecture Principles

### 1. **Universal-First Design**
- All data stored in 6 sacred tables
- No custom schemas or migrations
- Infinite flexibility through dynamic fields

### 2. **Security by Default**
- Organization isolation at every layer
- Role-based access control
- Automatic audit trails

### 3. **Performance Optimization**
- Intelligent caching strategies
- Database query optimization
- Lazy loading and code splitting

### 4. **Scalability Built-In**
- Stateless application design
- Horizontal scaling ready
- Multi-region support

### 5. **Developer Experience**
- Type safety throughout
- Consistent API patterns
- Comprehensive documentation

## 🔧 Technology Decisions

| Component | Technology | Rationale |
|-----------|------------|-----------|
| **Frontend Framework** | Next.js 15.4 | Server components, App Router, optimal performance |
| **UI Library** | React 19.1 | Latest features, concurrent rendering |
| **Database** | PostgreSQL | ACID compliance, JSON support, proven scale |
| **API Layer** | Universal API v2 | Consistent interface, automatic security |
| **Authentication** | JWT + RBAC | Stateless, scalable, flexible permissions |
| **Real-time** | WebSockets | Low latency updates, connection management |
| **Caching** | Redis | In-memory performance, pub/sub support |
| **Monitoring** | OpenTelemetry | Vendor agnostic, comprehensive insights |

## 📈 Performance Metrics

```mermaid
graph TD
    subgraph "Target Metrics"
        T1[Page Load < 1s]
        T2[API Response < 200ms]
        T3[Database Query < 50ms]
        T4[99.99% Uptime]
        T5[Zero Data Loss]
    end
    
    subgraph "Monitoring"
        M1[Real User Monitoring]
        M2[Synthetic Checks]
        M3[Database Metrics]
        M4[Error Tracking]
        M5[Business KPIs]
    end
    
    T1 --> M1
    T2 --> M2
    T3 --> M3
    T4 --> M4
    T5 --> M5
    
    style T4 fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
    style T5 fill:#FFD700,stroke:#FFA500,stroke-width:2px,color:#000
```

---

<div align="center">

**Architecture Excellence** | **Built for Scale** | **Enterprise Ready**

[← Back to Overview](./README.md) | [Security Guide →](./security.md)

</div>