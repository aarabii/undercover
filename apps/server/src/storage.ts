import type { Room } from "@game/types";

export interface PersistedRoomRecord {
  room: Room | null;
  rngSeed: number;
  reservedUntil?: number;
}

interface RoomSqlRow {
  code: string;
  state: string | null;
  rng_seed: number;
  reserved_until: number | null;
  updated_at: number;
  [key: string]: SqlStorageValue;
}

export type StorageTarget =
  | DurableObjectStorage
  | SqlStorage
  | {
      get?: (key: string) => Promise<any>;
      put?: (key: string, value: any) => Promise<void>;
      delete?: (key: string) => Promise<any>;
      sql?: SqlStorage;
    };

/**
 * Initializes the SQLite schema for the Room Durable Object.
 */
export function initDatabase(sql: SqlStorage): void {
  sql.exec(`
    CREATE TABLE IF NOT EXISTS room_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      code TEXT NOT NULL,
      state TEXT,
      rng_seed INTEGER NOT NULL,
      reserved_until INTEGER,
      updated_at INTEGER NOT NULL
    );
  `);
}

/**
 * Loads persisted room state and PRNG seed from SQLite storage.
 */
export function loadRoom(sql: SqlStorage): PersistedRoomRecord | null {
  initDatabase(sql);
  const cursor = sql.exec<RoomSqlRow>(
    "SELECT code, state, rng_seed, reserved_until, updated_at FROM room_state WHERE id = 1",
  );
  const rows = cursor.toArray();
  if (rows.length === 0) {
    return null;
  }
  const row = rows[0];
  const room = row.state ? (JSON.parse(row.state) as Room) : null;
  return {
    room,
    rngSeed: row.rng_seed,
    reservedUntil: row.reserved_until ?? undefined,
  };
}

/**
 * Persists room snapshot and PRNG seed into SQLite storage.
 */
export function saveRoom(
  sql: SqlStorage,
  code: string,
  room: Room | null,
  rngSeed: number,
  reservedUntil?: number,
): void {
  initDatabase(sql);
  sql.exec(
    "INSERT OR REPLACE INTO room_state (id, code, state, rng_seed, reserved_until, updated_at) VALUES (1, ?, ?, ?, ?, ?)",
    code,
    room ? JSON.stringify(room) : null,
    rngSeed,
    reservedUntil ?? null,
    Date.now(),
  );
}

/**
 * Deletes room state from SQLite table.
 */
export function clearRoom(sql: SqlStorage): void {
  initDatabase(sql);
  sql.exec("DELETE FROM room_state WHERE id = 1");
}

/**
 * High-performance storage manager with lazy/dirty write tracking.
 * Skips redundant SQLite writes on non-structural mutations (e.g., in-phase voting, settings update, heartbeats)
 * and flushes dirty state on major phase/player transitions or disconnects.
 */
export class RoomStorage {
  private dirty = false;
  private lastSavedPhase: string | null = null;
  private lastSavedPlayerCount: number | null = null;
  private lastSavedStatus: string | null = null;
  private code = "";
  private rngSeed = 0;
  private reservedUntil?: number;

  constructor(private storage: StorageTarget) {}

  private getSql(sqlOverride?: SqlStorage): SqlStorage | null {
    if (sqlOverride) return sqlOverride;
    if (!this.storage) return null;
    if ("sql" in (this.storage as any) && (this.storage as any).sql) {
      return (this.storage as any).sql as SqlStorage;
    }
    if ("exec" in (this.storage as any) && typeof (this.storage as any).exec === "function") {
      return this.storage as SqlStorage;
    }
    return null;
  }

  private getRoomStatus(room: Room): string {
    if ("status" in room && typeof (room as any).status === "string") {
      return (room as any).status;
    }
    return `${room.locked ? "locked" : "unlocked"}|${Array.isArray(room.players) ? room.players.map((p) => `${p.id}:${p.status}`).join(",") : ""}`;
  }

  isDirty(): boolean {
    return this.dirty;
  }

  markDirty(): void {
    this.dirty = true;
  }

  async loadRoom(sqlOverride?: SqlStorage): Promise<PersistedRoomRecord | null> {
    const sql = this.getSql(sqlOverride);
    let record: PersistedRoomRecord | null = null;

    if (sql) {
      record = loadRoom(sql);
    } else if (typeof (this.storage as any)?.get === "function") {
      const data = await (this.storage as any).get("room_state");
      if (data) {
        if ("room" in data || "rngSeed" in data) {
          record = data as PersistedRoomRecord;
        } else {
          record = {
            room: data as Room,
            rngSeed: 0,
          };
        }
      }
    }

    if (record) {
      this.rngSeed = record.rngSeed ?? 0;
      this.reservedUntil = record.reservedUntil;
      if (record.room) {
        this.lastSavedPhase = record.room.phase;
        this.lastSavedPlayerCount = record.room.players.length;
        this.lastSavedStatus = this.getRoomStatus(record.room);
      } else {
        this.lastSavedPhase = null;
        this.lastSavedPlayerCount = null;
        this.lastSavedStatus = null;
      }
    } else {
      this.lastSavedPhase = null;
      this.lastSavedPlayerCount = null;
      this.lastSavedStatus = null;
    }

    this.dirty = false;
    return record;
  }

  async saveRoom(
    room: Room | null,
    force = false,
    meta?: { code?: string; rngSeed?: number; reservedUntil?: number },
  ): Promise<boolean> {
    if (meta) {
      if (meta.code !== undefined) this.code = meta.code;
      if (meta.rngSeed !== undefined) this.rngSeed = meta.rngSeed;
      if (meta.reservedUntil !== undefined) this.reservedUntil = meta.reservedUntil;
    }

    if (room !== null) {
      const phaseChanged = room.phase !== this.lastSavedPhase;
      const playerCountChanged = room.players.length !== this.lastSavedPlayerCount;
      const currentStatus = this.getRoomStatus(room);
      const statusChanged = currentStatus !== this.lastSavedStatus;

      if (!force && !phaseChanged && !playerCountChanged && !statusChanged) {
        this.dirty = true;
        return false;
      }

      const sql = this.getSql();
      if (sql) {
        saveRoom(sql, this.code, room, this.rngSeed, this.reservedUntil);
      } else if (typeof (this.storage as any)?.put === "function") {
        await (this.storage as any).put("room_state", room);
      }

      this.lastSavedPhase = room.phase;
      this.lastSavedPlayerCount = room.players.length;
      this.lastSavedStatus = currentStatus;
      this.dirty = false;
      return true;
    } else {
      const isTransitioningFromNonNull =
        this.lastSavedPhase !== null ||
        this.lastSavedPlayerCount !== null ||
        this.lastSavedStatus !== null;

      if (force || isTransitioningFromNonNull) {
        const sql = this.getSql();
        if (sql) {
          saveRoom(sql, this.code, null, this.rngSeed, this.reservedUntil);
        } else if (typeof (this.storage as any)?.put === "function") {
          await (this.storage as any).put("room_state", null);
        }
        this.lastSavedPhase = null;
        this.lastSavedPlayerCount = null;
        this.lastSavedStatus = null;
        this.dirty = false;
        return true;
      }

      this.dirty = true;
      return false;
    }
  }

  async flushIfDirty(
    room?: Room | null,
    meta?: { code?: string; rngSeed?: number; reservedUntil?: number },
  ): Promise<boolean> {
    if (!this.dirty || room === undefined || (room === null && !this.reservedUntil)) {
      return false;
    }
    return await this.saveRoom(room, true, meta);
  }
}
