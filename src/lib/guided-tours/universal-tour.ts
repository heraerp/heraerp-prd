// HERA Universal Guided Tour System
// Powered by Intro.js with HERA DNA design integration

// Dynamic import for client-side only (Next.js SSR compatibility)
let introJs: any = null
let IntroJs: any = null

if (typeof window !== 'undefined') {
  import('intro.js').then((module) => {
    introJs = module.default
    IntroJs = module.IntroJs
  })
}

export interface TourStep {
  element: string
  intro: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  highlightClass?: string
}

export interface IndustryTour {
  id: string
  industry: string
  module: string
  title: string
  description: string
  steps: TourStep[]
}

// Universal tour steps that apply to all HERA applications
export const UNIVERSAL_TOUR_STEPS = {
  // Header and Navigation
  header: {
    element: 'header',
    intro: '🏢 <strong>Command Center Header</strong><br/>Your real-time business metrics and quick actions are always visible here.',
    position: 'bottom' as const
  },
  
  metrics: {
    element: '[data-tour="metrics-bar"]',
    intro: '📊 <strong>Live Business Metrics</strong><br/>Monitor your key performance indicators in real-time. These update automatically as your business grows.',
    position: 'bottom' as const
  },
  
  welcomeSection: {
    element: '[data-tour="welcome-section"]',
    intro: '👋 <strong>Personalized Welcome</strong><br/>Your business hub with personalized greetings and industry-specific insights.',
    position: 'bottom' as const
  },
  
  moduleGrid: {
    element: '[data-tour="module-grid"]',
    intro: '🎯 <strong>Business Modules</strong><br/>Access all your business operations through these intelligent modules. Each card shows live statistics and performance trends.',
    position: 'top' as const
  },
  
  moduleCard: {
    element: '[data-tour="module-card"]:first-child',
    intro: '💳 <strong>Smart Module Cards</strong><br/>Each module shows real stats, performance trends, and provides instant access to your operations. Hover to see the premium animations!',
    position: 'top' as const
  },
  
  quickActions: {
    element: '[data-tour="quick-actions"]',
    intro: '⚡ <strong>Quick Actions</strong><br/>Perform common tasks instantly without navigating through multiple screens. Your most frequent actions are always one click away.',
    position: 'top' as const
  },
  
  sidebar: {
    element: '[data-tour="sidebar"]',
    intro: '🧭 <strong>Smart Navigation</strong><br/>Microsoft Teams-style sidebar for instant access to any module. Hover over icons to see labels and tooltips.',
    position: 'right' as const
  },
  
  completedTour: {
    element: 'body',
    intro: '🎉 <strong>Welcome to HERA!</strong><br/>You\'re now ready to experience the future of business management. Each module has its own guided tour when you\'re ready to dive deeper.<br/><br/>💡 <em>Tip: Click the "?" icon in any module to restart its tour.</em>',
    position: 'top' as const
  }
}

