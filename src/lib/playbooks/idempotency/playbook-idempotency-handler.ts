/**
 * HERA Playbooks Idempotency Handler
 * 
 * Handles idempotency key validation and prevents duplicate operations
 * in playbook execution.
 */
import { universalApi } from '@/lib/universal-api';
import { PlaybookSmartCodes } from '../smart-codes/playbook-smart-codes';

interface IdempotencyCheck {
  key: string;
  operation: string;
  organizationId: string;
  userId?: string;
  expirationMinutes?: number;
}

interface IdempotencyResult {
  isDuplicate: boolean;
  existingResult?: any;
  transactionId?: string;
  createdAt?: string;
}

export class PlaybookIdempotencyHandler {
  private readonly DEFAULT_EXPIRATION_MINUTES = 1440; // 24 hours
  
  /**
   * Check if an operation with this idempotency key has already been processed
   */
  async checkIdempotency(check: IdempotencyCheck): Promise<IdempotencyResult> {
    try {
      const { key, operation, organizationId, expirationMinutes = this.DEFAULT_EXPIRATION_MINUTES } = check;
      
      // Calculate expiration cutoff
      const expirationCutoff = new Date(Date.now() - expirationMinutes * 60 * 1000);
      
      // Look for existing idempotency records
      const existingRecords = await universalApi.readTransactions({
        filters: {
          organization_id: organizationId,
          transaction_type: 'playbook_idempotency',
          'metadata.idempotency_key': key,
          'metadata.operation': operation,
          created_at: {
            $gte: expirationCutoff.toISOString()
          }
        }
      });
      
      if (existingRecords && existingRecords.length > 0) {
        const record = existingRecords[0];
        
        // Check if the operation completed successfully
        if (record.metadata?.status === 'completed') {
          return {
            isDuplicate: true,
            existingResult: record.metadata?.result,
            transactionId: record.id,
            createdAt: record.created_at
          };
        } else if (record.metadata?.status === 'in_progress') {
          // Check if it's been too long (stuck operation)
          const stuckThresholdMinutes = 5;
          const recordAge = Date.now() - new Date(record.created_at).getTime();
          
          if (recordAge > stuckThresholdMinutes * 60 * 1000) {
            // Mark as failed and allow retry
            await this.markOperationFailed(record.id, 'Operation timeout');
            return { isDuplicate: false };
          } else {
            // Still in progress, treat as duplicate
            return {
              isDuplicate: true,
              transactionId: record.id,
              createdAt: record.created_at
            };
          }
        }
        // If failed, allow retry
      }
      
      return { isDuplicate: false };
      
    } catch (error) {
      console.error('Idempotency check failed:', error);
      // On error, allow operation to proceed but log
      await this.logIdempotencyError(check, error);
      return { isDuplicate: false };
    }
  }
  
