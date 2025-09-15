// Restaurant POS Offline Service
// Manages offline operations with IndexedDB and sync queue

interface OfflineTransaction {
  id: string
  type: 'order' | 'payment' | 'inventory' | 'timeclock'
  data: any
  timestamp: Date
  synced: boolean
  retryCount: number
}

class RestaurantOfflineService {
  private db: IDBDatabase | null = null
  private readonly DB_NAME = 'restaurant_pos_offline'
  private readonly DB_VERSION = 1
  private readonly STORES = {
    transactions: 'transactions',
    menu: 'menu',
    tables: 'tables',
    staff: 'staff',
    inventory: 'inventory'
  }

  constructor() {
    this.initializeDB()
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open IndexedDB')
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('IndexedDB initialized successfully')
        resolve()
      }

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(this.STORES.transactions)) {
          const transactionStore = db.createObjectStore(this.STORES.transactions, {
            keyPath: 'id'
          })
          transactionStore.createIndex('synced', 'synced', { unique: false })
          transactionStore.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains(this.STORES.menu)) {
          db.createObjectStore(this.STORES.menu, { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains(this.STORES.tables)) {
          db.createObjectStore(this.STORES.tables, { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains(this.STORES.staff)) {
          db.createObjectStore(this.STORES.staff, { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains(this.STORES.inventory)) {
          db.createObjectStore(this.STORES.inventory, { keyPath: 'id' })
        }
      }
    })
  }

  // Queue transaction for later sync
  async queueTransaction(type: OfflineTransaction['type'], data: any): Promise<string> {
    const transaction: OfflineTransaction = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      timestamp: new Date(),
      synced: false,
      retryCount: 0
    }

    await this.saveToStore(this.STORES.transactions, transaction)

    // Try to sync immediately if online
    if (navigator.onLine) {
      this.syncTransaction(transaction.id)
    }

    return transaction.id
  }

  // Save data to IndexedDB store
  private async saveToStore(storeName: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Get data from IndexedDB store
  async getFromStore(storeName: string, key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Get all unsynced transactions
  async getUnsyncedTransactions(): Promise<OfflineTransaction[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.STORES.transactions], 'readonly')
      const store = transaction.objectStore(this.STORES.transactions)
      const index = store.index('synced')
      const request = index.getAll(false)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Sync single transaction
  async syncTransaction(transactionId: string): Promise<boolean> {
    try {
      const transaction = await this.getFromStore(this.STORES.transactions, transactionId)
      if (!transaction || transaction.synced) return true

      // Call appropriate API based on transaction type
      const response = await this.sendToServer(transaction)

      if (response.success) {
        // Mark as synced
        transaction.synced = true
        await this.saveToStore(this.STORES.transactions, transaction)
        return true
      } else {
        // Increment retry count
        transaction.retryCount++
        await this.saveToStore(this.STORES.transactions, transaction)
        return false
      }
    } catch (error) {
      console.error('Failed to sync transaction:', error)
      return false
    }
  }

  // Send transaction to server
  private async sendToServer(transaction: OfflineTransaction): Promise<any> {
    const endpoint = this.getEndpointForType(transaction.type)

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Offline-Transaction': transaction.id
        },
        body: JSON.stringify({
          ...transaction.data,
          offline_id: transaction.id,
          offline_timestamp: transaction.timestamp
        })
      })

      return await response.json()
    } catch (error) {
      console.error('Network error:', error)
      return { success: false, error: 'Network error' }
    }
  }

  // Get API endpoint for transaction type
  private getEndpointForType(type: OfflineTransaction['type']): string {
    const endpoints = {
      order: '/api/v1/restaurant/orders',
      payment: '/api/v1/restaurant/payments',
      inventory: '/api/v1/restaurant/inventory',
      timeclock: '/api/v1/restaurant/timeclock'
    }
    return endpoints[type]
  }

  // Sync all pending transactions
  async syncAll(): Promise<{ successful: number; failed: number }> {
    const unsynced = await this.getUnsyncedTransactions()
    let successful = 0
    let failed = 0

    // Sort by timestamp to maintain order
    unsynced.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    for (const transaction of unsynced) {
      const success = await this.syncTransaction(transaction.id)
      if (success) {
        successful++
      } else {
        failed++
      }
    }

    return { successful, failed }
  }

  // Cache menu data for offline use
  async cacheMenuData(menuData: any): Promise<void> {
    const items = Array.isArray(menuData) ? menuData : [menuData]

    for (const item of items) {
      await this.saveToStore(this.STORES.menu, item)
    }
  }

  // Get cached menu data
  async getCachedMenu(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.STORES.menu], 'readonly')
      const store = transaction.objectStore(this.STORES.menu)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  // Process offline order
  async createOfflineOrder(orderData: any): Promise<string> {
    // Assign offline ID
    const offlineOrderId = `offline_order_${Date.now()}`

    const order = {
      ...orderData,
      id: offlineOrderId,
      offline: true,
      created_at: new Date().toISOString()
    }

    // Queue for sync
    await this.queueTransaction('order', order)

    return offlineOrderId
  }

  // Process offline payment
  async processOfflinePayment(paymentData: any): Promise<string> {
    const offlinePaymentId = `offline_payment_${Date.now()}`

    const payment = {
      ...paymentData,
      id: offlinePaymentId,
      offline: true,
      processed_at: new Date().toISOString()
    }

    // Queue for sync
    await this.queueTransaction('payment', payment)

    return offlinePaymentId
  }

  // Clear synced transactions older than 7 days
  async cleanupOldTransactions(): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 7)

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.STORES.transactions], 'readwrite')
      const store = transaction.objectStore(this.STORES.transactions)
      const index = store.index('timestamp')
      const range = IDBKeyRange.upperBound(cutoffDate)
      const request = index.openCursor(range)

      request.onsuccess = event => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (cursor.value.synced) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => reject(request.error)
    })
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    pending: number
    synced: number
    failed: number
    oldestPending: Date | null
  }> {
    const transactions = await this.getUnsyncedTransactions()
    const allTransactions = await this.getAllTransactions()

    const pending = transactions.length
    const synced = allTransactions.filter(t => t.synced).length
    const failed = transactions.filter(t => t.retryCount > 3).length
    const oldestPending =
      transactions.length > 0
        ? new Date(Math.min(...transactions.map(t => t.timestamp.getTime())))
        : null

    return { pending, synced, failed, oldestPending }
  }

  // Get all transactions
  private async getAllTransactions(): Promise<OfflineTransaction[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'))
        return
      }

      const transaction = this.db.transaction([this.STORES.transactions], 'readonly')
      const store = transaction.objectStore(this.STORES.transactions)
      const request = store.getAll()

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }
}

// Export singleton instance
export const offlineService = new RestaurantOfflineService()

// Auto-sync when coming online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Network restored, syncing offline transactions...')
    offlineService.syncAll().then(result => {
      console.log(`Sync complete: ${result.successful} successful, ${result.failed} failed`)
    })
  })

  // Periodic sync attempt every 5 minutes
  setInterval(
    () => {
      if (navigator.onLine) {
        offlineService.syncAll()
      }
    },
    5 * 60 * 1000
  )

  // Cleanup old transactions daily
  setInterval(
    () => {
      offlineService.cleanupOldTransactions()
    },
    24 * 60 * 60 * 1000
  )
}
