import { QueuedOfflineAction, OfflineActionType, OfflineSyncState } from '../types';
import { storageService } from './storageService';
import { notificationService } from './notificationService';
import { firestoreService } from './firestoreService';

const STORAGE_KEYS = {
  OFFLINE_QUEUE: 'liencolis_offline_actions_queue',
  FORCED_OFFLINE: 'liencolis_forced_offline_mode',
  LAST_SYNC: 'liencolis_last_sync_timestamp',
};

type OfflineStateListener = (state: OfflineSyncState) => void;

class OfflineSyncService {
  private listeners: Set<OfflineStateListener> = new Set();
  private isOnlineStatus: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isForcedOfflineStatus: boolean = false;
  private lastOnlineAt: string | null = new Date().toISOString();
  private isSyncing: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    try {
      this.isForcedOfflineStatus = localStorage.getItem(STORAGE_KEYS.FORCED_OFFLINE) === 'true';
    } catch {
      this.isForcedOfflineStatus = false;
    }

    window.addEventListener('online', () => {
      this.isOnlineStatus = true;
      this.lastOnlineAt = new Date().toISOString();
      this.notifyListeners();
      
      // Auto-trigger sync on reconnect if not forced offline
      if (!this.isForcedOfflineStatus) {
        this.syncQueuedActions();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnlineStatus = false;
      this.notifyListeners();
    });
  }

  public isEffectiveOnline(): boolean {
    if (this.isForcedOfflineStatus) return false;
    return this.isOnlineStatus;
  }

  public getQueue(): QueuedOfflineAction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: QueuedOfflineAction[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    } catch (err) {
      console.error('Error saving offline queue:', err);
    }
  }

  public getState(): OfflineSyncState {
    const queue = this.getQueue();
    const pending = queue.filter((item) => item.status === 'pending');
    let lastSync: string | null = null;
    try {
      lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
    } catch {}

    return {
      isOnline: this.isEffectiveOnline(),
      isForcedOffline: this.isForcedOfflineStatus,
      lastOnlineAt: this.lastOnlineAt,
      lastSyncAt: lastSync,
      pendingActionsCount: pending.length,
      queuedActions: queue,
    };
  }

  public setForcedOffline(forced: boolean): void {
    this.isForcedOfflineStatus = forced;
    try {
      localStorage.setItem(STORAGE_KEYS.FORCED_OFFLINE, forced ? 'true' : 'false');
    } catch {}

    this.notifyListeners();

    if (!forced && this.isOnlineStatus) {
      this.syncQueuedActions();
    }
  }

  public queueAction(type: OfflineActionType, title: string, payload: any): QueuedOfflineAction {
    const action: QueuedOfflineAction = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      title,
      payload,
      timestamp: new Date().toISOString(),
      status: this.isEffectiveOnline() ? 'synced' : 'pending',
      retryCount: 0,
    };

    const currentQueue = this.getQueue();
    currentQueue.unshift(action);
    // Keep max 100 historical items
    this.saveQueue(currentQueue.slice(0, 100));
    this.notifyListeners();

    // If online, apply immediately
    if (this.isEffectiveOnline()) {
      this.executeActionDirectly(action);
    }

    return action;
  }

  private executeActionDirectly(action: QueuedOfflineAction) {
    // Action is processed into the corresponding local database and Firestore cloud
    switch (action.type) {
      case 'delivery_status_update':
        if (action.payload?.deliveryId && action.payload?.status) {
          const deliveries = storageService.getDeliveries();
          const target = deliveries.find((d) => d.id === action.payload.deliveryId);
          if (target) {
            target.status = action.payload.status;
            if (action.payload.status === 'delivered') {
              target.deliveredAt = new Date().toISOString();
            }
            storageService.updateDelivery(target);
            if (this.isEffectiveOnline()) {
              firestoreService.saveDelivery(target);
            }
          }
        }
        break;
      case 'new_classified_ad':
        if (action.payload) {
          storageService.addAd(action.payload);
          if (this.isEffectiveOnline()) {
            firestoreService.saveClassifiedAd(action.payload);
          }
        }
        break;
      case 'chat_message_sent':
        if (action.payload) {
          storageService.addMessage(action.payload);
          if (this.isEffectiveOnline()) {
            firestoreService.saveMessage(action.payload);
          }
        }
        break;
      case 'aid_request_created':
        if (action.payload) {
          storageService.addAidRequest(action.payload);
          if (this.isEffectiveOnline()) {
            firestoreService.saveAidRequest(action.payload);
          }
        }
        break;
      default:
        break;
    }
  }

  public async syncQueuedActions(): Promise<{ syncedCount: number; errorsCount: number }> {
    if (this.isSyncing) return { syncedCount: 0, errorsCount: 0 };
    if (!this.isEffectiveOnline()) return { syncedCount: 0, errorsCount: 0 };

    this.isSyncing = true;
    const queue = this.getQueue();
    let syncedCount = 0;
    let errorsCount = 0;

    const updatedQueue = queue.map((action) => {
      if (action.status === 'pending') {
        try {
          this.executeActionDirectly(action);
          syncedCount++;
          return { ...action, status: 'synced' as const, retryCount: action.retryCount + 1 };
        } catch (err: any) {
          errorsCount++;
          return {
            ...action,
            status: 'failed' as const,
            retryCount: action.retryCount + 1,
            errorMessage: err?.message || 'Erreur de synchronisation réseau',
          };
        }
      }
      return action;
    });

    this.saveQueue(updatedQueue);
    const now = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
    } catch {}

    this.isSyncing = false;
    this.notifyListeners();

    if (syncedCount > 0) {
      notificationService.playNotificationSound();
    }

    return { syncedCount, errorsCount };
  }

  public clearSyncedActions(): void {
    const queue = this.getQueue();
    const remaining = queue.filter((action) => action.status !== 'synced');
    this.saveQueue(remaining);
    this.notifyListeners();
  }

  public subscribe(listener: OfflineStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Error notifying offline sync listener', err);
      }
    });
  }
}

export const offlineSyncService = new OfflineSyncService();
