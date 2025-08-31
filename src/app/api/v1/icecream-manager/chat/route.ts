import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface AnalyticalFramework {
  stage: 'analyze' | 'investigate' | 'clarify' | 'target' | 'iterate' | 'initial'
  [key: string]: any
}

export async function POST(request: NextRequest) {
  try {
    const { message, organizationId, context } = await request.json()

    if (!message || !organizationId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // For demo purposes, this accepts any organization ID
    // Middleware automatically sets the ice cream org ID for /icecream routes

    // Parse the message to understand intent
    const lowerMessage = message.toLowerCase()
    
    // Initialize analytical framework
    let analyticalFramework: AnalyticalFramework = { stage: 'analyze' }
    let response = ''
    let data = null
    let actions = []
    let status = 'processing'
    let confidence = 85

    // Cold Chain Monitoring
    if (lowerMessage.includes('cold chain') || lowerMessage.includes('temperature')) {
      analyticalFramework.stage = 'investigate'
      
      // Simulate temperature data
      const temperatureData = {
        freezers: [
          { id: 'FREEZER-01', location: 'Main Storage', temp: -22, status: 'optimal', lastCheck: '5 mins ago' },
          { id: 'FREEZER-02', location: 'Production', temp: -20, status: 'optimal', lastCheck: '3 mins ago' },
          { id: 'FREEZER-03', location: 'Distribution', temp: -19, status: 'optimal', lastCheck: '7 mins ago' },
          { id: 'TRUCK-01', location: 'Delivery Vehicle 1', temp: -16, status: 'warning', lastCheck: '15 mins ago' }
        ],
        compliance: {
          percentage: 94,
          violations: 1,
          alerts: ['TRUCK-01 temperature rising - needs attention']
        }
      }
      
      response = `🌡️ **Cold Chain Status Report**

**Overall Compliance: ${temperatureData.compliance.percentage}%**

**Freezer Status:**
${temperatureData.freezers.map(f => 
  `• ${f.location}: ${f.temp}°C ${f.status === 'optimal' ? '✅' : '⚠️'} (${f.lastCheck})`
).join('\n')}

${temperatureData.compliance.violations > 0 ? `\n⚠️ **Alert:** ${temperatureData.compliance.alerts[0]}` : '\n✅ All systems operating within compliance range'}

**Recommendations:**
- Check TRUCK-01 refrigeration unit
- Schedule maintenance for optimal performance
- All storage units maintaining FSSAI standards`

      data = temperatureData
      status = temperatureData.compliance.violations > 0 ? 'warning' : 'optimal'
      actions = [
        { label: 'View Temperature Logs', action: 'logs', variant: 'outline' },
        { label: 'Check Vehicle', action: 'check', variant: 'default', data: { location: 'TRUCK-01' } }
      ]
    }
    
    // Production Planning
    else if (lowerMessage.includes('production') || lowerMessage.includes('plan')) {
      analyticalFramework.stage = 'target'
      
      const productionPlan = {
        date: new Date().toLocaleDateString(),
        weather: { temp: 32, condition: 'Sunny' },
        demandForecast: {
          totalUnits: 1200,
          byCategory: {
            'Kulfi': 350,
            'Family Packs': 280,
            'Sugar Free': 150,
            'Cups & Cones': 420
          }
        },
        recommendations: {
          'Mango Kulfi': { units: 200, reason: 'High demand, summer season' },
          'Vanilla Family Pack': { units: 150, reason: 'Weekend approaching' },
          'Chocolate Cone': { units: 180, reason: 'School orders expected' }
        }
      }
      
      response = `🏭 **Production Plan for ${productionPlan.date}**

**Weather Forecast:** ${productionPlan.weather.temp}°C, ${productionPlan.weather.condition}
**Total Demand Forecast:** ${productionPlan.demandForecast.totalUnits} units

**Category Breakdown:**
${Object.entries(productionPlan.demandForecast.byCategory).map(([cat, units]) => 
  `• ${cat}: ${units} units`
).join('\n')}

**🎯 Optimized Production Schedule:**
${Object.entries(productionPlan.recommendations).map(([product, info]) => 
  `• ${product}: ${info.units} units (${info.reason})`
).join('\n')}

**Production Timeline:**
- 6:00 AM - Start Kulfi production (needs 4 hours setting time)
- 8:00 AM - Begin Family Pack production
- 10:00 AM - Start Cups & Cones line
- 2:00 PM - Quality checks and packaging
- 4:00 PM - Ready for distribution`

      data = productionPlan
      actions = [
        { label: 'Approve Plan', action: 'approve', variant: 'default' },
        { label: 'Adjust Quantities', action: 'adjust', variant: 'outline' }
      ]
      confidence = 92
    }
    
    // Inventory Status
    else if (lowerMessage.includes('inventory') || lowerMessage.includes('stock') || lowerMessage.includes('expir')) {
      analyticalFramework.stage = 'investigate'
      
      const inventoryData = {
        summary: {
          totalProducts: 23,
          lowStock: 3,
          expiringSoon: 2,
          optimal: 18
        },
        alerts: [
          { product: 'Vanilla Extract', currentStock: '2L', reorderPoint: '5L', status: 'low' },
          { product: 'Mango Pulp', currentStock: '8kg', reorderPoint: '15kg', status: 'low' },
          { product: 'Sugar Free Mix', expiryDate: '2024-02-05', daysLeft: 5, status: 'expiring' }
        ]
      }
      
      response = `📦 **Inventory Status Report**

**Summary:**
• Total Products: ${inventoryData.summary.totalProducts}
• Optimal Stock: ${inventoryData.summary.optimal} ✅
• Low Stock Items: ${inventoryData.summary.lowStock} ⚠️
• Expiring Soon: ${inventoryData.summary.expiringSoon} 🕐

**⚠️ Immediate Attention Required:**
${inventoryData.alerts.map(alert => {
  if (alert.status === 'low') {
    return `• ${alert.product}: ${alert.currentStock} (Reorder at ${alert.reorderPoint})`
  } else {
    return `• ${alert.product}: Expires ${alert.expiryDate} (${alert.daysLeft} days)`
  }
}).join('\n')}

**Recommendations:**
1. Place order for Vanilla Extract and Mango Pulp today
2. Promote Sugar Free items with 20% discount to clear stock
3. Schedule delivery from supplier by tomorrow`

      data = inventoryData
      status = inventoryData.summary.lowStock > 0 ? 'warning' : 'optimal'
      actions = [
        { label: 'Create Purchase Order', action: 'order', variant: 'default' },
        { label: 'View Full Inventory', action: 'view', variant: 'outline' }
      ]
    }
    
    // Sales Analytics
    else if (lowerMessage.includes('sales') || lowerMessage.includes('best') || lowerMessage.includes('revenue')) {
      analyticalFramework.stage = 'investigate'
      
      const salesData = {
        period: 'This Week',
        totalRevenue: 425000,
        totalUnits: 5680,
        topProducts: [
          { name: 'Mango Kulfi', units: 890, revenue: 66750, growth: '+18%' },
          { name: 'Chocolate Family Pack', units: 560, revenue: 56000, growth: '+12%' },
          { name: 'Vanilla Cup', units: 1200, revenue: 48000, growth: '+5%' }
        ],
        outlets: [
          { name: 'Main Outlet', revenue: 185000, percentage: 43.5 },
          { name: 'City Center', revenue: 142000, percentage: 33.4 },
          { name: 'Beach Road', revenue: 98000, percentage: 23.1 }
        ]
      }
      
      response = `📊 **Sales Analytics - ${salesData.period}**

**Total Revenue:** ₹${salesData.totalRevenue.toLocaleString()}
**Units Sold:** ${salesData.totalUnits.toLocaleString()}

**🏆 Top Selling Products:**
${salesData.topProducts.map((p, i) => 
  `${i+1}. ${p.name}: ${p.units} units | ₹${p.revenue.toLocaleString()} | ${p.growth}`
).join('\n')}

**💰 Revenue by Outlet:**
${salesData.outlets.map(o => 
  `• ${o.name}: ₹${o.revenue.toLocaleString()} (${o.percentage}%)`
).join('\n')}

**📈 Key Insights:**
• Mango Kulfi showing strong growth (+18%)
• Beach Road outlet needs promotional support
• Weekend sales 35% higher than weekdays
• Temperature correlation: +1°C = +8% sales`

      data = salesData
      confidence = 95
      actions = [
        { label: 'Download Report', action: 'download', variant: 'outline' },
        { label: 'Forecast Next Week', action: 'forecast', variant: 'default' }
      ]
    }
    
    // Distribution Routes
    else if (lowerMessage.includes('distribution') || lowerMessage.includes('delivery') || lowerMessage.includes('route')) {
      analyticalFramework.stage = 'target'
      
      const distributionData = {
        activeRoutes: 4,
        completedDeliveries: 38,
        pendingDeliveries: 12,
        vehicles: [
          { id: 'ICE-001', driver: 'Kumar', route: 'North Zone', stops: 8, status: 'on-route', completion: 75 },
          { id: 'ICE-002', driver: 'Ravi', route: 'South Zone', stops: 6, status: 'on-route', completion: 50 },
          { id: 'ICE-003', driver: 'Suresh', route: 'Central', stops: 10, status: 'completed', completion: 100 }
        ],
        optimization: {
          originalDistance: 187,
          optimizedDistance: 164,
          timeSaved: '45 minutes',
          fuelSaved: '₹380'
        }
      }
      
      response = `🚚 **Distribution Status**

**Today's Overview:**
• Active Routes: ${distributionData.activeRoutes}
• Completed: ${distributionData.completedDeliveries} deliveries ✅
• Pending: ${distributionData.pendingDeliveries} deliveries

**Vehicle Status:**
${distributionData.vehicles.map(v => 
  `• ${v.id} (${v.driver}) - ${v.route}: ${v.completion}% complete ${v.status === 'completed' ? '✅' : '🚛'}`
).join('\n')}

**🎯 Route Optimization Results:**
• Distance reduced: ${distributionData.optimization.originalDistance}km → ${distributionData.optimization.optimizedDistance}km
• Time saved: ${distributionData.optimization.timeSaved}
• Fuel cost saved: ${distributionData.optimization.fuelSaved}
• All deliveries within temperature compliance ✅`

      data = distributionData
      status = 'optimal'
      actions = [
        { label: 'Track Vehicles', action: 'track', variant: 'default' },
        { label: 'Optimize Tomorrow', action: 'optimize', variant: 'outline' }
      ]
    }
    
    // Demand Forecasting
    else if (lowerMessage.includes('forecast') || lowerMessage.includes('predict') || lowerMessage.includes('demand')) {
      analyticalFramework.stage = 'target'
      
      const forecastData = {
        period: 'Next 7 Days',
        weatherImpact: 'High temperatures expected (34-36°C)',
        totalDemand: 8400,
        confidence: 88,
        byDay: [
          { day: 'Mon', units: 1100, temp: 34 },
          { day: 'Tue', units: 1150, temp: 35 },
          { day: 'Wed', units: 1200, temp: 35 },
          { day: 'Thu', units: 1180, temp: 34 },
          { day: 'Fri', units: 1350, temp: 36 },
          { day: 'Sat', units: 1420, temp: 36 },
          { day: 'Sun', units: 1000, temp: 33 }
        ],
        recommendations: [
          'Increase Kulfi production by 25% for weekend',
          'Stock extra Mango and Orange flavors',
          'Prepare promotional offers for high-temp days',
          'Ensure sufficient delivery capacity for Fri-Sat'
        ]
      }
      
      response = `🔮 **Demand Forecast - ${forecastData.period}**

**Forecast Confidence:** ${forecastData.confidence}%
**Weather Impact:** ${forecastData.weatherImpact}
**Total Predicted Demand:** ${forecastData.totalDemand.toLocaleString()} units

**Daily Breakdown:**
${forecastData.byDay.map(d => 
  `• ${d.day}: ${d.units} units (${d.temp}°C) ${d.units > 1300 ? '📈' : ''}`
).join('\n')}

**🎯 Strategic Recommendations:**
${forecastData.recommendations.map((r, i) => `${i+1}. ${r}`).join('\n')}

**Production Planning:**
• Weekday average: 1,160 units/day
• Weekend surge: +22% expected
• Temperature elasticity: +2.8% per degree above 32°C`

      data = forecastData
      confidence = forecastData.confidence
      actions = [
        { label: 'Apply to Production', action: 'apply', variant: 'default' },
        { label: 'Adjust Parameters', action: 'adjust', variant: 'outline' }
      ]
    }
    
    // Default helpful response
    else {
      analyticalFramework.stage = 'clarify'
      response = `I understand you're asking about "${message}". Let me help you with ice cream operations.

I can assist with:
• 🌡️ **Cold chain monitoring** - Check temperature compliance
• 🏭 **Production planning** - Optimize based on demand
• 📦 **Inventory management** - Stock levels and expiry tracking
• 📊 **Sales analytics** - Revenue and product performance
• 🚚 **Distribution routes** - Delivery optimization
• 🔮 **Demand forecasting** - Weather-based predictions

Could you please specify which area you'd like to explore?`
      
      confidence = 75
      status = 'clarify'
    }

    return NextResponse.json({
      message: response,
      data,
      status,
      confidence,
      actions,
      analyticalFramework
    })

  } catch (error) {
    console.error('Ice Cream Manager API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}