  /**
   * Record a new idempotent operation
   */
  async recordOperation(
    key: string,
    operation: string,
    organizationId: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<string> {
    try {
      const record = await universalApi.createTransaction({
        transaction_type: 'playbook_idempotency',
        organization_id: organizationId,
        smart_code: PlaybookSmartCodes.IDEMPOTENCY.RECORD,
        total_amount: 0,
        metadata: {
          idempotency_key: key,
          operation,
          user_id: userId,
          status: 'in_progress',
          ...metadata,
          recorded_at: new Date().toISOString()
        }
      });
      
      return record.id;
      
    } catch (error) {
      console.error('Failed to record idempotent operation:', error);
      throw error;
    }
  }
  
  /**
   * Mark an operation as completed with result
   */
  async markOperationCompleted(
    recordId: string,
    result: any
  ): Promise<void> {
    try {
      await universalApi.updateTransaction(recordId, {
        metadata: {
          status: 'completed',
          result,
          completed_at: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Failed to mark operation completed:', error);
      throw error;
    }
  }
  
  /**
   * Mark an operation as failed
   */
  async markOperationFailed(
    recordId: string,
    error: any
  ): Promise<void> {
    try {
      await universalApi.updateTransaction(recordId, {
        metadata: {
          status: 'failed',
          error: typeof error === 'string' ? error : error.message,
          error_details: error.stack || error,
          failed_at: new Date().toISOString()
        }
      });
    } catch (updateError) {
      console.error('Failed to mark operation failed:', updateError);
    }
  }
  
  /**
   * Generate idempotency key for playbook operations
   */
  generateKey(components: {
    operation: string;
    playbookId?: string;
    runId?: string;
    stepId?: string;
    userId?: string;
    timestamp?: string;
  }): string {
    const parts = [
      components.operation,
      components.playbookId || '',
      components.runId || '',
      components.stepId || '',
      components.userId || '',
      components.timestamp || ''
    ].filter(p => p !== '');
    
    // Create a deterministic key from components
    return parts.join(':');
  }
  
  /**
   * Validate idempotency key format
   */
  validateKey(key: string): boolean {
    // Key should be non-empty and reasonable length
    if (!key || key.length < 5 || key.length > 256) {
      return false;
    }
    
    // Should not contain problematic characters
    const validPattern = /^[a-zA-Z0-9:_\-\.]+$/;
    return validPattern.test(key);
  }
  
  /**
   * Clean up expired idempotency records
   */
  async cleanupExpiredRecords(
    organizationId: string,
    expirationDays: number = 7
  ): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - expirationDays * 24 * 60 * 60 * 1000);
      
      // Find expired records
      const expiredRecords = await universalApi.readTransactions({
        filters: {
          organization_id: organizationId,
          transaction_type: 'playbook_idempotency',
          created_at: {
            $lt: cutoffDate.toISOString()
          }
        }
      });
      
      if (!expiredRecords || expiredRecords.length === 0) {
        return 0;
      }
      
      // Mark them as expired (don't delete, keep for audit)
      let cleanedCount = 0;
      for (const record of expiredRecords) {
        if (record.metadata?.status !== 'expired') {
          await universalApi.updateTransaction(record.id, {
            metadata: {
              ...record.metadata,
              status: 'expired',
              expired_at: new Date().toISOString()
            }
          });
          cleanedCount++;
        }
      }
      
      // Log cleanup operation
      await universalApi.createTransaction({
        transaction_type: 'playbook_idempotency_cleanup',
        organization_id: organizationId,
        smart_code: PlaybookSmartCodes.IDEMPOTENCY.CLEANUP,
        total_amount: 0,
        metadata: {
          records_cleaned: cleanedCount,
          cutoff_date: cutoffDate.toISOString(),
          timestamp: new Date().toISOString()
        }
      });
      
      return cleanedCount;
      
    } catch (error) {
      console.error('Failed to cleanup expired records:', error);
      return 0;
    }
  }
  
  /**
   * Get idempotency statistics for monitoring
   */
  async getIdempotencyStats(
    organizationId: string,
    days: number = 7
  ): Promise<{
    total_operations: number;
    duplicate_requests: number;
    duplicate_rate: number;
    operations_by_type: Record<string, number>;
    average_operation_time_ms: number;
  }> {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Get all idempotency records
      const records = await universalApi.readTransactions({
        filters: {
          organization_id: organizationId,
          transaction_type: 'playbook_idempotency',
          created_at: {
            $gte: cutoffDate.toISOString()
          }
        }
      });
      
      if (!records || records.length === 0) {
        return {
          total_operations: 0,
          duplicate_requests: 0,
          duplicate_rate: 0,
          operations_by_type: {},
          average_operation_time_ms: 0
        };
      }
      
      // Group by idempotency key to find duplicates
      const keyGroups = new Map<string, any[]>();
      records.forEach(record => {
        const key = record.metadata?.idempotency_key;
        if (key) {
          if (!keyGroups.has(key)) {
            keyGroups.set(key, []);
          }
          keyGroups.get(key)!.push(record);
        }
      });
      
      // Calculate statistics
      let totalDuplicates = 0;
      const operationCounts: Record<string, number> = {};
      const operationTimes: number[] = [];
      
      keyGroups.forEach((group, key) => {
        if (group.length > 1) {
          totalDuplicates += group.length - 1;
        }
        
        // Count by operation type
        group.forEach(record => {
          const operation = record.metadata?.operation || 'unknown';
          operationCounts[operation] = (operationCounts[operation] || 0) + 1;
          
          // Calculate operation time for completed operations
          if (record.metadata?.status === 'completed' && 
              record.metadata?.completed_at &&
              record.metadata?.recorded_at) {
            const duration = new Date(record.metadata.completed_at).getTime() - 
                           new Date(record.metadata.recorded_at).getTime();
            operationTimes.push(duration);
          }
        });
      });
      
      const avgOperationTime = operationTimes.length > 0 ?
        operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length : 0;
      
      return {
        total_operations: records.length,
        duplicate_requests: totalDuplicates,
        duplicate_rate: records.length > 0 ? (totalDuplicates / records.length) * 100 : 0,
        operations_by_type: operationCounts,
        average_operation_time_ms: avgOperationTime
      };
      
    } catch (error) {
      console.error('Failed to get idempotency stats:', error);
      return {
        total_operations: 0,
        duplicate_requests: 0,
        duplicate_rate: 0,
        operations_by_type: {},
        average_operation_time_ms: 0
      };
    }
  }
  
  /**
   * Log idempotency error
   */
  private async logIdempotencyError(check: IdempotencyCheck, error: any): Promise<void> {
    try {
      await universalApi.createTransaction({
        transaction_type: 'playbook_idempotency_error',
        organization_id: check.organizationId,
        smart_code: PlaybookSmartCodes.IDEMPOTENCY.ERROR,
        total_amount: 0,
        metadata: {
          idempotency_key: check.key,
          operation: check.operation,
          error_message: error.message || 'Unknown error',
          error_stack: error.stack,
          timestamp: new Date().toISOString()
        }
      });
    } catch (logError) {
      console.error('Failed to log idempotency error:', logError);
    }
  }
}

// Export singleton instance
export const playbookIdempotencyHandler = new PlaybookIdempotencyHandler();