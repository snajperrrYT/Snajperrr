import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';

/**
 * Reusable in-memory database factory that mirrors the production schema.
 * Keeps voucher tests fully isolated without touching the filesystem.
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
  `);

  return db;
}

// ---------------------------------------------------------------------------
// Voucher creation
// ---------------------------------------------------------------------------
describe('Voucher creation', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('inserts a user_premium voucher', () => {
    const code = 'ABC123';
    db.prepare(
      'INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(code, 'user_premium', 2_592_000_000, 1, 0, 'admin1', Date.now());

    const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(code) as any;
    expect(voucher.type).toBe('user_premium');
    expect(voucher.duration).toBe(2_592_000_000);
    expect(voucher.uses).toBe(0);
    expect(voucher.max_uses).toBe(1);
  });

  it('inserts a guild_premium voucher', () => {
    const code = 'GUILD1';
    db.prepare(
      'INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(code, 'guild_premium', null, 5, 0, 'admin1', Date.now());

    const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(code) as any;
    expect(voucher.type).toBe('guild_premium');
    expect(voucher.duration).toBeNull();
    expect(voucher.max_uses).toBe(5);
  });

  it('generates unique codes (no conflict when codes differ)', () => {
    db.prepare(
      'INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('CODE1', 'user_premium', null, 1, 0, 'admin1', Date.now());
    db.prepare(
      'INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('CODE2', 'user_premium', null, 1, 0, 'admin1', Date.now());

    const all = db.prepare('SELECT * FROM vouchers').all();
    expect(all).toHaveLength(2);
  });

  it('rejects duplicate voucher codes', () => {
    db.prepare(
      'INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('DUP', 'user_premium', null, 1, 0, 'admin1', Date.now());

    expect(() => {
      db.prepare(
        'INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run('DUP', 'guild_premium', null, 1, 0, 'admin1', Date.now());
    }).toThrow();
  });
});

// ---------------------------------------------------------------------------
// Voucher redemption logic (mirrors /api/vouchers/redeem in server.ts)
// ---------------------------------------------------------------------------
describe('Voucher redemption', () => {
  let db: ReturnType<typeof createTestDb>;
  const USER_ID = 'user1';
  const GUILD_ID = 'guild1';

  function seedVoucher(
    code: string,
    type: 'user_premium' | 'guild_premium',
    maxUses = 1,
    duration: number | null = 2_592_000_000
  ) {
    db.prepare('INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      code, type, duration, maxUses, 0, 'admin', Date.now()
    );
  }

  /**
   * Inline port of the redemption transaction from server.ts so we can test
   * the core business logic without starting the full Express server.
   */
  function redeemVoucher(code: string, userId: string, guildId?: string): { success: boolean; error?: string } {
    const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(code) as any;
    if (!voucher) return { success: false, error: 'Nieprawidłowy kod vouchera.' };

    if (voucher.max_uses > 0 && voucher.uses >= voucher.max_uses) {
      return { success: false, error: 'Voucher został już w pełni wykorzystany.' };
    }

    const alreadyRedeemed = db.prepare('SELECT 1 FROM redeemed_vouchers WHERE code = ? AND user_id = ?').get(code, userId);
    if (alreadyRedeemed) return { success: false, error: 'Już zrealizowałeś ten voucher.' };

    const now = Date.now();
    const expiresAt = voucher.duration ? now + voucher.duration : null;

    try {
      db.transaction(() => {
        if (voucher.type === 'user_premium') {
          db.prepare('INSERT OR IGNORE INTO users (id) VALUES (?)').run(userId);
          db.prepare('UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?').run(expiresAt, userId);
        } else if (voucher.type === 'guild_premium') {
          if (!guildId) throw new Error('requires_guild_id');
          db.prepare(
            'INSERT INTO guilds_premium (guild_id, added_by, active) VALUES (?, ?, 1) ON CONFLICT(guild_id) DO UPDATE SET active = 1, added_by = excluded.added_by'
          ).run(guildId, userId);
        } else {
          throw new Error('Unknown voucher type');
        }

        db.prepare('INSERT INTO redeemed_vouchers (code, user_id, redeemed_at) VALUES (?, ?, ?)').run(code, userId, now);

        const newUses = voucher.uses + 1;
        if (voucher.max_uses > 0 && newUses >= voucher.max_uses) {
          db.prepare('DELETE FROM vouchers WHERE code = ?').run(code);
        } else {
          db.prepare('UPDATE vouchers SET uses = ? WHERE code = ?').run(newUses, code);
        }
      })();

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  beforeEach(() => {
    db = createTestDb();
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run(USER_ID, 'TestUser');
  });

  it('successfully redeems a user_premium voucher', () => {
    seedVoucher('PREM1', 'user_premium');
    const result = redeemVoucher('PREM1', USER_ID);

    expect(result.success).toBe(true);
    const user = db.prepare('SELECT premium FROM users WHERE id = ?').get(USER_ID) as any;
    expect(user.premium).toBe(1);
  });

  it('sets premium_expires_at when voucher has a duration', () => {
    const before = Date.now();
    seedVoucher('PREM_EXP', 'user_premium', 1, 86_400_000); // 1 day
    redeemVoucher('PREM_EXP', USER_ID);

    const user = db.prepare('SELECT premium_expires_at FROM users WHERE id = ?').get(USER_ID) as any;
    expect(user.premium_expires_at).toBeGreaterThan(before);
    expect(user.premium_expires_at).toBeLessThanOrEqual(Date.now() + 86_400_000);
  });

  it('sets no expiry when voucher duration is null (lifetime)', () => {
    seedVoucher('LIFETIME', 'user_premium', 1, null);
    redeemVoucher('LIFETIME', USER_ID);

    const user = db.prepare('SELECT premium_expires_at FROM users WHERE id = ?').get(USER_ID) as any;
    expect(user.premium_expires_at).toBeNull();
  });

  it('rejects an already-redeemed voucher by the same user', () => {
    seedVoucher('ONCE', 'user_premium', 2); // max_uses=2 so it's not exhausted
    redeemVoucher('ONCE', USER_ID);
    const result = redeemVoucher('ONCE', USER_ID);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Już zrealizowałeś');
  });

  it('rejects a fully used-up voucher', () => {
    // Single-use vouchers are deleted from the table once redeemed.
    // A subsequent attempt therefore returns "invalid code" rather than
    // "already used up" – both are correct rejection scenarios.
    seedVoucher('MAXED', 'user_premium', 1);
    const user2 = 'user2';
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run(user2, 'User2');
    redeemVoucher('MAXED', user2); // first redemption exhausts and deletes the voucher
    const result = redeemVoucher('MAXED', USER_ID); // second attempt should fail

    expect(result.success).toBe(false);
    // The voucher is deleted after the last use, so the lookup returns nothing
    expect(result.error).toBe('Nieprawidłowy kod vouchera.');
  });

  it('rejects redemption when voucher uses have reached max_uses (not yet deleted)', () => {
    // Manually insert a voucher that is already at max_uses without triggering deletion
    db.prepare(
      'INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run('EXHAUST', 'user_premium', null, 2, 2, 'admin', Date.now());

    const result = redeemVoucher('EXHAUST', USER_ID);

    expect(result.success).toBe(false);
    expect(result.error).toContain('w pełni wykorzystany');
  });

  it('rejects an invalid voucher code', () => {
    const result = redeemVoucher('INVALID', USER_ID);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Nieprawidłowy kod vouchera.');
  });

  it('deletes the voucher from the table once max_uses is reached', () => {
    seedVoucher('SINGUSE', 'user_premium', 1);
    redeemVoucher('SINGUSE', USER_ID);

    const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get('SINGUSE');
    expect(voucher).toBeUndefined();
  });

  it('keeps the voucher when max_uses is not yet reached', () => {
    seedVoucher('MULTI', 'user_premium', 3);
    redeemVoucher('MULTI', USER_ID);

    const voucher = db.prepare('SELECT uses FROM vouchers WHERE code = ?').get('MULTI') as any;
    expect(voucher).toBeDefined();
    expect(voucher.uses).toBe(1);
  });

  it('allows multiple different users to redeem a multi-use voucher', () => {
    seedVoucher('MULTI2', 'user_premium', 3);
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run('u2', 'User2');
    db.prepare('INSERT INTO users (id, username) VALUES (?, ?)').run('u3', 'User3');

    expect(redeemVoucher('MULTI2', USER_ID).success).toBe(true);
    expect(redeemVoucher('MULTI2', 'u2').success).toBe(true);
    expect(redeemVoucher('MULTI2', 'u3').success).toBe(true);

    // All three recorded in redeemed_vouchers
    const rows = db.prepare('SELECT * FROM redeemed_vouchers WHERE code = ?').all('MULTI2');
    expect(rows).toHaveLength(3);
  });

  it('redeems a guild_premium voucher and activates guild', () => {
    seedVoucher('GUILD1', 'guild_premium', 1, null);
    const result = redeemVoucher('GUILD1', USER_ID, GUILD_ID);

    expect(result.success).toBe(true);
    const gp = db.prepare('SELECT * FROM guilds_premium WHERE guild_id = ?').get(GUILD_ID) as any;
    expect(gp.active).toBe(1);
    expect(gp.added_by).toBe(USER_ID);
  });

  it('returns error when guild_premium voucher is redeemed without guildId', () => {
    seedVoucher('GUILDNOARG', 'guild_premium', 1, null);
    const result = redeemVoucher('GUILDNOARG', USER_ID); // no guildId

    expect(result.success).toBe(false);
    expect(result.error).toBe('requires_guild_id');
  });
});

// ---------------------------------------------------------------------------
// Guilds premium table
// ---------------------------------------------------------------------------
describe('Guilds premium table', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('inserts a new guild premium entry', () => {
    db.prepare('INSERT INTO guilds_premium (guild_id, added_by, active) VALUES (?, ?, 1)').run('g1', 'u1');
    const row = db.prepare('SELECT * FROM guilds_premium WHERE guild_id = ?').get('g1') as any;
    expect(row.active).toBe(1);
  });

  it('upserts guild premium entry on conflict', () => {
    db.prepare('INSERT INTO guilds_premium (guild_id, added_by, active) VALUES (?, ?, 1)').run('g1', 'u1');
    db.prepare(
      'INSERT INTO guilds_premium (guild_id, added_by, active) VALUES (?, ?, 1) ON CONFLICT(guild_id) DO UPDATE SET active = 1, added_by = excluded.added_by'
    ).run('g1', 'u2');

    const row = db.prepare('SELECT * FROM guilds_premium WHERE guild_id = ?').get('g1') as any;
    expect(row.added_by).toBe('u2');
    expect(row.active).toBe(1);
  });
});
