# Universal Progressive System - Usage Examples

## 🚀 **Quick Start Examples**

### **1. Basic Implementation (Financial Module)**

```tsx
// pages/financial-universal/page.tsx
import { UniversalProgressiveLayout } from '@/components/layout/UniversalProgressiveLayout'
import { useUniversalFinancialData } from '@/hooks/use-universal-progressive-data'
import { UNIVERSAL_MODULE_CONFIGS } from '@/components/auth/UniversalProgressiveProvider'

export default function FinancialUniversalPage() {
  const { data, updateData, stats, exportModuleData } = useUniversalFinancialData()

  const addTransaction = (transactionData) => {
    updateData(current => ({
      ...current,
      transactions: [...current.transactions, {
        ...transactionData,
        id: generateId(),
        smartCode: 'HERA.FIN.TXN.UNIV.v1',
        timestamp: new Date().toISOString()
      }]
    }))
  }

  return (
    <UniversalProgressiveLayout module={UNIVERSAL_MODULE_CONFIGS.financial}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard title="Total Transactions" value={data?.transactions?.length || 0} />
          <StatsCard title="Total Revenue" value={`$${data?.kpis?.revenue?.toLocaleString() || 0}`} />
          <StatsCard title="Profit Margin" value="18.3%" />
        </div>
        
        <TransactionList transactions={data?.transactions || []} />
        <AddTransactionForm onAdd={addTransaction} />
      </div>
    </UniversalProgressiveLayout>
  )
}
```

### **2. Custom Module Creation (Hospital Management)**

