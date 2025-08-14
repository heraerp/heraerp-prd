// MARIO'S RESTAURANT - ADVANCED MENU ANALYTICS SYSTEM
// Comprehensive menu engineering and optimization analytics

const MARIO_ORG_ID = '6f591f1a-ea86-493e-8ae4-639d28a7e3c8';

// Advanced Menu Analytics Data Structures
const menuAnalyticsSystem = {
  // MENU ENGINEERING MATRIX DATA
  menuEngineeringMatrix: [
    // STARS (High Profit, High Popularity)
    {
      item_code: 'PIZZA_MARGHERITA',
      item_name: 'Margherita Pizza',
      category: 'star',
      profit_margin: 12.70,
      popularity_score: 0.18, // 18% of total orders
      customer_rating: 4.8,
      food_cost_variance: 0.02, // 2% variance from target
      recommendation: 'Maintain quality, consider slight price increase',
      action_priority: 'High - Protect and promote'
    },
    {
      item_code: 'TIRAMISU_CASA',
      item_name: 'Tiramisu della Casa',
      category: 'star',
      profit_margin: 9.70,
      popularity_score: 0.16, // 16% of total orders
      customer_rating: 4.9,
      food_cost_variance: -0.01, // 1% under target (good)
      recommendation: 'Perfect performance, maintain current strategy',
      action_priority: 'Medium - Monitor and maintain'
    },

    // PLOWHORSES (Low Profit, High Popularity)
    {
      item_code: 'CAESAR_SALAD',
      item_name: 'Caesar Salad',
      category: 'plowhorse',
      profit_margin: 10.75,
      popularity_score: 0.14, // 14% of total orders
      customer_rating: 4.6,
      food_cost_variance: 0.05, // 5% over target
      recommendation: 'Reduce portion costs or increase price by $2-3',
      action_priority: 'High - Improve profitability'
    },
    {
      item_code: 'PENNE_ARRABBIATA',
      item_name: 'Penne Arrabbiata',
      category: 'plowhorse',
      profit_margin: 14.20,
      popularity_score: 0.13, // 13% of total orders
      customer_rating: 4.7,
      food_cost_variance: 0.03, // 3% over target
      recommendation: 'Optimize ingredient costs, consider premium pasta',
      action_priority: 'Medium - Cost optimization'
    },

    // PUZZLES (High Profit, Low Popularity)
    {
      item_code: 'OSSO_BUCO_MILANESE',
      item_name: 'Osso Buco alla Milanese',
      category: 'puzzle',
      profit_margin: 27.95,
      popularity_score: 0.08, // 8% of total orders
      customer_rating: 4.9,
      food_cost_variance: -0.02, // 2% under target
      recommendation: 'Feature prominently, train staff on upselling',
      action_priority: 'High - Increase visibility'
    },
    {
      item_code: 'BISTECCA_FIORENTINA',
      item_name: 'Bistecca alla Fiorentina',
      category: 'puzzle',
      profit_margin: 61.45,
      popularity_score: 0.04, // 4% of total orders
      customer_rating: 4.8,
      food_cost_variance: -0.03, // 3% under target
      recommendation: 'Premium positioning, wine pairing promotion',
      action_priority: 'Medium - Luxury marketing'
    },

    // DOGS (Low Profit, Low Popularity) - None currently, but monitoring
    {
      item_code: 'BRANZINO_SALT_CRUST',
      item_name: 'Branzino in Crosta di Sale',
      category: 'at_risk', // Monitoring for potential dog status
      profit_margin: 26.15,
      popularity_score: 0.06, // 6% of total orders
      customer_rating: 4.7,
      food_cost_variance: 0.04, // 4% over target
      recommendation: 'Monitor closely, consider tableside presentation',
      action_priority: 'Medium - Watch performance'
    }
  ],

  // DAILY PERFORMANCE TRACKING
  dailyPerformanceData: [
    {
      date: '2025-01-14',
      total_covers: 145,
      total_revenue: 6847.50,
      total_food_cost: 2108.25,
      overall_food_cost_percentage: 30.8,
      average_check: 47.22,
      top_performers: [
        { item: 'PIZZA_MARGHERITA', orders: 28, revenue: 474.60 },
        { item: 'TIRAMISU_CASA', orders: 22, revenue: 284.90 },
        { item: 'CAESAR_SALAD', orders: 19, revenue: 284.05 }
      ],
      underperformers: [
        { item: 'BISTECCA_FIORENTINA', orders: 3, revenue: 269.85 },
        { item: 'BRANZINO_SALT_CRUST', orders: 4, revenue: 155.80 }
      ]
    },
    {
      date: '2025-01-13',
      total_covers: 132,
      total_revenue: 6234.80,
      total_food_cost: 1923.15,
      overall_food_cost_percentage: 30.9,
      average_check: 47.23,
      top_performers: [
        { item: 'PIZZA_MARGHERITA', orders: 25, revenue: 423.75 },
        { item: 'TIRAMISU_CASA', orders: 20, revenue: 259.00 },
        { item: 'PENNE_ARRABBIATA', orders: 18, revenue: 341.10 }
      ],
      underperformers: [
        { item: 'BISTECCA_FIORENTINA', orders: 2, revenue: 179.90 },
        { item: 'BRANZINO_SALT_CRUST', orders: 5, revenue: 194.75 }
      ]
    }
  ],

  // COMPETITIVE ANALYSIS
  competitiveAnalysis: {
    local_competitors: [
      {
        name: 'Nonna Rosa Italian',
        distance_miles: 0.8,
        price_comparison: {
          'Similar pizza': { their_price: 18.95, mario_price: 16.95, advantage: 'Mario lower' },
          'Pasta dish': { their_price: 22.50, mario_price: 18.95, advantage: 'Mario lower' },
          'Osso Buco': { their_price: 38.95, mario_price: 42.95, advantage: 'Competitor lower' }
        },
        overall_positioning: 'Mario offers better value on basics, competitor on premium'
      },
      {
        name: 'Bella Vista',
        distance_miles: 1.2,
        price_comparison: {
          'Similar pizza': { their_price: 19.95, mario_price: 16.95, advantage: 'Mario lower' },
          'Pasta dish': { their_price: 24.95, mario_price: 18.95, advantage: 'Mario lower' },
          'Fish entree': { their_price: 34.95, mario_price: 38.95, advantage: 'Competitor lower' }
        },
        overall_positioning: 'Mario competitive across categories'
      }
    ],
    market_position: 'Value leader in casual dining, competitive in fine dining'
  },

  // CUSTOMER PREFERENCE ANALYTICS
  customerPreferences: {
    dietary_trends: {
      'vegetarian_orders': { percentage: 0.28, trend: 'increasing' },
      'gluten_free_requests': { percentage: 0.15, trend: 'stable' },
      'vegan_modifications': { percentage: 0.08, trend: 'increasing' },
      'low_carb_requests': { percentage: 0.12, trend: 'increasing' }
    },
    time_based_preferences: {
      lunch: {
        top_categories: ['Pizza', 'Pasta', 'Salads'],
        average_prep_time_preferred: '8-12 minutes',
        price_sensitivity: 'high'
      },
      dinner: {
        top_categories: ['Meat', 'Seafood', 'Appetizers'],
        average_prep_time_acceptable: '20-30 minutes',
        price_sensitivity: 'moderate'
      }
    },
    seasonal_preferences: {
      spring: ['Light pasta', 'Seafood', 'Seasonal vegetables'],
      summer: ['Cold appetizers', 'Grilled items', 'Light wines'],
      fall: ['Braised meats', 'Rich pasta', 'Full-bodied wines'],
      winter: ['Hearty soups', 'Comfort foods', 'Hot desserts']
    }
  },

  // MENU OPTIMIZATION RECOMMENDATIONS
  optimizationRecommendations: [
    {
      category: 'pricing',
      priority: 'high',
      items: ['CAESAR_SALAD', 'PENNE_ARRABBIATA'],
      recommendation: 'Increase prices by $1.50-2.00 to improve margins',
      expected_impact: 'Improve food cost percentage by 2-3%',
      risk_level: 'low'
    },
    {
      category: 'promotion',
      priority: 'high',
      items: ['OSSO_BUCO_MILANESE'],
      recommendation: 'Feature as "Chef\'s Special" with wine pairing',
      expected_impact: 'Increase orders by 40-50%',
      risk_level: 'low'
    },
    {
      category: 'cost_reduction',
      priority: 'medium',
      items: ['BRANZINO_SALT_CRUST'],
      recommendation: 'Negotiate better fish pricing or reduce portion by 10%',
      expected_impact: 'Improve margin by $3-4 per dish',
      risk_level: 'medium'
    },
    {
      category: 'menu_addition',
      priority: 'medium',
      items: [],
      recommendation: 'Add high-margin dessert wine pairings',
      expected_impact: 'Increase dessert revenue by 25%',
      risk_level: 'low'
    },
    {
      category: 'seasonal_optimization',
      priority: 'medium',
      items: ['RISOTTO_ASPARAGI', 'INSALATA_POLPO'],
      recommendation: 'Promote seasonal items 2 weeks before peak season',
      expected_impact: 'Increase seasonal item sales by 60%',
      risk_level: 'low'
    }
  ]
};

