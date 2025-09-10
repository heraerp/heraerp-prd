#!/usr/bin/env node

/**
 * HERA Furniture Module - Phase 8: Batch Processing System
 * 
 * Handles bulk imports, batch operations, and scheduled tasks
 * with progress tracking and error handling.
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parse/sync');

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class BatchProcessor extends EventEmitter {
  constructor(organizationId) {
    super();
    this.organizationId = organizationId;
    this.jobs = new Map();
    this.batchSize = 100; // Process 100 items at a time
  }

  /**
   * Create a new batch job
   */
  createJob(jobType, totalItems, metadata = {}) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job = {
      id: jobId,
      type: jobType,
      status: 'pending',
      totalItems,
      processedItems: 0,
      successCount: 0,
      errorCount: 0,
      errors: [],
      startTime: null,
      endTime: null,
      progress: 0,
      metadata,
      created: new Date().toISOString()
    };

    this.jobs.set(jobId, job);
    this.emit('job:created', job);
    
    return jobId;
  }

  /**
   * Update job progress
   */
  updateJobProgress(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    Object.assign(job, updates);
    job.progress = (job.processedItems / job.totalItems * 100).toFixed(2);
    
    this.emit('job:progress', job);
    
    if (job.processedItems >= job.totalItems) {
      job.status = 'completed';
      job.endTime = new Date().toISOString();
      this.emit('job:completed', job);
    }
  }

  /**
   * Import products from CSV
   */
  async importProducts(filePath) {
    try {
      // Read and parse CSV
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const records = csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      const jobId = this.createJob('product_import', records.length, { filePath });
      const job = this.jobs.get(jobId);
      job.status = 'processing';
      job.startTime = new Date().toISOString();

      // Process in batches
      for (let i = 0; i < records.length; i += this.batchSize) {
        const batch = records.slice(i, i + this.batchSize);
        
        try {
          await this.processBatchProducts(batch);
          job.successCount += batch.length;
        } catch (error) {
          job.errorCount += batch.length;
          job.errors.push({
            batch: `${i}-${i + batch.length}`,
            error: error.message
          });
        }

        job.processedItems = Math.min(i + this.batchSize, records.length);
        this.updateJobProgress(jobId, job);
      }

      return job;
    } catch (error) {
      console.error('Import error:', error);
      throw error;
    }
  }

  /**
   * Process batch of products
   */
  async processBatchProducts(products) {
    const entities = [];
    const dynamicData = [];

    for (const product of products) {
      const entityId = crypto.randomUUID();
      
      // Create entity
      entities.push({
        id: entityId,
        organization_id: this.organizationId,
        entity_type: 'product',
        entity_name: product.name || product.product_name,
        entity_code: product.code || product.product_code || `PROD-${Date.now()}`,
        status: 'active',
        smart_code: 'HERA.FURNITURE.PRODUCT.v1',
        metadata: {
          category: product.category || 'uncategorized',
          material: product.material,
          dimensions: product.dimensions,
          imported: true,
          import_date: new Date().toISOString()
        }
      });

      // Create dynamic data fields
      const fields = [
        { name: 'selling_price', value: parseFloat(product.price || 0), type: 'number' },
        { name: 'cost_price', value: parseFloat(product.cost || 0), type: 'number' },
        { name: 'current_stock', value: parseInt(product.stock || 0), type: 'number' },
        { name: 'minimum_stock', value: parseInt(product.min_stock || 10), type: 'number' },
        { name: 'description', value: product.description || '', type: 'text' },
        { name: 'warranty_period', value: product.warranty || '12 months', type: 'text' }
      ];

      fields.forEach(field => {
        dynamicData.push({
          organization_id: this.organizationId,
          entity_id: entityId,
          field_name: field.name,
          [`field_value_${field.type}`]: field.value,
          smart_code: `HERA.FURNITURE.FIELD.${field.name.toUpperCase()}.v1`
        });
      });
    }

    // Batch insert entities
    if (entities.length > 0) {
      const { error: entityError } = await supabase
        .from('core_entities')
        .insert(entities);

      if (entityError) throw entityError;
    }

    // Batch insert dynamic data
    if (dynamicData.length > 0) {
      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .insert(dynamicData);

      if (dynamicError) throw dynamicError;
    }
  }

  /**
   * Import customers from CSV
   */
  async importCustomers(filePath) {
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const records = csv.parse(fileContent, {
        columns: true,
        skip_empty_lines: true
      });

      const jobId = this.createJob('customer_import', records.length, { filePath });
      const job = this.jobs.get(jobId);
      job.status = 'processing';
      job.startTime = new Date().toISOString();

      for (let i = 0; i < records.length; i += this.batchSize) {
        const batch = records.slice(i, i + this.batchSize);
        
        try {
          await this.processBatchCustomers(batch);
          job.successCount += batch.length;
        } catch (error) {
          job.errorCount += batch.length;
          job.errors.push({
            batch: `${i}-${i + batch.length}`,
            error: error.message
          });
        }

        job.processedItems = Math.min(i + this.batchSize, records.length);
        this.updateJobProgress(jobId, job);
      }

      return job;
    } catch (error) {
      console.error('Customer import error:', error);
      throw error;
    }
  }

  /**
   * Process batch of customers
   */
  async processBatchCustomers(customers) {
    const entities = [];
    const dynamicData = [];

    for (const customer of customers) {
      const entityId = crypto.randomUUID();
      
      entities.push({
        id: entityId,
        organization_id: this.organizationId,
        entity_type: 'customer',
        entity_name: customer.name || customer.customer_name,
        entity_code: customer.code || `CUST-${Date.now()}`,
        status: 'active',
        smart_code: 'HERA.FURNITURE.CUSTOMER.v1',
        metadata: {
          type: customer.type || 'individual',
          imported: true,
          import_date: new Date().toISOString()
        }
      });

      const fields = [
        { name: 'email', value: customer.email || '', type: 'text' },
        { name: 'phone', value: customer.phone || '', type: 'text' },
        { name: 'address', value: customer.address || '', type: 'text' },
        { name: 'city', value: customer.city || '', type: 'text' },
        { name: 'country', value: customer.country || 'AE', type: 'text' },
        { name: 'credit_limit', value: parseFloat(customer.credit_limit || 0), type: 'number' }
      ];

      fields.forEach(field => {
        if (field.value) {
          dynamicData.push({
            organization_id: this.organizationId,
            entity_id: entityId,
            field_name: field.name,
            [`field_value_${field.type}`]: field.value,
            smart_code: `HERA.FURNITURE.FIELD.${field.name.toUpperCase()}.v1`
          });
        }
      });
    }

    // Batch insert
    if (entities.length > 0) {
      const { error: entityError } = await supabase
        .from('core_entities')
        .insert(entities);

      if (entityError) throw entityError;
    }

    if (dynamicData.length > 0) {
      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .insert(dynamicData);

      if (dynamicError) throw dynamicError;
    }
  }

  /**
   * Batch update inventory levels
   */
  async batchUpdateInventory(updates) {
    const jobId = this.createJob('inventory_update', updates.length);
    const job = this.jobs.get(jobId);
    job.status = 'processing';
    job.startTime = new Date().toISOString();

    for (let i = 0; i < updates.length; i += this.batchSize) {
      const batch = updates.slice(i, i + this.batchSize);
      
      try {
        // Update each product's inventory
        for (const update of batch) {
          const { error } = await supabase
            .from('core_dynamic_data')
            .update({ field_value_number: update.newStock })
            .eq('entity_id', update.productId)
            .eq('field_name', 'current_stock')
            .eq('organization_id', this.organizationId);

          if (error) throw error;

          // Create inventory adjustment transaction
          await this.createInventoryAdjustment(update);
        }
        
        job.successCount += batch.length;
      } catch (error) {
        job.errorCount += batch.length;
        job.errors.push({
          batch: `${i}-${i + batch.length}`,
          error: error.message
        });
      }

      job.processedItems = Math.min(i + this.batchSize, updates.length);
      this.updateJobProgress(jobId, job);
    }

    return job;
  }

  /**
   * Create inventory adjustment transaction
   */
  async createInventoryAdjustment(adjustment) {
    const transactionId = crypto.randomUUID();
    
    await supabase
      .from('universal_transactions')
      .insert({
        id: transactionId,
        organization_id: this.organizationId,
        transaction_type: 'inventory_adjustment',
        transaction_code: `ADJ-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        smart_code: 'HERA.FURNITURE.INV.ADJUSTMENT.v1',
        metadata: {
          reason: adjustment.reason || 'Batch update',
          old_stock: adjustment.oldStock,
          new_stock: adjustment.newStock
        }
      });

    await supabase
      .from('universal_transaction_lines')
      .insert({
        organization_id: this.organizationId,
        transaction_id: transactionId,
        line_entity_id: adjustment.productId,
        line_number: 1,
        quantity: adjustment.newStock - adjustment.oldStock,
        unit_price: 0,
        line_amount: 0,
        smart_code: 'HERA.FURNITURE.INV.ADJ.LINE.v1'
      });
  }

  /**
   * Batch process orders
   */
  async batchProcessOrders(orderIds, action) {
    const jobId = this.createJob('order_processing', orderIds.length, { action });
    const job = this.jobs.get(jobId);
    job.status = 'processing';
    job.startTime = new Date().toISOString();

    for (let i = 0; i < orderIds.length; i += this.batchSize) {
      const batch = orderIds.slice(i, i + this.batchSize);
      
      try {
        for (const orderId of batch) {
          await this.processOrder(orderId, action);
        }
        job.successCount += batch.length;
      } catch (error) {
        job.errorCount += batch.length;
        job.errors.push({
          batch: `${i}-${i + batch.length}`,
          error: error.message
        });
      }

      job.processedItems = Math.min(i + this.batchSize, orderIds.length);
      this.updateJobProgress(jobId, job);
    }

    return job;
  }

  /**
   * Process individual order
   */
  async processOrder(orderId, action) {
    const statusMap = {
      approve: 'approved',
      complete: 'completed',
      cancel: 'cancelled',
      ship: 'shipped'
    };

    const newStatus = statusMap[action];
    if (!newStatus) throw new Error(`Invalid action: ${action}`);

    const { error } = await supabase
      .from('universal_transactions')
      .update({ 
        status: newStatus,
        metadata: {
          [`${action}_date`]: new Date().toISOString(),
          [`${action}_by`]: 'batch_processor'
        }
      })
      .eq('id', orderId)
      .eq('organization_id', this.organizationId);

    if (error) throw error;
  }

  /**
   * Export data to CSV
   */
  async exportData(entityType, outputPath) {
    const jobId = this.createJob(`${entityType}_export`, 1, { outputPath });
    const job = this.jobs.get(jobId);
    job.status = 'processing';
    job.startTime = new Date().toISOString();

    try {
      // Fetch all entities of type
      const { data: entities, error } = await supabase
        .from('core_entities')
        .select(`
          *,
          core_dynamic_data(field_name, field_value_text, field_value_number)
        `)
        .eq('organization_id', this.organizationId)
        .eq('entity_type', entityType)
        .eq('status', 'active');

      if (error) throw error;

      // Transform to flat structure for CSV
      const records = entities.map(entity => {
        const record = {
          id: entity.id,
          name: entity.entity_name,
          code: entity.entity_code,
          ...entity.metadata
        };

        // Add dynamic fields
        entity.core_dynamic_data?.forEach(field => {
          record[field.field_name] = field.field_value_text || field.field_value_number;
        });

        return record;
      });

      // Write CSV
      const csvContent = this.generateCSV(records);
      await fs.writeFile(outputPath, csvContent);

      job.processedItems = 1;
      job.successCount = 1;
      job.metadata.recordCount = records.length;
      this.updateJobProgress(jobId, job);

      return job;
    } catch (error) {
      job.errorCount = 1;
      job.errors.push({ error: error.message });
      this.updateJobProgress(jobId, job);
      throw error;
    }
  }

  /**
   * Generate CSV content
   */
  generateCSV(records) {
    if (records.length === 0) return '';

    const headers = Object.keys(records[0]);
    const rows = records.map(record => 
      headers.map(header => {
        const value = record[header];
        // Escape values containing commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Schedule maintenance tasks
   */
  async runMaintenanceTasks() {
    const tasks = [
      { name: 'cleanup_old_logs', fn: () => this.cleanupOldLogs(30) },
      { name: 'update_inventory_alerts', fn: () => this.updateInventoryAlerts() },
      { name: 'archive_completed_orders', fn: () => this.archiveCompletedOrders(90) },
      { name: 'recalculate_customer_stats', fn: () => this.recalculateCustomerStats() }
    ];

    const jobId = this.createJob('maintenance', tasks.length);
    const job = this.jobs.get(jobId);
    job.status = 'processing';
    job.startTime = new Date().toISOString();

    for (const task of tasks) {
      try {
        console.log(`Running maintenance task: ${task.name}`);
        await task.fn();
        job.successCount++;
      } catch (error) {
        job.errorCount++;
        job.errors.push({
          task: task.name,
          error: error.message
        });
      }
      job.processedItems++;
      this.updateJobProgress(jobId, job);
    }

    return job;
  }

  /**
   * Clean up old logs
   */
  async cleanupOldLogs(daysOld) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    // This would clean up old audit logs, error logs, etc.
    console.log(`Cleaning up logs older than ${daysOld} days...`);
  }

  /**
   * Update inventory alerts
   */
  async updateInventoryAlerts() {
    // Check for low stock and create alerts
    const { data: lowStockProducts } = await supabase
      .from('core_entities')
      .select(`
        id,
        entity_name,
        core_dynamic_data!inner(field_name, field_value_number)
      `)
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'product')
      .eq('core_dynamic_data.field_name', 'current_stock')
      .lte('core_dynamic_data.field_value_number', 10);

    console.log(`Found ${lowStockProducts?.length || 0} products with low stock`);
  }

  /**
   * Archive completed orders
   */
  async archiveCompletedOrders(daysOld) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    console.log(`Archiving orders completed before ${cutoffDate.toISOString()}`);
    // This would move old orders to archive status
  }

  /**
   * Recalculate customer statistics
   */
  async recalculateCustomerStats() {
    console.log('Recalculating customer lifetime values and purchase frequencies...');
    // This would update customer statistics based on order history
  }

  /**
   * Get job status
   */
  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs
   */
  getAllJobs() {
    return Array.from(this.jobs.values());
  }

  /**
   * Get active jobs
   */
  getActiveJobs() {
    return Array.from(this.jobs.values())
      .filter(job => job.status === 'processing' || job.status === 'pending');
  }
}

// CLI interface
async function main() {
  const organizationId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';
  const processor = new BatchProcessor(organizationId);

  // Set up event listeners
  processor.on('job:created', job => {
    console.log(`\n📋 Job created: ${job.id} (${job.type})`);
  });

  processor.on('job:progress', job => {
    console.log(`📊 Progress: ${job.progress}% (${job.processedItems}/${job.totalItems})`);
  });

  processor.on('job:completed', job => {
    console.log(`\n✅ Job completed: ${job.id}`);
    console.log(`   Success: ${job.successCount}, Errors: ${job.errorCount}`);
    if (job.errors.length > 0) {
      console.log(`   Errors:`, job.errors);
    }
  });

  const command = process.argv[2];
  const arg1 = process.argv[3];
  const arg2 = process.argv[4];

  try {
    switch (command) {
      case 'import-products':
        if (!arg1) {
          console.error('Please provide CSV file path');
          process.exit(1);
        }
        await processor.importProducts(arg1);
        break;

      case 'import-customers':
        if (!arg1) {
          console.error('Please provide CSV file path');
          process.exit(1);
        }
        await processor.importCustomers(arg1);
        break;

      case 'export':
        if (!arg1 || !arg2) {
          console.error('Please provide entity type and output path');
          process.exit(1);
        }
        await processor.exportData(arg1, arg2);
        break;

      case 'maintenance':
        await processor.runMaintenanceTasks();
        break;

      case 'create-sample-csv':
        // Create sample CSV files for testing
        await createSampleCSVFiles();
        break;

      default:
        console.log(`
HERA Furniture Batch Processing System

Usage:
  node furniture-phase8-batch-processor.js <command> [options]

Commands:
  import-products <csv-file>    Import products from CSV
  import-customers <csv-file>   Import customers from CSV
  export <type> <output-file>   Export data to CSV (type: product|customer|supplier)
  maintenance                   Run scheduled maintenance tasks
  create-sample-csv            Create sample CSV files for testing

Examples:
  node furniture-phase8-batch-processor.js import-products products.csv
  node furniture-phase8-batch-processor.js export product products-export.csv
  node furniture-phase8-batch-processor.js maintenance
        `);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Create sample CSV files for testing
async function createSampleCSVFiles() {
  // Sample products CSV
  const productsCSV = `name,code,category,material,price,cost,stock,min_stock,warranty,description
Modern Sofa Set,SOFA-001,Living Room,Fabric,2500,1500,15,5,24 months,Comfortable 3-seater sofa with premium fabric
Executive Desk,DESK-001,Office,Wood,1800,1000,20,10,12 months,Large executive desk with storage
Dining Table Set,DINE-001,Dining,Wood,3500,2000,8,3,18 months,6-seater dining table with chairs
Office Chair,CHAIR-001,Office,Leather,800,400,25,15,12 months,Ergonomic office chair with lumbar support
Bookshelf Unit,BOOK-001,Storage,Wood,1200,700,12,5,12 months,5-tier bookshelf for home or office`;

  // Sample customers CSV
  const customersCSV = `name,code,email,phone,address,city,country,type,credit_limit
Ahmed Hassan,CUST-001,ahmed@example.com,+971501234567,123 Sheikh Zayed Road,Dubai,AE,individual,10000
Fatima Al Rashid,CUST-002,fatima@example.com,+971502345678,456 Al Wasl Road,Dubai,AE,individual,15000
Modern Office LLC,CUST-003,info@modernoffice.ae,+971504567890,789 Business Bay,Dubai,AE,corporate,50000
Home Decor Trading,CUST-004,sales@homedecor.ae,+971505678901,321 Al Barsha,Dubai,AE,corporate,75000
Sarah Johnson,CUST-005,sarah@example.com,+971506789012,654 Marina Walk,Dubai,AE,individual,20000`;

  await fs.writeFile('sample-products.csv', productsCSV);
  await fs.writeFile('sample-customers.csv', customersCSV);

  console.log('✅ Sample CSV files created:');
  console.log('   - sample-products.csv');
  console.log('   - sample-customers.csv');
}

// Export for use in other modules
module.exports = { BatchProcessor };

// Run CLI if called directly
if (require.main === module) {
  main();
}