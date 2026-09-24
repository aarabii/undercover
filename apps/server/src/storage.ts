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
}

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
  const cursor = sql.exec<RoomSqlRow>(
    "SELECT code, state, rng_seed, reserved_until, updated_at FROM room_state WHERE id = 1"
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
  reservedUntil?: number
): void {
  sql.exec(
    "INSERT OR REPLACE INTO room_state (id, code, state, rng_seed, reserved_until, updated_at) VALUES (1, ?, ?, ?, ?, ?)",
    code,
    room ? JSON.stringify(room) : null,
    rngSeed,
    reservedUntil ?? null,
    Date.now()
  );
}

/**
 * Deletes room state from SQLite table.
 */
export function clearRoom(sql: SqlStorage): void {
  sql.exec("DELETE FROM room_state WHERE id = 1");
}
