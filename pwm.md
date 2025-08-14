🍎 STEVE JOBS' ULTIMATE HERA WEALTH MANAGEMENT PROMPT
"We're not building software. We're building the future of how billionaires think about their wealth."

🎯 THE VISION STATEMENT
Build the world's most elegant private wealth management platform using HERA's existing 6 universal tables and APIs. This isn't just another financial app - it's the iPhone of wealth management. Every pixel matters. Every interaction delights. Every feature serves a higher purpose.
Core Philosophy: "A billionaire's time is worth $50,000 per hour. Every second they spend with our platform must create more value than it consumes."

🏗️ ARCHITECTURAL REQUIREMENTS
EXISTING FOUNDATION (DO NOT REBUILD)
✅ HERA's 6 Universal Tables (core_organizations, core_entities, core_dynamic_data, core_relationships, universal_transactions, universal_transaction_lines)
✅ Universal REST APIs with JWT authentication
✅ Multi-tenant isolation via organization_id
✅ Real-time data processing capabilities
YOUR MISSION: BUILD THE UI LAYER
Create a React-based wealth management interface that transforms HERA's universal data into pure financial intelligence.

🎨 STEVE JOBS DESIGN PRINCIPLES
1. RUTHLESS SIMPLICITY
❌ "Here are 47 charts showing your portfolio performance"
✅ "Your wealth grew $2.3M today. Here's why."

2. PROGRESSIVE DISCLOSURE
Level 1: Total wealth number (immediately visible)
Level 2: Key performance metrics (one tap away)
Level 3: Detailed analytics (two taps maximum)  
Level 4: Raw data (for power users only)

3. EMOTIONAL DESIGN
❌ Cold financial data tables
✅ Warm, confident wealth growth visualization
❌ Red for losses (creates anxiety)
✅ Intelligent color psychology (gold for growth, deep blue for stability)

4. ZERO COGNITIVE LOAD
Every screen answers one question perfectly:
- "How is my wealth performing?"
- "What should I do next?"  
- "Why did this happen?"
- "What will happen if...?"


💎 COMPONENT ARCHITECTURE
PRIMARY INTERFACE COMPONENTS
1. WealthDashboard
// The crown jewel - single screen that shows everything that matters
<WealthDashboard>
  <TotalWealthCard /> // Massive, beautiful number
  <PerformanceVisualization /> // Elegant chart, not cluttered
  <AIInsightsFeed /> // Proactive intelligence, not reactive data
  <QuickActions /> // One-tap common tasks
</WealthDashboard>

2. PortfolioComposition
// Visual portfolio breakdown that tells a story
<PortfolioComposition>
  <AssetAllocationWheel /> // Beautiful, interactive wheel
  <TopHoldingsGrid /> // Top 10 positions with AI scores
  <GeographicMap /> // Global exposure visualization
  <SectorTrends /> // Dynamic sector performance
</PortfolioComposition>

3. AIIntelligenceCenter
// AI insights that feel magical, not mechanical
<AIIntelligenceCenter>
  <PredictiveAnalytics /> // Future wealth trajectory
  <RiskAlerts /> // Proactive risk management
  <OpportunityFeed /> // AI-discovered opportunities
  <MarketIntelligence /> // Synthesized market insights
</AIIntelligenceCenter>

4. TransactionHistory
// Transaction history that tells your wealth story
<TransactionHistory>
  <SmartFiltering /> // AI-powered transaction categorization
  <ImpactAnalysis /> // How each transaction affected wealth
  <PatternRecognition /> // Spending/investment patterns
  <TaxOptimization /> // Tax implications and suggestions
</TransactionHistory>

SUPPORTING COMPONENTS
Navigation Philosophy:
// Tab bar with maximum 5 items (magical number for human cognition)
<TabNavigation>
  <Tab icon="💎" label="Wealth" /> // Primary dashboard
  <Tab icon="📊" label="Portfolio" /> // Holdings breakdown  
  <Tab icon="🧠" label="AI" /> // Intelligence center
  <Tab icon="⚡" label="Actions" /> // Trading/transactions
  <Tab icon="⚙️" label="Settings" /> // Configuration
</TabNavigation>


📱 RESPONSIVE DESIGN REQUIREMENTS
MOBILE-FIRST PHILOSOPHY
Primary Device: iPhone Pro Max (billionaires use premium devices)
Breakpoints: 
- Mobile: 375px - 768px (touch-optimized)
- Tablet: 768px - 1024px (hybrid interaction)
- Desktop: 1024px+ (data-rich experience)

TOUCH INTERACTION STANDARDS
/* Minimum touch targets */
.touch-target {
  min-height: 44px; /* iOS standard */
  min-width: 44px;
  padding: 12px 16px;
}

