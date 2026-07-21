import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'mysudoku.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables(db);
  }
  return db;
}

function initTables(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS puzzles (
      id          TEXT PRIMARY KEY,
      puzzle      TEXT NOT NULL,
      solution    TEXT,
      difficulty  INTEGER DEFAULT 0,
      remark      TEXT,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      _modified   INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS puzzle_techniques (
      puzzle_id TEXT NOT NULL,
      technique TEXT NOT NULL,
      PRIMARY KEY (puzzle_id, technique),
      FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS game_records (
      id            TEXT PRIMARY KEY,
      puzzle_id     TEXT NOT NULL,
      time_seconds  INTEGER,
      completed     INTEGER NOT NULL DEFAULT 0,
      hint_used     INTEGER DEFAULT 0,
      check_errors  INTEGER DEFAULT 0,
      started_at    TEXT NOT NULL DEFAULT (datetime('now')),
      finished_at   TEXT,
      _modified     INTEGER NOT NULL DEFAULT 1,
      FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      _modified   INTEGER NOT NULL DEFAULT 1
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('edit_password', 'Kili+2016');

    CREATE INDEX IF NOT EXISTS idx_puzzles_difficulty ON puzzles(difficulty);
    CREATE INDEX IF NOT EXISTS idx_puzzles__modified ON puzzles(_modified);
    CREATE INDEX IF NOT EXISTS idx_game_records_puzzle ON game_records(puzzle_id);
    CREATE INDEX IF NOT EXISTS idx_puzzle_techniques_technique ON puzzle_techniques(technique);
  `);

  // 迁移：为已存在的 puzzles 表新增 seq 列（题号）
  migratePuzzleSeq(db);
}

/**
 * 迁移：puzzles 表加 seq 列。
 *
 * 若已有 puzzles 数据，按 created_at 升序补齐 seq=1..N。
 * 若空表，仅加列不补数据。
 */
function migratePuzzleSeq(db: Database.Database): void {
  const cols = db.prepare("PRAGMA table_info(puzzles)").all() as { name: string }[];
  if (cols.some(c => c.name === "seq")) return;

  db.exec("ALTER TABLE puzzles ADD COLUMN seq INTEGER;");

  // 补齐已有题目的 seq
  const rows = db.prepare(
    "SELECT id FROM puzzles ORDER BY created_at ASC, rowid ASC"
  ).all() as { id: string }[];
  const update = db.prepare("UPDATE puzzles SET seq = ? WHERE id = ?");
  rows.forEach((row, idx) => update.run(idx + 1, row.id));

  db.exec("CREATE INDEX IF NOT EXISTS idx_puzzles_seq ON puzzles(seq);");
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
