# Complete Claude CLI Prompt: HERA Universal Appointment System

## 🎯 **MISSION OBJECTIVE**
Build a production-ready Universal Appointment System using HERA's 6-table architecture that works across all industries (jewelry, healthcare, restaurant, professional services) with smart coding patterns and AI-native workflows.

---

## 🏗️ **HERA FOUNDATION CONTEXT**

### **Sacred 6-Table Architecture:**
```sql
-- THE UNIVERSAL FOUNDATION (NEVER ALTER)
1. core_organizations        -- Multi-tenant isolation
2. core_entities            -- All business objects (customers, staff, services)
3. core_dynamic_data        -- Unlimited custom fields (appointment properties)
4. core_relationships       -- Universal connections (staff-customer, service-booking)
5. universal_transactions   -- All appointments as transactions
6. universal_transaction_lines -- Appointment details, services, line items
```

### **Universal Smart Coding Pattern:**
```
HERA.{INDUSTRY}.CRM.APT.TXN.{TYPE}.v1

Examples:
- HERA.JWLR.CRM.APT.TXN.CONS.v1  (Jewelry consultation)
- HERA.HLTH.CRM.APT.TXN.CHKUP.v1 (Healthcare checkup)
- HERA.REST.CRM.APT.TXN.RES.v1   (Restaurant reservation)
- HERA.PROF.CRM.APT.TXN.MEET.v1  (Professional meeting)
```

### **Sacred Rules:**
1. **organization_id everywhere** - Perfect multi-tenant isolation
2. **Never alter schema** - Use core_dynamic_data for custom fields
3. **AI-native design** - AI insights built into core tables
4. **Universal patterns** - Same code works across all industries

---

## 📋 **APPOINTMENT SYSTEM SPECIFICATIONS**

### **Core Features Required:**

#### **1. Universal Appointment Management**
- **Create/Edit/Cancel** appointments with industry-specific types
- **Smart scheduling** with availability checking and conflict resolution
- **Multi-resource booking** (staff, equipment, rooms) via relationships
- **Recurring appointments** with flexible patterns
- **Waitlist management** for popular time slots

#### **2. Industry-Specific Appointment Types**

**Jewelry Store:**
- Design Consultations (60 min) - Custom jewelry design discussions
- Ring Sizing (15 min) - Professional sizing services
- Jewelry Appraisal (30 min) - Valuation for insurance/sales
- Repair Services (45 min) - Restoration work
- Collection Viewing (90 min) - VIP customer private viewings

**Healthcare:**
- General Checkups (30 min) - Routine examinations
- Specialist Consultations (45 min) - Expert medical advice
- Medical Procedures (120 min) - Scheduled treatments
- Follow-up Visits (20 min) - Post-treatment reviews
- Emergency Slots (15 min) - Urgent care availability

**Restaurant:**
- Table Reservations (120 min) - Standard dining bookings
- Private Events (240 min) - Exclusive dining experiences
- Tasting Menus (180 min) - Chef's special presentations
- Cooking Classes (150 min) - Interactive culinary experiences

**Professional Services:**
- Client Meetings (60 min) - Strategic consultations
- Legal Consultations (90 min) - Professional advice sessions
- Document Reviews (45 min) - Contract analysis meetings
- Court Appearances (480 min) - Legal proceedings

#### **3. Universal Workflow Engine**

**Standard Workflow States:**
```javascript
const APPOINTMENT_WORKFLOW = {
  DRAFT: 'draft',           // Initial creation
  SCHEDULED: 'scheduled',   // Time slot reserved
  CONFIRMED: 'confirmed',   // Customer confirmed attendance
  REMINDED: 'reminded',     // Automatic reminders sent
  CHECKED_IN: 'checked_in', // Customer arrived
  IN_PROGRESS: 'in_progress', // Service being provided
  COMPLETED: 'completed',   // Service finished
  FOLLOW_UP: 'follow_up',   // Post-service actions
  CANCELLED: 'cancelled',   // Appointment cancelled
  NO_SHOW: 'no_show'        // Customer didn't attend
};
```

**Workflow Automations:**
- **24h Confirmation**: Send SMS/email confirmations
- **2h Reminders**: Automatic appointment reminders
- **Resource Preparation**: Equipment/room setup notifications
- **Follow-up Scheduling**: Automatic next appointment suggestions
- **Feedback Collection**: Post-appointment satisfaction surveys

