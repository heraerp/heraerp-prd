/**
 * HERA Progressive Healthcare Template
 * Complete healthcare management system with patient records, appointments, and billing
 * Smart Code: HERA.PROGRESSIVE.TEMPLATE.HEALTHCARE.v1
 */

export interface HealthcareBusinessRequirements {
  business_name: string
  practice_type: 'family_medicine' | 'pediatrics' | 'cardiology' | 'orthopedics' | 'dermatology' | 'mental_health' | 'urgent_care' | 'specialty_clinic'
  provider_count: number
  daily_appointments?: number
  specializations?: string[]
  accepts_insurance?: string[]
  telemedicine_enabled?: boolean
  location?: {
    address: string
    city: string
    state: string
    zip: string
  }
}

export interface Patient {
  id: string
  medical_record_number: string
  personal_info: {
    first_name: string
    last_name: string
    date_of_birth: Date
    gender: 'male' | 'female' | 'other' | 'prefer_not_to_say'
    phone: string
    email?: string
    address: {
      street: string
      city: string
      state: string
      zip: string
    }
  }
  insurance_info?: {
    primary_insurance: string
    policy_number: string
    group_number?: string
    copay?: number
  }
  emergency_contact: {
    name: string
    relationship: string
    phone: string
  }
  medical_history: {
    allergies: string[]
    chronic_conditions: string[]
    current_medications: Medication[]
    family_history: string[]
  }
  provider_id?: string
}

export interface Appointment {
  id: string
  patient_id: string
  provider_id: string
  appointment_type: 'consultation' | 'follow_up' | 'procedure' | 'physical_exam' | 'telemedicine' | 'emergency'
  scheduled_date: Date
  duration_minutes: number
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  chief_complaint?: string
  notes?: string
  visit_summary?: {
    diagnosis: string[]
    procedures: string[]
    prescriptions: Medication[]
    follow_up_needed: boolean
    next_appointment_date?: Date
  }
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  prescribed_date: Date
  prescribing_provider: string
  instructions?: string
  refills_remaining?: number
}

export interface LabResult {
  id: string
  patient_id: string
  test_name: string
  ordered_date: Date
  result_date?: Date
  results: {
    parameter: string
    value: string
    reference_range: string
    status: 'normal' | 'abnormal' | 'critical'
  }[]
  ordering_provider: string
  status: 'ordered' | 'collected' | 'in_lab' | 'resulted' | 'reviewed'
}

export class HealthcareTemplate {
  
  /**
   * Generate comprehensive healthcare demo data
   */
  static generateDemoData(requirements: HealthcareBusinessRequirements): any {
    const organizationId = crypto.randomUUID()
    
    return {
      organization: this.createHealthcareOrganization(organizationId, requirements),
      entities: [
        ...this.generatePatients(organizationId),
        ...this.generateProviders(organizationId, requirements.provider_count),
        ...this.generateStaff(organizationId),
        ...this.generateMedications(organizationId),
        ...this.generateInsurancePlans(organizationId),
        ...this.generateTreatmentRooms(organizationId)
      ],
      transactions: [
        ...this.generateAppointments(organizationId, requirements.daily_appointments || 25),
        ...this.generateBillingTransactions(organizationId),
        ...this.generateInsuranceTransactions(organizationId)
      ],
      relationships: this.generateRelationships(organizationId),
      dynamicData: this.generateDynamicData(organizationId)
    }
  }

