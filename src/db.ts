import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('database.db');

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    avatar TEXT,
    is_admin INTEGER DEFAULT 0,
    premium INTEGER DEFAULT 0,
    premium_expires_at INTEGER,
    audio_quality TEXT DEFAULT 'high',
    premium_settings TEXT DEFAULT '{}',
    spotify_access_token TEXT,
    spotify_refresh_token TEXT,
    spotify_token_expires_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    level TEXT,
    source TEXT,
    message TEXT,
    details TEXT,
    solution TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS system_stats (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS bug_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    title TEXT,
    description TEXT,
    priority TEXT,
    status TEXT DEFAULT 'pending',
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS vouchers (
    code TEXT PRIMARY KEY,
    type TEXT,
    duration INTEGER,
    max_uses INTEGER,
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

  CREATE TABLE IF NOT EXISTS guilds_premium (
    guild_id TEXT PRIMARY KEY,
    added_by TEXT,
    active INTEGER DEFAULT 1
  );
  
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    body TEXT,
    created_at INTEGER,
    created_by TEXT
  );

  CREATE TABLE IF NOT EXISTS warnings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT,
    moderator_id TEXT,
    reason TEXT,
    timestamp INTEGER
  );

  CREATE TABLE IF NOT EXISTS global_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Seed initial stats if they don't exist
const seedStats = [
  { key: 'last_repair', value: '0' },
  { key: 'total_repairs', value: '0' },
  { key: 'reboot_count', value: '0' }
];

const seedSettings = [
  { key: 'admin_dm_notifications', value: '1' },
  { key: 'maintenance_mode', value: '0' }
];

const insertStat = db.prepare('INSERT OR IGNORE INTO system_stats (key, value) VALUES (?, ?)');
seedStats.forEach(stat => insertStat.run(stat.key, stat.value));

const insertSetting = db.prepare('INSERT OR IGNORE INTO global_settings (key, value) VALUES (?, ?)');
seedSettings.forEach(setting => insertSetting.run(setting.key, setting.value));

export default db;