```tsx
// pages/hospital-progressive/page.tsx
import { UniversalProgressiveLayout } from '@/components/layout/UniversalProgressiveLayout'
import { useUniversalProgressiveData } from '@/hooks/use-universal-progressive-data'
import { createModuleConfig } from '@/components/auth/UniversalProgressiveProvider'
import { Activity, Users, Calendar, FileText, DollarSign } from 'lucide-react'

// Create hospital module configuration
const hospitalModule = createModuleConfig('hospital', 'Hospital Management', 'HERA.HOSP', {
  description: 'Complete hospital management with patient care and HIPAA compliance',
  icon: Activity,
  primaryColor: 'emerald-600',
  gradientColors: 'from-emerald-600 to-teal-600',
  dataKeys: ['patients', 'appointments', 'staff', 'medical_records', 'billing'],
  features: ['Patient Management', 'Appointment Scheduling', 'Medical Records', 'Staff Management', 'HIPAA Compliance'],
  navigationItems: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      description: 'Hospital overview and key metrics',
      icon: Activity,
      url: '/hospital-progressive',
      smartCode: 'HERA.HOSP.DASH.v1',
      isPrimary: true
    },
    {
      id: 'patients',
      title: 'Patients',
      description: 'Patient records and management',
      icon: Users,
      url: '/hospital-progressive/patients',
      smartCode: 'HERA.HOSP.PATIENTS.v1',
      badge: '156'
    },
    {
      id: 'appointments',
      title: 'Appointments',
      description: 'Scheduling and calendar',
      icon: Calendar,
      url: '/hospital-progressive/appointments',
      smartCode: 'HERA.HOSP.APPOINTMENTS.v1',
      badge: '23'
    },
    {
      id: 'records',
      title: 'Medical Records',
      description: 'Patient medical history',
      icon: FileText,
      url: '/hospital-progressive/records',
      smartCode: 'HERA.HOSP.RECORDS.v1'
    },
    {
      id: 'billing',
      title: 'Billing',
      description: 'Insurance and payments',
      icon: DollarSign,
      url: '/hospital-progressive/billing',
      smartCode: 'HERA.HOSP.BILLING.v1',
      badge: '8'
    }
  ]
})

export default function HospitalProgressivePage() {
  // Use hospital-specific data with HIPAA-compliant transforms
  const { data, updateData, stats, exportModuleData } = useUniversalProgressiveData({
    key: 'hospital_data',
    smartCode: 'HERA.HOSP.MASTER.DATA.v1',
    metadata: {
      version: '1.0.0',
      module: 'hospital',
      description: 'HIPAA-compliant hospital management data',
      compliance: ['HIPAA', 'SOX']
    },
    transform: {
      serialize: (data) => {
        // Encrypt patient data before storage
        return {
          ...data,
          patients: data.patients?.map(patient => ({
            ...patient,
            medicalInfo: encryptHIPAAData(patient.medicalInfo)
          }))
        }
      },
      deserialize: (data) => {
        // Decrypt patient data after retrieval
        return {
          ...data,
          patients: data.patients?.map(patient => ({
            ...patient,
            medicalInfo: decryptHIPAAData(patient.medicalInfo)
          }))
        }
      }
    },
    initialData: {
      patients: [
        {
          id: 'patient-001',
          name: 'John Doe',
          age: 45,
          condition: 'Routine Checkup',
          lastVisit: '2024-08-05',
          smartCode: 'HERA.HOSP.PATIENT.v1'
        }
      ],
      appointments: [
        {
          id: 'appt-001',
          patientId: 'patient-001',
          doctor: 'Dr. Smith',
          date: '2024-08-15',
          time: '10:00 AM',
          type: 'Follow-up',
          smartCode: 'HERA.HOSP.APPOINTMENT.v1'
        }
      ],
      staff: [],
      medical_records: [],
      billing: []
    }
  })

  const addPatient = (patientData) => {
    updateData(current => ({
      ...current,
      patients: [...current.patients, {
        ...patientData,
        id: `patient-${Date.now()}`,
        createdAt: new Date().toISOString(),
        smartCode: 'HERA.HOSP.PATIENT.v1'
      }]
    }))
  }

  return (
    <UniversalProgressiveLayout module={hospitalModule}>
      <div className="space-y-6">
        {/* Hospital Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <HospitalStatCard 
            title="Total Patients" 
            value={data?.patients?.length || 0}
            icon={Users}
            color="blue"
          />
          <HospitalStatCard 
            title="Today's Appointments" 
            value={getTodayAppointments(data?.appointments).length}
            icon={Calendar}
            color="green"
          />
          <HospitalStatCard 
            title="Active Staff" 
            value={data?.staff?.length || 0}
            icon={Activity}
            color="purple"
          />
          <HospitalStatCard 
            title="Pending Bills" 
            value={getPendingBills(data?.billing).length}
            icon={DollarSign}
            color="orange"
          />
        </div>

        {/* Recent Patients */}
        <PatientList 
          patients={data?.patients || []} 
          onAddPatient={addPatient}
        />
        
        {/* Appointment Schedule */}
        <AppointmentSchedule appointments={data?.appointments || []} />
      </div>
    </UniversalProgressiveLayout>
  )
}

// Helper components
function HospitalStatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100',
    green: 'text-green-600 bg-green-100',
    purple: 'text-purple-600 bg-purple-100',
    orange: 'text-orange-600 bg-orange-100'
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </Card>
  )
}
```

### **3. Advanced Data Management with Transforms**

