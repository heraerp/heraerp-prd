// PWM Demo Data and Testing Utilities

import { WealthOverview, WealthEntity, WealthTransaction, AIInsight } from './types';

// Demo organization ID (matches our seeded data)
export const DEMO_ORG_ID = 'o2222222-2222-2222-2222-222222222222';

// Demo user credentials
export const DEMO_USER = {
  id: 'user-demo-001',
  email: 'demo@johnsonfamilyoffice.com',
  name: 'Demo Johnson',
  role: 'client_admin',
  organization_id: DEMO_ORG_ID,
  organization_name: 'Johnson Family Office'
};

// Mock demo data that matches our database seeds
export const DEMO_WEALTH_ENTITIES: WealthEntity[] = [
  {
    entity_id: 'e4444444-4444-4444-4444-444444444444',
    organization_id: DEMO_ORG_ID,
    entity_type: 'investment',
    entity_name: 'Apple Inc. (AAPL)',
    entity_code: 'AAPL-001',
    from_entity_id: 'e3333333-3333-3333-3333-333333333333',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-17T00:00:00Z',
    current_value: 28500000,
    cost_basis: 24000000,
    currency: 'USD',
    risk_score: 6,
    liquidity_score: 9
  },
  {
    entity_id: 'e5555555-5555-5555-5555-555555555555',
    organization_id: DEMO_ORG_ID,
    entity_type: 'investment',
    entity_name: 'Microsoft Corporation (MSFT)',
    entity_code: 'MSFT-001',
    from_entity_id: 'e3333333-3333-3333-3333-333333333333',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-17T00:00:00Z',
    current_value: 45600000,
    cost_basis: 36000000,
    currency: 'USD',
    risk_score: 5,
    liquidity_score: 9
  },
  {
    entity_id: 'e6666666-6666-6666-6666-666666666666',
    organization_id: DEMO_ORG_ID,
    entity_type: 'investment',
    entity_name: 'Tesla Inc. (TSLA)',
    entity_code: 'TSLA-001',
    from_entity_id: 'e3333333-3333-3333-3333-333333333333',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-17T00:00:00Z',
    current_value: 12500000,
    cost_basis: 15000000,
    currency: 'USD',
    risk_score: 8,
    liquidity_score: 8
  },
  {
    entity_id: 'e7777777-7777-7777-7777-777777777777',
    organization_id: DEMO_ORG_ID,
    entity_type: 'real_estate',
    entity_name: 'Manhattan Commercial Property',
    entity_code: 'NYC-COMM-001',
    from_entity_id: 'e3333333-3333-3333-3333-333333333333',
    is_active: true,
    created_at: '2023-09-15T00:00:00Z',
    updated_at: '2024-01-17T00:00:00Z',
    current_value: 75000000,
    cost_basis: 65000000,
    currency: 'USD',
    risk_score: 4,
    liquidity_score: 3
  },
  {
    entity_id: 'e8888888-8888-8888-8888-888888888888',
    organization_id: DEMO_ORG_ID,
    entity_type: 'crypto',
    entity_name: 'Bitcoin Holdings',
    entity_code: 'BTC-001',
    from_entity_id: 'e3333333-3333-3333-3333-333333333333',
    is_active: true,
    created_at: '2023-08-22T00:00:00Z',
    updated_at: '2024-01-17T00:00:00Z',
    current_value: 1147500,
    cost_basis: 765000,
    currency: 'USD',
    risk_score: 9,
    liquidity_score: 7
  },
  {
    entity_id: 'e9999999-9999-9999-9999-999999999999',
    organization_id: DEMO_ORG_ID,
    entity_type: 'private_equity',
    entity_name: 'TechVenture Fund III',
    entity_code: 'TVFIII-001',
    from_entity_id: 'e3333333-3333-3333-3333-333333333333',
    is_active: true,
    created_at: '2023-05-10T00:00:00Z',
    updated_at: '2024-01-17T00:00:00Z',
    current_value: 12800000,
    cost_basis: 10000000,
    currency: 'USD',
    risk_score: 7,
    liquidity_score: 1
  },
  {
    entity_id: 'ea111111-a111-a111-a111-a11111111111',
    organization_id: DEMO_ORG_ID,
    entity_type: 'hedge_fund',
    entity_name: 'Quantum Alpha Hedge Fund',
    entity_code: 'QAHF-001',
    from_entity_id: 'e3333333-3333-3333-3333-333333333333',
    is_active: true,
    created_at: '2023-04-03T00:00:00Z',
    updated_at: '2024-01-17T00:00:00Z',
    current_value: 16200000,
    cost_basis: 15000000,
    currency: 'USD',
    risk_score: 6,
    liquidity_score: 4
  },
  {
    entity_id: 'eb222222-b222-b222-b222-b22222222222',
    organization_id: DEMO_ORG_ID,
    entity_type: 'commodity',
    entity_name: 'Gold Bullion Holdings',
    entity_code: 'GOLD-001',
    from_entity_id: 'e3333333-3333-3333-3333-333333333333',
    is_active: true,
    created_at: '2023-03-18T00:00:00Z',
    updated_at: '2024-01-17T00:00:00Z',
    current_value: 5437500,
    cost_basis: 4500000,
    currency: 'USD',
    risk_score: 3,
    liquidity_score: 6
  },
  {
    entity_id: 'ec333333-c333-c333-c333-c33333333333',
    organization_id: DEMO_ORG_ID,
    entity_type: 'account',
    entity_name: 'JP Morgan Cash Management',
    entity_code: 'JPM-CASH-001',
    from_entity_id: 'e3333333-3333-3333-3333-333333333333',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-17T00:00:00Z',
    current_value: 12500000,
    cost_basis: 12500000,
    currency: 'USD',
    risk_score: 1,
    liquidity_score: 10
  }
];

