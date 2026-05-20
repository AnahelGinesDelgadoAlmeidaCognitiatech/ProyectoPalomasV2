/**
 * syncWorker.ts
 * 
 * Drains the local Dexie syncQueue and sends each operation to Supabase.
 * Converts camelCase local fields to snake_case Supabase columns.
 * Adds user_id automatically from the authenticated session.
 */

import { supabase } from "@/integrations/supabase/client";
import { db, type SyncQueueItem } from "@/lib/db";

// ─── Table name mapping (SyncEntity → Supabase table) ─────────────────────
const TABLE_MAP: Record<string, string> = {
  pigeon:       "pigeons",
  pair:         "pairs",
  season:       "seasons",
  race:         "races",
  team:         "teams",
  contact:      "contacts",
  station:      "stations",
  loft:         "lofts",
  journal:      "journal",
  medication:   "medications",
  comment:      "comments",
  band:         "bands",
  autocomplete: "autocomplete",
  filter:       "filters",
  setting:      "settings",
};

// ─── camelCase → snake_case payload converters ─────────────────────────────

function toSnake(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const snakeKey = k.replace(/([A-Z])/g, "_$1").toLowerCase();
    out[snakeKey] = v;
  }
  return out;
}

/**
 * Strips local-only fields and converts timestamps (number ms → ISO string).
 * Also handles special cases per entity.
 */
function mapPayload(entity: string, raw: any, userId: string): Record<string, any> {
  // Remove Dexie-only internal fields
  const { updatedAt, createdAt, ...rest } = raw;

  let base = toSnake(rest);

  // Add user_id and timestamps in ISO format for Supabase
  base.user_id = userId;
  if (updatedAt) base.updated_at = new Date(updatedAt).toISOString();
  if (createdAt) base.created_at = new Date(createdAt).toISOString();

  // ── Entity-specific field fixes ──────────────────────────────────────────

  if (entity === "pigeon") {
      // loft field in code = UUID (loft_id in Supabase) or legacy name
      const loftVal = base.loft;
      if (loftVal && isUUID(loftVal)) {
        base.loft_id = loftVal;
      }
      delete base.loft; // Don't send text loft field — use loft_id

      // Rename genealogy fields
      if (base.father_id !== undefined) base.father_id = base.father_id || null;
      if (base.mother_id !== undefined) base.mother_id = base.mother_id || null;

      // Keep the main image URL and gallery images in sync.
      // Supabase `pigeons` has an `images` array column in the current schema.
    }
  if (entity === "pair") {
    // breedingRecommendation → breeding_recommendation (already handled by toSnake)
    // cock_id/hen_id can be null
    if (!base.cock_id) base.cock_id = null;
    if (!base.hen_id)  base.hen_id  = null;
    if (!base.season_id) base.season_id = null;
  }

  if (entity === "race") {
    base.station_id = isUUID(base.station_id) ? base.station_id : null;
    base.team_id    = isUUID(base.team_id)    ? base.team_id    : null;
  }

  if (entity === "comment") {
    // Local uses `target` and `text`, Supabase uses `target_type` and `content`
    base.target_type = base.target;
    base.content     = base.text;
    delete base.target;
    delete base.text;
  }

  if (entity === "journal") {
    // Supabase has `content` column; local uses `body`
    base.content = base.body;
    delete base.body;
  }

  if (entity === "setting") {
    // Settings use composite PK (key, user_id) — no id column
    delete base.id;
  }

  return base;
}

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// ─── Main sync function ────────────────────────────────────────────────────

let isSyncing = false;

export async function drainSyncQueue(): Promise<void> {
  if (isSyncing) return;

  // Only sync if authenticated
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;

  isSyncing = true;
  try {
    const pending: SyncQueueItem[] = await db.syncQueue
      .filter((i) => !i.syncedAt)
      .sortBy("createdAt");

    for (const item of pending) {
      const table = TABLE_MAP[item.entity];
      if (!table) {
        // Unknown entity — mark as synced to avoid loop
        await db.syncQueue.update(item.id!, { syncedAt: Date.now() });
        continue;
      }

      try {
        if (item.op === "delete") {
          const { error } = await (supabase as any)
            .from(table)
            .delete()
            .eq("id", item.payload.id)
            .eq("user_id", userId);

          if (error) throw error;

        } else {
          // create or update → upsert
          const payload = mapPayload(item.entity, item.payload, userId);

          const { error } = await (supabase as any)
            .from(table)
            .upsert(payload, { onConflict: "id" });

          if (error) throw error;
        }

        // Mark as synced
        await db.syncQueue.update(item.id!, { syncedAt: Date.now() });

      } catch (err: any) {
        // Log but don't crash — will retry next cycle
        console.warn(`[SyncWorker] Failed to sync ${item.entity}#${item.payload?.id}:`, err?.message ?? err);
      }
    }
  } finally {
    isSyncing = false;
  }
}

/**
 * Pulls data from Supabase for all entities and saves it to Dexie.
 * Call this on login to hydrate the local DB with cloud data.
 */
export async function pullFromSupabase(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;

  try {
    const now = Date.now();

    const pull = async (table: string, dexieTable: any, transform?: (row: any) => any) => {
      const { data, error } = await (supabase as any)
        .from(table)
        .select("*")
        .eq("user_id", userId);

      if (error) {
        console.warn(`[SyncWorker] Pull error for ${table}:`, error.message);
        return;
      }

      if (!data?.length) return;

      const rows = data.map((row: any) => {
        const mapped = snakeToCamel(row);
        mapped.createdAt = mapped.createdAt ? new Date(mapped.createdAt).getTime() : now;
        mapped.updatedAt = mapped.updatedAt ? new Date(mapped.updatedAt).getTime() : now;
        return transform ? transform(mapped) : mapped;
      });

      await dexieTable.bulkPut(rows);
    };

    await Promise.all([
      pull("pigeons",      db.pigeons,      (r) => ({ ...r, loft: r.loftId ?? r.loft ?? "" })),
      pull("lofts",        db.lofts),
      pull("pairs",        db.pairs,        (r) => ({ ...r, status: r.status ?? "active" })),
      pull("seasons",      db.seasons),
      pull("races",        db.races),
      pull("teams",        db.teams,        (r) => ({ ...r, pigeonIds: r.pigeonIds ?? [] })),
      pull("contacts",     db.contacts),
      pull("stations",     db.stations),
      pull("journal",      db.journal,      (r) => ({ ...r, body: r.body ?? r.content ?? "" })),
      pull("medications",  db.medications,  (r) => ({ ...r, pigeonIds: r.pigeonIds ?? [] })),
      pull("comments",     db.comments,     (r) => ({ ...r, target: r.targetType, text: r.content })),
      pull("bands",        db.bands),
      pull("autocomplete", db.autocomplete),
    ]);

    console.log("[SyncWorker] Pull from Supabase complete.");
  } catch (err) {
    console.warn("[SyncWorker] Pull failed:", err);
  }
}

/** snake_case → camelCase for pulled rows */
function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    const camelKey = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camelKey] = v;
  }
  return out;
}