```tsx
// Example: E-commerce module with encrypted customer data
export default function EcommerceProgressivePage() {
  const { data, updateData, batchUpdate, stats } = useUniversalProgressiveData({
    key: 'ecommerce_data',
    smartCode: 'HERA.ECOM.MASTER.DATA.v1',
    metadata: {
      version: '2.0.0',
      module: 'ecommerce',
      description: 'E-commerce platform with PCI compliance'
    },
    transform: {
      serialize: (data) => ({
        ...data,
        customers: data.customers?.map(customer => ({
          ...customer,
          paymentMethods: encryptPCIData(customer.paymentMethods),
          personalInfo: encryptPIIData(customer.personalInfo)
        })),
        orders: data.orders?.map(order => ({
          ...order,
          paymentInfo: encryptPCIData(order.paymentInfo)
        }))
      }),
      deserialize: (data) => ({
        ...data,
        customers: data.customers?.map(customer => ({
          ...customer,
          paymentMethods: decryptPCIData(customer.paymentMethods),
          personalInfo: decryptPIIData(customer.personalInfo)
        })),
        orders: data.orders?.map(order => ({
          ...order,
          paymentInfo: decryptPCIData(order.paymentInfo)
        }))
      })
    },
    initialData: {
      products: [],
      categories: [],
      customers: [],
      orders: [],
      inventory: [],
      analytics: {
        totalRevenue: 0,
        totalOrders: 0,
        conversionRate: 0,
        averageOrderValue: 0
      }
    }
  })

  // Batch operations for performance
  const processOrderBatch = (orders) => {
    batchUpdate([
      (current) => ({
        ...current,
        orders: [...current.orders, ...orders]
      }),
      (current) => ({
        ...current,
        analytics: {
          ...current.analytics,
          totalOrders: current.orders.length,
          totalRevenue: current.orders.reduce((sum, order) => sum + order.total, 0)
        }
      }),
      (current) => ({
        ...current,
        inventory: updateInventoryFromOrders(current.inventory, orders)
      })
    ])
  }

  return (
    <UniversalProgressiveLayout module={ecommerceModule}>
      {/* E-commerce dashboard content */}
    </UniversalProgressiveLayout>
  )
}
```

### **4. Preset Layout Usage**

```tsx
// Using preset layouts for common modules
import { 
  FinancialProgressiveLayout,
  CRMProgressiveLayout,
  InventoryProgressiveLayout 
} from '@/components/layout/UniversalProgressiveLayout'
import { UniversalWorkspaceStats } from '@/components/auth/UniversalProgressivePrompts'

// Financial page with custom actions
export default function FinancialPage() {
  const customActions = (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm">
        <FileText className="w-4 h-4 mr-2" />
        Generate Report
      </Button>
      <Button size="sm">
        <Plus className="w-4 h-4 mr-2" />
        New Transaction
      </Button>
    </div>
  )

  const customHeader = (
    <Badge variant="secondary" className="bg-green-100 text-green-700">
      Q3 2024 Active
    </Badge>
  )

  return (
    <FinancialProgressiveLayout 
      showSidebar={true}
      showBanner={true}
      showDataStatus={true}
      customActions={customActions}
      customHeader={customHeader}
    >
      <div className="space-y-6">
        <UniversalWorkspaceStats />
        <FinancialDashboard />
        <RecentTransactions />
      </div>
    </FinancialProgressiveLayout>
  )
}

// CRM page with minimal layout
export default function CRMPage() {
  return (
    <CRMProgressiveLayout showBanner={false}>
      <CRMPipeline />
    </CRMProgressiveLayout>
  )
}
```

### **5. Custom Data Hooks**

```tsx
// Custom hooks for specific data patterns
function useRestaurantData() {
  return useUniversalProgressiveData({
    key: 'restaurant_operations',
    smartCode: 'HERA.REST.OPS.DATA.v1',
    metadata: {
      version: '1.0.0',
      module: 'restaurant',
      description: 'Restaurant operations and menu management'
    },
    initialData: {
      menu: [
        {
          id: 'item-001',
          name: 'Margherita Pizza',
          price: 18.99,
          category: 'Pizza',
          ingredients: ['tomato', 'mozzarella', 'basil'],
          smartCode: 'HERA.REST.MENU.ITEM.v1'
        }
      ],
      orders: [],
      tables: Array.from({ length: 20 }, (_, i) => ({
        id: `table-${i + 1}`,
        number: i + 1,
        capacity: i < 10 ? 4 : 6,
        status: 'available',
        smartCode: 'HERA.REST.TABLE.v1'
      })),
      staff: [],
      inventory: []
    }
  })
}

function useHealthcareData() {
  return useUniversalProgressiveData({
    key: 'healthcare_records',
    smartCode: 'HERA.HEALTH.RECORDS.v1',
    metadata: {
      version: '1.0.0',
      module: 'healthcare',
      description: 'HIPAA-compliant healthcare management',
      compliance: ['HIPAA', 'HITECH']
    },
    transform: {
      serialize: (data) => encryptHealthcareData(data),
      deserialize: (data) => decryptHealthcareData(data)
    },
    initialData: {
      patients: [],
      appointments: [],
      medical_records: [],
      prescriptions: [],
      insurance_claims: []
    }
  })
}
```