export const DEMO_TRANSACTIONS: WealthTransaction[] = [
  {
    transaction_id: 't1111111-1111-1111-1111-111111111111',
    organization_id: DEMO_ORG_ID,
    transaction_type: 'buy',
    transaction_date: '2024-01-15T10:30:00Z',
    description: 'Purchase 5000 MSFT shares at $380',
    total_amount: 1900000,
    currency: 'USD',
    status: 'completed',
    created_at: '2024-01-15T10:30:00Z'
  },
  {
    transaction_id: 't2222222-2222-2222-2222-222222222222',
    organization_id: DEMO_ORG_ID,
    transaction_type: 'sell',
    transaction_date: '2024-01-12T15:45:00Z',
    description: 'Sale 5000 TSLA shares at $245',
    total_amount: 1225000,
    currency: 'USD',
    status: 'completed',
    created_at: '2024-01-12T15:45:00Z'
  },
  {
    transaction_id: 't3333333-3333-3333-3333-333333333333',
    organization_id: DEMO_ORG_ID,
    transaction_type: 'dividend',
    transaction_date: '2024-01-10T09:00:00Z',
    description: 'AAPL Q1 2024 dividend payment',
    total_amount: 36750,
    currency: 'USD',
    status: 'completed',
    created_at: '2024-01-10T09:00:00Z'
  },
  {
    transaction_id: 't4444444-4444-4444-4444-444444444444',
    organization_id: DEMO_ORG_ID,
    transaction_type: 'rebalance',
    transaction_date: '2024-01-08T11:20:00Z',
    description: 'AI-recommended portfolio rebalancing',
    total_amount: 0,
    currency: 'USD',
    status: 'completed',
    created_at: '2024-01-08T11:20:00Z'
  },
  {
    transaction_id: 't5555555-5555-5555-5555-555555555555',
    organization_id: DEMO_ORG_ID,
    transaction_type: 'interest',
    transaction_date: '2024-01-01T00:00:00Z',
    description: 'December 2023 interest payment',
    total_amount: 49479,
    currency: 'USD',
    status: 'completed',
    created_at: '2024-01-01T00:00:00Z'
  }
];

export const DEMO_AI_INSIGHTS: AIInsight[] = [
  {
    id: 'ai-001',
    type: 'opportunity',
    title: 'Tech Sector Rotation Opportunity',
    description: 'Based on market patterns, rotating 15% from bonds to tech equities could yield additional 12% annual returns',
    impact: 1500000,
    confidence: 0.85,
    priority: 'high',
    created_at: new Date().toISOString(),
    actions: [
      {
        id: 'action-001',
        action_type: 'rebalance',
        description: 'Shift allocation from bonds to tech stocks',
        suggested_amount: 15000000
      }
    ]
  },
  {
    id: 'ai-002',
    type: 'risk',
    title: 'Currency Exposure Risk',
    description: 'EUR exposure exceeds recommended threshold by 20%',
    impact: -500000,
    confidence: 0.92,
    priority: 'medium',
    created_at: new Date().toISOString()
  },
  {
    id: 'ai-003',
    type: 'recommendation',
    title: 'Tax Loss Harvesting Available',
    description: 'Identified $2.3M in tax loss harvesting opportunities',
    impact: 800000,
    confidence: 0.95,
    priority: 'high',
    created_at: new Date().toISOString()
  }
];

// Demo wealth overview calculation
export function calculateDemoWealthOverview(): WealthOverview {
  const totalWealth = DEMO_WEALTH_ENTITIES.reduce((sum, entity) => sum + (entity.current_value || 0), 0);
  const totalCostBasis = DEMO_WEALTH_ENTITIES.reduce((sum, entity) => sum + (entity.cost_basis || 0), 0);
  const dailyChange = 2345000; // From demo data
  const dailyChangePercent = (dailyChange / totalWealth) * 100;
  
  // Calculate asset allocation
  const assetAllocation = calculateDemoAssetAllocation();
  
  return {
    totalWealth,
    currency: 'USD',
    lastUpdated: new Date().toISOString(),
    dailyChange,
    dailyChangePercent,
    monthlyChange: 8500000, // Mock data
    yearlyChange: 35000000, // Mock data
    assetAllocation,
    topHoldings: DEMO_WEALTH_ENTITIES.slice(0, 10),
    recentTransactions: DEMO_TRANSACTIONS
  };
}