// Industry-specific tour configurations
export const INDUSTRY_TOURS: Record<string, IndustryTour> = {
  restaurant: {
    id: 'restaurant-main',
    industry: 'restaurant',
    module: 'main',
    title: 'Welcome to Your Restaurant Management System',
    description: 'Learn how to manage your restaurant operations like a pro',
    steps: [
      UNIVERSAL_TOUR_STEPS.header,
      UNIVERSAL_TOUR_STEPS.metrics,
      {
        element: '[data-tour="metrics-bar"] > div:nth-child(2)',
        intro: '🍽️ <strong>Active Tables</strong><br/>Track your restaurant capacity and table turnover in real-time.',
        position: 'bottom'
      },
      UNIVERSAL_TOUR_STEPS.welcomeSection,
      UNIVERSAL_TOUR_STEPS.moduleGrid,
      {
        element: '[data-tour="module-card"][data-module="pos"]',
        intro: '🛒 <strong>Point of Sale</strong><br/>Process orders, handle payments, and manage your daily sales operations.',
        position: 'top'
      },
      {
        element: '[data-tour="module-card"][data-module="menu"]',
        intro: '📋 <strong>Menu Management</strong><br/>Update your menu, manage pricing, and track popular items.',
        position: 'top'
      },
      {
        element: '[data-tour="module-card"][data-module="kitchen"]',
        intro: '👨‍🍳 <strong>Kitchen Display</strong><br/>Real-time order management and kitchen workflow optimization.',
        position: 'top'
      },
      UNIVERSAL_TOUR_STEPS.quickActions,
      UNIVERSAL_TOUR_STEPS.sidebar,
      UNIVERSAL_TOUR_STEPS.completedTour
    ]
  },

  healthcare: {
    id: 'healthcare-main',
    industry: 'healthcare',
    module: 'main',
    title: 'Welcome to Your Healthcare Practice Management',
    description: 'Streamline your medical practice with intelligent automation',
    steps: [
      UNIVERSAL_TOUR_STEPS.header,
      UNIVERSAL_TOUR_STEPS.metrics,
      {
        element: '[data-tour="metrics-bar"] > div:nth-child(2)',
        intro: '🏥 <strong>Active Patients</strong><br/>Monitor patient flow and practice capacity in real-time.',
        position: 'bottom'
      },
      UNIVERSAL_TOUR_STEPS.welcomeSection,
      UNIVERSAL_TOUR_STEPS.moduleGrid,
      {
        element: '[data-tour="module-card"][data-module="appointments"]',
        intro: '📅 <strong>Appointment Scheduling</strong><br/>Manage patient appointments, reduce no-shows, and optimize your schedule.',
        position: 'top'
      },
      {
        element: '[data-tour="module-card"][data-module="patients"]',
        intro: '👥 <strong>Patient Records</strong><br/>Comprehensive health management with secure, HIPAA-compliant records.',
        position: 'top'
      },
      {
        element: '[data-tour="module-card"][data-module="billing"]',
        intro: '💰 <strong>Billing & Insurance</strong><br/>Streamlined financial operations with insurance claim management.',
        position: 'top'
      },
      UNIVERSAL_TOUR_STEPS.quickActions,
      UNIVERSAL_TOUR_STEPS.sidebar,
      UNIVERSAL_TOUR_STEPS.completedTour
    ]
  },

  'enterprise-retail': {
    id: 'retail-main',
    industry: 'enterprise-retail',
    module: 'main',
    title: 'Welcome to Your Enterprise Retail Command Center',
    description: 'Master modern retail operations with AI-powered insights',
    steps: [
      UNIVERSAL_TOUR_STEPS.header,
      UNIVERSAL_TOUR_STEPS.metrics,
      {
        element: '[data-tour="metrics-bar"] > div:nth-child(2)',
        intro: '🏪 <strong>Active Stores</strong><br/>Monitor performance across all your retail locations in real-time.',
        position: 'bottom'
      },
      UNIVERSAL_TOUR_STEPS.welcomeSection,
      UNIVERSAL_TOUR_STEPS.moduleGrid,
      {
        element: '[data-tour="module-card"][data-module="merchandising"]',
        intro: '🎨 <strong>Merchandising</strong><br/>Product lifecycle management, assortments, and visual merchandising optimization.',
        position: 'top'
      },
      {
        element: '[data-tour="module-card"][data-module="planning"]',
        intro: '📈 <strong>Planning & Buying</strong><br/>AI-powered demand forecasting and intelligent buying decisions.',
        position: 'top'
      },
      {
        element: '[data-tour="module-card"][data-module="analytics"]',
        intro: '📊 <strong>Retail Analytics</strong><br/>Business intelligence dashboards with competitive insights and performance optimization.',
        position: 'top'
      },
      UNIVERSAL_TOUR_STEPS.quickActions,
      UNIVERSAL_TOUR_STEPS.sidebar,
      UNIVERSAL_TOUR_STEPS.completedTour
    ]
  },

  // Retail Sub-Module Tours
  'retail-merchandising': {
    id: 'retail-merchandising',
    industry: 'enterprise-retail',
    module: 'merchandising',
    title: 'Welcome to Merchandising Management',
    description: 'Master product lifecycle, assortments, and visual merchandising',
    steps: [
      {
        element: 'header',
        intro: '🎨 <strong>Merchandising Command Center</strong><br/>Your central hub for product management, visual merchandising, and assortment planning.',
        position: 'bottom'
      },
      {
        element: '[data-tour="product-catalog"]',
        intro: '📦 <strong>Product Catalog</strong><br/>Manage your entire product portfolio with smart categorization and performance analytics.',
        position: 'bottom'
      },
      {
        element: '[data-tour="assortment-planning"]',
        intro: '🎯 <strong>Assortment Planning</strong><br/>Optimize your product mix by location and season using AI-powered recommendations.',
        position: 'top'
      },
      {
        element: '[data-tour="visual-merchandising"]',
        intro: '🖼️ <strong>Visual Merchandising</strong><br/>Create compelling store layouts and product displays that drive sales.',
        position: 'top'
      },
      {
        element: '[data-tour="performance-analytics"]',
        intro: '📈 <strong>Performance Analytics</strong><br/>Track product performance, identify top sellers, and spot trends early.',
        position: 'top'
      },
      UNIVERSAL_TOUR_STEPS.completedTour
    ]
  },

  'retail-planning': {
    id: 'retail-planning',
    industry: 'enterprise-retail',
    module: 'planning',
    title: 'Welcome to Demand Planning & Buying',
    description: 'AI-powered forecasting and intelligent buying decisions',
    steps: [
      {
        element: 'header',
        intro: '📊 <strong>Planning & Buying Center</strong><br/>Your AI-powered hub for demand forecasting and intelligent purchasing decisions.',
        position: 'bottom'
      },
      {
        element: '[data-tour="demand-forecast"]',
        intro: '🔮 <strong>Demand Forecasting</strong><br/>AI analyzes historical data, seasonality, and trends to predict future demand with 89% accuracy.',
        position: 'bottom'
      },
      {
        element: '[data-tour="buying-recommendations"]',
        intro: '🛒 <strong>Smart Buying</strong><br/>Get intelligent recommendations on what to buy, when to buy it, and how much inventory to maintain.',
        position: 'top'
      },
      {
        element: '[data-tour="supplier-management"]',
        intro: '🤝 <strong>Supplier Management</strong><br/>Manage supplier relationships, compare costs, and optimize your supply chain.',
        position: 'top'
      },
      {
        element: '[data-tour="seasonal-planning"]',
        intro: '🌟 <strong>Seasonal Planning</strong><br/>Plan for holidays, events, and seasonal changes with advanced predictive models.',
        position: 'top'
      },
      UNIVERSAL_TOUR_STEPS.completedTour
    ]
  },

  'retail-procurement': {
    id: 'retail-procurement',
    industry: 'enterprise-retail',
    module: 'procurement',
    title: 'Welcome to Procurement Management',
    description: 'Streamline supplier management and purchase orders',
    steps: [
      {
        element: 'header',
        intro: '🏪 <strong>Procurement Hub</strong><br/>Manage suppliers, purchase orders, and sourcing with complete transparency and control.',
        position: 'bottom'
      },
      {
        element: '[data-tour="supplier-directory"]',
        intro: '📋 <strong>Supplier Directory</strong><br/>Maintain comprehensive supplier profiles with performance ratings and contract details.',
        position: 'bottom'
      },
      {
        element: '[data-tour="purchase-orders"]',
        intro: '📄 <strong>Purchase Orders</strong><br/>Create, track, and manage purchase orders with automated approval workflows.',
        position: 'top'
      },
      {
        element: '[data-tour="sourcing-tools"]',
        intro: '🔍 <strong>Strategic Sourcing</strong><br/>Compare suppliers, negotiate better terms, and optimize your procurement strategy.',
        position: 'top'
      },
      {
        element: '[data-tour="cost-analytics"]',
        intro: '💰 <strong>Cost Analytics</strong><br/>Track spending patterns, identify cost savings opportunities, and manage budgets effectively.',
        position: 'top'
      },
      UNIVERSAL_TOUR_STEPS.completedTour
    ]
  },

  'retail-pos': {
    id: 'retail-pos',
    industry: 'enterprise-retail',
    module: 'pos',
    title: 'Welcome to Point of Sale System',
    description: 'Omnichannel sales and customer service excellence',
    steps: [
      {
        element: 'header',
        intro: '🛒 <strong>Point of Sale Command Center</strong><br/>Your unified platform for all sales channels - in-store, online, and mobile.',
        position: 'bottom'
      },
      {
        element: '[data-tour="transaction-interface"]',
        intro: '💳 <strong>Transaction Interface</strong><br/>Process sales quickly with intuitive touch interface and multiple payment options.',
        position: 'bottom'
      },
      {
        element: '[data-tour="customer-lookup"]',
        intro: '👤 <strong>Customer Management</strong><br/>Quick customer lookup, loyalty program integration, and purchase history access.',
        position: 'top'
      },
      {
        element: '[data-tour="inventory-check"]',
        intro: '📦 <strong>Real-time Inventory</strong><br/>Check stock levels, reserve items, and handle special orders seamlessly.',
        position: 'top'
      },
      {
        element: '[data-tour="sales-analytics"]',
        intro: '📊 <strong>Sales Analytics</strong><br/>Monitor daily sales performance, track goals, and identify opportunities.',
        position: 'top'
      },
      UNIVERSAL_TOUR_STEPS.completedTour
    ]
  },

  'retail-inventory': {
    id: 'retail-inventory',
    industry: 'enterprise-retail',
    module: 'inventory',
    title: 'Welcome to Inventory Management',
    description: 'Smart stock management and warehouse operations',
    steps: [
      {
        element: 'header',
        intro: '📦 <strong>Inventory Control Center</strong><br/>Manage stock levels, track movements, and optimize warehouse operations with precision.',
        position: 'bottom'
      },
      {
        element: '[data-tour="stock-levels"]',
        intro: '📊 <strong>Stock Levels</strong><br/>Real-time inventory levels across all locations with automatic reorder points and alerts.',
        position: 'bottom'
      },
      {
        element: '[data-tour="warehouse-operations"]',
        intro: '🏭 <strong>Warehouse Operations</strong><br/>Manage receiving, putaway, picking, and shipping with optimized workflows.',
        position: 'top'
      },
      {
        element: '[data-tour="inventory-transfers"]',
        intro: '🔄 <strong>Inventory Transfers</strong><br/>Move stock between locations efficiently with full tracking and documentation.',
        position: 'top'
      },
      {
        element: '[data-tour="cycle-counting"]',
        intro: '📋 <strong>Cycle Counting</strong><br/>Maintain inventory accuracy with systematic cycle counts and variance analysis.',
        position: 'top'
      },
      UNIVERSAL_TOUR_STEPS.completedTour
    ]
  },

  'retail-analytics': {
    id: 'retail-analytics',
    industry: 'enterprise-retail',
    module: 'analytics',
    title: 'Welcome to Retail Analytics',
    description: 'Business intelligence and performance insights',
    steps: [
      {
        element: 'header',
        intro: '📈 <strong>Analytics Command Center</strong><br/>Transform data into actionable insights with comprehensive retail analytics and reporting.',
        position: 'bottom'
      },
      {
        element: '[data-tour="kpi-dashboard"]',
        intro: '🎯 <strong>KPI Dashboard</strong><br/>Monitor key performance indicators across sales, inventory, customers, and operations.',
        position: 'bottom'
      },
      {
        element: '[data-tour="sales-analysis"]',
        intro: '💰 <strong>Sales Analysis</strong><br/>Deep dive into sales trends, customer behavior, and product performance patterns.',
        position: 'top'
      },
      {
        element: '[data-tour="predictive-insights"]',
        intro: '🔮 <strong>Predictive Insights</strong><br/>AI-powered forecasts and recommendations to optimize future performance.',
        position: 'top'
      },
      {
        element: '[data-tour="custom-reports"]',
        intro: '📊 <strong>Custom Reports</strong><br/>Build and schedule custom reports tailored to your specific business needs.',
        position: 'top'
      },
      UNIVERSAL_TOUR_STEPS.completedTour
    ]
  },

  'retail-promotions': {
    id: 'retail-promotions',
    industry: 'enterprise-retail',
    module: 'promotions',
    title: 'Welcome to Promotions & Marketing',
    description: 'Campaign management and loyalty programs',
    steps: [
      {
        element: 'header',
        intro: '🎪 <strong>Promotions Hub</strong><br/>Create, manage, and track promotional campaigns and customer loyalty programs.',
        position: 'bottom'
      },
      {
        element: '[data-tour="campaign-manager"]',
        intro: '🚀 <strong>Campaign Management</strong><br/>Design and execute promotional campaigns with advanced targeting and automation.',
        position: 'bottom'
      },
      {
        element: '[data-tour="loyalty-programs"]',
        intro: '⭐ <strong>Loyalty Programs</strong><br/>Build customer loyalty with points, rewards, and personalized offers.',
        position: 'top'
      },
      {
        element: '[data-tour="promotion-analytics"]',
        intro: '📈 <strong>Promotion Analytics</strong><br/>Measure campaign effectiveness and ROI with detailed performance metrics.',
        position: 'top'
      },
      {
        element: '[data-tour="customer-segments"]',
        intro: '🎯 <strong>Customer Segmentation</strong><br/>Target specific customer groups with personalized marketing messages.',
        position: 'top'
      },
      UNIVERSAL_TOUR_STEPS.completedTour
    ]
  },

  'retail-customers': {
    id: 'retail-customers',
    industry: 'enterprise-retail',
    module: 'customers',
    title: 'Welcome to Customer Management',
    description: 'CRM, segmentation, and customer experience',
    steps: [
      {
        element: 'header',
        intro: '👥 <strong>Customer Experience Center</strong><br/>Manage customer relationships, analyze behavior, and deliver personalized experiences.',
        position: 'bottom'
      },
      {
        element: '[data-tour="customer-profiles"]',
        intro: '📋 <strong>Customer Profiles</strong><br/>Comprehensive customer records with purchase history, preferences, and interaction timeline.',
        position: 'bottom'
      },
      {
        element: '[data-tour="segmentation-tools"]',
        intro: '🎯 <strong>Customer Segmentation</strong><br/>Group customers by behavior, demographics, and value for targeted marketing.',
        position: 'top'
      },
      {
        element: '[data-tour="communication-center"]',
        intro: '💬 <strong>Communication Center</strong><br/>Manage customer communications across email, SMS, and social media channels.',
        position: 'top'
      },
      {
        element: '[data-tour="customer-analytics"]',
        intro: '📊 <strong>Customer Analytics</strong><br/>Analyze customer lifetime value, churn risk, and engagement patterns.',
        position: 'top'
      },
      UNIVERSAL_TOUR_STEPS.completedTour
    ]
  },

  manufacturing: {
    id: 'manufacturing-main',
    industry: 'manufacturing',
    module: 'main',
    title: 'Welcome to Your Manufacturing ERP System',
    description: 'Optimize production efficiency with real-time monitoring',
    steps: [
      UNIVERSAL_TOUR_STEPS.header,
      UNIVERSAL_TOUR_STEPS.metrics,
      {
        element: '[data-tour="metrics-bar"] > div:nth-child(2)',
        intro: '🏭 <strong>Active Production Lines</strong><br/>Monitor manufacturing capacity and production efficiency in real-time.',
        position: 'bottom'
      },
      UNIVERSAL_TOUR_STEPS.welcomeSection,
      UNIVERSAL_TOUR_STEPS.moduleGrid,
      {
        element: '[data-tour="module-card"][data-module="production"]',
        intro: '⚙️ <strong>Production Floor</strong><br/>Real-time production monitoring, quality control, and workflow optimization.',
        position: 'top'
      },
      {
        element: '[data-tour="module-card"][data-module="quality"]',
        intro: '✅ <strong>Quality Control</strong><br/>Ensure excellence at every step with automated quality assurance processes.',
        position: 'top'
      },
      {
        element: '[data-tour="module-card"][data-module="inventory"]',
        intro: '📦 <strong>Raw Materials</strong><br/>Optimize inventory levels, reduce waste, and prevent stockouts.',
        position: 'top'
      },
      UNIVERSAL_TOUR_STEPS.quickActions,
      UNIVERSAL_TOUR_STEPS.sidebar,
      UNIVERSAL_TOUR_STEPS.completedTour
    ]
  },

  'real-estate': {
    id: 'realestate-main',
    industry: 'real-estate',
    module: 'main',
    title: 'Welcome to Your Real Estate Management Platform',
    description: 'Maximize property returns with intelligent portfolio management',
    steps: [
      UNIVERSAL_TOUR_STEPS.header,
      UNIVERSAL_TOUR_STEPS.metrics,
      {
        element: '[data-tour="metrics-bar"] > div:nth-child(2)',
        intro: '🏘️ <strong>Active Properties</strong><br/>Track occupancy rates and property performance across your entire portfolio.',
        position: 'bottom'
      },
      UNIVERSAL_TOUR_STEPS.welcomeSection,
      UNIVERSAL_TOUR_STEPS.moduleGrid,
      {
        element: '[data-tour="module-card"][data-module="properties"]',
        intro: '🏢 <strong>Property Management</strong><br/>Complete portfolio management with performance tracking and optimization.',
        position: 'top'
      },
      {
        element: '[data-tour="module-card"][data-module="tenants"]',
        intro: '👥 <strong>Tenant Relations</strong><br/>Build lasting relationships with streamlined tenant management and communication.',
        position: 'top'
      },
      {
        element: '[data-tour="module-card"][data-module="maintenance"]',
        intro: '🔧 <strong>Maintenance</strong><br/>Proactive property care with preventive maintenance scheduling and tracking.',
        position: 'top'
      },
      UNIVERSAL_TOUR_STEPS.quickActions,
      UNIVERSAL_TOUR_STEPS.sidebar,
      UNIVERSAL_TOUR_STEPS.completedTour
    ]
  }
}