#### **4. AI-Powered Intelligence**

**Predictive Features:**
- **Demand Forecasting**: Predict busy periods and optimal staffing
- **No-show Prediction**: Identify likely cancellations and overbook intelligently
- **Service Recommendations**: Suggest additional services based on appointment type
- **Optimal Scheduling**: AI-suggested time slots for maximum efficiency
- **Customer Journey**: Track appointment history and predict future needs

**Cross-Industry Learning:**
- Healthcare efficiency patterns → Jewelry consultation optimization
- Restaurant reservation patterns → Professional services scheduling
- Universal optimization patterns applied contextually

---

## 🚀 **TECHNICAL IMPLEMENTATION REQUIREMENTS**

### **1. Database Implementation (HERA 6-Table Pattern)**

#### **Customers as Entities:**
```sql
INSERT INTO core_entities (
  organization_id,
  entity_type,
  entity_name,
  entity_code,
  smart_code,
  metadata,
  ai_insights
) VALUES (
  'org_jewelry_store',
  'customer',
  'Priya Sharma',
  'CUST-2024-001',
  'HERA.JWLR.CRM.ENT.CUST.v1',
  '{"phone": "+91 98765 43210", "email": "priya@email.com"}',
  '{"customer_value": "high", "appointment_frequency": "monthly"}'
);
```

#### **Services as Entities:**
```sql
INSERT INTO core_entities (
  organization_id,
  entity_type,
  entity_name,
  entity_code,
  smart_code,
  metadata
) VALUES (
  'org_jewelry_store',
  'service',
  'Design Consultation',
  'SVC-CONS',
  'HERA.JWLR.CRM.ENT.SVC.CONS.v1',
  '{"duration": 60, "price": 2000, "requires": ["design_expert"]}'
);
```

#### **Appointments as Transactions:**
```sql
INSERT INTO universal_transactions (
  organization_id,
  transaction_number,
  smart_code,
  source_entity_id,        -- Customer
  target_entity_id,        -- Service
  transaction_type,
  transaction_date,
  total_amount,
  metadata,
  ai_insights
) VALUES (
  'org_jewelry_store',
  'APT-2024-001',
  'HERA.JWLR.CRM.APT.TXN.CONS.v1',
  'customer_priya_id',
  'service_consultation_id',
  'appointment',
  '2024-03-15',
  2000.00,
  '{"start_time": "14:00", "duration": 60, "status": "confirmed"}',
  '{"conversion_probability": 0.85, "suggested_followup": "show_catalog"}'
);
```

#### **Dynamic Appointment Properties:**
```sql
INSERT INTO core_dynamic_data VALUES
-- Industry-specific fields stored dynamically
('appointment_id', 'expected_budget', 'number', '50000', null, null, null, null),
('appointment_id', 'jewelry_preference', 'text', 'traditional_gold', null, null, null, null),
('appointment_id', 'special_occasion', 'text', 'engagement', null, null, null, null),
('appointment_id', 'design_inspiration', 'text', 'vintage_art_deco', null, null, null, null);
```

#### **Staff-Appointment Relationships:**
```sql
INSERT INTO core_relationships (
  organization_id,
  smart_code,
  source_entity_id,        -- Staff member
  target_entity_id,        -- Appointment
  relationship_type,
  relationship_value
) VALUES (
  'org_jewelry_store',
  'HERA.JWLR.HR.REL.STAFF.APT.v1',
  'staff_designer_id',
  'appointment_id',
  'assigned_to',
  '{"role": "lead_designer", "expertise": ["custom_rings"]}'
);
```

### **2. API Implementation**

#### **Universal Appointment Endpoints:**
```typescript
// POST /api/v1/appointments
interface CreateAppointmentRequest {
  smart_code: string;           // HERA.{INDUSTRY}.CRM.APT.TXN.{TYPE}.v1
  customer_id: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  duration?: number;
  special_requests?: string;
  custom_fields?: Record<string, any>;
}

// GET /api/v1/appointments/availability
interface AvailabilityRequest {
  service_id: string;
  date_range: { start: string; end: string };
  duration: number;
  staff_preferences?: string[];
}

// PUT /api/v1/appointments/{id}/workflow
interface WorkflowUpdateRequest {
  action: 'confirm' | 'check_in' | 'start' | 'complete' | 'cancel';
  notes?: string;
  follow_up_actions?: string[];
}
```

