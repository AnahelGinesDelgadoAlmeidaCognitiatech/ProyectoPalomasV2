/**
 * Local-first data layer for PigeonDB.
 *
 * Strategy:
 *  - All app reads/writes go to IndexedDB via Dexie. The UI works fully offline.
 *  - Every mutation is also pushed to a `syncQueue` table (outbox pattern).
 *  - When/if a remote backend is connected (Lovable Cloud), a background worker
 *    can drain the queue and POST each operation, then mark it as synced.
 *
 * This keeps the mobile/offline use case as the default while making the
 * future server sync trivial: just implement `flushSyncQueue` against your API.
 */
import Dexie, { type Table } from "dexie";

export type Sex = "cock" | "hen";
export type Status = "breeder" | "racer" | "young" | "lost";

export interface Pigeon {
  id: string;
  ringNumber: string;
  name: string;
  sex: Sex;
  color: string;
  bornYear?: number;
  status: Status;
  loft: string;
  breeder: string;
  fatherId?: string;
  motherId?: string;
  image?: string; // data URL or remote URL
  notes?: string;
  wins?: number;
  races?: number;
  createdAt: number;
  updatedAt: number;
}

export type SyncOp = "create" | "update" | "delete";
export type SyncEntity = "pigeon" | "pair" | "race" | "journal" | "team" | "contact";

export interface SyncQueueItem {
  id?: number;
  entity: SyncEntity;
  op: SyncOp;
  payload: any;
  createdAt: number;
  syncedAt?: number;
}

class PigeonDexie extends Dexie {
  pigeons!: Table<Pigeon, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor() {
    super("pigeondb");
    this.version(1).stores({
      pigeons: "id, ringNumber, name, status, loft, bornYear, fatherId, motherId, updatedAt",
      syncQueue: "++id, entity, op, syncedAt, createdAt",
    });
  }
}

export const db = new PigeonDexie();

export const uid = () =>
  (crypto as any)?.randomUUID?.() ??
  "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

/** Push a mutation to the outbox. A future worker can drain this against an API. */
export async function enqueueSync(item: Omit<SyncQueueItem, "id" | "createdAt" | "syncedAt">) {
  await db.syncQueue.add({ ...item, createdAt: Date.now() });
}

/** Pending (un-synced) outbox items — useful for a "X pending changes" badge. */
export async function pendingSyncCount(): Promise<number> {
  return db.syncQueue.where("syncedAt").equals(0 as any).count().catch(() => 0).then((n) => {
    if (n) return n;
    // Dexie can't index undefined; we filter:
    return db.syncQueue.filter((i) => !i.syncedAt).count();
  });
}

/** Seed the local DB with the existing demo data on first run. */
export async function seedIfEmpty() {
  const count = await db.pigeons.count();
  if (count > 0) return;
  const { pigeons: seed } = await import("@/data/pigeons");
  const now = Date.now();
  await db.pigeons.bulkAdd(
    seed.map((p) => ({
      id: p.id,
      ringNumber: p.ringNumber,
      name: p.name,
      sex: p.sex,
      color: p.color,
      bornYear: p.bornYear,
      status: p.status,
      loft: p.loft,
      breeder: p.breeder,
      fatherId: p.fatherId,
      motherId: p.motherId,
      image: p.image,
      notes: p.notes,
      wins: p.wins,
      races: p.races,
      createdAt: now,
      updatedAt: now,
    }))
  );
}