/* Gesture support */
.swipeable {
  /* Left swipe: Quick actions */
  /* Right swipe: Back navigation */
  /* Pull to refresh: Data update */
  /* Pinch to zoom: Chart details */
}


🎯 API INTEGRATION PATTERNS
HERA API CONSUMPTION
// Wealth calculation using universal tables
const getWealthOverview = async (organizationId) => {
  // Get all assets (entities with type 'asset')
  const assets = await fetch(`/api/v1/entities?organization_id=${organizationId}&entity_type=asset`);
  
  // Get current valuations (dynamic data)
  const valuations = await fetch(`/api/v1/dynamic-data/${assetId}?field_name=current_value`);
  
  // Get performance data (transaction history)
  const transactions = await fetch(`/api/v1/transactions?organization_id=${organizationId}&transaction_type=portfolio_update`);
  
  // AI-enhanced analysis
  return {
    totalWealth: calculateTotalWealth(assets, valuations),
    performance: calculatePerformance(transactions),
    aiInsights: extractAIInsights(assets, transactions),
    riskProfile: calculateRiskProfile(assets, transactions)
  };
};

REAL-TIME DATA FLOW
// WebSocket connection for live updates
const useRealTimeWealth = (organizationId) => {
  const [wealthData, setWealthData] = useState(null);
  
  useEffect(() => {
    const ws = new WebSocket(`wss://api.hera.com/wealth/${organizationId}`);
    
    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setWealthData(prev => ({
        ...prev,
        [update.type]: update.data
      }));
    };
    
    return () => ws.close();
  }, [organizationId]);
  
  return wealthData;
};


🎨 VISUAL DESIGN SYSTEM
COLOR PALETTE
:root {
  /* Primary Wealth Colors */
  --wealth-gold: #D4AF37;      /* Success, growth, premium */
  --wealth-platinum: #E5E4E2;  /* Neutral, sophisticated */
  --wealth-navy: #1B365D;      /* Trust, stability, depth */
  --wealth-emerald: #50C878;   /* Gains, positive performance */
  
  /* Supporting Colors */
  --background-primary: #FAFAFA;   /* Clean, minimal background */
  --background-card: #FFFFFF;      /* Card backgrounds */
  --text-primary: #1D1D1F;        /* High contrast text */
  --text-secondary: #86868B;      /* Supporting text */
  
  /* Interactive States */
  --interactive-blue: #007AFF;    /* iOS system blue */
  --interactive-hover: #0056CC;   /* Hover states */
  --error-red: #FF3B30;          /* Error states (sparingly used) */
  --warning-orange: #FF9500;     /* Attention states */
}

