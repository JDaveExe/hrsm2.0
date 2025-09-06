/**
 * Real-time synchronization service for patient queue and checkups
 * Optimized for performance and reliability
 */

class SyncService {
  constructor() {
    this.syncInProgress = false;
    this.lastSyncTime = 0;
    this.syncQueue = [];
    this.eventListeners = new Map();
    this.retryCount = 0;
    this.maxRetries = 3;
    this.syncInterval = 30000; // 30 seconds
    this.debounceTime = 1000; // 1 second
  }

  // Initialize the sync service
  init() {
    this.setupVisibilityChangeHandler();
    this.setupBeforeUnloadHandler();
    console.log('🔄 SyncService initialized');
  }

  // Setup visibility change handler for efficient resource usage
  setupVisibilityChangeHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // Sync immediately when tab becomes visible
        this.syncAll();
      }
    });
  }

  // Setup beforeunload handler to cleanup
  setupBeforeUnloadHandler() {
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  // Add event listener for sync events
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  // Remove event listener
  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Emit events to listeners
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Check if sync is needed (debounced)
  shouldSync() {
    const now = Date.now();
    return !this.syncInProgress && (now - this.lastSyncTime) > this.debounceTime;
  }

  // Sync all data (queue and checkups)
  async syncAll() {
    if (!this.shouldSync()) {
      return { success: false, reason: 'Sync not needed or in progress' };
    }

    this.syncInProgress = true;
    const syncStartTime = Date.now();

    try {
      console.log('🔄 Starting real-time sync...');
      
      const [queueResult, checkupsResult] = await Promise.allSettled([
        this.syncDoctorQueue(),
        this.syncTodaysCheckups()
      ]);

      const results = {
        queue: queueResult.status === 'fulfilled' ? queueResult.value : { error: queueResult.reason },
        checkups: checkupsResult.status === 'fulfilled' ? checkupsResult.value : { error: checkupsResult.reason }
      };

      this.lastSyncTime = Date.now();
      this.retryCount = 0; // Reset retry count on successful sync

      const syncDuration = this.lastSyncTime - syncStartTime;
      console.log(`✅ Sync completed in ${syncDuration}ms`);

      this.emit('syncComplete', { results, duration: syncDuration });

      return { success: true, results, duration: syncDuration };
    } catch (error) {
      console.error('❌ Sync failed:', error);
      this.handleSyncError(error);
      return { success: false, error: error.message };
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync doctor queue data
  async syncDoctorQueue() {
    try {
      const response = await fetch('/api/doctor/queue', {
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Queue sync failed: ${response.status} ${response.statusText}`);
      }

      const queueData = await response.json();
      this.emit('queueUpdated', queueData);
      return { success: true, data: queueData };
    } catch (error) {
      console.error('Error syncing doctor queue:', error);
      throw error;
    }
  }

  // Sync today's checkups data
  async syncTodaysCheckups() {
    try {
      const response = await fetch('/api/checkups/today', {
        headers: {
          'Authorization': `Bearer ${window.__authToken}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`Checkups sync failed: ${response.status} ${response.statusText}`);
      }

      const checkupsData = await response.json();
      this.emit('checkupsUpdated', checkupsData);
      return { success: true, data: checkupsData };
    } catch (error) {
      console.error('Error syncing today\'s checkups:', error);
      throw error;
    }
  }

  // Handle sync errors with retry logic
  handleSyncError(error) {
    this.retryCount++;
    
    if (this.retryCount <= this.maxRetries) {
      const retryDelay = Math.min(1000 * Math.pow(2, this.retryCount), 30000); // Exponential backoff
      console.log(`🔄 Retrying sync in ${retryDelay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
      
      setTimeout(() => {
        this.syncAll();
      }, retryDelay);
    } else {
      console.error('❌ Max retries reached, sync failed permanently');
      this.emit('syncFailed', { error, retryCount: this.retryCount });
      this.retryCount = 0; // Reset for next sync cycle
    }
  }

  // Queue an operation for batch processing
  queueOperation(operation) {
    this.syncQueue.push({
      ...operation,
      timestamp: Date.now()
    });

    // Process queue with debouncing
    this.debounceProcessQueue();
  }

  // Debounced queue processing
  debounceProcessQueue() {
    clearTimeout(this.processQueueTimeout);
    this.processQueueTimeout = setTimeout(() => {
      this.processQueue();
    }, this.debounceTime);
  }

  // Process queued operations
  async processQueue() {
    if (this.syncQueue.length === 0) return;

    const operations = [...this.syncQueue];
    this.syncQueue = [];

    console.log(`🔄 Processing ${operations.length} queued operations`);

    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
      } catch (error) {
        console.error('Error executing queued operation:', error);
        // Re-queue failed operations for retry
        this.syncQueue.push(operation);
      }
    }
  }

  // Execute a single operation
  async executeOperation(operation) {
    const { type, data, endpoint, method = 'POST' } = operation;

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Authorization': `Bearer ${window.__authToken}`,
        'Content-Type': 'application/json'
      },
      body: method !== 'GET' ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Operation ${type} failed: ${response.status}`);
    }

    const result = await response.json();
    this.emit('operationComplete', { type, result });
    return result;
  }

  // Get sync statistics
  getStats() {
    return {
      lastSyncTime: this.lastSyncTime,
      syncInProgress: this.syncInProgress,
      queueLength: this.syncQueue.length,
      retryCount: this.retryCount,
      listenerCount: Array.from(this.eventListeners.values()).reduce((total, listeners) => total + listeners.length, 0)
    };
  }

  // Cleanup resources
  cleanup() {
    clearTimeout(this.processQueueTimeout);
    this.eventListeners.clear();
    this.syncQueue = [];
    this.syncInProgress = false;
    console.log('🔄 SyncService cleaned up');
  }
}

// Create singleton instance
const syncService = new SyncService();

export default syncService;