// ANALYTICS FUNCTIONS

function calculateMenuEngineeringScore(item) {
  const profitWeight = 0.4;
  const popularityWeight = 0.3;
  const ratingWeight = 0.2;
  const varianceWeight = 0.1;

  const normalizedProfit = Math.min(item.profit_margin / 60, 1); // Max expected profit $60
  const normalizedPopularity = item.popularity_score / 0.2; // Max expected 20%
  const normalizedRating = (item.customer_rating - 3) / 2; // 3-5 scale normalized to 0-1
  const normalizedVariance = Math.max(0, 1 - Math.abs(item.food_cost_variance) * 10);

  return (
    normalizedProfit * profitWeight +
    normalizedPopularity * popularityWeight +
    normalizedRating * ratingWeight +
    normalizedVariance * varianceWeight
  );
}

function generateMenuEngineeringReport() {
  console.log('\n🔍 COMPREHENSIVE MENU ENGINEERING ANALYSIS');
  console.log('=' .repeat(60));

  const matrix = menuAnalyticsSystem.menuEngineeringMatrix;
  
  // Group by category
  const stars = matrix.filter(item => item.category === 'star');
  const plowhorses = matrix.filter(item => item.category === 'plowhorse');
  const puzzles = matrix.filter(item => item.category === 'puzzle');
  const atRisk = matrix.filter(item => item.category === 'at_risk');

  console.log('\n⭐ STARS (High Profit, High Popularity):');
  stars.forEach(item => {
    const score = calculateMenuEngineeringScore(item);
    console.log(`   ${item.item_name}:`);
    console.log(`     Profit Margin: $${item.profit_margin.toFixed(2)}`);
    console.log(`     Popularity: ${(item.popularity_score * 100).toFixed(1)}% of orders`);
    console.log(`     Rating: ${item.customer_rating}/5.0`);
    console.log(`     Performance Score: ${(score * 100).toFixed(1)}/100`);
    console.log(`     Recommendation: ${item.recommendation}`);
    console.log('');
  });

  console.log('\n🐎 PLOWHORSES (Low Profit, High Popularity):');
  plowhorses.forEach(item => {
    const score = calculateMenuEngineeringScore(item);
    console.log(`   ${item.item_name}:`);
    console.log(`     Profit Margin: $${item.profit_margin.toFixed(2)} (NEEDS IMPROVEMENT)`);
    console.log(`     Popularity: ${(item.popularity_score * 100).toFixed(1)}% of orders`);
    console.log(`     Food Cost Variance: ${(item.food_cost_variance * 100).toFixed(1)}%`);
    console.log(`     Performance Score: ${(score * 100).toFixed(1)}/100`);
    console.log(`     Recommendation: ${item.recommendation}`);
    console.log('');
  });

  console.log('\n🧩 PUZZLES (High Profit, Low Popularity):');
  puzzles.forEach(item => {
    const score = calculateMenuEngineeringScore(item);
    console.log(`   ${item.item_name}:`);
    console.log(`     Profit Margin: $${item.profit_margin.toFixed(2)} (EXCELLENT)`);
    console.log(`     Popularity: ${(item.popularity_score * 100).toFixed(1)}% of orders (NEEDS BOOST)`);
    console.log(`     Rating: ${item.customer_rating}/5.0`);
    console.log(`     Performance Score: ${(score * 100).toFixed(1)}/100`);
    console.log(`     Recommendation: ${item.recommendation}`);
    console.log('');
  });

  console.log('\n⚠️ AT-RISK ITEMS (Monitoring Required):');
  atRisk.forEach(item => {
    const score = calculateMenuEngineeringScore(item);
    console.log(`   ${item.item_name}:`);
    console.log(`     Profit Margin: $${item.profit_margin.toFixed(2)}`);
    console.log(`     Popularity: ${(item.popularity_score * 100).toFixed(1)}% of orders`);
    console.log(`     Food Cost Variance: ${(item.food_cost_variance * 100).toFixed(1)}%`);
    console.log(`     Performance Score: ${(score * 100).toFixed(1)}/100`);
    console.log(`     Recommendation: ${item.recommendation}`);
    console.log('');
  });
}

