import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';

/**
 * Helpers to build an in-memory SQLite database with the same schema
 * as src/db.ts so we can test DB operations without touching the real file.
 */
function createTestDb() {
  const db = new Database(':memory:');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      avatar TEXT,
      premium INTEGER DEFAULT 0,
      is_admin INTEGER DEFAULT 0,
      premium_expires_at INTEGER DEFAULT NULL,
      audio_quality TEXT DEFAULT 'standard'
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
      type TEXT,
      duration INTEGER,
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
      level TEXT,
      source TEXT,
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
      status TEXT DEFAULT 'open',
      priority TEXT DEFAULT 'low',
      created_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS system_stats (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  db.prepare("INSERT OR IGNORE INTO system_stats (key, value) VALUES ('last_repair', NULL)").run();

  return db;
}

// ---------------------------------------------------------------------------
// Schema tests
// ---------------------------------------------------------------------------
describe('Database schema', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('creates all required tables', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((r: any) => r.name);

    expect(tables).toContain('users');
    expect(tables).toContain('guilds_premium');
    expect(tables).toContain('warnings');
    expect(tables).toContain('vouchers');
    expect(tables).toContain('redeemed_vouchers');
    expect(tables).toContain('system_logs');
    expect(tables).toContain('bug_reports');
    expect(tables).toContain('system_stats');
  });

  it('initialises system_stats with last_repair key', () => {
    const row = db.prepare("SELECT value FROM system_stats WHERE key = 'last_repair'").get() as any;
    expect(row).toBeDefined();
    expect(row.value).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Users table
// ---------------------------------------------------------------------------
describe('Users table', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('inserts a user with default values', () => {
    db.prepare('INSERT INTO users (id, username, avatar) VALUES (?, ?, ?)').run('u1', 'Alice', 'avatar1');
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get('u1') as any;

    expect(user.id).toBe('u1');
    expect(user.username).toBe('Alice');
    expect(user.premium).toBe(0);
    expect(user.is_admin).toBe(0);
    expect(user.premium_expires_at).toBeNull();
    expect(user.audio_quality).toBe('standard');
  });

  it('upserts user on conflict (updates username and avatar)', () => {
    db.prepare('INSERT INTO users (id, username, avatar) VALUES (?, ?, ?)').run('u1', 'Alice', 'old');
    db.prepare(
      `INSERT INTO users (id, username, avatar) VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET username=excluded.username, avatar=excluded.avatar`
    ).run('u1', 'AliceUpdated', 'new');

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get('u1') as any;
    expect(user.username).toBe('AliceUpdated');
    expect(user.avatar).toBe('new');
  });

  it('grants admin status', () => {
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run('admin1', 'Admin');
    db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run('admin1');

    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get('admin1') as any;
    expect(user.is_admin).toBe(1);
  });

  it('sets and revokes premium', () => {
    const expiresAt = Date.now() + 86_400_000;
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run('u2', 'Bob');
    db.prepare('UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?').run(expiresAt, 'u2');

    let user = db.prepare('SELECT * FROM users WHERE id = ?').get('u2') as any;
    expect(user.premium).toBe(1);
    expect(user.premium_expires_at).toBe(expiresAt);

    db.prepare('UPDATE users SET premium = 0, premium_expires_at = NULL WHERE id = ?').run('u2');
    user = db.prepare('SELECT * FROM users WHERE id = ?').get('u2') as any;
    expect(user.premium).toBe(0);
    expect(user.premium_expires_at).toBeNull();
  });

  it('updates audio_quality', () => {
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run('u3', 'Carol');
    db.prepare("UPDATE users SET audio_quality = ? WHERE id = ?").run('ultra', 'u3');

    const user = db.prepare('SELECT audio_quality FROM users WHERE id = ?').get('u3') as any;
    expect(user.audio_quality).toBe('ultra');
  });

  it('returns null for non-existent user', () => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get('nobody');
    expect(user).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Warnings table
// ---------------------------------------------------------------------------
describe('Warnings table', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run('mod1', 'Mod');
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run('target1', 'Target');
  });

  it('inserts a warning', () => {
    const now = Date.now();
    db.prepare(
      'INSERT INTO warnings (guild_id, user_id, moderator_id, reason, timestamp) VALUES (?, ?, ?, ?, ?)'
    ).run('guild1', 'target1', 'mod1', 'Spamming', now);

    const warns = db.prepare('SELECT * FROM warnings WHERE user_id = ?').all('target1') as any[];
    expect(warns).toHaveLength(1);
    expect(warns[0].reason).toBe('Spamming');
    expect(warns[0].moderator_id).toBe('mod1');
  });

  it('fetches all warnings for a user in a guild', () => {
    const now = Date.now();
    db.prepare(
      'INSERT INTO warnings (guild_id, user_id, moderator_id, reason, timestamp) VALUES (?, ?, ?, ?, ?)'
    ).run('guild1', 'target1', 'mod1', 'First offence', now);
    db.prepare(
      'INSERT INTO warnings (guild_id, user_id, moderator_id, reason, timestamp) VALUES (?, ?, ?, ?, ?)'
    ).run('guild1', 'target1', 'mod1', 'Second offence', now + 1000);

    const warns = db
      .prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ?')
      .all('guild1', 'target1') as any[];
    expect(warns).toHaveLength(2);
  });

  it('clears warnings for a user', () => {
    db.prepare(
      'INSERT INTO warnings (guild_id, user_id, moderator_id, reason, timestamp) VALUES (?, ?, ?, ?, ?)'
    ).run('guild1', 'target1', 'mod1', 'Bad behaviour', Date.now());

    db.prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?').run('guild1', 'target1');
    const warns = db
      .prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ?')
      .all('guild1', 'target1');
    expect(warns).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// System logs table
// ---------------------------------------------------------------------------
describe('System logs table', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('inserts an info log', () => {
    db.prepare(
      'INSERT INTO system_logs (level, source, message, details, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run('info', 'backend', 'Server started', null, Date.now());

    const logs = db.prepare('SELECT * FROM system_logs').all() as any[];
    expect(logs).toHaveLength(1);
    expect(logs[0].level).toBe('info');
    expect(logs[0].source).toBe('backend');
  });

  it('inserts an error log with details', () => {
    const details = JSON.stringify({ stack: 'Error: boom' });
    db.prepare(
      'INSERT INTO system_logs (level, source, message, details, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run('error', 'bot', 'Player crashed', details, Date.now());

    const log = db.prepare('SELECT * FROM system_logs WHERE level = ?').get('error') as any;
    expect(log.message).toBe('Player crashed');
    expect(JSON.parse(log.details).stack).toBe('Error: boom');
  });

  it('updates the solution field on a log entry', () => {
    const result = db.prepare(
      'INSERT INTO system_logs (level, source, message, created_at) VALUES (?, ?, ?, ?)'
    ).run('warn', 'player-debug', 'decipher error', Date.now());

    const logId = result.lastInsertRowid as number;
    db.prepare('UPDATE system_logs SET solution = ? WHERE id = ?').run('Restart extractors', logId);

    const log = db.prepare('SELECT solution FROM system_logs WHERE id = ?').get(logId) as any;
    expect(log.solution).toBe('Restart extractors');
  });

  it('retrieves the 200 most recent logs', () => {
    for (let i = 0; i < 210; i++) {
      db.prepare(
        'INSERT INTO system_logs (level, source, message, created_at) VALUES (?, ?, ?, ?)'
      ).run('info', 'test', `Message ${i}`, i);
    }

    const logs = db
      .prepare('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 200')
      .all() as any[];
    expect(logs).toHaveLength(200);
    expect((logs[0] as any).message).toBe('Message 209');
  });
});

// ---------------------------------------------------------------------------
// Bug reports table
// ---------------------------------------------------------------------------
describe('Bug reports table', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run('u1', 'Reporter');
  });

  it('creates a bug report with default status and priority', () => {
    db.prepare(
      'INSERT INTO bug_reports (user_id, title, description, created_at) VALUES (?, ?, ?, ?)'
    ).run('u1', 'Login fails', 'Cannot log in using Discord OAuth', Date.now());

    const bug = db.prepare('SELECT * FROM bug_reports').get() as any;
    expect(bug.title).toBe('Login fails');
    expect(bug.status).toBe('open');
    expect(bug.priority).toBe('low');
  });

  it('updates bug report status', () => {
    const result = db.prepare(
      'INSERT INTO bug_reports (user_id, title, description, created_at) VALUES (?, ?, ?, ?)'
    ).run('u1', 'Crash', 'Bot crashes on play', Date.now());

    db.prepare('UPDATE bug_reports SET status = ? WHERE id = ?').run('resolved', result.lastInsertRowid);
    const bug = db.prepare('SELECT status FROM bug_reports WHERE id = ?').get(result.lastInsertRowid) as any;
    expect(bug.status).toBe('resolved');
  });

  it('fetches bugs with reporter username via join', () => {
    db.prepare(
      'INSERT INTO bug_reports (user_id, title, description, priority, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run('u1', 'High priority bug', 'Description', 'high', Date.now());

    const bugs = db.prepare(`
      SELECT b.*, u.username as reporter
      FROM bug_reports b
      LEFT JOIN users u ON b.user_id = u.id
      ORDER BY b.created_at DESC
    `).all() as any[];

    expect(bugs[0].reporter).toBe('Reporter');
    expect(bugs[0].priority).toBe('high');
  });
});
