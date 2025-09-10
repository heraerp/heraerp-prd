# HERA Furniture Module - Phase 8: Performance & Scale Guide

## Overview

Phase 8 implements comprehensive performance optimization for the HERA Furniture Module, including:
- Query optimization with caching
- Batch processing for bulk operations  
- Performance monitoring and alerting
- Frontend performance components
- Progressive data loading

## Backend Performance Services

### 1. Query Optimization Service

**File**: `furniture-phase8-query-optimization.js`

Provides optimized query patterns, result caching, and performance monitoring.

```bash
# Test optimized queries
node furniture-phase8-query-optimization.js test-queries

# View performance report
node furniture-phase8-query-optimization.js performance-report

# Get index recommendations
node furniture-phase8-query-optimization.js index-recommendations

# Clear cache
node furniture-phase8-query-optimization.js clear-cache
```

**Key Features**:
- LRU cache with 100MB limit and 5-minute TTL
- Automatic slow query detection (>1s)
- Performance metrics tracking
- Index recommendations
- Cache hit rate monitoring

**Usage Example**:
```javascript
const { QueryOptimizationService } = require('./furniture-phase8-query-optimization');

const optimizer = new QueryOptimizationService(organizationId);

// Get products with caching
const products = await optimizer.getProductsWithInventory({ 
  limit: 50, 
  category: 'Living Room' 
});

// Get dashboard metrics with pre-computed aggregations
const metrics = await optimizer.getDashboardMetrics();

// View performance report
const report = optimizer.getPerformanceReport();
console.log(`Cache hit rate: ${report.cacheHitRate}`);
```

### 2. Batch Processing System

**File**: `furniture-phase8-batch-processor.js`

Handles bulk imports, batch operations, and scheduled maintenance tasks.

```bash
# Import products from CSV
node furniture-phase8-batch-processor.js import-products sample-products.csv

# Import customers from CSV
node furniture-phase8-batch-processor.js import-customers sample-customers.csv

# Export data to CSV
node furniture-phase8-batch-processor.js export product products-export.csv

# Run maintenance tasks
node furniture-phase8-batch-processor.js maintenance

# Create sample CSV files for testing
node furniture-phase8-batch-processor.js create-sample-csv
```

**Key Features**:
- Batch size of 100 items for optimal performance
- Progress tracking with event emitters
- Error handling and recovery
- CSV import/export capabilities
- Scheduled maintenance tasks

**Usage Example**:
```javascript
const { BatchProcessor } = require('./furniture-phase8-batch-processor');

const processor = new BatchProcessor(organizationId);

// Listen to progress events
processor.on('job:progress', job => {
  console.log(`Progress: ${job.progress}% (${job.processedItems}/${job.totalItems})`);
});

processor.on('job:completed', job => {
  console.log(`Completed! Success: ${job.successCount}, Errors: ${job.errorCount}`);
});

// Import products
await processor.importProducts('products.csv');

// Batch update inventory
await processor.batchUpdateInventory([
  { productId: 'uuid1', oldStock: 10, newStock: 50, reason: 'Restock' },
  { productId: 'uuid2', oldStock: 5, newStock: 0, reason: 'Out of stock' }
]);
```

### 3. Performance Monitoring System

**File**: `furniture-phase8-performance-monitor.js`

Real-time monitoring of API endpoints, database queries, and system resources.

```bash
# Start real-time monitoring
node furniture-phase8-performance-monitor.js monitor

# Run performance simulation
node furniture-phase8-performance-monitor.js simulate

# View current thresholds
node furniture-phase8-performance-monitor.js thresholds
```

**Key Features**:
- API endpoint performance tracking
- Database query monitoring
- System resource monitoring (CPU, memory)
- Automatic alert generation
- Performance analysis and reporting

**Thresholds**:
- API Response Time: 1000ms
- Database Query Time: 500ms
- CPU Usage: 80%
- Memory Usage: 85%
- Error Rate: 5%

**Usage Example**:
```javascript
const { PerformanceMonitor } = require('./furniture-phase8-performance-monitor');

const monitor = new PerformanceMonitor(organizationId);

// Set up alerts
monitor.on('alert', alert => {
  console.log(`Alert [${alert.severity}]: ${alert.message}`);
  // Send to monitoring service, email, etc.
});

// Start monitoring
monitor.start(60000); // Check every minute

// Record API metrics
monitor.recordApiMetric(
  '/api/furniture/products',
  'GET',
  150, // duration in ms
  200, // status code
  null  // error
);

// Record database metrics
monitor.recordDatabaseMetric(
  'SELECT * FROM products WHERE category = ?',
  45, // duration in ms
  25  // row count
);

// Get performance report
const report = monitor.getReport();
```

## Frontend Performance Components

### 1. LazyDataTable

Efficient data table with lazy loading and virtual scrolling.