function analyzeDailyPerformanceTrends() {
  console.log('\n📈 DAILY PERFORMANCE TREND ANALYSIS');
  console.log('=' .repeat(45));

  const data = menuAnalyticsSystem.dailyPerformanceData;
  
  data.forEach(day => {
    console.log(`\n📅 ${day.date}:`);
    console.log(`   Total Covers: ${day.total_covers}`);
    console.log(`   Revenue: $${day.total_revenue.toLocaleString()}`);
    console.log(`   Food Cost: ${day.overall_food_cost_percentage.toFixed(1)}%`);
    console.log(`   Average Check: $${day.average_check.toFixed(2)}`);
    
    console.log(`   🏆 Top Performers:`);
    day.top_performers.forEach(item => {
      console.log(`     - ${item.item}: ${item.orders} orders, $${item.revenue.toFixed(2)}`);
    });
    
    console.log(`   📉 Need Attention:`);
    day.underperformers.forEach(item => {
      console.log(`     - ${item.item}: ${item.orders} orders, $${item.revenue.toFixed(2)}`);
    });
  });

  // Calculate trends
  const revenueChange = ((data[0].total_revenue - data[1].total_revenue) / data[1].total_revenue) * 100;
  const coverChange = ((data[0].total_covers - data[1].total_covers) / data[1].total_covers) * 100;
  const checkChange = ((data[0].average_check - data[1].average_check) / data[1].average_check) * 100;

  console.log('\n📊 TREND ANALYSIS (Latest vs Previous Day):');
  console.log(`   Revenue: ${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%`);
  console.log(`   Covers: ${coverChange > 0 ? '+' : ''}${coverChange.toFixed(1)}%`);
  console.log(`   Average Check: ${checkChange > 0 ? '+' : ''}${checkChange.toFixed(1)}%`);
}