// Universal Tour Manager Class
export class UniversalTourManager {
  private intro: IntroJs | null = null
  private currentTour: IndustryTour | null = null

  constructor() {
    this.setupDefaultStyles()
  }

  private setupDefaultStyles() {
    // Inject HERA DNA styles for Intro.js
    const style = document.createElement('style')
    style.textContent = `
      /* HERA DNA Tour Styles */
      .introjs-tooltip {
        background: rgba(255, 255, 255, 0.95) !important;
        backdrop-filter: blur(20px) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        border-radius: 16px !important;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        max-width: 400px !important;
      }
      
      .introjs-tooltip-title {
        font-weight: 600 !important;
        font-size: 18px !important;
        color: #111827 !important;
        margin-bottom: 8px !important;
      }
      
      .introjs-tooltiptext {
        font-size: 14px !important;
        line-height: 1.6 !important;
        color: #4B5563 !important;
      }
      
      .introjs-button {
        background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%) !important;
        border: none !important;
        border-radius: 8px !important;
        color: white !important;
        font-weight: 500 !important;
        padding: 8px 16px !important;
        transition: all 0.2s ease !important;
      }
      
      .introjs-button:hover {
        transform: translateY(-1px) !important;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
      }
      
      .introjs-prevbutton {
        background: rgba(75, 85, 99, 0.1) !important;
        color: #374151 !important;
      }
      
      .introjs-skipbutton {
        color: #6B7280 !important;
        font-weight: 500 !important;
      }
      
      .introjs-bullets {
        text-align: center !important;
      }
      
      .introjs-bullet {
        background: rgba(59, 130, 246, 0.3) !important;
        border: 2px solid rgba(59, 130, 246, 0.3) !important;
        border-radius: 50% !important;
        width: 8px !important;
        height: 8px !important;
      }
      
      .introjs-bullet.active {
        background: #3B82F6 !important;
        border-color: #3B82F6 !important;
      }
      
      .introjs-overlay {
        background: rgba(0, 0, 0, 0.4) !important;
        backdrop-filter: blur(2px) !important;
      }
      
      .introjs-helperLayer {
        border-radius: 12px !important;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3) !important;
      }
      
      /* Custom highlight classes */
      .hera-tour-highlight-primary {
        animation: heraTourPulse 2s infinite;
      }
      
      @keyframes heraTourPulse {
        0%, 100% { box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3); }
        50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.1); }
      }
      
      .hera-tour-highlight-success {
        box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.3) !important;
      }
      
      .hera-tour-highlight-warning {
        box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.3) !important;
      }
    `
    document.head.appendChild(style)
  }