function calculateDemoAssetAllocation() {
  const totalValue = DEMO_WEALTH_ENTITIES.reduce((sum, entity) => sum + (entity.current_value || 0), 0);
  const allocationMap = new Map();
  
  DEMO_WEALTH_ENTITIES.forEach(entity => {
    const category = mapEntityTypeToCategory(entity.entity_type);
    const value = entity.current_value || 0;
    
    if (!allocationMap.has(category)) {
      allocationMap.set(category, {
        category,
        value: 0,
        percentage: 0,
        change24h: (Math.random() - 0.5) * 5, // Mock change
        riskScore: calculateRiskScore(category),
        entities: []
      });
    }
    
    const allocation = allocationMap.get(category);
    allocation.value += value;
    allocation.entities.push(entity);
  });
  
  // Calculate percentages
  allocationMap.forEach(allocation => {
    allocation.percentage = totalValue > 0 ? (allocation.value / totalValue) * 100 : 0;
  });
  
  return Array.from(allocationMap.values()).sort((a, b) => b.value - a.value);
}

function mapEntityTypeToCategory(entityType: string): string {
  const categoryMap: Record<string, string> = {
    asset: 'General Assets',
    portfolio: 'Managed Portfolios',
    account: 'Cash & Equivalents',
    investment: 'Public Equities',
    real_estate: 'Real Estate',
    crypto: 'Cryptocurrency',
    commodity: 'Commodities',
    private_equity: 'Private Equity',
    hedge_fund: 'Hedge Funds',
    trust: 'Trusts',
    foundation: 'Foundations'
  };
  
  return categoryMap[entityType] || 'Other';
}

function calculateRiskScore(category: string): number {
  const riskScores: Record<string, number> = {
    'Cash & Equivalents': 1,
    'Real Estate': 3,
    'Public Equities': 5,
    'Managed Portfolios': 5,
    'Commodities': 6,
    'Hedge Funds': 7,
    'Private Equity': 8,
    'Cryptocurrency': 9,
    'General Assets': 5,
    'Trusts': 3,
    'Foundations': 3,
    'Other': 5
  };
  
  return riskScores[category] || 5;
}

// Demo API testing utilities
export async function testDemoAPI() {
  console.log('🧪 Testing PWM Demo System...');
  
  try {
    // Test wealth overview calculation
    const wealthOverview = calculateDemoWealthOverview();
    console.log('✅ Wealth Overview:', {
      totalWealth: wealthOverview.totalWealth,
      assetCount: wealthOverview.topHoldings.length,
      allocationCategories: wealthOverview.assetAllocation.length
    });
    
    // Test entity processing
    console.log('✅ Demo Entities:', {
      totalEntities: DEMO_WEALTH_ENTITIES.length,
      entityTypes: [...new Set(DEMO_WEALTH_ENTITIES.map(e => e.entity_type))],
      totalValue: DEMO_WEALTH_ENTITIES.reduce((sum, e) => sum + (e.current_value || 0), 0)
    });
    
    // Test transactions
    console.log('✅ Demo Transactions:', {
      totalTransactions: DEMO_TRANSACTIONS.length,
      transactionTypes: [...new Set(DEMO_TRANSACTIONS.map(t => t.transaction_type))],
      dateRange: {
        earliest: DEMO_TRANSACTIONS.reduce((min, t) => t.transaction_date < min ? t.transaction_date : min, DEMO_TRANSACTIONS[0].transaction_date),
        latest: DEMO_TRANSACTIONS.reduce((max, t) => t.transaction_date > max ? t.transaction_date : max, DEMO_TRANSACTIONS[0].transaction_date)
      }
    });
    
    // Test AI insights
    console.log('✅ AI Insights:', {
      totalInsights: DEMO_AI_INSIGHTS.length,
      insightTypes: [...new Set(DEMO_AI_INSIGHTS.map(i => i.type))],
      averageConfidence: (DEMO_AI_INSIGHTS.reduce((sum, i) => sum + i.confidence, 0) / DEMO_AI_INSIGHTS.length * 100).toFixed(1) + '%'
    });
    
    return {
      success: true,
      summary: {
        organization: 'Johnson Family Office',
        totalWealth: wealthOverview.totalWealth,
        entities: DEMO_WEALTH_ENTITIES.length,
        transactions: DEMO_TRANSACTIONS.length,
        insights: DEMO_AI_INSIGHTS.length
      }
    };
    
  } catch (error) {
    console.error('❌ Demo API Test Failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// User association utilities
export function associateUserWithDemo(email: string) {
  return {
    ...DEMO_USER,
    email,
    id: `user-${email.split('@')[0]}-${Date.now()}`,
    created_at: new Date().toISOString()
  };
}

export function getDemoUserPermissions() {
  return {
    canViewPortfolio: true,
    canViewTransactions: true,
    canExecuteTrades: false, // Demo restriction
    canModifySettings: true,
    canAccessAI: true,
    canExportData: true,
    restrictions: {
      maxTransactionAmount: 1000000, // $1M demo limit
      tradingHours: 'market_hours_only',
      requiresApproval: ['large_trades', 'new_investments']
    }
  };
}