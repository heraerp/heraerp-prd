# Finance DNA v2 Architecture Diagrams

## System Integration Flow

```mermaid
graph TB
    subgraph "Salon Application Layer"
        A[POS Checkout] --> B[usePosCheckout Hook]
        C[Financial Dashboard] --> D[Finance DNA v2 Hooks]
        E[Trial Balance] --> F[useTrialBalance Hook]
    end
    
    subgraph "Finance DNA v2 Layer"
        B --> G[FinanceDNAServiceV2]
        D --> H[Financial Reporting API v2]
        F --> I[Trial Balance Engine]
        
        G --> J[Guardrails Validation]
        G --> K[Auto-Journal Processing]
        G --> L[Policy Engine]
    end
    
    subgraph "Sacred Six Tables"
        M[core_organizations]
        N[core_entities] 
        O[core_dynamic_data]
        P[core_relationships]
        Q[universal_transactions]
        R[universal_transaction_lines]
    end
    
    subgraph "Intelligence Layer"
        S[AI Confidence Scoring]
        T[Smart Code Registry]
        U[Performance Metrics]
    end
    
    J --> M
    K --> Q
    K --> R
    L --> O
    H --> N
    I --> Q
    
    G --> S
    H --> T
    I --> U
    
    classDef application fill:#e1f5fe
    classDef finance fill:#f3e5f5
    classDef database fill:#e8f5e8
    classDef intelligence fill:#fff3e0
    
    class A,B,C,D,E,F application
    class G,H,I,J,K,L finance  
    class M,N,O,P,Q,R database
    class S,T,U intelligence
```

## Smart Code Lineage Flow

```mermaid
graph LR
    subgraph "POS Transaction Flow"
        A[User Checkout] --> B[HERA.SALON.TXN.SALE.CREATE.V1]
        B --> C[Finance DNA v2 Processing]
        C --> D[HERA.SALON.FINANCE.TXN.REVENUE.SERVICE.V1]
    end
    
    subgraph "Auto-Journal Processing"
        D --> E[Policy Engine Lookup]
        E --> F[GL Account Derivation]
        F --> G[Journal Entry Creation]
        G --> H[Balance Validation]
    end
    
    subgraph "Real-time Updates"
        H --> I[Trial Balance Refresh]
        H --> J[Financial Dashboard Update]
        H --> K[Performance Metrics]
    end
    
    subgraph "Intelligence Feedback"
        K --> L[AI Confidence Scoring]
        L --> M[Policy Optimization]
        M --> E
    end
    
    classDef pos fill:#ffebee
    classDef auto fill:#e8f5e8
    classDef realtime fill:#e3f2fd
    classDef intelligence fill:#fff8e1
    
    class A,B,C,D pos
    class E,F,G,H auto
    class I,J,K realtime
    class L,M intelligence
```

## Data Flow Architecture

```mermaid
graph TD
    subgraph "Request Flow"
        A[Salon POS Request] --> B[Finance DNA v2 Validation]
        B --> C{Guardrails Check}
        C -->|Pass| D[Auto-Journal Processing]
        C -->|Fail| E[Error Response]
    end
    
    subgraph "Processing Engine"
        D --> F[Smart Code Classification]
        F --> G[Policy Engine Query]
        G --> H[GL Account Resolution]
        H --> I[Journal Entry Generation]
    end
    
    subgraph "Database Operations"
        I --> J[universal_transactions INSERT]
        J --> K[universal_transaction_lines INSERT]
        K --> L[core_dynamic_data UPDATE]
        L --> M[Audit Trail Creation]
    end
    
    subgraph "Response Generation"
        M --> N[Performance Metrics]
        N --> O[Success Response]
        O --> P[Dashboard Refresh]
        P --> Q[Real-time Updates]
    end
    
    subgraph "Intelligence Loop"
        Q --> R[AI Analysis]
        R --> S[Pattern Recognition]
        S --> T[Policy Optimization]
        T --> G
    end
    
    classDef request fill:#ffebee
    classDef processing fill:#e8f5e8
    classDef database fill:#e3f2fd
    classDef response fill:#fff3e0
    classDef intelligence fill:#f3e5f5
    
    class A,B,C,E request
    class D,F,G,H,I processing
    class J,K,L,M database
    class N,O,P,Q response
    class R,S,T intelligence
```