  public async startTour(industryKey: string): Promise<void> {
    const tour = INDUSTRY_TOURS[industryKey]
    if (!tour) {
      console.warn(`No tour found for industry: ${industryKey}`)
      return
    }

    // Ensure introJs is loaded client-side
    if (typeof window === 'undefined') return
    
    if (!introJs) {
      const module = await import('intro.js')
      introJs = module.default
    }

    this.currentTour = tour
    this.intro = introJs()

    // Configure tour
    this.intro.setOptions({
      steps: tour.steps,
      showProgress: true,
      showBullets: true,
      exitOnOverlayClick: false,
      exitOnEsc: true,
      nextLabel: 'Next →',
      prevLabel: '← Back',
      skipLabel: 'Skip Tour',
      doneLabel: 'Start Exploring! 🚀',
      hidePrev: false,
      hideNext: false,
      scrollToElement: true,
      scrollTo: 'tooltip',
      overlayOpacity: 0.8,
      disableInteraction: true,
      tooltipClass: 'hera-tour-tooltip'
    })

    // Set up event handlers
    this.setupEventHandlers()

    // Start the tour
    this.intro.start()

    // Track tour start
    this.trackTourEvent('started', industryKey)
  }

  private setupEventHandlers(): void {
    if (!this.intro) return

    this.intro.onchange((targetElement: HTMLElement) => {
      // Add special highlighting for certain elements
      const step = this.intro?.getCurrentStep()
      if (step && step.highlightClass) {
        targetElement.classList.add(step.highlightClass)
      }
    })

    this.intro.oncomplete(() => {
      this.trackTourEvent('completed', this.currentTour?.industry || 'unknown')
      this.showCompletionMessage()
    })

    this.intro.onexit(() => {
      this.trackTourEvent('exited', this.currentTour?.industry || 'unknown')
    })
  }

