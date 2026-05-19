/**
 * Local-first data layer for PigeonDB.
 *
 * - Reads/writes go to IndexedDB via Dexie. Works fully offline.
 * - Every mutation is mirrored into a `syncQueue` (outbox) so a future
 *   background worker can drain it against a remote API (Lovable Cloud).
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
  image?: string;
  /** Additional gallery images (max 4). The main `image` acts as profile picture. */
  images?: string[];
  notes?: string;
  wins?: number;
  races?: number;

  // Additional detail fields
  trailBand?: string;
  family?: string;
  lastOwner?: string;
  tags?: string;
  eyeColor?: string;
  legColor?: string;
  markings?: string;
  
  // Genetics fields
  baseColor?: string;
  carriedColor?: string;
  patterns?: string;
  carriedPatterns?: string;
  spread?: string;
  dilute?: string;
  grizzle?: string;
  recessiveRed?: string;

  createdAt: number;
  updatedAt: number;
}

export interface Pair {
  id: string;
  cockId?: string;
  henId?: string;
  seasonId: string; // Reference to Season.id
  nestBox?: string;
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
  status: "active" | "separated" | "resting";
  /** Optional recommendation/notes about expected offspring. */
  breedingRecommendation?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Season {
  id: string;
  year: string;
  name: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Race {
  id: string;
  name: string;
  type?: string; // Race Type
  date: string; // ISO yyyy-mm-dd
  clubName?: string;
  clubNumber?: string;
  clubLocation?: string;
  combineName?: string;
  stationId?: string;
  releasePointName?: string;
  releasePointLat?: number;
  releasePointLng?: number;
  teamId?: string;
  destPointName?: string;
  destPointLat?: number;
  destPointLng?: number;
  pigeonIds?: string[]; // Individual pigeons entered
  distanceKm?: number;
  distanceMiles?: number;
  totalBirds?: number;
  totalLofts?: number;
  liberationTime?: string;
  releaseTemp?: string;
  releaseWeather?: string;
  releaseOther?: string;
  destTemp?: string;
  destWeather?: string;
  destOther?: string;
  archived?: boolean;
  notes?: string;
  results?: { pigeonId: string; arrivalTime?: string; position?: number; speed?: number }[];
  createdAt: number;
  updatedAt: number;
}

export interface Team {
  id: string;
  name: string;
  pigeonIds: string[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Contact {
  id: string;
  name: string;
  country?: string;
  email?: string;
  phone?: string;
  loft?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Station {
  id: string;
  name: string;
  country?: string;
  lat?: number;
  lng?: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Loft {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
  capacity?: number;
  notes?: string;
  isPrimary?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Medication {
  id: string;
  date: string;
  name: string;
  reason?: string;
  dose?: string;
  pigeonIds?: string[]; // empty = all loft
  withdrawalDays?: number;
  createdAt: number;
  updatedAt: number;
}

export type CommentTarget = "pigeon" | "pair" | "team";
export interface Comment {
  id: string;
  target: CommentTarget;
  targetId: string;
  author: string;
  text: string;
  date: string;
  createdAt: number;
  updatedAt: number;
}

export interface BandCollection {
  id: string;
  countryPrefix: string;
  year: string;
  fromNumber: number;
  toNumber: number;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type AutocompleteCategory =
  | "color"
  | "status"
  | "marking"
  | "family"
  | "loft"
  | "breeder"
  | "tag";
export interface AutocompleteValue {
  id: string;
  category: AutocompleteCategory;
  value: string;
  createdAt: number;
  updatedAt: number;
}

export interface SavedFilter {
  id: string;
  name: string;
  module: "pigeons" | "races" | "pairs";
  query: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface SettingEntry {
  key: string;
  value: any;
  updatedAt: number;
}

export type SyncOp = "create" | "update" | "delete";
export type SyncEntity =
  | "pigeon" | "pair" | "season" | "race" | "team" | "contact"
  | "station" | "loft" | "journal" | "medication" | "comment"
  | "band" | "autocomplete" | "filter" | "setting";

export interface SyncQueueItem {
  id?: number;
  entity: SyncEntity;
  op: SyncOp;
  payload: any;
  createdAt: number;
  syncedAt?: number;
}

// Helper to get the current user ID for DB naming
const getCurrentUserId = () => {
  const mock = localStorage.getItem("pigeondb_mock_user");
  if (mock) return JSON.parse(mock).id;
  // This is a simple way to get the session from localStorage if not using the hook
  const sbKey = Object.keys(localStorage).find(k => k.includes("-auth-token"));
  if (sbKey) {
    const session = JSON.parse(localStorage.getItem(sbKey) || "{}");
    return session?.user?.id;
  }
  return "public"; // Fallback
};

class PigeonDexie extends Dexie {
  pigeons!: Table<Pigeon, string>;
  pairs!: Table<Pair, string>;
  seasons!: Table<Season, string>;
  races!: Table<Race, string>;
  teams!: Table<Team, string>;
  contacts!: Table<Contact, string>;
  stations!: Table<Station, string>;
  lofts!: Table<Loft, string>;
  journal!: Table<JournalEntry, string>;
  medications!: Table<Medication, string>;
  comments!: Table<Comment, string>;
  bands!: Table<BandCollection, string>;
  autocomplete!: Table<AutocompleteValue, string>;
  filters!: Table<SavedFilter, string>;
  settings!: Table<SettingEntry, string>;
  syncQueue!: Table<SyncQueueItem, number>;

  constructor(userId: string) {
    super(`pigeondb_${userId}`);
    this.version(3).stores({
      pigeons: "id, ringNumber, name, status, loft, bornYear, fatherId, motherId, updatedAt",
      pairs: "id, seasonId, cockId, henId, updatedAt",
      seasons: "id, year, updatedAt",
      races: "id, date, stationId, updatedAt",
      teams: "id, name, updatedAt",
      contacts: "id, name, country, updatedAt",
      stations: "id, name, country, updatedAt",
      lofts: "id, name, isPrimary, updatedAt",
      journal: "id, date, updatedAt",
      medications: "id, date, name, updatedAt",
      comments: "id, target, targetId, date, updatedAt",
      bands: "id, countryPrefix, year, updatedAt",
      autocomplete: "id, category, value, updatedAt",
      filters: "id, module, name, updatedAt",
      settings: "key, updatedAt",
      syncQueue: "++id, entity, op, syncedAt, createdAt",
    });
  }
}

export const db = new PigeonDexie(getCurrentUserId());

export const uid = () =>
  (crypto as any)?.randomUUID?.() ??
  "p-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

export async function enqueueSync(item: Omit<SyncQueueItem, "id" | "createdAt" | "syncedAt">) {
  await db.syncQueue.add({ ...item, createdAt: Date.now() });
}

export async function pendingSyncCount(): Promise<number> {
  return db.syncQueue.filter((i) => !i.syncedAt).count();
}

/** Generic helper: save + enqueue. */
export async function saveAndSync<T extends { id: string; updatedAt: number }>(
  table: Table<T, string>,
  entity: SyncEntity,
  payload: T,
  isNew: boolean
) {
  payload.updatedAt = Date.now();
  await table.put(payload);
  await enqueueSync({ entity, op: isNew ? "create" : "update", payload });
}

export async function removeAndSync<T>(
  table: Table<T, string>,
  entity: SyncEntity,
  id: string
) {
  await table.delete(id);
  await enqueueSync({ entity, op: "delete", payload: { id } });
}

export async function seedIfEmpty() {
  const userId = getCurrentUserId();
  // Only seed if we are the mock admin or if it's the public view
  // This prevents new users (like User1) from getting the same demo data
  if (userId !== "mock-admin-id" && userId !== "public") {
    return;
  }

  const count = await db.pigeons.count();
  if (count === 0) {
    const { pigeons: seed } = await import("@/data/pigeons");
    const { 
      mockSeasons, mockPairs, mockRaces, mockTeams, 
      mockContacts, mockStations, mockLofts, mockJournal, 
      mockMedications, mockBands 
    } = await import("@/data/mockData");
    
    const now = Date.now();

    // Pigeons
    await db.pigeons.bulkAdd(
      seed.map((p) => ({
        ...p,
        createdAt: now,
        updatedAt: now,
      }))
    );

    // Other tables
    await db.seasons.bulkAdd(mockSeasons);
    await db.pairs.bulkAdd(mockPairs);
    await db.races.bulkAdd(mockRaces);
    await db.teams.bulkAdd(mockTeams);
    await db.contacts.bulkAdd(mockContacts);
    await db.stations.bulkAdd(mockStations);
    await db.lofts.bulkAdd(mockLofts);
    await db.journal.bulkAdd(mockJournal);
    await db.medications.bulkAdd(mockMedications);
    await db.bands.bulkAdd(mockBands);
  }

  // Seed default autocomplete values once.
  if ((await db.autocomplete.count()) === 0) {
    const now = Date.now();
    const seed: Omit<AutocompleteValue, "id">[] = [
      ...["Blue Bar", "Blue Check", "Checker", "White", "Slate", "Red Check", "Mealy", "Pied"].map(
        (v) => ({ category: "color" as const, value: v, createdAt: now, updatedAt: now })
      ),
      ...["Bar", "Spread", "Grizzle", "Pied", "Saddle"].map((v) => ({
        category: "marking" as const, value: v, createdAt: now, updatedAt: now,
      })),
      ...["Janssen", "Van der Berg", "Garcia", "Klein Dirk"].map((v) => ({
        category: "family" as const, value: v, createdAt: now, updatedAt: now,
      })),
      ...["Main Loft", "Breeding Loft", "Race Loft", "Young Birds"].map((v) => ({
        category: "loft" as const, value: v, createdAt: now, updatedAt: now,
      })),
    ];
    await db.autocomplete.bulkAdd(seed.map((s) => ({ ...s, id: uid() })));
  }
}