function analyzeCompetitivePosition() {
  console.log('\n🥊 COMPETITIVE ANALYSIS');
  console.log('=' .repeat(30));

  const analysis = menuAnalyticsSystem.competitiveAnalysis;
  
  console.log(`\nMarket Position: ${analysis.market_position}`);
  
  console.log('\n🏪 Competitor Comparison:');
  analysis.local_competitors.forEach(competitor => {
    console.log(`\n   ${competitor.name} (${competitor.distance_miles} miles):`);
    
    Object.entries(competitor.price_comparison).forEach(([category, comparison]) => {
      const advantage = comparison.mario_price < comparison.their_price ? 
        `Mario $${(comparison.their_price - comparison.mario_price).toFixed(2)} lower` :
        `Competitor $${(comparison.mario_price - comparison.their_price).toFixed(2)} lower`;
      
      console.log(`     ${category}: Mario $${comparison.mario_price} vs Their $${comparison.their_price}`);
      console.log(`       → ${advantage}`);
    });
    
    console.log(`     Overall: ${competitor.overall_positioning}`);
  });
}

function generateCustomerPreferenceInsights() {
  console.log('\n👥 CUSTOMER PREFERENCE INSIGHTS');
  console.log('=' .repeat(40));

  const prefs = menuAnalyticsSystem.customerPreferences;
  
  console.log('\n🌱 Dietary Trend Analysis:');
  Object.entries(prefs.dietary_trends).forEach(([trend, data]) => {
    const trendIcon = data.trend === 'increasing' ? '📈' : 
                     data.trend === 'decreasing' ? '📉' : '➡️';
    console.log(`   ${trend}: ${(data.percentage * 100).toFixed(1)}% ${trendIcon} ${data.trend}`);
  });

  console.log('\n⏰ Time-Based Preferences:');
  Object.entries(prefs.time_based_preferences).forEach(([time, data]) => {
    console.log(`   ${time.toUpperCase()}:`);
    console.log(`     Top Categories: ${data.top_categories.join(', ')}`);
    console.log(`     Preferred Timing: ${data.average_prep_time_preferred || data.average_prep_time_acceptable}`);
    console.log(`     Price Sensitivity: ${data.price_sensitivity}`);
  });

  console.log('\n🗓️ Seasonal Preferences:');
  Object.entries(prefs.seasonal_preferences).forEach(([season, items]) => {
    console.log(`   ${season.toUpperCase()}: ${items.join(', ')}`);
  });
}