  private showCompletionMessage(): void {
    // Show a success message
    const toast = document.createElement('div')
    toast.className = 'fixed top-4 right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white p-4 rounded-lg shadow-lg z-50'
    toast.innerHTML = `
      <div class="flex items-center gap-3">
        <div class="text-2xl">🎉</div>
        <div>
          <div class="font-semibold">Tour Complete!</div>
          <div class="text-sm opacity-90">You're ready to explore HERA</div>
        </div>
      </div>
    `
    document.body.appendChild(toast)

    setTimeout(() => {
      toast.remove()
    }, 5000)
  }

  private trackTourEvent(event: string, industry: string): void {
    // Track tour analytics
    console.log(`HERA Tour Event: ${event} for ${industry}`)
    
    // You can integrate with analytics services here
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'tour_action', {
        event_category: 'guided_tour',
        event_label: `${industry}_${event}`,
        value: 1
      })
    }
  }

  public static addTourDataAttributes(element: HTMLElement, tourId: string, moduleId?: string): void {
    element.setAttribute('data-tour', tourId)
    if (moduleId) {
      element.setAttribute('data-module', moduleId)
    }
  }

  public static createTourTrigger(industryKey: string, className = ''): HTMLButtonElement {
    const button = document.createElement('button')
    button.className = `tour-trigger ${className}`.trim()
    button.innerHTML = '❓ Take Tour'
    button.title = 'Start Guided Tour'
    
    button.onclick = async () => {
      const tourManager = new UniversalTourManager()
      await tourManager.startTour(industryKey)
    }
    
    return button
  }
}

// Hook for React components
export const useUniversalTour = (industryKey: string) => {
  const startTour = async () => {
    const tourManager = new UniversalTourManager()
    await tourManager.startTour(industryKey)
  }

  const addTourAttributes = (element: HTMLElement | null, tourId: string, moduleId?: string) => {
    if (element) {
      UniversalTourManager.addTourDataAttributes(element, tourId, moduleId)
    }
  }

  return {
    startTour,
    addTourAttributes
  }
}

// Auto-start tour based on localStorage preference
export const checkAutoStartTour = (industryKey: string): boolean => {
  if (typeof window === 'undefined') return false
  
  const hasSeenTour = localStorage.getItem(`hera_tour_completed_${industryKey}`)
  const isFirstVisit = !localStorage.getItem(`hera_visited_${industryKey}`)
  
  if (isFirstVisit && !hasSeenTour) {
    localStorage.setItem(`hera_visited_${industryKey}`, 'true')
    return true
  }
  
  return false
}

export const markTourCompleted = (industryKey: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`hera_tour_completed_${industryKey}`, 'true')
  }
}