#### **Industry-Specific Intelligence:**
```typescript
// AI-powered appointment optimization
interface AppointmentAI {
  predictOptimalSlots(serviceType: string, customerHistory: any[]): TimeSlot[];
  calculateNoShowRisk(customerId: string, appointmentType: string): number;
  suggestServiceUpsells(appointmentType: string, customerProfile: any): Service[];
  optimizeStaffSchedule(date: string, appointments: Appointment[]): StaffSchedule;
}
```

### **3. Frontend Components**

#### **Universal Appointment Calendar:**
```typescript
interface AppointmentCalendarProps {
  organizationId: string;
  industry: 'jewelry' | 'healthcare' | 'restaurant' | 'professional';
  viewType: 'day' | 'week' | 'month';
  staffFilter?: string[];
  serviceFilter?: string[];
}

// Automatically adapts UI based on industry smart codes
<AppointmentCalendar 
  organizationId="org_jewelry_store"
  industry="jewelry"
  onAppointmentClick={handleAppointmentDetails}
  onSlotClick={handleNewAppointment}
/>
```

#### **Dynamic Appointment Form:**
```typescript
interface DynamicAppointmentFormProps {
  serviceSmartCode: string;     // Determines form fields
  customFields: DynamicField[]; // From core_dynamic_data
  validationRules: ValidationRule[];
}

// Form auto-generates based on service smart code
<DynamicAppointmentForm
  serviceSmartCode="HERA.JWLR.CRM.APT.TXN.CONS.v1"
  onSubmit={createAppointment}
/>
```

### **4. Workflow Automation Engine**

#### **Universal Workflow Triggers:**
```typescript
const WorkflowEngine = {
  // Automatic confirmation SMS/email
  onAppointmentScheduled: async (appointmentId: string) => {
    await sendConfirmation(appointmentId);
    await scheduleReminders(appointmentId);
    await prepareResources(appointmentId);
  },

  // Smart reminder system
  onReminderTrigger: async (appointmentId: string) => {
    const appointment = await getAppointment(appointmentId);
    const reminderType = determineReminderType(appointment.smart_code);
    await sendReminder(appointmentId, reminderType);
  },

  // AI-powered follow-up suggestions
  onAppointmentCompleted: async (appointmentId: string) => {
    const aiSuggestions = await generateFollowUpActions(appointmentId);
    await createFollowUpTasks(appointmentId, aiSuggestions);
  }
};
```

---

## 📊 **REPORTING & ANALYTICS REQUIREMENTS**

### **Universal Dashboard Metrics:**
- **Daily Schedule** - Today's appointments by status
- **Utilization Rates** - Staff and resource efficiency
- **Revenue Impact** - Appointment value and conversion rates
- **Customer Satisfaction** - Post-appointment feedback scores
- **No-Show Analysis** - Patterns and prevention strategies

### **Industry-Specific Analytics:**

**Jewelry Store:**
- **Consultation Conversion**: Design consultations → Sales
- **Service Revenue**: Repair/sizing/appraisal income
- **Customer Journey**: First visit → VIP customer timeline
- **Seasonal Patterns**: Wedding/festival season optimization

**Healthcare:**
- **Patient Flow**: Average wait times and processing
- **Treatment Outcomes**: Follow-up appointment success rates
- **Resource Utilization**: Equipment and room usage
- **Preventive Care**: Checkup compliance tracking

### **AI Insights Dashboard:**
- **Demand Forecasting**: Next week/month predictions
- **Optimization Opportunities**: Schedule efficiency improvements
- **Customer Behavior**: Appointment patterns and preferences
- **Cross-Industry Learning**: Best practices from other industries

---

## 🎯 **IMPLEMENTATION DELIVERABLES**

### **Phase 1: Foundation (Week 1)**
- [ ] HERA 6-table schema deployed with appointment extensions
- [ ] Universal smart coding patterns documented
- [ ] Basic appointment CRUD operations
- [ ] Multi-tenant organization setup