function generateOptimizationActionPlan() {
  console.log('\n🎯 MENU OPTIMIZATION ACTION PLAN');
  console.log('=' .repeat(40));

  const recommendations = menuAnalyticsSystem.optimizationRecommendations;
  
  // Sort by priority
  const highPriority = recommendations.filter(r => r.priority === 'high');
  const mediumPriority = recommendations.filter(r => r.priority === 'medium');

  console.log('\n🔥 HIGH PRIORITY ACTIONS:');
  highPriority.forEach((rec, index) => {
    console.log(`\n   ${index + 1}. ${rec.category.toUpperCase()} OPTIMIZATION:`);
    if (rec.items.length > 0) {
      console.log(`      Items: ${rec.items.join(', ')}`);
    }
    console.log(`      Action: ${rec.recommendation}`);
    console.log(`      Expected Impact: ${rec.expected_impact}`);
    console.log(`      Risk Level: ${rec.risk_level.toUpperCase()}`);
  });

  console.log('\n🟡 MEDIUM PRIORITY ACTIONS:');
  mediumPriority.forEach((rec, index) => {
    console.log(`\n   ${index + 1}. ${rec.category.toUpperCase()} OPTIMIZATION:`);
    if (rec.items.length > 0) {
      console.log(`      Items: ${rec.items.join(', ')}`);
    }
    console.log(`      Action: ${rec.recommendation}`);
    console.log(`      Expected Impact: ${rec.expected_impact}`);
    console.log(`      Risk Level: ${rec.risk_level.toUpperCase()}`);
  });
}

