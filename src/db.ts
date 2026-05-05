import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    avatar TEXT,
    premium INTEGER DEFAULT 0,
    is_admin INTEGER DEFAULT 0
  );
  
  CREATE TABLE IF NOT EXISTS guilds_premium (
    guild_id TEXT PRIMARY KEY,
    added_by TEXT,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT,
    moderator_id TEXT,
    reason TEXT,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS vouchers (
    code TEXT PRIMARY KEY,
    type TEXT, /* 'user_premium' or 'guild_premium' */
    duration INTEGER, /* in ms */
    max_uses INTEGER DEFAULT 1,
    uses INTEGER DEFAULT 0,
    created_by TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS redeemed_vouchers (
    code TEXT,
    user_id TEXT,
    redeemed_at INTEGER,
    PRIMARY KEY (code, user_id)
  );

  CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT, /* 'info', 'warn', 'error' */
    source TEXT, /* 'backend', 'frontend', 'bot' */
    message TEXT,
    details TEXT,
    solution TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS bug_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    title TEXT,
    description TEXT,
    status TEXT DEFAULT 'open', /* 'open', 'in_progress', 'resolved', 'closed' */
    priority TEXT DEFAULT 'low',
    created_at INTEGER,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS system_stats (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Initialize stats if not present
try {
  db.prepare("INSERT OR IGNORE INTO system_stats (key, value) VALUES ('last_repair', NULL)").run();
} catch (e) {}

try {
  db.exec('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0;');
} catch (e) {
  // column already exists
}

try {
  db.exec('ALTER TABLE users ADD COLUMN premium_expires_at INTEGER DEFAULT NULL;');
} catch (e) {}

export default db;