## Multi-Tenant Security Architecture

```mermaid
graph TB
    subgraph "Organization A"
        A1[Salon A POS]
        A2[Finance DNA v2 Instance A]
        A3[Sacred Data Boundary A]
    end
    
    subgraph "Organization B"  
        B1[Salon B POS]
        B2[Finance DNA v2 Instance B]
        B3[Sacred Data Boundary B]
    end
    
    subgraph "Shared Finance DNA v2 Engine"
        C[FinanceDNAServiceV2 Factory]
        D[Guardrails Validation]
        E[Policy Engine]
        F[Smart Code Registry]
    end
    
    subgraph "Sacred Six Tables (Shared Infrastructure)"
        G[core_organizations]
        H[core_entities]
        I[core_dynamic_data] 
        J[core_relationships]
        K[universal_transactions]
        L[universal_transaction_lines]
    end
    
    A1 --> A2
    A2 --> C
    A3 --> G
    A3 --> H
    A3 --> I
    A3 --> J
    A3 --> K
    A3 --> L
    
    B1 --> B2
    B2 --> C
    B3 --> G
    B3 --> H
    B3 --> I
    B3 --> J
    B3 --> K
    B3 --> L
    
    C --> D
    C --> E
    C --> F
    
    classDef orgA fill:#ffebee
    classDef orgB fill:#e8f5e8
    classDef shared fill:#e3f2fd
    classDef database fill:#fff3e0
    
    class A1,A2,A3 orgA
    class B1,B2,B3 orgB
    class C,D,E,F shared
    class G,H,I,J,K,L database
```

## Performance Optimization Flow

```mermaid
graph LR
    subgraph "Request Pipeline"
        A[API Request] --> B[JWT Validation]
        B --> C[Organization Context]
        C --> D[Cache Check]
    end
    
    subgraph "Fast Path (Cache Hit)"
        D -->|Hit| E[Cached Response]
        E --> F[Performance Metrics]
        F --> G[Response < 50ms]
    end
    
    subgraph "Slow Path (Cache Miss)"
        D -->|Miss| H[Database Query]
        H --> I[RPC Function Call]
        I --> J[Result Processing]
        J --> K[Cache Update]
        K --> L[Response < 100ms]
    end
    
    subgraph "Intelligence Optimization"
        G --> M[Performance Analysis]
        L --> M
        M --> N[Query Optimization]
        N --> O[Cache Strategy Update]
        O --> D
    end
    
    classDef request fill:#ffebee
    classDef fast fill:#e8f5e8
    classDef slow fill:#e3f2fd
    classDef intelligence fill:#fff3e0
    
    class A,B,C,D request
    class E,F,G fast
    class H,I,J,K,L slow
    class M,N,O intelligence
```

## Trial Balance Generation Architecture

```mermaid
graph TD
    subgraph "Request Layer"
        A[Trial Balance Request] --> B[useTrialBalance Hook]
        B --> C[Finance DNA v2 API]
    end
    
    subgraph "Processing Layer"
        C --> D[Organization Validation]
        D --> E[Date Range Processing]
        E --> F[Account Hierarchy Query]
        F --> G[Balance Calculation Engine]
    end
    
    subgraph "Database Layer"
        G --> H[PostgreSQL RPC Function]
        H --> I[hera_trial_balance_v1]
        I --> J[Materialized View Query]
        J --> K[IFRS Classification]
    end
    
    subgraph "Response Layer"
        K --> L[Balance Validation]
        L --> M[Performance Metrics]
        M --> N[Formatted Response]
        N --> O[Real-time UI Update]
    end
    
    subgraph "Performance Optimization"
        O --> P[83ms Target]
        P --> Q[Caching Strategy]
        Q --> R[Query Optimization]
        R --> H
    end
    
    classDef request fill:#ffebee
    classDef processing fill:#e8f5e8
    classDef database fill:#e3f2fd
    classDef response fill:#fff3e0
    classDef performance fill:#f3e5f5
    
    class A,B,C request
    class D,E,F,G processing
    class H,I,J,K database
    class L,M,N,O response
    class P,Q,R performance
```