function generateExecutiveSummary() {
  console.log('\n📋 EXECUTIVE SUMMARY - MARIO\'S MENU PERFORMANCE');
  console.log('=' .repeat(60));

  const matrix = menuAnalyticsSystem.menuEngineeringMatrix;
  const dailyData = menuAnalyticsSystem.dailyPerformanceData[0]; // Latest day

  console.log(`\n🏆 OVERALL PERFORMANCE (${dailyData.date}):`);
  console.log(`   Total Revenue: $${dailyData.total_revenue.toLocaleString()}`);
  console.log(`   Food Cost Percentage: ${dailyData.overall_food_cost_percentage.toFixed(1)}% (Target: 30%)`);
  console.log(`   Average Check: $${dailyData.average_check.toFixed(2)}`);
  console.log(`   Customer Satisfaction: 4.7/5.0 average rating`);

  console.log('\n🎯 MENU ENGINEERING SUMMARY:');
  const stars = matrix.filter(item => item.category === 'star').length;
  const plowhorses = matrix.filter(item => item.category === 'plowhorse').length;
  const puzzles = matrix.filter(item => item.category === 'puzzle').length;
  const atRisk = matrix.filter(item => item.category === 'at_risk').length;

  console.log(`   ⭐ Stars (Promote): ${stars} items`);
  console.log(`   🐎 Plowhorses (Optimize): ${plowhorses} items`);
  console.log(`   🧩 Puzzles (Market): ${puzzles} items`);
  console.log(`   ⚠️ At-Risk (Monitor): ${atRisk} items`);

  console.log('\n🚀 KEY OPPORTUNITIES:');
  console.log('   1. Increase prices on popular low-margin items (+2-3% profit)');
  console.log('   2. Promote high-margin signature dishes (+40-50% orders)');
  console.log('   3. Optimize ingredient costs on at-risk items (+$3-4/dish)');
  console.log('   4. Enhance seasonal menu marketing (+60% seasonal sales)');

  console.log('\n📈 PROJECTED IMPACT:');
  console.log('   Revenue Increase: 8-12% annually');
  console.log('   Profit Margin Improvement: 3-5 percentage points');
  console.log('   Customer Satisfaction Maintenance: >4.6/5.0');
  console.log('   Food Cost Target Achievement: <30%');

  console.log('\n✅ NEXT STEPS:');
  console.log('   1. Implement high-priority pricing adjustments (Week 1)');
  console.log('   2. Launch signature dish promotion campaign (Week 2)');
  console.log('   3. Negotiate supplier agreements for cost optimization (Week 3-4)');
  console.log('   4. Monitor performance metrics and adjust strategies (Ongoing)');
}

// MAIN ANALYTICS EXECUTION
function runAdvancedMenuAnalytics() {
  console.log('🍝 MARIO\'S RESTAURANT - ADVANCED MENU ANALYTICS SYSTEM');
  console.log('📊 Comprehensive Performance Analysis & Optimization Recommendations\n');
  
  generateMenuEngineeringReport();
  analyzeDailyPerformanceTrends();
  analyzeCompetitivePosition();
  generateCustomerPreferenceInsights();
  generateOptimizationActionPlan();
  generateExecutiveSummary();

  console.log('\n🎉 ADVANCED MENU ANALYTICS COMPLETE!');
  console.log('🚀 Mario\'s Restaurant has comprehensive menu intelligence');
  console.log('   powered by HERA\'s universal architecture and smart analytics.');
  console.log('   Ready for data-driven menu optimization and profitability growth!');
}

// Export for testing
module.exports = {
  menuAnalyticsSystem,
  calculateMenuEngineeringScore,
  runAdvancedMenuAnalytics,
  generateMenuEngineeringReport,
  analyzeDailyPerformanceTrends,
  analyzeCompetitivePosition,
  generateCustomerPreferenceInsights,
  generateOptimizationActionPlan,
  generateExecutiveSummary
};

// Run analytics if called directly
if (require.main === module) {
  runAdvancedMenuAnalytics();
}