  /**
   * Create healthcare organization entity
   */
  private static createHealthcareOrganization(id: string, requirements: HealthcareBusinessRequirements): any {
    return {
      id,
      organization_name: requirements.business_name,
      organization_code: `HC-${requirements.business_name.replace(/\s+/g, '').toUpperCase().substring(0, 8)}`,
      organization_type: 'healthcare_provider',
      industry_classification: 'healthcare',
      ai_insights: {
        practice_type: requirements.practice_type,
        provider_count: requirements.provider_count,
        estimated_monthly_revenue: requirements.daily_appointments * 150 * 22, // $150 avg per visit
        specializations: requirements.specializations || [],
        growth_potential: 'moderate'
      },
      settings: {
        operating_hours: {
          monday: { open: '08:00', close: '17:00' },
          tuesday: { open: '08:00', close: '17:00' },
          wednesday: { open: '08:00', close: '17:00' },
          thursday: { open: '08:00', close: '17:00' },
          friday: { open: '08:00', close: '16:00' },
          saturday: { open: '09:00', close: '13:00' },
          sunday: { closed: true }
        },
        appointment_settings: {
          default_duration: 30,
          buffer_time: 15,
          advance_booking_days: 90,
          same_day_booking: true,
          telemedicine_enabled: requirements.telemedicine_enabled || false
        },
        billing_settings: {
          accepted_insurance: requirements.accepts_insurance || ['Medicare', 'Medicaid', 'Blue Cross', 'Aetna'],
          payment_terms: 'Payment due at time of service',
          late_fee: 25.00
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  }

  /**
   * Generate realistic patient entities
   */
  private static generatePatients(organizationId: string): any[] {
    const patients = [
      {
        first_name: 'Jennifer', last_name: 'Adams', age: 34, gender: 'female',
        phone: '555-1001', email: 'jennifer.adams@email.com',
        conditions: ['Hypertension'], allergies: ['Penicillin'],
        insurance: 'Blue Cross Blue Shield'
      },
      {
        first_name: 'Michael', last_name: 'Brown', age: 67, gender: 'male',
        phone: '555-1002', email: 'michael.brown@email.com',
        conditions: ['Type 2 Diabetes', 'High Cholesterol'], allergies: [],
        insurance: 'Medicare'
      },
      {
        first_name: 'Sarah', last_name: 'Wilson', age: 28, gender: 'female',
        phone: '555-1003', email: 'sarah.wilson@email.com',
        conditions: [], allergies: ['Shellfish', 'Latex'],
        insurance: 'Aetna'
      },
      {
        first_name: 'Robert', last_name: 'Johnson', age: 45, gender: 'male',
        phone: '555-1004', email: 'robert.johnson@email.com',
        conditions: ['Asthma'], allergies: ['Dust', 'Pollen'],
        insurance: 'Cigna'
      },
      {
        first_name: 'Emily', last_name: 'Davis', age: 8, gender: 'female',
        phone: '555-1005', email: 'parent@email.com',
        conditions: [], allergies: ['Peanuts'],
        insurance: 'Blue Cross Blue Shield'
      },
      {
        first_name: 'William', last_name: 'Miller', age: 72, gender: 'male',
        phone: '555-1006', email: 'william.miller@email.com',
        conditions: ['Arthritis', 'Hypertension'], allergies: ['Sulfa'],
        insurance: 'Medicare'
      },
      {
        first_name: 'Lisa', last_name: 'Garcia', age: 41, gender: 'female',
        phone: '555-1007', email: 'lisa.garcia@email.com',
        conditions: ['Migraine'], allergies: [],
        insurance: 'UnitedHealth'
      },
      {
        first_name: 'David', last_name: 'Martinez', age: 55, gender: 'male',
        phone: '555-1008', email: 'david.martinez@email.com',
        conditions: ['High Blood Pressure'], allergies: ['Ibuprofen'],
        insurance: 'Humana'
      },
      {
        first_name: 'Amanda', last_name: 'Taylor', age: 29, gender: 'female',
        phone: '555-1009', email: 'amanda.taylor@email.com',
        conditions: [], allergies: [],
        insurance: 'Anthem'
      },
      {
        first_name: 'James', last_name: 'Anderson', age: 61, gender: 'male',
        phone: '555-1010', email: 'james.anderson@email.com',
        conditions: ['Heart Disease', 'Diabetes'], allergies: ['Aspirin'],
        insurance: 'Medicare'
      }
    ]

    return patients.map(patient => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'patient',
      entity_name: `${patient.first_name} ${patient.last_name}`,
      smart_code: 'HERA.HC.PATIENT.RECORD.v1',
      metadata: {
        medical_record_number: `MRN-${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`,
        personal_info: {
          first_name: patient.first_name,
          last_name: patient.last_name,
          date_of_birth: new Date(new Date().getFullYear() - patient.age, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
          gender: patient.gender,
          phone: patient.phone,
          email: patient.email,
          address: {
            street: `${Math.floor(Math.random() * 9999) + 1} Main St`,
            city: 'Springfield',
            state: 'IL',
            zip: '62701'
          }
        },
        insurance_info: {
          primary_insurance: patient.insurance,
          policy_number: `POL-${Math.floor(Math.random() * 10000000)}`,
          copay: 25 + Math.floor(Math.random() * 50)
        },
        emergency_contact: {
          name: 'Emergency Contact',
          relationship: 'Spouse',
          phone: '555-9999'
        },
        medical_history: {
          allergies: patient.allergies,
          chronic_conditions: patient.conditions,
          current_medications: this.generatePatientMedications(),
          family_history: ['Heart Disease', 'Diabetes'].filter(() => Math.random() > 0.5)
        },
        registration_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
        last_visit: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000)
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate healthcare providers
   */
  private static generateProviders(organizationId: string, providerCount: number): any[] {
    const providerNames = [
      { name: 'Dr. Sarah Johnson', specialty: 'Family Medicine', license: 'MD12345' },
      { name: 'Dr. Michael Chen', specialty: 'Internal Medicine', license: 'MD12346' },
      { name: 'Dr. Emily Rodriguez', specialty: 'Pediatrics', license: 'MD12347' },
      { name: 'Dr. David Thompson', specialty: 'Cardiology', license: 'MD12348' },
      { name: 'Dr. Lisa Patel', specialty: 'Dermatology', license: 'MD12349' }
    ]

    return providerNames.slice(0, providerCount).map(provider => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'healthcare_provider',
      entity_name: provider.name,
      smart_code: 'HERA.HC.PROVIDER.PHYSICIAN.v1',
      metadata: {
        credentials: {
          license_number: provider.license,
          specialty: provider.specialty,
          board_certified: true,
          education: 'Medical School',
          years_experience: 5 + Math.floor(Math.random() * 20)
        },
        schedule: {
          availability: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          appointment_duration: 30,
          max_daily_patients: 20
        },
        contact_info: {
          office_phone: '555-2000',
          email: `${provider.name.toLowerCase().replace(/\s+/g, '.')}@clinic.com`
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate healthcare staff
   */
  private static generateStaff(organizationId: string): any[] {
    const staff = [
      { name: 'Maria Gonzalez', role: 'office_manager', hourly_rate: 22.00 },
      { name: 'Jennifer Kim', role: 'nurse', hourly_rate: 28.50 },
      { name: 'Ashley Brown', role: 'medical_assistant', hourly_rate: 18.00 },
      { name: 'Jessica Wilson', role: 'receptionist', hourly_rate: 16.00 },
      { name: 'Robert Taylor', role: 'billing_specialist', hourly_rate: 20.00 }
    ]

    return staff.map(person => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'employee',
      entity_name: person.name,
      smart_code: 'HERA.HC.STAFF.EMPLOYEE.v1',
      metadata: {
        role: person.role,
        employment_details: {
          hire_date: new Date(Date.now() - Math.random() * 1095 * 24 * 60 * 60 * 1000),
          hourly_rate: person.hourly_rate,
          status: 'active',
          certifications: person.role === 'nurse' ? ['RN', 'BLS'] : person.role === 'medical_assistant' ? ['CMA'] : []
        },
        contact_info: {
          phone: `555-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          emergency_contact: 'Available on file'
        }
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate appointment transactions
   */
  private static generateAppointments(organizationId: string, dailyCount: number): any[] {
    const appointments = []
    const appointmentTypes = ['consultation', 'follow_up', 'physical_exam', 'procedure']
    const statuses = ['completed', 'completed', 'completed', 'scheduled', 'confirmed']
    
    // Generate appointments for last 30 days
    for (let day = 0; day < 30; day++) {
      const appointmentsForDay = Math.floor(dailyCount * (0.7 + Math.random() * 0.6))
      
      for (let i = 0; i < appointmentsForDay; i++) {
        const appointmentDate = new Date(Date.now() - day * 24 * 60 * 60 * 1000 + Math.random() * 8 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000)
        const appointmentType = appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)]
        const status = day === 0 ? statuses[Math.floor(Math.random() * statuses.length)] : 'completed'
        
        const basePrice = appointmentType === 'consultation' ? 200 : appointmentType === 'procedure' ? 400 : 150
        const actualPrice = basePrice + (Math.random() - 0.5) * 100
        
        appointments.push({
          id: crypto.randomUUID(),
          organization_id: organizationId,
          transaction_type: 'appointment',
          transaction_number: `APT-${String(appointments.length + 1).padStart(5, '0')}`,
          transaction_date: appointmentDate,
          smart_code: 'HERA.HC.APPOINTMENT.VISIT.v1',
          description: `${appointmentType.replace('_', ' ')} appointment`,
          total_amount: Math.round(actualPrice * 100) / 100,
          currency_code: 'USD',
          status: status === 'completed' ? 'confirmed' : 'pending',
          metadata: {
            appointment_type: appointmentType,
            duration_minutes: appointmentType === 'procedure' ? 60 : 30,
            patient_id: crypto.randomUUID(),
            provider_id: crypto.randomUUID(),
            appointment_status: status,
            chief_complaint: this.getRandomChiefComplaint(),
            diagnosis_codes: this.getRandomDiagnosisCodes(),
            copay_collected: status === 'completed' ? 25 + Math.floor(Math.random() * 50) : 0
          },
          created_at: appointmentDate,
          updated_at: appointmentDate,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
      }
    }
    
    return appointments
  }

  /**
   * Generate billing transactions
   */
  private static generateBillingTransactions(organizationId: string): any[] {
    const transactions = []
    
    // Generate monthly billing cycles
    for (let month = 0; month < 3; month++) {
      const billingDate = new Date(Date.now() - month * 30 * 24 * 60 * 60 * 1000)
      
      // Insurance payments
      transactions.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        transaction_type: 'insurance_payment',
        transaction_number: `INS-${String(month + 1).padStart(4, '0')}`,
        transaction_date: billingDate,
        smart_code: 'HERA.HC.BILLING.INSURANCE.v1',
        description: 'Monthly insurance reimbursements',
        total_amount: 15000 + Math.random() * 10000,
        currency_code: 'USD',
        status: 'confirmed',
        metadata: {
          insurance_carrier: 'Blue Cross Blue Shield',
          claims_processed: 45 + Math.floor(Math.random() * 20),
          payment_method: 'ACH',
          processing_time_days: 14 + Math.floor(Math.random() * 7)
        },
        created_at: billingDate,
        updated_at: billingDate,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })

      // Patient payments
      transactions.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        transaction_type: 'patient_payment',
        transaction_number: `PAT-${String(month + 1).padStart(4, '0')}`,
        transaction_date: billingDate,
        smart_code: 'HERA.HC.BILLING.PATIENT.v1',
        description: 'Patient copays and deductibles',
        total_amount: 3500 + Math.random() * 2000,
        currency_code: 'USD',
        status: 'confirmed',
        metadata: {
          payment_types: {
            copays: 2800,
            deductibles: 1200,
            self_pay: 500
          },
          payment_methods: {
            cash: 800,
            card: 3200,
            check: 500
          }
        },
        created_at: billingDate,
        updated_at: billingDate,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return transactions
  }

  /**
   * Generate insurance-related transactions
   */
  private static generateInsuranceTransactions(organizationId: string): any[] {
    const transactions = []
    
    // Generate weekly claims submissions
    for (let week = 0; week < 12; week++) {
      const claimDate = new Date(Date.now() - week * 7 * 24 * 60 * 60 * 1000)
      
      transactions.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        transaction_type: 'insurance_claim',
        transaction_number: `CLM-${String(week + 1).padStart(4, '0')}`,
        transaction_date: claimDate,
        smart_code: 'HERA.HC.INSURANCE.CLAIM.v1',
        description: 'Weekly insurance claims submission',
        total_amount: 4000 + Math.random() * 3000,
        currency_code: 'USD',
        status: week < 4 ? 'confirmed' : 'pending',
        metadata: {
          claims_submitted: 12 + Math.floor(Math.random() * 8),
          primary_insurance_mix: {
            'Medicare': 30,
            'Medicaid': 15,
            'Blue Cross': 25,
            'Aetna': 20,
            'Other': 10
          },
          expected_reimbursement_rate: 0.85
        },
        created_at: claimDate,
        updated_at: claimDate,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return transactions
  }

  /**
   * Generate common medications
   */
  private static generateMedications(organizationId: string): any[] {
    const medications = [
      { name: 'Lisinopril', category: 'ACE Inhibitor', common_dosages: ['5mg', '10mg', '20mg'] },
      { name: 'Metformin', category: 'Antidiabetic', common_dosages: ['500mg', '1000mg'] },
      { name: 'Atorvastatin', category: 'Statin', common_dosages: ['20mg', '40mg', '80mg'] },
      { name: 'Omeprazole', category: 'PPI', common_dosages: ['20mg', '40mg'] },
      { name: 'Albuterol', category: 'Bronchodilator', common_dosages: ['90mcg'] },
      { name: 'Amoxicillin', category: 'Antibiotic', common_dosages: ['250mg', '500mg', '875mg'] },
      { name: 'Ibuprofen', category: 'NSAID', common_dosages: ['200mg', '400mg', '600mg', '800mg'] },
      { name: 'Prednisone', category: 'Corticosteroid', common_dosages: ['5mg', '10mg', '20mg'] }
    ]

    return medications.map(med => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'medication',
      entity_name: med.name,
      smart_code: 'HERA.HC.MEDICATION.DRUG.v1',
      metadata: {
        category: med.category,
        common_dosages: med.common_dosages,
        prescription_frequency: 'As prescribed',
        side_effects: ['Consult prescribing information'],
        interactions: ['Check drug interactions'],
        controlled_substance: ['Prednisone'].includes(med.name)
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate insurance plans
   */
  private static generateInsurancePlans(organizationId: string): any[] {
    const plans = [
      { name: 'Medicare Part B', type: 'government', typical_copay: 20 },
      { name: 'Medicaid', type: 'government', typical_copay: 0 },
      { name: 'Blue Cross Blue Shield PPO', type: 'private', typical_copay: 25 },
      { name: 'Aetna HMO', type: 'private', typical_copay: 30 },
      { name: 'UnitedHealth PPO', type: 'private', typical_copay: 35 },
      { name: 'Cigna EPO', type: 'private', typical_copay: 40 }
    ]

    return plans.map(plan => ({
      id: crypto.randomUUID(),
      organization_id: organizationId,
      entity_type: 'insurance_plan',
      entity_name: plan.name,
      smart_code: 'HERA.HC.INSURANCE.PLAN.v1',
      metadata: {
        plan_type: plan.type,
        typical_copay: plan.typical_copay,
        reimbursement_rate: 0.80 + Math.random() * 0.15,
        authorization_required: plan.type === 'private',
        claims_processing_time: plan.type === 'government' ? '14-21 days' : '7-14 days'
      },
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }))
  }

  /**
   * Generate treatment rooms
   */
  private static generateTreatmentRooms(organizationId: string): any[] {
    const rooms = []
    
    for (let i = 1; i <= 8; i++) {
      rooms.push({
        id: crypto.randomUUID(),
        organization_id: organizationId,
        entity_type: 'treatment_room',
        entity_name: `Room ${i}`,
        smart_code: 'HERA.HC.ROOM.TREATMENT.v1',
        metadata: {
          room_number: i,
          room_type: i <= 6 ? 'examination' : i === 7 ? 'procedure' : 'consultation',
          equipment: i <= 6 ? ['exam_table', 'sink', 'computer'] : i === 7 ? ['procedure_table', 'surgical_lights', 'monitoring'] : ['desk', 'chairs', 'computer'],
          capacity: i === 8 ? 4 : 2,
          current_status: 'available'
        },
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
    }
    
    return rooms
  }

  /**
   * Generate patient medications
   */
  private static generatePatientMedications(): Medication[] {
    const commonMeds = [
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
      { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
      { name: 'Multivitamin', dosage: '1 tablet', frequency: 'Once daily' }
    ]
    
    return commonMeds.filter(() => Math.random() > 0.5).map(med => ({
      ...med,
      prescribed_date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      prescribing_provider: 'Dr. Johnson',
      refills_remaining: Math.floor(Math.random() * 6)
    }))
  }

  /**
   * Get random chief complaint for appointments
   */
  private static getRandomChiefComplaint(): string {
    const complaints = [
      'Annual physical exam',
      'Chest pain',
      'Shortness of breath',
      'Headache',
      'Back pain',
      'Abdominal pain',
      'Fatigue',
      'Cough',
      'Fever',
      'Medication refill',
      'Blood pressure check',
      'Diabetes follow-up'
    ]
    
    return complaints[Math.floor(Math.random() * complaints.length)]
  }

  /**
   * Get random diagnosis codes
   */
  private static getRandomDiagnosisCodes(): string[] {
    const codes = [
      'Z00.00', // Adult health examination
      'I10', // Essential hypertension
      'E11.9', // Type 2 diabetes mellitus
      'M54.9', // Dorsalgia, unspecified
      'R06.02', // Shortness of breath
      'R50.9', // Fever, unspecified
      'G44.1' // Vascular headache
    ]
    
    return [codes[Math.floor(Math.random() * codes.length)]]
  }

  /**
   * Generate relationships between entities
   */
  private static generateRelationships(organizationId: string): any[] {
    return []
  }

  /**
   * Generate dynamic data fields
   */
  private static generateDynamicData(organizationId: string): any[] {
    return []
  }

  /**
   * Generate healthcare-specific component structure
   */
  static generateComponentStructure(): any {
    return {
      pages: [
        {
          name: 'HealthcareDashboard',
          path: '/dashboard',
          components: ['GlassPanel', 'AppointmentSummary', 'PatientMetrics', 'RevenueChart']
        },
        {
          name: 'PatientManagement',
          path: '/patients',
          components: ['GlassPanel', 'EnterpriseTable', 'PatientForm', 'MedicalHistory']
        },
        {
          name: 'AppointmentScheduling',
          path: '/appointments',
          components: ['GlassPanel', 'CalendarView', 'AppointmentForm', 'WaitingList']
        },
        {
          name: 'MedicalRecords',
          path: '/records',
          components: ['GlassPanel', 'PatientChart', 'VisitNotes', 'LabResults']
        },
        {
          name: 'PrescriptionManagement',
          path: '/prescriptions',
          components: ['GlassPanel', 'MedicationList', 'PrescriptionForm', 'DrugInteractions']
        },
        {
          name: 'BillingInsurance',
          path: '/billing',
          components: ['GlassPanel', 'ClaimsTracking', 'PaymentProcessing', 'InsuranceVerification']
        },
        {
          name: 'Reports',
          path: '/reports',
          components: ['GlassPanel', 'PatientReports', 'FinancialReports', 'QualityMetrics']
        }
      ],
      specialized_components: [
        'PatientChart',
        'CalendarView',
        'AppointmentForm',
        'MedicalHistory',
        'VisitNotes',
        'LabResults',
        'MedicationList',
        'PrescriptionForm',
        'ClaimsTracking',
        'InsuranceVerification',
        'DrugInteractions'
      ]
    }
  }
}

/**
 * Healthcare template factory function
 */
export function createHealthcareTemplate(requirements: HealthcareBusinessRequirements): any {
  return {
    demoData: HealthcareTemplate.generateDemoData(requirements),
    componentStructure: HealthcareTemplate.generateComponentStructure(),
    businessLogic: {
      appointmentWorkflow: ['scheduled', 'confirmed', 'in_progress', 'completed'],
      patientManagement: true,
      insuranceBilling: true,
      prescriptionTracking: true,
      medicalRecords: true,
      telemedicine: requirements.telemedicine_enabled || false
    },
    smartCodes: [
      'HERA.HC.PATIENT.RECORD.v1',
      'HERA.HC.APPOINTMENT.VISIT.v1',
      'HERA.HC.PROVIDER.PHYSICIAN.v1',
      'HERA.HC.MEDICATION.DRUG.v1',
      'HERA.HC.BILLING.INSURANCE.v1',
      'HERA.HC.INSURANCE.PLAN.v1',
      'HERA.HC.ROOM.TREATMENT.v1'
    ]
  }
}