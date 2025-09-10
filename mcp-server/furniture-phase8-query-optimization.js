#!/usr/bin/env node

/**
 * HERA Furniture Module - Phase 8: Query Optimization Service
 * 
 * Implements optimized query patterns, caching, and performance monitoring
 * for the furniture module operations.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { LRUCache } = require('lru-cache');

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize LRU cache with 100MB limit and 5-minute TTL
const queryCache = new LRUCache({
  max: 100 * 1024 * 1024, // 100MB
  ttl: 1000 * 60 * 5, // 5 minutes
  sizeCalculation: (value) => JSON.stringify(value).length
});

// Performance metrics storage
const performanceMetrics = {
  queries: [],
  avgResponseTimes: {}
};

class QueryOptimizationService {
  constructor(organizationId) {
    this.organizationId = organizationId;
    this.indexRecommendations = new Map();
  }

  /**
   * Execute optimized query with caching and monitoring
   */
  async executeOptimizedQuery(queryName, queryFunction, cacheKey = null) {
    const startTime = Date.now();
    
    try {
      // Check cache first if cache key provided
      if (cacheKey && queryCache.has(cacheKey)) {
        const cachedResult = queryCache.get(cacheKey);
        this.recordMetrics(queryName, Date.now() - startTime, true);
        return cachedResult;
      }

      // Execute query
      const result = await queryFunction();
      
      // Cache result if cache key provided
      if (cacheKey && result) {
        queryCache.set(cacheKey, result);
      }

      // Record metrics
      const duration = Date.now() - startTime;
      this.recordMetrics(queryName, duration, false);
      
      // Check if query needs optimization
      if (duration > 1000) { // More than 1 second
        this.suggestOptimization(queryName, duration);
      }

      return result;
    } catch (error) {
      console.error(`Query ${queryName} failed:`, error);
      throw error;
    }
  }

  /**
   * Record query performance metrics
   */
  recordMetrics(queryName, duration, cacheHit) {
    const metric = {
      queryName,
      duration,
      cacheHit,
      timestamp: new Date().toISOString()
    };

    performanceMetrics.queries.push(metric);

    // Update average response time
    if (!performanceMetrics.avgResponseTimes[queryName]) {
      performanceMetrics.avgResponseTimes[queryName] = {
        count: 0,
        total: 0,
        avg: 0
      };
    }

    const stats = performanceMetrics.avgResponseTimes[queryName];
    stats.count++;
    stats.total += duration;
    stats.avg = stats.total / stats.count;

    // Keep only last 1000 queries
    if (performanceMetrics.queries.length > 1000) {
      performanceMetrics.queries.shift();
    }
  }

  /**
   * Suggest query optimization based on performance
   */
  suggestOptimization(queryName, duration) {
    const suggestions = [];

    if (duration > 5000) {
      suggestions.push('Consider adding database indexes');
      suggestions.push('Break query into smaller chunks');
    } else if (duration > 2000) {
      suggestions.push('Add result caching');
      suggestions.push('Use query pagination');
    } else if (duration > 1000) {
      suggestions.push('Optimize WHERE clauses');
      suggestions.push('Reduce JOIN operations');
    }

    this.indexRecommendations.set(queryName, suggestions);
  }

  /**
   * Get products with inventory levels - optimized
   */
  async getProductsWithInventory(options = {}) {
    const { limit = 50, offset = 0, category = null } = options;
    const cacheKey = `products_inventory_${this.organizationId}_${limit}_${offset}_${category}`;

    return this.executeOptimizedQuery(
      'getProductsWithInventory',
      async () => {
        let query = supabase
          .from('core_entities')
          .select(`
            id,
            entity_name,
            entity_code,
            metadata,
            core_dynamic_data!inner(field_name, field_value_text, field_value_number)
          `)
          .eq('organization_id', this.organizationId)
          .eq('entity_type', 'product')
          .eq('status', 'active');

        if (category) {
          query = query.eq('metadata->category', category);
        }

        const { data, error } = await query
          .range(offset, offset + limit - 1);

        if (error) throw error;

        // Transform data for better performance
        return data.map(product => ({
          id: product.id,
          name: product.entity_name,
          code: product.entity_code,
          category: product.metadata?.category,
          inventory: this.extractFieldValue(product.core_dynamic_data, 'current_stock'),
          price: this.extractFieldValue(product.core_dynamic_data, 'selling_price')
        }));
      },
      cacheKey
    );
  }

  /**
   * Get customer order summary - optimized with pre-aggregation
   */
  async getCustomerOrderSummary(customerId) {
    const cacheKey = `customer_summary_${customerId}`;

    return this.executeOptimizedQuery(
      'getCustomerOrderSummary',
      async () => {
        // Get customer info and aggregate order data in single query
        const { data, error } = await supabase
          .from('core_entities')
          .select(`
            id,
            entity_name,
            entity_code,
            metadata,
            from_transactions:universal_transactions!from_entity_id(
              id,
              total_amount,
              transaction_date,
              status
            )
          `)
          .eq('id', customerId)
          .eq('from_transactions.transaction_type', 'sale_order')
          .eq('from_transactions.organization_id', this.organizationId)
          .single();

        if (error) throw error;

        // Calculate aggregates
        const orders = data.from_transactions || [];
        const summary = {
          customer: {
            id: data.id,
            name: data.entity_name,
            code: data.entity_code
          },
          orderCount: orders.length,
          totalRevenue: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
          averageOrderValue: orders.length > 0 
            ? orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) / orders.length 
            : 0,
          lastOrderDate: orders.length > 0 
            ? orders.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date))[0].transaction_date
            : null
        };

        return summary;
      },
      cacheKey
    );
  }

  /**
   * Get production schedule with optimization
   */
  async getProductionSchedule(options = {}) {
    const { startDate, endDate, status = 'all' } = options;
    const cacheKey = `production_schedule_${this.organizationId}_${startDate}_${endDate}_${status}`;

    return this.executeOptimizedQuery(
      'getProductionSchedule',
      async () => {
        let query = supabase
          .from('universal_transactions')
          .select(`
            id,
            transaction_code,
            transaction_date,
            total_amount,
            metadata,
            status,
            from_entity:from_entity_id(entity_name),
            universal_transaction_lines!inner(
              line_entity_id,
              quantity,
              unit_price,
              metadata,
              line_entity:line_entity_id(entity_name, entity_code)
            )
          `)
          .eq('organization_id', this.organizationId)
          .eq('transaction_type', 'production_order');

        if (startDate && endDate) {
          query = query
            .gte('transaction_date', startDate)
            .lte('transaction_date', endDate);
        }

        if (status !== 'all') {
          query = query.eq('status', status);
        }

        const { data, error } = await query
          .order('transaction_date', { ascending: false })
          .limit(100);

        if (error) throw error;

        // Group by date for better visualization
        const scheduleByDate = {};
        data.forEach(order => {
          const date = new Date(order.transaction_date).toLocaleDateString();
          if (!scheduleByDate[date]) {
            scheduleByDate[date] = [];
          }
          scheduleByDate[date].push({
            id: order.id,
            orderCode: order.transaction_code,
            customerName: order.from_entity?.entity_name,
            status: order.status,
            items: order.universal_transaction_lines.map(line => ({
              productName: line.line_entity?.entity_name,
              productCode: line.line_entity?.entity_code,
              quantity: line.quantity,
              dueDate: line.metadata?.completion_date
            }))
          });
        });

        return scheduleByDate;
      },
      cacheKey
    );
  }

  /**
   * Get dashboard metrics with pre-computed aggregations
   */
  async getDashboardMetrics() {
    const cacheKey = `dashboard_metrics_${this.organizationId}`;

    return this.executeOptimizedQuery(
      'getDashboardMetrics',
      async () => {
        // Execute all queries in parallel for better performance
        const [
          totalProducts,
          totalCustomers,
          totalSuppliers,
          recentOrders,
          inventoryAlerts
        ] = await Promise.all([
          this.getEntityCount('product'),
          this.getEntityCount('customer'),
          this.getEntityCount('supplier'),
          this.getRecentTransactions('sale_order', 5),
          this.getLowInventoryProducts(10)
        ]);

        // Calculate revenue metrics
        const { data: revenueData } = await supabase
          .from('universal_transactions')
          .select('total_amount, transaction_date')
          .eq('organization_id', this.organizationId)
          .eq('transaction_type', 'sale_order')
          .eq('status', 'completed')
          .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

        const monthlyRevenue = revenueData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

        return {
          summary: {
            totalProducts,
            totalCustomers,
            totalSuppliers,
            monthlyRevenue,
            pendingOrders: recentOrders.filter(o => o.status === 'pending').length
          },
          recentOrders,
          inventoryAlerts,
          lastUpdated: new Date().toISOString()
        };
      },
      cacheKey
    );
  }

  /**
   * Helper function to get entity count
   */
  async getEntityCount(entityType) {
    const { count, error } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', this.organizationId)
      .eq('entity_type', entityType)
      .eq('status', 'active');

    return count || 0;
  }

  /**
   * Helper function to get recent transactions
   */
  async getRecentTransactions(transactionType, limit) {
    const { data, error } = await supabase
      .from('universal_transactions')
      .select(`
        id,
        transaction_code,
        transaction_date,
        total_amount,
        status,
        from_entity:from_entity_id(entity_name)
      `)
      .eq('organization_id', this.organizationId)
      .eq('transaction_type', transactionType)
      .order('transaction_date', { ascending: false })
      .limit(limit);

    return data || [];
  }

  /**
   * Helper function to get low inventory products
   */
  async getLowInventoryProducts(threshold) {
    const { data, error } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_name,
        entity_code,
        core_dynamic_data!inner(field_name, field_value_number)
      `)
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'product')
      .eq('status', 'active')
      .eq('core_dynamic_data.field_name', 'current_stock')
      .lte('core_dynamic_data.field_value_number', threshold);

    return data?.map(product => ({
      id: product.id,
      name: product.entity_name,
      code: product.entity_code,
      currentStock: product.core_dynamic_data[0]?.field_value_number || 0
    })) || [];
  }

  /**
   * Extract field value from dynamic data
   */
  extractFieldValue(dynamicData, fieldName) {
    const field = dynamicData?.find(f => f.field_name === fieldName);
    return field?.field_value_number || field?.field_value_text || null;
  }

  /**
   * Clear cache for specific patterns
   */
  clearCache(pattern = null) {
    if (!pattern) {
      queryCache.clear();
    } else {
      const keys = [...queryCache.keys()];
      keys.forEach(key => {
        if (key.includes(pattern)) {
          queryCache.delete(key);
        }
      });
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const report = {
      totalQueries: performanceMetrics.queries.length,
      cacheHitRate: this.calculateCacheHitRate(),
      averageResponseTimes: performanceMetrics.avgResponseTimes,
      slowQueries: this.getSlowQueries(),
      recommendations: [...this.indexRecommendations.entries()],
      cacheStats: {
        size: queryCache.size,
        itemCount: queryCache.size
      }
    };

    return report;
  }

  /**
   * Calculate cache hit rate
   */
  calculateCacheHitRate() {
    const recentQueries = performanceMetrics.queries.slice(-100);
    const cacheHits = recentQueries.filter(q => q.cacheHit).length;
    return recentQueries.length > 0 ? (cacheHits / recentQueries.length * 100).toFixed(2) + '%' : '0%';
  }

  /**
   * Get slow queries
   */
  getSlowQueries() {
    return performanceMetrics.queries
      .filter(q => q.duration > 1000)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }

  /**
   * Create recommended indexes
   */
  getIndexRecommendations() {
    return [
      {
        table: 'core_entities',
        columns: ['organization_id', 'entity_type', 'status'],
        reason: 'Optimize entity type queries'
      },
      {
        table: 'core_dynamic_data',
        columns: ['entity_id', 'field_name'],
        reason: 'Optimize dynamic field lookups'
      },
      {
        table: 'universal_transactions',
        columns: ['organization_id', 'transaction_type', 'transaction_date'],
        reason: 'Optimize transaction queries by date'
      },
      {
        table: 'universal_transactions',
        columns: ['from_entity_id', 'organization_id'],
        reason: 'Optimize customer order lookups'
      },
      {
        table: 'core_relationships',
        columns: ['from_entity_id', 'relationship_type'],
        reason: 'Optimize relationship queries'
      }
    ];
  }
}

// CLI interface
async function main() {
  const organizationId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';
  const optimizer = new QueryOptimizationService(organizationId);

  const command = process.argv[2];

  try {
    switch (command) {
      case 'test-queries':
        console.log('Testing optimized queries...\n');

        // Test product query
        console.log('1. Testing product inventory query...');
        const products = await optimizer.getProductsWithInventory({ limit: 10 });
        console.log(`✓ Found ${products.length} products`);

        // Test customer summary
        console.log('\n2. Testing customer order summary...');
        // Get a sample customer
        const { data: customers } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('entity_type', 'customer')
          .limit(1);
        
        if (customers?.length > 0) {
          const summary = await optimizer.getCustomerOrderSummary(customers[0].id);
          console.log(`✓ Customer: ${summary.customer.name}`);
          console.log(`  Orders: ${summary.orderCount}, Total Revenue: AED ${summary.totalRevenue.toFixed(2)}`);
        }

        // Test production schedule
        console.log('\n3. Testing production schedule query...');
        const schedule = await optimizer.getProductionSchedule({
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        });
        console.log(`✓ Found schedules for ${Object.keys(schedule).length} dates`);

        // Test dashboard metrics
        console.log('\n4. Testing dashboard metrics query...');
        const metrics = await optimizer.getDashboardMetrics();
        console.log('✓ Dashboard metrics:', metrics.summary);

        break;

      case 'performance-report':
        // Run some queries first to generate metrics
        await optimizer.getProductsWithInventory();
        await optimizer.getDashboardMetrics();
        
        const report = optimizer.getPerformanceReport();
        console.log('\n📊 Performance Report\n');
        console.log('Total Queries:', report.totalQueries);
        console.log('Cache Hit Rate:', report.cacheHitRate);
        console.log('\nAverage Response Times:');
        Object.entries(report.averageResponseTimes).forEach(([query, stats]) => {
          console.log(`  ${query}: ${stats.avg.toFixed(2)}ms (${stats.count} calls)`);
        });
        
        if (report.slowQueries.length > 0) {
          console.log('\n⚠️  Slow Queries:');
          report.slowQueries.forEach(q => {
            console.log(`  ${q.queryName}: ${q.duration}ms at ${q.timestamp}`);
          });
        }

        if (report.recommendations.length > 0) {
          console.log('\n💡 Optimization Recommendations:');
          report.recommendations.forEach(([query, suggestions]) => {
            console.log(`\n  ${query}:`);
            suggestions.forEach(s => console.log(`    - ${s}`));
          });
        }

        break;

      case 'index-recommendations':
        const indexes = optimizer.getIndexRecommendations();
        console.log('\n🔧 Recommended Database Indexes\n');
        indexes.forEach((idx, i) => {
          console.log(`${i + 1}. Table: ${idx.table}`);
          console.log(`   Columns: ${idx.columns.join(', ')}`);
          console.log(`   Reason: ${idx.reason}`);
          console.log(`   SQL: CREATE INDEX idx_${idx.table}_${idx.columns.join('_')} ON ${idx.table} (${idx.columns.join(', ')});`);
          console.log();
        });
        break;

      case 'clear-cache':
        const pattern = process.argv[3];
        optimizer.clearCache(pattern);
        console.log(`✓ Cache cleared${pattern ? ` for pattern: ${pattern}` : ''}`);
        break;

      default:
        console.log(`
HERA Furniture Query Optimization Service

Usage:
  node furniture-phase8-query-optimization.js <command>

Commands:
  test-queries         Test optimized query performance
  performance-report   Show performance metrics and recommendations
  index-recommendations Show recommended database indexes
  clear-cache [pattern] Clear query cache (optional pattern)

Examples:
  node furniture-phase8-query-optimization.js test-queries
  node furniture-phase8-query-optimization.js performance-report
  node furniture-phase8-query-optimization.js clear-cache products
        `);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Export for use in other modules
module.exports = { QueryOptimizationService };

// Run CLI if called directly
if (require.main === module) {
  main();
}