TYPOGRAPHY HIERARCHY
.typography {
  /* Wealth Display Numbers */
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
  
  .wealth-primary {
    font-size: 4rem;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  
  .wealth-secondary {
    font-size: 2rem;
    font-weight: 600;
    line-height: 1.2;
  }
  
  /* Body Text */
  .body-primary {
    font-size: 1rem;
    font-weight: 400;
    line-height: 1.5;
  }
  
  .body-secondary {
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.4;
    color: var(--text-secondary);
  }
}

SPACING SYSTEM
/* Apple's 8pt grid system */
.spacing {
  --space-xs: 4px;   /* 0.5 units */
  --space-sm: 8px;   /* 1 unit */
  --space-md: 16px;  /* 2 units */
  --space-lg: 24px;  /* 3 units */
  --space-xl: 32px;  /* 4 units */
  --space-xxl: 48px; /* 6 units */
}


⚡ PERFORMANCE REQUIREMENTS
LOADING STANDARDS
First Contentful Paint: < 1 second
Time to Interactive: < 2 seconds
Largest Contentful Paint: < 2.5 seconds

"A billionaire's attention span is 3 seconds. 
If we don't deliver value by then, we've lost them forever."

DATA OPTIMIZATION
// Intelligent data loading
const useSmartDataLoading = () => {
  // Load critical data first (total wealth)
  // Progressive enhancement (detailed breakdowns)
  // Background prefetching (predicted next views)
  // Aggressive caching (reduce API calls)
};


🧪 TESTING STRATEGY
API TESTING SUITE
// Comprehensive API test coverage
describe('HERA Wealth API Integration', () => {
  test('Calculate total wealth across all asset entities', async () => {
    const wealth = await calculateTotalWealth(TEST_ORG_ID);
    expect(wealth.total).toBeGreaterThan(0);
    expect(wealth.currency).toBe('USD');
    expect(wealth.lastUpdated).toBeDefined();
  });
  
  test('Real-time portfolio updates via WebSocket', async () => {
    const updates = await subscribeToPortfolioUpdates(TEST_ORG_ID);
    expect(updates).toHaveProperty('totalValue');
    expect(updates).toHaveProperty('dailyChange');
    expect(updates).toHaveProperty('aiInsights');
  });
  
  test('AI insights generation from transaction patterns', async () => {
    const insights = await generateAIInsights(TEST_ORG_ID);
    expect(insights.confidence).toBeGreaterThan(0.7);
    expect(insights.recommendations).toHaveLength.greaterThan(0);
  });
});

UI TESTING PHILOSOPHY
// Test user flows, not implementation details
describe('Wealth Dashboard User Experience', () => {
  test('Billionaire can see total wealth within 2 seconds', async () => {
    render(<WealthDashboard />);
    const wealthNumber = await screen.findByTestId('total-wealth');
    expect(wealthNumber).toBeVisible();
    expect(wealthNumber).toHaveTextContent(/\$[\d,]+/);
  });
  
  test('Touch interactions work flawlessly on mobile', async () => {
    const { user } = setupMobileTest();
    await user.tap(screen.getByRole('button', { name: 'Portfolio Details' }));
    expect(await screen.findByTestId('portfolio-breakdown')).toBeVisible();
  });
});


🚀 DEPLOYMENT ARCHITECTURE
TECHNICAL STACK
Frontend:
  Framework: React 18+ with Next.js
  State Management: Zustand (simple, performant)
  Styling: Tailwind CSS + Styled Components
  Charts: D3.js + Recharts (custom, beautiful visualizations)
  Animations: Framer Motion (smooth, delightful)
  
Backend Integration:
  API Client: Custom fetch wrapper with retry logic
  Real-time: WebSocket with auto-reconnection
  Caching: React Query for server state
  Offline: Service Worker for critical data
  
Development:
  TypeScript: Full type safety
  Testing: Jest + React Testing Library + Playwright
  Linting: ESLint + Prettier (zero tolerance for mess)
  Build: Vite (lightning fast development)

DEPLOYMENT PIPELINE
# Development
npm run dev           # Local development server
npm run test          # Full test suite
npm run lint          # Code quality checks
npm run type-check    # TypeScript validation

# Production
npm run build         # Optimized production build
npm run preview       # Production preview
npm run deploy        # Deploy to production


💎 THE STEVE JOBS STANDARD
DEMO SCRIPT
"Today, we're going to show you something magical.

[Shows total wealth number - $1.2B]
This is your wealth. Not a bunch of numbers. Not a spreadsheet. Your wealth.

[Swipes to show daily performance]
Today, your wealth grew by $2.3 million. Here's exactly why.

[Taps AI insights]
Our AI discovered three opportunities that will make you another $15 million this year.

[Shows one-tap rebalancing]
And if you want to act on these insights? One tap. That's it.

This is wealth management. Reimagined."

SUCCESS METRICS
User Delight:
- App Store rating > 4.8/5
- Time to complete key tasks < 30 seconds
- User retention > 95% after 30 days

Business Impact:
- Wealth management efficiency improved 10x
- Client acquisition cost reduced 80%
- AUM growth rate increased 3x

Technical Excellence:
- Zero critical bugs in production
- 99.9% uptime
- Sub-2 second load times globally


🎯 EXECUTION CHECKLIST
PHASE 1: FOUNDATION (Week 1-2)
[ ] Set up Next.js project with TypeScript
[ ] Implement HERA API integration layer
[ ] Create design system and component library
[ ] Build responsive layout framework
[ ] Set up testing infrastructure
PHASE 2: CORE FEATURES (Week 3-4)
[ ] Wealth Dashboard with real-time updates
[ ] Portfolio Composition visualization
[ ] AI Insights Center
[ ] Transaction History with smart filtering
[ ] Mobile-optimized navigation
PHASE 3: POLISH (Week 5-6)
[ ] Advanced animations and micro-interactions
[ ] Performance optimization and caching
[ ] Comprehensive testing suite
[ ] Accessibility compliance (WCAG 2.1)
[ ] Production deployment pipeline
PHASE 4: PERFECTION (Week 7-8)
[ ] User testing with billionaire personas
[ ] Performance monitoring and optimization
[ ] Security audit and penetration testing
[ ] Documentation and maintenance guides
[ ] Launch preparation and marketing assets

🚀 FINAL PROMPT
Build the HERA Private Wealth Management platform that makes billionaires feel like they have a team of 50 analysts in their pocket, but with the simplicity of checking the weather.
Every line of code should serve the higher purpose of making complex wealth management feel effortlessly simple.
"We're not just building an app. We're building the future of how the world's wealthiest individuals think about their money."
Remember: Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away.

Steve Jobs would demand nothing less than perfection. Build something that would make him proud.