### **6. Component Integration Examples**

```tsx
// Using universal prompts and indicators
import { 
  UniversalSavePrompt,
  UniversalUpgradePrompt,
  UniversalDataStatusIndicator,
  UniversalWorkspaceStats
} from '@/components/auth/UniversalProgressivePrompts'

export default function MyModulePage() {
  return (
    <UniversalProgressiveLayout module={myModule}>
      {/* Main content */}
      <div className="space-y-6">
        <ModuleDashboard />
        <DataTable />
        
        {/* Workspace statistics */}
        <UniversalWorkspaceStats />
      </div>
      
      {/* Floating prompts - automatically positioned */}
      <UniversalSavePrompt />
      <UniversalUpgradePrompt />
    </UniversalProgressiveLayout>
  )
}
```

### **7. Testing Progressive Flow**

```tsx
// Test component for progressive authentication flow
export default function ProgressiveTestPage() {
  const { moduleConfig, progressiveAuth } = useUniversalProgressive()
  const { data, stats, exportModuleData } = useUniversalProgressiveData({
    key: 'test_data',
    initialData: { testRecords: [] }
  })

  const addTestRecord = () => {
    updateData(current => ({
      ...current,
      testRecords: [...current.testRecords, {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: 'test_interaction'
      }]
    }))
  }

  return (
    <UniversalProgressiveLayout module={testModule}>
      <div className="space-y-6">
        {/* Authentication State Display */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Authentication State</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Current State:</p>
              <Badge variant={
                progressiveAuth.isRegistered ? 'default' :
                progressiveAuth.isIdentified ? 'secondary' : 
                'outline'
              }>
                {progressiveAuth.isRegistered ? 'Registered' :
                 progressiveAuth.isIdentified ? 'Email Verified' :
                 'Anonymous'}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Days Remaining:</p>
              <p className="text-lg font-semibold">{progressiveAuth.daysRemaining}</p>
            </div>
          </div>
        </Card>

        {/* Data Statistics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Data Statistics</h3>
          <div className="grid grid-cols-4 gap-4">
            <StatItem label="Records" value={stats.recordCount} />
            <StatItem label="Size (KB)" value={(stats.totalSize / 1024).toFixed(1)} />
            <StatItem label="Interactions" value={stats.interactions} />
            <StatItem label="Backups" value={stats.backupCount} />
          </div>
        </Card>

        {/* Test Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Test Actions</h3>
          <div className="flex space-x-4">
            <Button onClick={addTestRecord}>Add Test Record</Button>
            <Button onClick={exportModuleData} variant="outline">Export Data</Button>
          </div>
        </Card>

        {/* Test Records List */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Test Records</h3>
          <div className="space-y-2">
            {data?.testRecords?.map((record, index) => (
              <div key={record.id} className="p-2 bg-gray-50 rounded">
                <span className="text-sm">
                  #{index + 1} - {new Date(record.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </UniversalProgressiveLayout>
  )
}

function StatItem({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-blue-600">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  )
}
```

## 🎯 **Migration Examples**

### **Converting Existing Progressive Page**

```tsx
// BEFORE: Existing financial-progressive page
export default function FinancialProgressivePage() {
  const { workspace, isAnonymous } = useProgressiveAuth()
  const { data, updateData } = useProgressiveFinancialData()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <FinancialTeamsSidebar />
      <div className="ml-16">
        {/* Custom header and content */}
      </div>
    </div>
  )
}

// AFTER: Using Universal Progressive System
export default function FinancialUniversalPage() {
  const { data, updateData } = useUniversalFinancialData()
  
  return (
    <FinancialProgressiveLayout>
      {/* Same content, all infrastructure handled by universal system */}
      <FinancialDashboard data={data} onUpdate={updateData} />
    </FinancialProgressiveLayout>
  )
}
```

These examples demonstrate the flexibility and power of the Universal Progressive System, showing how it can be adapted for any business domain while maintaining consistent user experience and development patterns.