```tsx
import { LazyDataTable } from '@/components/furniture/performance';

<LazyDataTable
  columns={[
    { key: 'name', header: 'Product Name', sortable: true },
    { key: 'price', header: 'Price', render: (value) => `AED ${value}` },
    { key: 'stock', header: 'Stock', sortable: true }
  ]}
  fetchData={async (page, pageSize, sortBy, sortOrder) => {
    const response = await fetch(`/api/products?page=${page}&size=${pageSize}`);
    const data = await response.json();
    return {
      data: data.items,
      totalCount: data.total,
      hasMore: data.hasMore
    };
  }}
  pageSize={50}
  rowKey="id"
  onRowClick={(row) => console.log('Clicked:', row)}
  loadMoreThreshold={200}
/>
```

### 2. VirtualList

High-performance list rendering for thousands of items.

```tsx
import { VirtualList } from '@/components/furniture/performance';

<VirtualList
  items={products}
  itemHeight={80}
  renderItem={(product) => (
    <ProductCard product={product} />
  )}
  overscan={3}
  onEndReached={() => loadMoreProducts()}
  endReachedThreshold={100}
  loading={isLoading}
/>
```

### 3. DebouncedSearch

Search input with debouncing and suggestions.

```tsx
import { DebouncedSearch } from '@/components/furniture/performance';

<DebouncedSearch
  onSearch={async (query) => {
    const results = await searchProducts(query);
    setSearchResults(results);
  }}
  placeholder="Search products..."
  delay={300}
  minLength={2}
  suggestions={productSuggestions}
  onSuggestionClick={(suggestion) => {
    navigateToProduct(suggestion);
  }}
/>
```

### 4. ProgressiveLoader

Multi-stage loading indicator for complex operations.

```tsx
import { ProgressiveLoader } from '@/components/furniture/performance';

<ProgressiveLoader
  stages={[
    { id: 'auth', label: 'Authenticating...', duration: 500 },
    { id: 'data', label: 'Loading data...', duration: 2000 },
    { id: 'render', label: 'Rendering interface...', duration: 1000 }
  ]}
  onComplete={() => console.log('Loading complete!')}
  showProgress={true}
  autoStart={true}
/>
```

### 5. PerformanceDashboard

Real-time performance monitoring dashboard.

```tsx
import { PerformanceDashboard } from '@/components/furniture/performance';

<PerformanceDashboard
  refreshInterval={30}
  onRefresh={async () => {
    const metrics = await fetchPerformanceMetrics();
    return {
      metrics: [
        { label: 'Avg Response Time', value: 245, unit: 'ms', trend: 'down' },
        { label: 'Cache Hit Rate', value: 89.5, unit: '%', trend: 'up' }
      ],
      systemHealth: { cpu: 45, memory: 62, disk: 38, network: 15 },
      apiEndpoints: metrics.apiEndpoints,
      queryPerformance: metrics.queries,
      alerts: metrics.alerts
    };
  }}
/>
```

## Performance Best Practices

### 1. Query Optimization
- Always use the QueryOptimizationService for database operations
- Implement proper indexing based on recommendations
- Use pagination for large result sets
- Cache frequently accessed data

### 2. Batch Processing
- Use batch operations for bulk imports/updates
- Process in chunks of 100 items
- Implement proper error handling and recovery
- Monitor job progress and handle failures

### 3. Frontend Performance
- Use lazy loading for large data sets
- Implement virtual scrolling for long lists
- Debounce user inputs (search, filters)
- Show progressive loading states

### 4. Monitoring
- Set up alerts for performance degradation
- Monitor key metrics continuously
- Review slow query logs regularly
- Analyze cache hit rates

## Database Index Recommendations

Based on the furniture module query patterns:

```sql
-- Optimize entity queries
CREATE INDEX idx_core_entities_org_type_status 
ON core_entities (organization_id, entity_type, status);

-- Optimize dynamic field lookups
CREATE INDEX idx_core_dynamic_data_entity_field 
ON core_dynamic_data (entity_id, field_name);

-- Optimize transaction queries by date
CREATE INDEX idx_universal_transactions_org_type_date 
ON universal_transactions (organization_id, transaction_type, transaction_date);

-- Optimize customer order lookups
CREATE INDEX idx_universal_transactions_from_entity_org 
ON universal_transactions (from_entity_id, organization_id);

-- Optimize relationship queries
CREATE INDEX idx_core_relationships_from_type 
ON core_relationships (from_entity_id, relationship_type);
```

## Performance Targets

- **Page Load**: < 2 seconds
- **API Response**: < 500ms (p95)
- **Database Queries**: < 100ms (average)
- **Cache Hit Rate**: > 80%
- **Error Rate**: < 1%
- **Batch Processing**: 1000+ items/minute

## Troubleshooting

### High Memory Usage
- Clear cache: `node furniture-phase8-query-optimization.js clear-cache`
- Reduce batch sizes in BatchProcessor
- Implement more aggressive cache expiration

### Slow Queries
- Run index recommendations
- Use query optimization service
- Enable query result caching
- Consider data archival for old records

### API Performance Issues
- Check performance dashboard for bottlenecks
- Review slow endpoint logs
- Implement response caching
- Use CDN for static assets

### Import Failures
- Check CSV format matches expected schema
- Reduce batch size for large imports
- Review error logs in job details
- Ensure sufficient database connections