// UK Construction Management Data Factory
// Generates realistic construction business scenarios for loft conversions, extensions, and interior decoration

import { faker } from '@faker-js/faker'

export const ConstructionDataFactory = {
  
  // Generate complete construction business scenario
  generateBusinessScenario: (overrides = {}) => {
    const projectTypes = ['loft_conversion', 'extension', 'interior_decoration']
    const customerStatuses = ['lead', 'quote_sent', 'in_progress', 'completed', 'on_hold']
    
    return {
      company: {
        name: `${faker.person.lastName()} Construction Ltd`,
        type: 'UK Construction Company',
        specialties: ['loft_conversions', 'extensions', 'interior_decoration'],
        location: faker.location.city() + ', UK',
        established: faker.number.int({ min: 2010, max: 2020 }),
        vatNumber: `GB${faker.number.int({ min: 100000000, max: 999999999 })}`,
        companyNumber: faker.number.int({ min: 10000000, max: 99999999 }),
        insurance: {
          publicLiability: '£2,000,000',
          employersLiability: '£10,000,000',
          expiryDate: faker.date.future({ years: 1 })
        }
      },
      
      customers: Array.from({ length: faker.number.int({ min: 8, max: 15 }) }, () => ({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number('+44 7### ######'),
        address: {
          line1: faker.location.streetAddress(),
          city: faker.location.city(),
          postcode: faker.location.zipCode('?? #??'),
          county: faker.helpers.arrayElement(['London', 'Surrey', 'Kent', 'Essex', 'Hertfordshire'])
        },
        status: faker.helpers.arrayElement(customerStatuses),
        leadSource: faker.helpers.arrayElement(['Google', 'Facebook', 'Referral', 'Website', 'Local Search']),
        communicationPreference: faker.helpers.arrayElement(['Email', 'Phone', 'WhatsApp', 'Text']),
        projectInterest: faker.helpers.arrayElement(projectTypes),
        notes: faker.lorem.sentences(2),
        joinDate: faker.date.past({ years: 2 })
      })),
      
      projects: Array.from({ length: faker.number.int({ min: 5, max: 12 }) }, (_, i) => ({
        id: `PROJ-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
        customerId: faker.string.uuid(),
        type: faker.helpers.arrayElement(projectTypes),
        title: faker.helpers.arrayElement([
          'Loft Conversion with Ensuite',
          'Single Storey Rear Extension',
          'Kitchen Extension and Renovation',
          'Complete Interior Decoration',
          'Two Storey Side Extension',
          'Loft Conversion with Dormer'
        ]),
        status: faker.helpers.arrayElement(['planning', 'design', 'building', 'finishing', 'completed']),
        startDate: faker.date.past({ months: 6 }),
        estimatedEndDate: faker.date.future({ months: 3 }),
        budget: faker.number.int({ min: 15000, max: 80000 }),
        description: faker.lorem.paragraph(),
        address: faker.location.streetAddress() + ', ' + faker.location.city(),
        planningPermission: faker.helpers.arrayElement(['Required', 'Not Required', 'Applied', 'Approved']),
        buildingRegs: faker.helpers.arrayElement(['Required', 'Applied', 'Approved'])
      })),
      
      subcontractors: Array.from({ length: faker.number.int({ min: 5, max 10 }) }, () => ({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        company: `${faker.person.lastName()} ${faker.helpers.arrayElement(['Plumbing', 'Electrical', 'Roofing', 'Plastering'])}`,
        trade: faker.helpers.arrayElement(['Electrician', 'Plumber', 'Roofer', 'Plasterer', 'Carpenter', 'Painter']),
        phone: faker.phone.number('+44 7### ######'),
        email: faker.internet.email(),
        dailyRate: faker.number.int({ min: 180, max: 350 }),
        skills: faker.helpers.arrayElements(['Wiring', 'Plumbing', 'Tiling', 'Plastering', 'Roofing'], { min: 1, max: 3 }),
        certifications: faker.helpers.arrayElements(['Gas Safe', 'NICEIC', 'JIB', 'CSCS'], { min: 0, max: 2 }),
        availability: faker.helpers.arrayElement(['Available', 'Booked', 'Limited']),
        rating: faker.number.float({ min: 3.5, max: 5.0, precision: 0.1 })
      })),
      
      ...overrides
    }
  },

  // Generate CRM data
  generateCRM: () => {
    return {
      customers: Array.from({ length: 12 }, () => {
        const customer = ConstructionDataFactory.generateBusinessScenario().customers[0]
        return {
          ...customer,
          contactDetails: {
            primaryPhone: customer.phone,
            alternativePhone: faker.phone.number('+44 20#### ####'),
            email: customer.email,
            preferredContact: faker.helpers.arrayElement(['Phone', 'Email', 'WhatsApp'])
          },
          jobHistory: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
            projectId: faker.string.uuid(),
            type: faker.helpers.arrayElement(['loft_conversion', 'extension', 'interior_decoration']),
            value: faker.number.int({ min: 5000, max: 50000 }),
            completedDate: faker.date.past({ years: 2 }),
            satisfaction: faker.number.float({ min: 3.0, max: 5.0, precision: 0.1 })
          })),
          communications: Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, () => ({
            date: faker.date.recent({ days: 30 }),
            type: faker.helpers.arrayElement(['Phone', 'Email', 'WhatsApp', 'Site Visit']),
            summary: faker.lorem.sentence(),
            followUpRequired: faker.datatype.boolean()
          })),
          preferences: {
            communicationTime: faker.helpers.arrayElement(['Morning', 'Afternoon', 'Evening', 'Weekends']),
            projectBudget: faker.helpers.arrayElement(['£10k-20k', '£20k-40k', '£40k-60k', '£60k+']),
            timeframe: faker.helpers.arrayElement(['ASAP', '1-3 months', '3-6 months', '6+ months'])
          }
        }
      }),
      leadSources: {
        'Google': 35,
        'Facebook': 20,
        'Referral': 25,
        'Website': 15,
        'Local Search': 5
      },
      conversionRates: {
        leadToQuote: 75,
        quoteToJob: 45,
        repeatCustomers: 30
      }
    }
  },

  // Generate quoting and invoicing data
  generateQuoting: () => {
    return {
      templates: {
        loft_conversion: {
          baseItems: [
            { item: 'Structural calculations', price: 800, unit: 'fixed' },
            { item: 'Building regulations', price: 1200, unit: 'fixed' },
            { item: 'Steel beams installation', price: 2500, unit: 'fixed' },
            { item: 'Flooring (per sqm)', price: 45, unit: 'sqm' },
            { item: 'Insulation', price: 1500, unit: 'fixed' },
            { item: 'Plastering (per sqm)', price: 25, unit: 'sqm' },
            { item: 'Electrical work', price: 2200, unit: 'fixed' },
            { item: 'Plumbing (if ensuite)', price: 1800, unit: 'optional' }
          ],
          averageSize: 25, // sqm
          priceRange: { min: 18000, max: 35000 }
        },
        extension: {
          baseItems: [
            { item: 'Foundations', price: 180, unit: 'sqm' },
            { item: 'Brickwork', price: 120, unit: 'sqm' },
            { item: 'Roof structure', price: 95, unit: 'sqm' },
            { item: 'Windows and doors', price: 1200, unit: 'each' },
            { item: 'Electrical work', price: 2500, unit: 'fixed' },
            { item: 'Plumbing', price: 1800, unit: 'fixed' },
            { item: 'Plastering', price: 25, unit: 'sqm' },
            { item: 'Flooring', price: 55, unit: 'sqm' }
          ],
          averageSize: 20, // sqm
          priceRange: { min: 25000, max: 60000 }
        },
        interior_decoration: {
          baseItems: [
            { item: 'Paint and materials', price: 15, unit: 'sqm' },
            { item: 'Labour (per room)', price: 800, unit: 'room' },
            { item: 'Wallpaper hanging', price: 35, unit: 'sqm' },
            { item: 'Ceiling work', price: 20, unit: 'sqm' },
            { item: 'Woodwork painting', price: 25, unit: 'sqm' },
            { item: 'Floor preparation', price: 18, unit: 'sqm' }
          ],
          averageRooms: 4,
          priceRange: { min: 3000, max: 15000 }
        }
      },
      
      quotes: Array.from({ length: faker.number.int({ min: 8, max: 15 }) }, (_, i) => {
        const projectType = faker.helpers.arrayElement(['loft_conversion', 'extension', 'interior_decoration'])
        const template = ConstructionDataFactory.generateQuoting().templates[projectType]
        const quoteValue = faker.number.int(template.priceRange)
        
        return {
          id: `QUO-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
          customerId: faker.string.uuid(),
          projectType,
          lineItems: template.baseItems.map(item => ({
            ...item,
            quantity: item.unit === 'sqm' ? faker.number.int({ min: 15, max: 40 }) : 
                     item.unit === 'room' ? faker.number.int({ min: 1, max: 5 }) : 1,
            total: item.price * (item.unit === 'sqm' ? faker.number.int({ min: 15, max: 40 }) : 1)
          })),
          subtotal: quoteValue * 0.8,
          vatAmount: quoteValue * 0.2,
          totalAmount: quoteValue,
          validUntil: faker.date.future({ days: 30 }),
          status: faker.helpers.arrayElement(['draft', 'sent', 'approved', 'rejected']),
          sentDate: faker.date.recent({ days: 14 }),
          notes: faker.lorem.paragraph()
        }
      }),
      
      integrations: ['quickbooks', 'xero'],
      vatRate: 20,
      paymentTerms: ['50% deposit, 50% on completion', '30% deposit, 30% mid-project, 40% completion']
    }
  },

  // Generate project management data
  generateProjects: () => {
    return {
      projects: Array.from({ length: faker.number.int({ min: 4, max: 8 }) }, (_, i) => {
        const projectType = faker.helpers.arrayElement(['loft_conversion', 'extension', 'interior_decoration'])
        const stages = {
          loft_conversion: ['planning', 'structural_design', 'building_regs', 'construction', 'electrical', 'plumbing', 'finishing'],
          extension: ['planning', 'design', 'foundations', 'building', 'roofing', 'electrical', 'plumbing', 'finishing'],
          interior_decoration: ['planning', 'preparation', 'painting', 'wallpapering', 'flooring', 'finishing']
        }
        
        return {
          id: `PROJ-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
          type: projectType,
          customerId: faker.string.uuid(),
          title: faker.helpers.arrayElement([
            'Victorian Loft Conversion',
            'Modern Kitchen Extension',
            'Complete House Redecoration',
            'Two Storey Extension'
          ]),
          status: faker.helpers.arrayElement(['active', 'on_hold', 'completed']),
          
          stages: stages[projectType].map((stage, index) => ({
            id: index + 1,
            name: stage,
            status: index < 2 ? 'completed' : index === 2 ? 'in_progress' : 'pending',
            startDate: faker.date.recent({ days: 30 - (index * 4) }),
            endDate: index < 2 ? faker.date.recent({ days: 25 - (index * 4) }) : faker.date.future({ days: (index - 2) * 7 }),
            assignedTo: faker.person.fullName(),
            notes: faker.lorem.sentence()
          })),
          
          tasks: Array.from({ length: faker.number.int({ min: 8, max: 15 }) }, (_, taskIndex) => ({
            id: taskIndex + 1,
            title: faker.helpers.arrayElement([
              'Site preparation',
              'Material delivery',
              'Structural work',
              'Electrical rough-in',
              'Plumbing installation',
              'Insulation',
              'Drywall installation',
              'Painting preparation',
              'Final inspection'
            ]),
            description: faker.lorem.sentence(),
            assignedTo: faker.person.fullName(),
            dueDate: faker.date.future({ days: taskIndex * 2 }),
            status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed', 'blocked']),
            priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
            estimatedHours: faker.number.int({ min: 4, max: 24 })
          })),
          
          timeline: {
            startDate: faker.date.recent({ days: 30 }),
            estimatedEndDate: faker.date.future({ days: 45 }),
            actualEndDate: null,
            milestones: [
              { name: 'Planning approved', date: faker.date.recent({ days: 20 }) },
              { name: 'Construction start', date: faker.date.recent({ days: 15 }) },
              { name: 'Structural complete', date: faker.date.future({ days: 10 }) },
              { name: 'Final completion', date: faker.date.future({ days: 45 }) }
            ]
          },
          
          documents: [
            { type: 'contract', name: 'Construction Contract.pdf', uploadDate: faker.date.recent({ days: 30 }) },
            { type: 'plans', name: 'Architectural Plans.pdf', uploadDate: faker.date.recent({ days: 25 }) },
            { type: 'permit', name: 'Building Permit.pdf', uploadDate: faker.date.recent({ days: 20 }) },
            { type: 'rams', name: 'Risk Assessment.pdf', uploadDate: faker.date.recent({ days: 15 }) }
          ]
        }
      }),
      
      ganttData: Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        text: faker.helpers.arrayElement([
          'Site preparation',
          'Foundation work',
          'Structural frame',
          'Roofing',
          'Electrical rough-in',
          'Plumbing rough-in'
        ]),
        start_date: faker.date.recent({ days: 30 }),
        duration: faker.number.int({ min: 3, max: 14 }),
        progress: faker.number.float({ min: 0, max: 1, precision: 0.1 }),
        parent: i < 5 ? 0 : faker.number.int({ min: 1, max: 5 })
      }))
    }
  },

  // Generate calendar and scheduling data
  generateScheduling: () => {
    return {
      appointments: Array.from({ length: faker.number.int({ min: 15, max: 25 }) }, () => ({
        id: faker.string.uuid(),
        type: faker.helpers.arrayElement(['site_visit', 'delivery', 'inspection', 'client_meeting', 'work_session']),
        title: faker.helpers.arrayElement([
          'Initial site survey',
          'Material delivery',
          'Building control inspection',
          'Client progress meeting',
          'Electrical work',
          'Plumbing installation'
        ]),
        dateTime: faker.date.future({ days: 30 }),
        duration: faker.number.int({ min: 60, max: 480 }), // minutes
        assignedTo: faker.person.fullName(),
        customer: faker.person.fullName(),
        project: `PROJ-${new Date().getFullYear()}-${faker.number.int({ min: 1, max: 10 }).toString().padStart(3, '0')}`,
        location: faker.location.streetAddress(),
        notes: faker.lorem.sentence(),
        reminders: [
          { type: 'email', time: '24 hours before' },
          { type: 'sms', time: '2 hours before' }
        ],
        status: faker.helpers.arrayElement(['scheduled', 'confirmed', 'completed', 'cancelled'])
      })),
      
      teamAvailability: {
        [faker.person.fullName()]: {
          role: 'Lead Builder',
          availability: Array.from({ length: 7 }, (_, i) => ({
            day: faker.date.future({ days: i }),
            available: faker.datatype.boolean(0.8),
            hours: faker.helpers.arrayElement(['Full Day', 'Morning Only', 'Afternoon Only', 'Not Available'])
          }))
        },
        [faker.person.fullName()]: {
          role: 'Electrician',
          availability: Array.from({ length: 7 }, (_, i) => ({
            day: faker.date.future({ days: i }),
            available: faker.datatype.boolean(0.7),
            hours: faker.helpers.arrayElement(['Full Day', 'Morning Only', 'Afternoon Only', 'Not Available'])
          }))
        }
      },
      
      integrations: ['google_calendar', 'outlook'],
      reminderTypes: ['email', 'sms', 'app_notification', 'whatsapp']
    }
  },

  // Generate file management data
  generateFileManagement: () => {
    return {
      projects: Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, () => ({
        projectId: faker.string.uuid(),
        files: {
          photos: Array.from({ length: faker.number.int({ min: 10, max: 25 }) }, () => ({
            id: faker.string.uuid(),
            url: `https://example.com/photos/${faker.string.uuid()}.jpg`,
            filename: `${faker.helpers.arrayElement(['before', 'during', 'after'])}_${faker.date.recent().getTime()}.jpg`,
            uploadDate: faker.date.recent({ days: 30 }),
            stage: faker.helpers.arrayElement(['before', 'during', 'after']),
            description: faker.lorem.sentence(),
            uploadedBy: faker.person.fullName(),
            size: faker.number.int({ min: 500000, max: 5000000 }), // bytes
            tags: faker.helpers.arrayElements(['progress', 'issue', 'completion', 'quality'], { min: 0, max: 2 })
          })),
          
          drawings: Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, () => ({
            id: faker.string.uuid(),
            url: `https://example.com/drawings/${faker.string.uuid()}.pdf`,
            filename: `${faker.helpers.arrayElement(['floor_plan', 'elevation', 'section'])}_v${faker.number.int({ min: 1, max: 5 })}.pdf`,
            uploadDate: faker.date.recent({ days: 30 }),
            type: faker.helpers.arrayElement(['architectural', 'structural', 'electrical', 'plumbing']),
            version: faker.number.int({ min: 1, max: 5 }),
            status: faker.helpers.arrayElement(['draft', 'approved', 'superseded'])
          })),
          
          permits: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => ({
            id: faker.string.uuid(),
            url: `https://example.com/permits/${faker.string.uuid()}.pdf`,
            filename: `${faker.helpers.arrayElement(['planning_permission', 'building_regs', 'party_wall'])}.pdf`,
            uploadDate: faker.date.recent({ days: 60 }),
            type: faker.helpers.arrayElement(['planning_permission', 'building_regulations', 'party_wall_agreement']),
            status: faker.helpers.arrayElement(['applied', 'approved', 'conditional_approval']),
            expiryDate: faker.date.future({ years: 1 })
          })),
          
          contracts: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
            id: faker.string.uuid(),
            url: `https://example.com/contracts/${faker.string.uuid()}.pdf`,
            filename: `construction_contract_${faker.date.recent().getTime()}.pdf`,
            uploadDate: faker.date.recent({ days: 30 }),
            type: faker.helpers.arrayElement(['main_contract', 'subcontractor_agreement', 'material_supply']),
            signedDate: faker.date.recent({ days: 25 }),
            parties: [faker.person.fullName(), `${faker.person.lastName()} Construction Ltd`]
          }))
        }
      })),
      
      sharingOptions: ['customer_portal', 'secure_link', 'email', 'whatsapp'],
      storageUsed: faker.number.int({ min: 2000, max: 10000 }), // MB
      storageLimit: 50000 // MB
    }
  },

  // Generate team management data
  generateTeam: () => {
    return {
      team: [
        {
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          role: 'admin',
          title: 'Company Owner',
          skills: ['Project Management', 'Customer Relations', 'Building Regulations'],
          certifications: ['CSCS', 'First Aid'],
          availability: 'Full Time',
          accessLevel: 'full',
          phone: faker.phone.number('+44 7### ######'),
          email: faker.internet.email(),
          joinDate: faker.date.past({ years: 5 })
        },
        ...Array.from({ length: faker.number.int({ min: 2, max: 4 }) }, () => ({
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          role: 'worker',
          title: faker.helpers.arrayElement(['Site Foreman', 'Senior Builder', 'Multi-Trade']),
          skills: faker.helpers.arrayElements(['Carpentry', 'Brickwork', 'Roofing', 'General Building'], { min: 2, max: 4 }),
          certifications: faker.helpers.arrayElements(['CSCS', 'First Aid', 'Working at Height'], { min: 1, max: 3 }),
          availability: faker.helpers.arrayElement(['Full Time', 'Part Time', 'Contract']),
          accessLevel: 'project',
          phone: faker.phone.number('+44 7### ######'),
          email: faker.internet.email(),
          joinDate: faker.date.past({ years: 2 }),
          hourlyRate: faker.number.int({ min: 18, max: 35 })
        })),
        ...Array.from({ length: faker.number.int({ min: 3, max: 6 }) }, () => ({
          id: faker.string.uuid(),
          name: faker.person.fullName(),
          role: 'subcontractor',
          title: faker.helpers.arrayElement(['Electrician', 'Plumber', 'Plasterer', 'Roofer']),
          company: `${faker.person.lastName()} ${faker.helpers.arrayElement(['Electrical', 'Plumbing', 'Plastering'])}`,
          skills: faker.helpers.arrayElements(['Electrical Installation', 'Plumbing', 'Plastering', 'Roofing'], { min: 1, max: 2 }),
          certifications: faker.helpers.arrayElements(['Gas Safe', 'NICEIC', 'JIB', 'CSCS'], { min: 1, max: 3 }),
          availability: faker.helpers.arrayElement(['Available', 'Booked until [date]', 'Limited']),
          accessLevel: 'assigned_projects',
          phone: faker.phone.number('+44 7### ######'),
          email: faker.internet.email(),
          specialties: faker.helpers.arrayElements(['Rewiring', 'Central Heating', 'Bathroom Installation'], { min: 1, max: 2 }),
          rateCard: {
            dailyRate: faker.number.int({ min: 180, max: 350 }),
            callOutFee: faker.number.int({ min: 50, max: 100 }),
            overtime: faker.number.int({ min: 25, max: 45 })
          },
          projects: Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => faker.string.uuid()),
          rating: faker.number.float({ min: 3.5, max: 5.0, precision: 0.1 }),
          joinDate: faker.date.past({ years: 1 })
        }))
      ],
      
      timeTracking: {
        enabled: true,
        method: faker.helpers.arrayElement(['manual', 'app_checkin', 'gps_tracking']),
        features: ['project_time', 'break_tracking', 'overtime_alerts', 'weekly_reports']
      },
      
      roles: {
        admin: ['full_access', 'user_management', 'financial_reports', 'system_settings'],
        worker: ['project_access', 'time_tracking', 'file_upload', 'customer_communication'],
        subcontractor: ['assigned_projects', 'time_tracking', 'file_upload'],
        customer: ['project_view', 'file_access', 'communication', 'invoice_view']
      }
    }
  },

  // Generate financial data
  generateFinances: () => {
    const projects = Array.from({ length: faker.number.int({ min: 5, max: 10 }) }, (_, i) => {
      const revenue = faker.number.int({ min: 15000, max: 80000 })
      const costs = revenue * faker.number.float({ min: 0.6, max: 0.8, precision: 0.01 })
      const profit = revenue - costs
      
      return {
        id: `PROJ-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
        revenue,
        costs,
        profit,
        margin: ((profit / revenue) * 100).toFixed(1)
      }
    })
    
    return {
      payments: Array.from({ length: faker.number.int({ min: 15, max: 25 }) }, () => ({
        id: faker.string.uuid(),
        projectId: faker.helpers.arrayElement(projects).id,
        amount: faker.number.int({ min: 500, max: 15000 }),
        method: faker.helpers.arrayElement(['bank_transfer', 'card', 'cash', 'cheque']),
        status: faker.helpers.arrayElement(['received', 'pending', 'overdue']),
        date: faker.date.recent({ days: 90 }),
        invoiceId: `INV-${new Date().getFullYear()}-${faker.number.int({ min: 1, max: 100 }).toString().padStart(3, '0')}`,
        reference: faker.string.alphanumeric(8),
        notes: faker.lorem.sentence()
      })),
      
      expenses: Array.from({ length: faker.number.int({ min: 20, max: 40 }) }, () => ({
        id: faker.string.uuid(),
        projectId: faker.helpers.arrayElement(projects).id,
        category: faker.helpers.arrayElement(['materials', 'labor', 'equipment', 'transport', 'other']),
        description: faker.helpers.arrayElement([
          'Building materials - Wickes',
          'Subcontractor payment',
          'Tool hire - HSS',
          'Fuel and transport',
          'Site welfare facilities'
        ]),
        amount: faker.number.int({ min: 50, max: 2500 }),
        date: faker.date.recent({ days: 60 }),
        supplier: faker.company.name(),
        receipt: faker.datatype.boolean(0.8),
        vatReclaim: faker.datatype.boolean(0.7)
      })),
      
      projects,
      
      summary: {
        totalRevenue: projects.reduce((sum, p) => sum + p.revenue, 0),
        totalCosts: projects.reduce((sum, p) => sum + p.costs, 0),
        totalProfit: projects.reduce((sum, p) => sum + p.profit, 0),
        averageMargin: (projects.reduce((sum, p) => sum + parseFloat(p.margin), 0) / projects.length).toFixed(1),
        outstandingInvoices: faker.number.int({ min: 5000, max: 25000 }),
        cashFlow: faker.number.int({ min: -5000, max: 15000 })
      }
    }
  },

  // Generate customer portal data
  generateCustomerPortal: () => {
    return {
      customers: Array.from({ length: faker.number.int({ min: 8, max: 12 }) }, () => ({
        id: faker.string.uuid(),
        name: faker.person.fullName(),
        email: faker.internet.email(),
        portal: {
          loginCredentials: {
            username: faker.internet.userName(),
            lastLogin: faker.date.recent({ days: 7 }),
            loginCount: faker.number.int({ min: 2, max: 15 })
          },
          projects: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
            id: faker.string.uuid(),
            name: faker.helpers.arrayElement([
              'Loft Conversion Project',
              'Kitchen Extension',
              'Full House Renovation'
            ]),
            status: faker.helpers.arrayElement(['planning', 'in_progress', 'completed']),
            progress: faker.number.int({ min: 10, max: 100 }),
            access: ['progress_photos', 'documents', 'invoices', 'timeline'],
            communicationLog: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
              date: faker.date.recent({ days: 30 }),
              type: faker.helpers.arrayElement(['update', 'question', 'approval_request']),
              message: faker.lorem.sentence(),
              from: faker.helpers.arrayElement(['customer', 'contractor']),
              responded: faker.datatype.boolean(0.8)
            })),
            approvalWorkflow: {
              quotesApproved: faker.number.int({ min: 0, max: 3 }),
              documentsApproved: faker.number.int({ min: 0, max: 5 }),
              changesRequested: faker.number.int({ min: 0, max: 2 })
            }
          })),
          permissions: {
            viewPhotos: true,
            downloadDocuments: true,
            approveQuotes: true,
            requestChanges: true,
            viewInvoices: true,
            payOnline: faker.datatype.boolean(0.7)
          },
          notifications: {
            email: true,
            sms: faker.datatype.boolean(0.6),
            app: faker.datatype.boolean(0.8)
          }
        }
      })),
      
      features: [
        'Real-time project progress',
        'Photo gallery with before/during/after',
        'Document library access',
        'Invoice viewing and payment',
        'Direct messaging with contractor',
        'Approval workflow for quotes and changes',
        'Timeline view of project milestones'
      ],
      
      usage: {
        averageLogins: faker.number.int({ min: 3, max: 12 }),
        mostUsedFeature: 'Progress Photos',
        customerSatisfaction: faker.number.float({ min: 4.0, max: 5.0, precision: 0.1 })
      }
    }
  },

  // Generate compliance and safety data
  generateCompliance: () => {
    return {
      rams: Array.from({ length: faker.number.int({ min: 8, max: 15 }) }, (_, i) => ({
        id: `RAMS-${new Date().getFullYear()}-${String(i + 1).padStart(3, '0')}`,
        projectId: faker.string.uuid(),
        title: faker.helpers.arrayElement([
          'Loft Conversion RAMS',
          'Extension Work RAMS',
          'Electrical Installation RAMS',
          'Working at Height RAMS'
        ]),
        riskAssessment: {
          hazards: faker.helpers.arrayElements([
            'Working at height',
            'Manual handling',
            'Electrical hazards',
            'Dust and debris',
            'Structural instability'
          ], { min: 2, max: 4 }),
          riskLevel: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
          controlMeasures: faker.helpers.arrayElements([
            'Safety harnesses and barriers',
            'Proper lifting techniques',
            'Electrical isolation procedures',
            'Dust masks and ventilation',
            'Structural assessment'
          ], { min: 2, max: 4 })
        },
        methodStatement: {
          workSteps: Array.from({ length: faker.number.int({ min: 5, max: 10 }) }, (_, stepIndex) => ({
            step: stepIndex + 1,
            description: faker.lorem.sentence(),
            safety: faker.lorem.sentence(),
            equipment: faker.helpers.arrayElements(['PPE', 'Tools', 'Safety equipment'], { min: 1, max: 3 })
          }))
        },
        approvedBy: faker.person.fullName(),
        approvalDate: faker.date.recent({ days: 30 }),
        expiryDate: faker.date.future({ months: 6 }),
        reviewDate: faker.date.future({ months: 3 }),
        status: faker.helpers.arrayElement(['draft', 'approved', 'expired', 'under_review'])
      })),
      
      certifications: {
        gasSafe: {
          number: `${faker.number.int({ min: 100000, max: 999999 })}`,
          holder: faker.person.fullName(),
          expiryDate: faker.date.future({ years: 1 }),
          categories: ['CCN1', 'CEN1', 'WAT1']
        },
        niceic: {
          number: `${faker.string.alpha({ length: 2, casing: 'upper' })}${faker.number.int({ min: 10000, max: 99999 })}`,
          holder: faker.person.fullName(),
          expiryDate: faker.date.future({ years: 1 }),
          categories: ['Domestic Installer', 'Part P']
        },
        insurance: {
          publicLiability: {
            provider: faker.company.name(),
            amount: '£2,000,000',
            expiryDate: faker.date.future({ months: 11 }),
            policyNumber: faker.string.alphanumeric(10)
          },
          employersLiability: {
            provider: faker.company.name(),
            amount: '£10,000,000',
            expiryDate: faker.date.future({ months: 11 }),
            policyNumber: faker.string.alphanumeric(10)
          }
        }
      },
      
      reminders: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => {
        const expiryDate = faker.date.future({ months: 6 })
        const today = new Date()
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))
        
        return {
          documentType: faker.helpers.arrayElement(['Gas Safe Certificate', 'NICEIC Registration', 'Insurance Policy', 'RAMS Document']),
          expiryDate,
          daysUntilExpiry,
          urgency: daysUntilExpiry < 30 ? 'high' : daysUntilExpiry < 60 ? 'medium' : 'low',
          action: 'Renewal required'
        }
      }),
      
      inspections: Array.from({ length: faker.number.int({ min: 5, max: 12 }) }, () => ({
        id: faker.string.uuid(),
        type: faker.helpers.arrayElement(['Building Control', 'Electrical', 'Gas Safety', 'Health & Safety']),
        projectId: faker.string.uuid(),
        scheduledDate: faker.date.future({ days: 30 }),
        inspector: faker.person.fullName(),
        status: faker.helpers.arrayElement(['scheduled', 'passed', 'failed', 'conditional_pass']),
        notes: faker.lorem.sentence()
      }))
    }
  },

  // Generate reporting and insights data
  generateReports: () => {
    const projects = ConstructionDataFactory.generateFinances().projects
    
    return {
      profitability: projects.map(project => ({
        ...project,
        completion: faker.number.int({ min: 45, max: 100 }),
        timeline: faker.helpers.arrayElement(['On Track', 'Delayed', 'Ahead of Schedule']),
        customerSatisfaction: faker.number.float({ min: 3.5, max: 5.0, precision: 0.1 })
      })),
      
      outstandingInvoices: Array.from({ length: faker.number.int({ min: 5, max: 12 }) }, () => ({
        invoiceId: `INV-${new Date().getFullYear()}-${faker.number.int({ min: 1, max: 100 }).toString().padStart(3, '0')}`,
        customer: faker.person.fullName(),
        amount: faker.number.int({ min: 500, max: 15000 }),
        dueDate: faker.date.future({ days: 30 }),
        daysPastDue: faker.number.int({ min: 0, max: 45 }),
        status: faker.helpers.arrayElement(['pending', 'overdue', 'disputed'])
      })),
      
      workload: {
        teamMembers: Array.from({ length: faker.number.int({ min: 4, max: 8 }) }, () => ({
          name: faker.person.fullName(),
          role: faker.helpers.arrayElement(['Lead Builder', 'Electrician', 'Plumber', 'General Builder']),
          currentProjects: faker.number.int({ min: 1, max: 4 }),
          hoursThisWeek: faker.number.int({ min: 20, max: 50 }),
          utilization: faker.number.int({ min: 60, max: 100 }),
          availability: faker.helpers.arrayElement(['Available', 'Fully Booked', 'Limited'])
        })),
        projects: Array.from({ length: faker.number.int({ min: 6, max: 12 }) }, () => ({
          id: faker.string.uuid(),
          name: faker.lorem.words(3),
          status: faker.helpers.arrayElement(['planning', 'in_progress', 'delayed', 'completed']),
          teamSize: faker.number.int({ min: 2, max: 6 }),
          daysRemaining: faker.number.int({ min: 5, max: 45 }),
          workloadLevel: faker.helpers.arrayElement(['Light', 'Medium', 'Heavy', 'Critical'])
        }))
      },
      
      upcomingDeadlines: Array.from({ length: faker.number.int({ min: 8, max: 15 }) }, () => ({
        type: faker.helpers.arrayElement(['Project Completion', 'Planning Permission', 'Building Control Inspection', 'Material Delivery']),
        description: faker.lorem.sentence(),
        date: faker.date.future({ days: 30 }),
        priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'critical']),
        project: faker.lorem.words(3),
        assignedTo: faker.person.fullName()
      })),
      
      analytics: {
        monthlyRevenue: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
          revenue: faker.number.int({ min: 15000, max: 80000 }),
          projects: faker.number.int({ min: 2, max: 8 }),
          profit: faker.number.int({ min: 3000, max: 20000 })
        })),
        customerAcquisition: {
          newCustomers: faker.number.int({ min: 2, max: 6 }),
          leadSources: {
            'Google': 35,
            'Referrals': 30,
            'Facebook': 20,
            'Website': 15
          },
          conversionRate: faker.number.int({ min: 15, max: 35 })
        },
        projectTypes: {
          'Loft Conversions': 40,
          'Extensions': 35,
          'Interior Decoration': 25
        }
      }
    }
  },

  // Generate platform requirements data
  generatePlatform: () => {
    return {
      platforms: ['mobile_app', 'web_desktop'],
      primaryPlatform: 'mobile',
      userRoles: ['admin', 'customer', 'subcontractor'],
      
      mobileFeatures: [
        { name: 'Project Dashboard', offlineCapable: true, priority: 'high' },
        { name: 'Photo Upload', offlineCapable: true, priority: 'high' },
        { name: 'Time Tracking', offlineCapable: true, priority: 'high' },
        { name: 'Customer Communication', offlineCapable: false, priority: 'high' },
        { name: 'Document Access', offlineCapable: true, priority: 'medium' },
        { name: 'Calendar/Scheduling', offlineCapable: false, priority: 'medium' },
        { name: 'Expense Recording', offlineCapable: true, priority: 'medium' },
        { name: 'Quote Generation', offlineCapable: true, priority: 'low' },
        { name: 'Invoice Management', offlineCapable: false, priority: 'low' },
        { name: 'Reporting', offlineCapable: false, priority: 'low' }
      ],
      
      desktopFeatures: [
        'Advanced Reporting',
        'Bulk Operations',
        'System Administration',
        'Financial Management',
        'Customer Portal Management',
        'Document Templates'
      ],
      
      integrations: {
        essential: ['Google Calendar', 'WhatsApp', 'Email'],
        accounting: ['QuickBooks', 'Xero'],
        optional: ['HMRC MTD', 'Material Suppliers', 'Payment Gateways']
      },
      
      performance: {
        loadTime: '< 2 seconds',
        offlineSync: 'Automatic when online',
        dataUsage: 'Optimized for mobile data',
        storage: 'Local storage for offline features'
      }
    }
  }
}