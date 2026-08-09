export type SnapshotMeta = {
  id: string;
  eventId: string;
  version: string;
  syncedAt: string;
};

export type OfflineQueueStatus = "pending" | "sending" | "accepted" | "already_applied" | "rejected";

export type OfflineQueueItem = {
  queueId: string;
  ticketId: string;
  eventId: string;
  actionType: "check_in" | "check_out" | "status_change";
  previousStatus: string;
  newStatus: string;
  gateName: string;
  staffName: string;
  timestamp: string;
  clientSnapshotVersion: string;
  idempotencyKey: string;
  status: OfflineQueueStatus;
  serverResult?: string;
  conflictReason?: string;
};

export type StoredTicket = {
  id: string;
  eventId: string;
  qrPayload: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string;
  ticketTier: string;
  seatOrZone?: string;
  price: number;
  purchaseDate: string;
  status: string;
  lastCheckedInTime?: string;
  lastCheckedOutTime?: string;
  lastGateName?: string;
  lastStaffName?: string;
  notes?: string;
};

type StoredSession = {
  eventId: string;
  gateName: string;
  staffName: string;
  startedAt: string;
};

type StoredEvent = {
  id: string;
  name: string;
  organizerId: string;
  organizerName: string;
  date: string;
  venue: string;
  city: string;
  bannerImage: string;
  state: "Upcoming" | "Live" | "Ended";
  totalTicketsSold: number;
  checkedInCount: number;
  category: string;
  gates: string[];
  version: string;
};

const DB_NAME = "buymesho-validator-offline";
const DB_VERSION = 1;

type DBSchema = {
  snapshots: SnapshotMeta;
  events: StoredEvent;
  tickets: StoredTicket;
  queue: OfflineQueueItem;
  session: StoredSession;
  history: { id: string; ts: string; note: string };
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("snapshots")) {
        db.createObjectStore("snapshots", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("events")) {
        db.createObjectStore("events", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("tickets")) {
        db.createObjectStore("tickets", { keyPath: "id" });
        db.createIndex("eventId", "eventId", { unique: false });
      }
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "queueId" });
        db.createIndex("status", "status", { unique: false });
        db.createIndex("eventId", "eventId", { unique: false });
      }
      if (!db.objectStoreNames.contains("session")) {
        db.createObjectStore("session", { keyPath: "eventId" });
      }
      if (!db.objectStoreNames.contains("history")) {
        db.createObjectStore("history", { keyPath: "id" });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(
  storeName: keyof DBSchema,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(String(storeName), mode);
    const store = tx.objectStore(String(storeName));

    Promise.resolve(fn(store))
      .then((result) => {
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
      .catch(reject);
  });
}

function reqToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function putSnapshotMeta(meta: SnapshotMeta) {
  await withStore("snapshots", "readwrite", (store) => reqToPromise(store.put(meta)));
}

export async function getSnapshotMeta(eventId: string): Promise<SnapshotMeta | null> {
  return withStore("snapshots", "readonly", async (store) => (await reqToPromise(store.get(eventId))) ?? null);
}

export async function saveEvents(events: StoredEvent[]) {
  await withStore("events", "readwrite", async (store) => {
    for (const event of events) await reqToPromise(store.put(event));
  });
}

export async function getEvents(): Promise<StoredEvent[]> {
  return withStore("events", "readonly", async (store) => {
    const request = store.getAll();
    return (await reqToPromise(request)) as StoredEvent[];
  });
}

export async function saveTickets(tickets: StoredTicket[]) {
  await withStore("tickets", "readwrite", async (store) => {
    for (const ticket of tickets) await reqToPromise(store.put(ticket));
  });
}

export async function getTickets(eventId?: string): Promise<StoredTicket[]> {
  return withStore("tickets", "readonly", async (store) => {
    const all = (await reqToPromise(store.getAll())) as StoredTicket[];
    return eventId ? all.filter((ticket) => ticket.eventId === eventId) : all;
  });
}

export async function upsertTicket(ticket: StoredTicket) {
  await withStore("tickets", "readwrite", (store) => reqToPromise(store.put(ticket)));
}

export async function getTicket(ticketId: string) {
  return withStore("tickets", "readonly", async (store) => (await reqToPromise(store.get(ticketId))) ?? null);
}

export async function saveQueueItem(item: OfflineQueueItem) {
  await withStore("queue", "readwrite", (store) => reqToPromise(store.put(item)));
}

export async function getQueueItems(status?: OfflineQueueStatus) {
  return withStore("queue", "readonly", async (store) => {
    const all = (await reqToPromise(store.getAll())) as OfflineQueueItem[];
    return status ? all.filter((item) => item.status === status) : all.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  });
}

export async function replaceQueue(items: OfflineQueueItem[]) {
  await withStore("queue", "readwrite", async (store) => {
    await reqToPromise(store.clear());
    for (const item of items) await reqToPromise(store.put(item));
  });
}

export async function deleteQueueItem(queueId: string) {
  await withStore("queue", "readwrite", (store) => reqToPromise(store.delete(queueId)));
}

export async function clearQueue() {
  await withStore("queue", "readwrite", (store) => reqToPromise(store.clear()));
}

export async function saveSession(session: StoredSession | null) {
  await withStore("session", "readwrite", async (store) => {
    await reqToPromise(store.clear());
    if (session) await reqToPromise(store.put(session));
  });
}

export async function getSession(): Promise<StoredSession | null> {
  return withStore("session", "readonly", async (store) => (await reqToPromise(store.getAll()))[0] ?? null);
}

export async function addHistory(note: string) {
  const entry = { id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ts: new Date().toISOString(), note };
  await withStore("history", "readwrite", (store) => reqToPromise(store.put(entry)));
}

export async function getHistory() {
  return withStore("history", "readonly", async (store) => {
    const entries = (await reqToPromise(store.getAll())) as Array<{ id: string; ts: string; note: string }>;
    return entries.sort((a, b) => b.ts.localeCompare(a.ts));
  });
}

export async function clearAllOfflineData() {
  await Promise.all([clearQueue(), withStore("tickets", "readwrite", (s) => reqToPromise(s.clear())), withStore("events", "readwrite", (s) => reqToPromise(s.clear())), withStore("snapshots", "readwrite", (s) => reqToPromise(s.clear())), withStore("session", "readwrite", (s) => reqToPromise(s.clear())), withStore("history", "readwrite", (s) => reqToPromise(s.clear()))]);
}