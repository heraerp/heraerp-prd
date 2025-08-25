/**
 * Idempotency management for HERA SDK
 * Framework-agnostic with memory and localStorage adapters
 */

export interface IdempotencyConfig {
  storage?: 'memory' | 'local';
  prefix?: string;
}

export const DEFAULT_IDEMPOTENCY_CONFIG: IdempotencyConfig = {
  storage: 'memory',
  prefix: 'hera:extref:',
};

/**
 * Storage adapter interface
 */
export interface IdempotencyStorage {
  set(key: string, value: string): void;
  get(key: string): string | null;
  delete(key: string): void;
  clear(): void;
}

/**
 * In-memory storage adapter
 */
export class MemoryStorage implements IdempotencyStorage {
  private store = new Map<string, string>();

  set(key: string, value: string): void {
    this.store.set(key, value);
  }

  get(key: string): string | null {
    return this.store.get(key) || null;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * LocalStorage adapter (browser-safe)
 */
export class LocalStorageAdapter implements IdempotencyStorage {
  constructor(private prefix: string) {}

  set(key: string, value: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.prefix + key, value);
    }
  }

  get(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.prefix + key);
    }
    return null;
  }

  delete(key: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.prefix + key);
    }
  }

  clear(): void {
    if (typeof localStorage !== 'undefined') {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(this.prefix)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  }
}

/**
 * Generate external reference using crypto API
 * Creates a UUID v4 format string
 */
export function makeExternalRef(input?: {
  namespace?: string;
  seed?: string;
}): string {
  // Use crypto API if available (browser/Node 15+/Deno)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    const uuid = crypto.randomUUID();
    if (input?.namespace) {
      return `${input.namespace}:${uuid}`;
    }
    return uuid;
  }

  // Fallback to manual UUID v4 generation
  const bytes = new Uint8Array(16);
  
  // Use crypto.getRandomValues if available
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Last resort: Math.random (not cryptographically secure)
    for (let i = 0; i < 16; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  // Set version (4) and variant bits
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // Format as UUID string
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  const uuid = [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');

  if (input?.namespace) {
    return `${input.namespace}:${uuid}`;
  }
  return uuid;
}

/**
 * Idempotency manager
 */
export class IdempotencyManager {
  private storage: IdempotencyStorage;

  constructor(config: IdempotencyConfig = DEFAULT_IDEMPOTENCY_CONFIG) {
    if (config.storage === 'local') {
      this.storage = new LocalStorageAdapter(config.prefix || DEFAULT_IDEMPOTENCY_CONFIG.prefix!);
    } else {
      this.storage = new MemoryStorage();
    }
  }

  /**
   * Remember a transaction ID for an external reference
   */
  remember(ref: string, txnId: string): void {
    this.storage.set(ref, txnId);
  }

  /**
   * Recall a transaction ID for an external reference
   */
  recall(ref: string): string | null {
    return this.storage.get(ref);
  }

  /**
   * Forget a transaction ID for an external reference
   */
  forget(ref: string): void {
    this.storage.delete(ref);
  }

  /**
   * Clear all stored references
   */
  clearAll(): void {
    this.storage.clear();
  }

  /**
   * Generate a new external reference
   */
  generateRef(namespace?: string): string {
    return makeExternalRef({ namespace });
  }

  /**
   * Check if a reference exists and optionally remember new transaction
   */
  checkAndSet(ref: string, txnId: string): { exists: boolean; existingTxnId?: string } {
    const existing = this.recall(ref);
    if (existing) {
      return { exists: true, existingTxnId: existing };
    }
    this.remember(ref, txnId);
    return { exists: false };
  }
}

/**
 * Global singleton instance (optional convenience)
 */
let globalManager: IdempotencyManager | null = null;

export function getGlobalIdempotencyManager(): IdempotencyManager {
  if (!globalManager) {
    globalManager = new IdempotencyManager();
  }
  return globalManager;
}

export function setGlobalIdempotencyManager(manager: IdempotencyManager): void {
  globalManager = manager;
}