### **Phase 2: Core Features (Week 2)**
- [ ] Appointment scheduling with conflict detection
- [ ] Industry-specific service types and durations
- [ ] Staff/resource assignment via relationships
- [ ] Basic workflow state management

### **Phase 3: Intelligence (Week 3)**
- [ ] AI-powered availability suggestions
- [ ] Automatic workflow triggers (confirmations, reminders)
- [ ] No-show prediction and overbooking logic
- [ ] Cross-industry pattern learning

### **Phase 4: Advanced Features (Week 4)**
- [ ] Advanced analytics dashboard
- [ ] Customer journey tracking
- [ ] Revenue optimization recommendations
- [ ] Mobile app with calendar sync

### **Phase 5: Production Polish (Week 5)**
- [ ] Performance optimization
- [ ] Security audit and compliance
- [ ] Integration testing across industries
- [ ] Documentation and deployment guides

---

## 🏆 **SUCCESS CRITERIA**

### **Technical Requirements:**
- ✅ Sub-second response times for all appointment operations
- ✅ 99.9% uptime with proper error handling
- ✅ Perfect multi-tenant isolation (no data leakage)
- ✅ Horizontal scalability to 10,000+ concurrent users
- ✅ Mobile-responsive UI across all device types

### **Business Requirements:**
- ✅ Works identically across jewelry/healthcare/restaurant/professional services
- ✅ Zero schema changes when adding new industries
- ✅ 90%+ accuracy in AI predictions (no-show, demand forecasting)
- ✅ 50%+ reduction in manual scheduling overhead
- ✅ 25%+ improvement in appointment conversion rates

### **User Experience Requirements:**
- ✅ Intuitive scheduling in <3 clicks
- ✅ Automatic smart suggestions for optimal time slots
- ✅ Real-time calendar updates across all users
- ✅ Seamless integration with existing business workflows
- ✅ Industry-specific terminology and workflows

---

## 🚀 **DEPLOYMENT INSTRUCTIONS**

### **Environment Setup:**
```bash
# Clone HERA universal architecture
git clone https://github.com/hera-platform/universal-appointment-system
cd universal-appointment-system

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Configure: SUPABASE_URL, SUPABASE_ANON_KEY, JWT_SECRET

# Deploy HERA schema
npm run deploy:schema

# Seed appointment data
npm run seed:appointments

# Start development server
npm run dev
```

### **Production Deployment:**
```bash
# Build for production
npm run build

# Deploy to cloud infrastructure
npm run deploy:production

# Setup monitoring and alerts
npm run setup:monitoring

# Run integration tests
npm run test:integration
```

---

## 💡 **ARCHITECTURAL ADVANTAGES**

### **Why This Approach is Revolutionary:**

1. **Universal Patterns**: Same appointment system works for jewelry consultations, medical appointments, restaurant reservations, and professional meetings

2. **Zero Schema Changes**: Add new appointment types, custom fields, or industry-specific requirements without touching the database

3. **AI-Native Intelligence**: Every appointment teaches the system, creating cross-industry optimization

4. **Perfect Scalability**: Multi-tenant architecture supports unlimited businesses with complete data isolation

5. **Future-Proof Design**: Universal patterns ensure the system never becomes obsolete

### **Competitive Advantages:**
- **vs Calendly**: Industry-specific intelligence and workflow automation
- **vs Traditional ERP**: Universal patterns work across all business types
- **vs Custom Solutions**: 90% faster implementation with proven architecture
- **vs SaaS Tools**: Perfect customization without vendor lock-in

---

## 🎯 **FINAL DELIVERABLE**

**Create a production-ready Universal Appointment System that:**
- Works seamlessly across jewelry, healthcare, restaurant, and professional services
- Uses HERA's 6-table architecture with smart coding patterns
- Provides AI-powered scheduling optimization and workflow automation
- Scales to enterprise levels with perfect multi-tenant isolation
- Demonstrates the power of universal business patterns

**Timeline**: 5 weeks from start to production deployment
**Budget Impact**: 90% less than traditional custom development
**Maintenance**: Self-optimizing with zero ongoing customization costs

---

*This system will serve as the definitive proof-of-concept for HERA's universal architecture, demonstrating how one platform can handle complex business processes across all industries with unprecedented efficiency and intelligence.*