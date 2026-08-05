import { TicketStatus } from '../types';

export interface QueuedValidation {
  id: string;
  timestamp: string;
  ticketId: string;
  eventId: string;
  attendeeName: string;
  ticketTier: string;
  actionType: 'check_in' | 'check_out' | 'status_change';
  newStatus: TicketStatus;
  previousStatus: TicketStatus;
  gateName: string;
  staffName: string;
  notes?: string;
}

const OFFLINE_QUEUE_KEY = 'buymesho_validator_offline_queue';

export function getOfflineQueue(): QueuedValidation[] {
  try {
    const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to read offline queue from localStorage:', err);
  }
  return [];
}

export function saveOfflineQueue(queue: QueuedValidation[]): void {
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to save offline queue to localStorage:', err);
  }
}

export function enqueueValidation(
  item: Omit<QueuedValidation, 'id' | 'timestamp'>
): QueuedValidation {
  const queue = getOfflineQueue();
  const newItem: QueuedValidation = {
    ...item,
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
  queue.push(newItem);
  saveOfflineQueue(queue);

  // Attempt to trigger Background Sync API if supported
  requestBackgroundSync();

  return newItem;
}

export function removeFromOfflineQueue(id: string): void {
  const queue = getOfflineQueue();
  const updated = queue.filter((item) => item.id !== id);
  saveOfflineQueue(updated);
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (err) {
    console.error('Failed to clear offline queue:', err);
  }
}

export async function requestBackgroundSync(): Promise<boolean> {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-expect-error SyncManager interface standard
      await registration.sync.register('sync-ticket-validations');
      return true;
    } catch (err) {
      console.log('Background Sync registration fallback:', err);
    }
  }
  return false;
}

export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('ServiceWorker registered with scope: ', reg.scope);
        })
        .catch((err) => {
          console.warn('ServiceWorker registration failed: ', err);
        });
    });
  }
}
