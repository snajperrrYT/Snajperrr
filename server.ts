import express from "express";
import path from "path";
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import type { Client, GuildMember, REST, SlashCommandBuilder, StringSelectMenuBuilder } from "discord.js";
import type { Player } from "discord-player";
import type Stripe from "stripe";

const app = express();
const PORT = Number.parseInt(process.env.PORT || '', 10) || 3000;

// 1. IMMEDIATE LISTEN to pass Cloud Run health checks
app.get('/api/health', (req, res) => res.status(200).send('OK'));
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[Startup] Port ${PORT} opened. Initializing heavy modules...`);
});

// Catch all unhandled process errors early
process.on('unhandledRejection', (reason) => {
  console.error(`Unhandled Rejection:`, reason);
});
process.on('uncaughtException', (error) => {
  console.error(`Uncaught Exception:`, error);
});

async function bootstrap() {
    console.log('[Startup] Loading dynamic imports...');
    const [
        { createServer: createViteServer },
        { Client, GatewayIntentBits, ActivityType, REST, Routes, SlashCommandBuilder, GuildMember, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType, MessageFlags },
        { Player },
        { DefaultExtractors },
        { YoutubeiExtractor },
        jwt,
        { default: Stripe },
        crypto,
        { default: ms },
        { GoogleGenAI },
        { default: db },
        { adminCommandsDefinitions, handleAdminCommands }
    ] = await Promise.all([
        import("vite"),
        import("discord.js"),
        import("discord-player"),
        import("@discord-player/extractor"),
        import("discord-player-youtubei"),
        import('jsonwebtoken'),
        import('stripe'),
        import('crypto'),
        import('ms'),
        import("@google/genai"),
        import('./src/db'),
        import('./src/adminCommands')
    ]);

    const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_jwt';

    app.use((req, res, next) => {
        if (req.originalUrl === '/api/stripe/webhook') {
            next();
        } else {
            express.json()(req, res, next);
        }
    });
    app.use(cookieParser());

    // Scope variables to bootstrap
    let aiAssistant: any = null;
    if (process.env.GEMINI_API_KEY) {
        aiAssistant = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    const client: any = new Client({
        intents: [
            GatewayIntentBits.Guilds, 
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessages,
        ],
    });
    const player: any = new Player(client);
    let botStartTime = 0;
    let botStatus: any = { 
        state: 'offline', 
        guilds: 0, 
        ping: 0, 
        tag: '',
        uptime: 0
    };

    // Make functions available inside bootstrap closure
    const logEvent = (level: 'info' | 'warn' | 'error', source: string, message: string, details?: any) => {
        try {
            const detailsStr = details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null;
            const result = db.prepare('INSERT INTO system_logs (level, source, message, details, created_at) VALUES (?, ?, ?, ?, ?)')
                .run(level, source, message, detailsStr, Date.now());
            
            const logId = result.lastInsertRowid as number;

            if (level === 'error' && aiAssistant) {
                analyzeAndStoreSolution(logId, message, detailsStr || '');
                const msg = message.toLowerCase();
                if (msg.includes('decipher') || msg.includes('signature') || msg.includes('youtubejs') || msg.includes('streaming data not available')) {
                    performSystemRepair();
                }
            }
            
            const time = new Date().toLocaleTimeString();
            if (level === 'error') console.log(`\x1b[31m[${time}] [ERROR] [${source}] ${message}\x1b[0m`);
            else if (level === 'warn') console.log(`\x1b[33m[${time}] [WARN] [${source}] ${message}\x1b[0m`);
            else console.log(`\x1b[32m[${time}] [INFO] [${source}] ${message}\x1b[0m`);
        } catch (err) {
            console.error('Failed to write to system_logs:', err);
        }
    };

    const analyzeAndStoreSolution = async (logId: number, message: string, details: string) => {
        if (!aiAssistant) return;
        try {
            const prompt = `Jesteś systemem autodiagnostyki bota muzycznego. Wystąpił błąd:\nWIADOMOŚĆ: ${message}\nSZCZEGÓŁY: ${details}\n\nPodaj krótkie, konkretne rozwiązanie (max 2 zdania). Jeśli to błąd YouTube (decipher), zasugeruj "Restart Silnika Extractors".\nOdpowiedz w JSON: {"solution": "treść", "canAutoFix": true/false}`;
            const response = await aiAssistant.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { responseMimeType: "application/json" }
            });
            const data = JSON.parse(response.text);
            db.prepare('UPDATE system_logs SET solution = ? WHERE id = ?').run(data.solution, logId);
        } catch (err) {}
    };

    const performSystemRepair = async () => {
        if (repairCooldown && Date.now() - lastRepairAttempt < 60000) return false;
        repairCooldown = true;
        lastRepairAttempt = Date.now();
        logEvent('warn', 'system', 'Inicjowanie procedury autonaprawy...');
        try {
            try { await player.extractors.unregister(YoutubeiExtractor.identifier); } catch(e) {}
            await player.extractors.register(YoutubeiExtractor, {
                useServerAbrStream: true,
                streamOptions: {
                    highWaterMark: 1024 * 1024 * 4,
                    useClient: 'TV_EMBEDDED',
                }
            });
            await player.extractors.loadMulti(DefaultExtractors);
            db.prepare("UPDATE system_stats SET value = ? WHERE key = 'last_repair'").run(Date.now().toString());
            logEvent('info', 'system', 'System naprawiony pomyślnie.');
            setTimeout(() => { repairCooldown = false; }, 60000);
            return { success: true };
        } catch (err: any) {
            repairCooldown = false;
            logEvent('error', 'system', `Błąd autonaprawy: ${err.message}`);
            return false;
        }
    };

    player.on('debug', (message) => {
        const spamPatterns = ['Querying all extractors', 'appropriate extractor', 'Failed to query metadata query using N/A extractor', 'Using N/A extractor'];
        if (!spamPatterns.some(pattern => message.includes(pattern))) {
            console.log(`[Player Debug] ${message}`);
            if (message.includes('Failed') || message.includes('Error') || message.includes('decipher') || message.includes('signature') || message.includes('Streaming data not available')) {
                logEvent('warn', 'player-debug', message);
                if (message.includes('decipher') || message.includes('signature') || message.includes('Streaming data not available')) {
                    if (!repairCooldown || Date.now() - lastRepairAttempt > 60000) performSystemRepair();
                }
            }
        }
    });

    let lastRepairAttempt = 0;
    let repairCooldown = false;
    const playbackHistory = new Map<string, any[]>();

let stripeClient: any = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
}

// OAuth and Stripe endpoints will go here...
function getRedirectUri(req: express.Request) {
  let protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  let host = String(req.headers['x-forwarded-host'] || req.headers.host || '');
  
  if (host.includes('ais-pre-ly5ivmhh6jz6aqhbimhb3h')) {
    return 'https://ais-pre-ly5ivmhh6jz6aqhbimhb3h-563309155975.europe-west2.run.app/api/auth/callback';
  }
  if (host.includes('ais-dev-ly5ivmhh6jz6aqhbimhb3h')) {
    return 'https://ais-dev-ly5ivmhh6jz6aqhbimhb3h-563309155975.europe-west2.run.app/api/auth/callback';
  }
  
  // Clean up if it contains multiple comma-separated values
  if (typeof protocol === 'string' && protocol.includes(',')) {
    protocol = protocol.split(',')[0].trim();
  }
  if (typeof host === 'string' && host.includes(',')) {
    host = host.split(',')[0].trim();
  }
  
  // Force https for Cloud Run URLs
  if (typeof host === 'string' && host.includes('run.app')) {
    protocol = 'https';
  }
  
  const uri = `${protocol}://${host}/api/auth/callback`;
  console.log('[Auth] Generated Redirect URI:', uri);
  return uri;
}

app.get('/api/auth/url', (req, res) => {
  const clientRedirect = req.query.redirectUri as string;
  const redirectUri = clientRedirect || getRedirectUri(req);
  
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID || '',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify guilds', // you'd want 'guilds' for adding bot or checking user's guilds
  });
  console.log('[Auth] Returning authorization url with redirect:', redirectUri);
  res.json({ url: `https://discord.com/api/oauth2/authorize?${params}` });
});

app.get('/api/auth/callback', async (req, res) => {
  const { code, state } = req.query;
  
  // Try to use the host from headers
  const redirectUri = getRedirectUri(req);
  console.log('[Auth Callback] Using Redirect URI for token code exchange:', redirectUri);

  
  if (!code) return res.send("No code provided");

  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID || '',
        client_secret: process.env.DISCORD_CLIENT_SECRET || '',
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
        return res.send(`Failed to fetch OAuth token: ${tokenData.error_description || tokenData.error}`);
    }

    const [userRes, guildsRes] = await Promise.all([
      fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }),
      fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      })
    ]);

    const userData = await userRes.json();

    db.prepare(`INSERT INTO users (id, username, avatar) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET username=excluded.username, avatar=excluded.avatar`).run(userData.id, userData.username, userData.avatar);

    if (userData.id === '1230509684138709056') {
      db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(userData.id);
    }

    const token = jwt.sign({ id: userData.id, username: userData.username, avatar: userData.avatar }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('auth_token', token, {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Logowanie udane. To okno zostanie zamknięte.</p>
        </body>
      </html>
    `);
  } catch(err) {
    console.error(err);
    res.status(500).send("Internal Server Error during OAuth");
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('auth_token', {
    secure: true,
    sameSite: 'none',
    httpOnly: true
  });
  res.json({ success: true });
});

app.get('/api/me', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.json({ loggedIn: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    let user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user) return res.json({ loggedIn: false });
    
    // Automatically revoke expired premium
    if (user.premium === 1 && user.premium_expires_at && user.premium_expires_at < Date.now()) {
      db.prepare('UPDATE users SET premium = 0, premium_expires_at = NULL WHERE id = ?').run(user.id);
      user.premium = 0;
      user.premium_expires_at = null;
    }

    res.json({ loggedIn: true, user });
  } catch(err) {
    res.json({ loggedIn: false });
  }
});

app.get('/api/admin/users', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const adminUser = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!adminUser || adminUser.is_admin !== 1) {
      return res.status(403).json({ success: false, error: 'Brak uprawnień administratora.' });
    }

    const users = db.prepare('SELECT id, username, avatar, premium, premium_expires_at, is_admin FROM users').all();
    res.json({ success: true, users });
  } catch(err) {
    res.status(500).json({ success: false });
  }
});

app.post('/api/admin/users/:id/premium', express.json(), async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const adminUser = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!adminUser || adminUser.is_admin !== 1) {
      return res.status(403).json({ success: false, error: 'Brak uprawnień administratora.' });
    }

    const targetUserId = req.params.id;
    const { action, durationStr } = req.body;
    let newExpiresAt = null;

    if (action === 'revoke') {
      db.prepare('UPDATE users SET premium = 0, premium_expires_at = NULL WHERE id = ?').run(targetUserId);
    } else if (action === 'grant' || action === 'extend') {
      let durationMs = durationStr && durationStr !== 'lifetime' ? ms(durationStr) : null;
      if (durationStr && durationStr !== 'lifetime' && !durationMs) {
         return res.status(400).json({ success: false, error: 'Nieprawidłowy format czasu (np. 30d)' });
      }
      
      const currentUser = db.prepare('SELECT premium, premium_expires_at FROM users WHERE id = ?').get(targetUserId) as any;
      if (!currentUser) return res.status(404).json({ success: false, error: 'Użytkownik nie znaleziony.' });

      let baseTime = Date.now();
      if (action === 'extend' && currentUser.premium_expires_at && currentUser.premium_expires_at > Date.now()) {
        baseTime = currentUser.premium_expires_at;
      }

      newExpiresAt = durationMs ? baseTime + durationMs : null;
      db.prepare('UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?').run(newExpiresAt, targetUserId);
    } else {
      return res.status(400).json({ success: false, error: 'Nieznana akcja.' });
    }

    const updatedUser = db.prepare('SELECT id, premium, premium_expires_at FROM users WHERE id = ?').get(targetUserId);
    res.json({ success: true, user: updatedUser });
  } catch(err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.post('/api/admin/vouchers', express.json(), async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) {
      return res.status(403).json({ success: false, error: 'Brak uprawnień administratora.' });
    }

    const { type, durationStr, maxUses } = req.body;
    let duration = null;
    if (durationStr && durationStr !== 'lifetime') {
        duration = ms(durationStr);
        if (!duration) return res.status(400).json({ success: false, error: 'Nieprawidłowy format czasu (np. 30d)' });
    }
  
    const code = crypto.randomBytes(6).toString('hex').toUpperCase();
    const stmt = db.prepare('INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    stmt.run(code, type, duration, maxUses, 0, decoded.id, Date.now());
    
    res.json({ success: true, code, type, duration: durationStr, maxUses });
  } catch(err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get('/api/admin/vouchers', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) {
      return res.status(403).json({ success: false, error: 'Brak uprawnień administratora.' });
    }

    const vouchers = db.prepare('SELECT * FROM vouchers ORDER BY created_at DESC').all();
    res.json({ success: true, vouchers });
  } catch(err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// --- Logs & Bug Endpoints ---
app.get('/api/admin/logs', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    const logs = db.prepare('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 200').all() as any[];
    res.json({ success: true, logs });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.get('/api/admin/system/stats', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    const stats = db.prepare('SELECT * FROM system_stats').all() as any[];
    const statsObj = stats.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    res.json({ success: true, stats: statsObj });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/system/repair', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    const result = await performSystemRepair();
    res.json(result);
  } catch(err) { res.status(500).json({ success: false }); }
});

app.post('/api/bugs', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  const { title, description, priority } = req.body;
  if (!title || !description) return res.status(400).json({ success: false, error: 'Tytuł i opis są wymagane.' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    db.prepare('INSERT INTO bug_reports (user_id, title, description, priority, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(decoded.id, title, description, priority || 'low', Date.now());
    
    logEvent('info', 'frontend', `Nowe zgłoszenie błędu: ${title}`, { userId: decoded.id });
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.get('/api/admin/bugs', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    const bugs = db.prepare(`
      SELECT b.*, u.username as reporter 
      FROM bug_reports b 
      LEFT JOIN users u ON b.user_id = u.id 
      ORDER BY b.created_at DESC
    `).all();
    res.json({ success: true, bugs });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.patch('/api/admin/bugs/:id', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  const { status } = req.body;
  const { id } = req.params;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    db.prepare('UPDATE bug_reports SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.post('/api/vouchers/redeem', express.json(), async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const code = req.body.code?.trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "Kod vouchera jest wymagany." });

    const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(code) as any;
    if (!voucher) return res.status(404).json({ error: "Nieprawidłowy kod vouchera." });

    if (voucher.max_uses > 0 && voucher.uses >= voucher.max_uses) {
      return res.status(400).json({ error: "Voucher został już w pełni wykorzystany." });
    }

    const alreadyRedeemed = db.prepare('SELECT 1 FROM redeemed_vouchers WHERE code = ? AND user_id = ?').get(code, decoded.id);
    if (alreadyRedeemed) return res.status(400).json({ error: "Już zrealizowałeś ten voucher." });

    const now = Date.now();
    const expiresAt = voucher.duration ? now + voucher.duration : null;

    const guildId = req.body.guildId?.trim();

    db.transaction(() => {
      if (voucher.type === 'user_premium') {
        // Here we could set premium_expires_at if we had the column, but let's just set premium = 1
        db.prepare('UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?').run(expiresAt, decoded.id);
      } else if (voucher.type === 'guild_premium') {
        if (!guildId) {
          throw new Error("requires_guild_id");
        }
        db.prepare('INSERT INTO guilds_premium (guild_id, added_by, active) VALUES (?, ?, 1) ON CONFLICT(guild_id) DO UPDATE SET active = 1, added_by = excluded.added_by').run(guildId, decoded.id);
      } else {
        throw new Error("Unknown voucher type");
      }

      db.prepare('INSERT INTO redeemed_vouchers (code, user_id, redeemed_at) VALUES (?, ?, ?)').run(code, decoded.id, now);
      
      const newUses = voucher.uses + 1;
      if (voucher.max_uses > 0 && newUses >= voucher.max_uses) {
        db.prepare('DELETE FROM vouchers WHERE code = ?').run(code);
      } else {
        db.prepare('UPDATE vouchers SET uses = ? WHERE code = ?').run(newUses, code);
      }
    })();

    res.json({ success: true, message: "Konto Premium zostało aktywowane pomyślnie!" });
  } catch(err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || "Błąd serwera." });
  }
});

app.post('/api/stripe/checkout', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    if (!stripeClient) {
      console.log("[Stripe] Mocking checkout for user", decoded.id);
      // Mock the payment process
      const expiresAt = Date.now() + ms('30d');
      db.prepare("UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?").run(expiresAt, decoded.id);
      return res.json({ url: `${getRedirectUri(req).replace('/api/auth/callback', '')}?checkout=success` });
    }

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      client_reference_id: decoded.id, // Store their discord ID
      success_url: `${getRedirectUri(req).replace('/api/auth/callback', '')}?checkout=success`,
      cancel_url: `${getRedirectUri(req).replace('/api/auth/callback', '')}?checkout=cancel`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

app.post('/api/stripe/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    if (!stripeClient) throw new Error("Stripe not configured");
    event = stripeClient.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
    const discordId = session.client_reference_id;
    if (discordId) {
      const expiresAt = Date.now() + ms('30d');
      db.prepare(`UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?`).run(expiresAt, discordId);
    }
  }

  // Handle subscription cancel/end events if you want...
  
  res.json({received: true});
});

// Set up the Discord Bot handles events below

player.events.on('playerStart', async (queue, track) => {
  // Ensure audio is clear and not overly bassy by resetting filters
    try {
      // Ensure audio filters are clean to avoid distortion/bassboost
      if (queue.filters.ffmpeg) {
         await queue.filters.ffmpeg.setFilters([]);
      }
      
      // Explicitly set volume to a clear level
      queue.node.setVolume(75);
    } catch(e) {}

  logEvent('info', 'bot', `Rozpoczęto odtwarzanie: ${track.title}`, { guild: queue.guild.name, author: track.author });
  const guildId = queue.guild.id;
  const history = playbackHistory.get(guildId) || [];
  history.unshift({
    title: track.title,
    author: track.author,
    duration: track.duration,
    playedAt: Date.now(),
    url: track.url
  });
  if (history.length > 50) history.pop();
  playbackHistory.set(guildId, history);

  try {
    // Premium welcome message removed to keep it simple and clean
  } catch(e) {
    console.error('Błąd podczas witania premium: ', e);
  }
});

player.events.on('error', async (queue, error) => {
  logEvent('error', 'bot', `Player Engine Error: ${error.message}`, { guild: queue.guild.name, error: error.stack });
  
  if (error.message.toLowerCase().includes('decipher') || error.message.toLowerCase().includes('signature')) {
    logEvent('info', 'bot', 'Wykryto błąd YouTube Signature. Uruchamiam automatyczną naprawę silnika...');
    await performSystemRepair();
    queue.metadata?.channel?.send('⚠️ Wykryto problem z odtwarzaniem. System autonaprawy został uruchomiony. Spróbuj dodać utwór ponownie.');
  }
});

player.events.on('playerError', (queue, error) => {
  logEvent('error', 'bot', `Player Connection Error: ${error.message}`, { guild: queue.guild.name, error: error.stack });
});
player.events.on('emptyChannel', (queue) => {
  queue.metadata.channel?.send('Kanał głosowy jest pusty. Zatrzymuję odtwarzacz...');
});

client.on('ready', async () => {
  botStatus.state = 'online';
  botStatus.tag = client.user?.tag || '';
  botStartTime = Date.now();
  
  if (client.user) {
    client.user.setActivity('music | /play', { type: ActivityType.Listening });
  }

  console.log(`[Discord] Logged in as ${client.user?.tag}`);
  
  // Staggered loading of extractors to prevent blocking the event loop on startup
  setTimeout(async () => {
    try {
      console.log('[Discord] Loading primary YouTube extractor...');
      // Use higher quality settings for YouTubei
      await player.extractors.register(YoutubeiExtractor, {
          useServerAbrStream: true,
          streamOptions: {
              highWaterMark: 1024 * 1024 * 4, // Increased to 4MB for better buffering
              useClient: 'TV_EMBEDDED', // Changed to TV_EMBEDDED for better format availability
          }
      });
      
      // Delay further to give the server breathing room during probe window
      setTimeout(async () => {
        console.log('[Discord] Loading secondary extractors...');
        await player.extractors.loadMulti(DefaultExtractors);
        logEvent('info', 'bot', 'Extractors loaded successfully (Quality optimized)');
      }, 5000);
    } catch(e: any) {
      logEvent('error', 'bot', `Failed to load extractors: ${e?.message || 'Unknown error'}`, e);
    }
  }, 3000);

  // Register slash commands
  if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== "YOUR_DISCORD_BOT_TOKEN_HERE") {
    try {
      const commands = [
        ...adminCommandsDefinitions,
        new SlashCommandBuilder()
          .setName('join')
          .setDescription('Dołącza do kanału głosowego'),
        new SlashCommandBuilder()
          .setName('play')
          .setDescription('Odtwarza utwór')
          .addStringOption(option => 
            option.setName('song')
              .setDescription('Wpisz co chcesz posłuchać')
              .setRequired(true)),
        new SlashCommandBuilder()
          .setName('search')
          .setDescription('Szukaj utworu i wybierz z listy')
          .addStringOption(option => 
            option.setName('query')
              .setDescription('Czego szukasz?')
              .setRequired(true)),
        new SlashCommandBuilder()
          .setName('pause')
          .setDescription('Wstrzymuje odtwarzanie'),
        new SlashCommandBuilder()
          .setName('resume')
          .setDescription('Wznawia odtwarzanie'),
        new SlashCommandBuilder()
          .setName('skip')
          .setDescription('Pomija obecny utwór'),
        new SlashCommandBuilder()
          .setName('stop')
          .setDescription('Zatrzymuje bota i czyści kolejkę'),
        new SlashCommandBuilder()
          .setName('volume')
          .setDescription('Ustawia głośność')
          .addIntegerOption(option => 
            option.setName('level')
              .setDescription('Poziom głośności (0-100)')
              .setRequired(true))
      ].map(c => c.toJSON());

      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
      
      await rest.put(Routes.applicationCommands(client.user!.id), { body: commands });
      console.log('[Discord] Successfully registered global slash commands.');
      
      // Removed per-guild registration to speed up startup
    } catch (error) {
      console.error('[Discord] Error registering commands:', error);
    }
  }
});

async function bootstrapBot() {
  // Start the bot if a token is provided
  if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== "YOUR_DISCORD_BOT_TOKEN_HERE") {
    console.log('[Discord] Connecting...');
    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (err: any) {
        console.error(`[Discord] Login failed:`, err.message);
    }
  } else {
    console.log('[Discord] No valid DISCORD_TOKEN provided. Application requires token in Settings.');
  }
}

// Admin and Bot status helpers

// API Routes
app.get("/api/status", (req, res) => {
  if (client.isReady()) {
    botStatus.guilds = client.guilds.cache.size;
    botStatus.ping = client.ws.ping;
    botStatus.uptime = Math.floor((Date.now() - botStartTime) / 1000);
  }
  
  if (botStatus.state === 'online') {
    res.json({
      ...botStatus,
      inviteUrl: client.user ? `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=3148800&scope=bot%20applications.commands` : null
    });
  } else {
    res.json({
      state: 'offline',
      guilds: 0,
      ping: 0,
      tag: 'Podaj DISCORD_TOKEN',
      uptime: 0,
      mockMode: true
    });
  }
});

app.get("/api/players", (req, res) => {
  const playersInfo = [];
  if (client.isReady() && player.nodes) {
    for (const [guildId, queue] of player.nodes.cache) {
      if (!queue) continue;
      const currentTrack = queue.currentTrack;
      playersInfo.push({
        guildId: guildId,
        guildName: queue.guild.name,
        channelName: queue.channel?.name || 'Voice',
        nowPlaying: currentTrack ? {
          title: currentTrack.title,
          author: currentTrack.author,
          duration: Math.floor(currentTrack.durationMS / 1000),
          current: Math.floor(queue.node.streamTime / 1000),
          thumbnail: currentTrack.thumbnail
        } : null,
        queueLength: queue.tracks.size,
        queue: queue.tracks.toArray().map((t, idx) => ({
          id: t.id,
          title: t.title,
          author: t.author,
          duration: Math.floor(t.durationMS / 1000),
          thumbnailColor: "bg-indigo-500"
        })),
        history: playbackHistory.get(guildId) || [],
        state: queue.node.isPaused() ? "paused" : "playing",
        volume: queue.node.volume
      });
    }
  }
  res.json(playersInfo);
});

app.delete("/api/players/:guildId/queue/:trackId", (req, res) => {
  const { guildId, trackId } = req.params;
  const queue = player.nodes.get(guildId);
  if (!queue) return res.status(404).json({ success: false, error: "Player not found" });

  try {
    const trackToRemove = queue.tracks.toArray().find(t => t.id === trackId);
    if (!trackToRemove) return res.status(404).json({ success: false, error: "Track not found" });

    queue.node.remove(trackToRemove);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.post("/api/players/:guildId/queue/move", express.json(), (req, res) => {
  const { guildId } = req.params;
  const { from, to } = req.body;
  const queue = player.nodes.get(guildId);
  if (!queue) return res.status(404).json({ success: false, error: "Player not found" });

  try {
    // discord-player uses moveTrack(track, position) or similar
    // Note: queue.tracks is a QueueStrategy (usually LinkedList or Array)
    const tracks = queue.tracks.toArray();
    if (from < 0 || from >= tracks.length || to < 0 || to >= tracks.length) {
      return res.status(400).json({ success: false, error: "Invalid positions" });
    }

    const track = tracks[from];
    queue.node.move(track, to);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// Handle Discord Bot Interactions
client.on('interactionCreate', async interaction => {
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'search_results') {
      const songUrl = interaction.values[0];
    const member = interaction.member as any;
      const voiceChannel = member.voice?.channel;
      
      if (!voiceChannel) {
        return interaction.reply({ content: 'Musisz być na kanale głosowym aby tego użyć!', flags: MessageFlags.Ephemeral });
      }
      
      await interaction.deferReply();
      try {
        const results = await player.search(songUrl, { 
          requestedBy: member.user,
          searchEngine: "auto" 
        });

        if (!results.hasTracks()) {
          return interaction.followUp('❌ Nie udało się znaleźć tego utworu.');
        }

        const { track } = await player.play(voiceChannel, results, {
          nodeOptions: {
            metadata: interaction,
            volume: 80,
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 300000,
            leaveOnEnd: true,
            leaveOnEndCooldown: 300000,
            bufferingTimeout: 20000,
          }
        });
        await interaction.message.delete().catch(() => {});
        await interaction.followUp(`🎵 Z listy wybrano i dodano: **${track.title}**`);
      } catch (e) {
        console.error(e);
        await interaction.followUp('Wystąpił błąd podczas odtwarzania utworu.');
      }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName, guildId } = interaction;
  
  if (!guildId) {
    await interaction.reply({ content: 'Komendy mogą być używane tylko na serwerze.', ephemeral: true });
    return;
  }
  
  if (await handleAdminCommands(interaction)) return;
  
  const member = interaction.member as any;
  const voiceChannel = member.voice?.channel;

  if (commandName === 'join') {
    if (!voiceChannel) {
      return interaction.reply({ content: 'Musisz być na kanale głosowym aby tego użyć!', flags: MessageFlags.Ephemeral });
    }
    
    await interaction.deferReply();
    try {
      let queue = player.nodes.get(guildId);
      if (!queue) {
        queue = player.nodes.create(interaction.guild!, {
          metadata: interaction,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 300000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 300000,
        });
      }
      if (!queue.connection) {
        await queue.connect(voiceChannel);
      }
      await interaction.followUp('✅ Dołączono do kanału głosowego!');
    } catch (e) {
      console.error(e);
      await interaction.followUp('❌ Nie udało się dołączyć do kanału głosowego.');
    }
  } else if (commandName === 'play') {
    if (!voiceChannel) {
      return interaction.reply({ content: 'Musisz być na kanale głosowym aby tego użyć!', flags: MessageFlags.Ephemeral });
    }
    
    await interaction.deferReply();
    let song = interaction.options.getString('song', true);
    
    // Basic cleanup of short-links and tracking params
    if (song.includes('youtube.com/shorts/')) {
        song = song.replace('youtube.com/shorts/', 'youtube.com/watch?v=');
    }
    if (song.includes('?si=')) {
      song = song.split('?si=')[0];
    }
    
    try {
      const isUrl = song.startsWith('http');
      const results = await player.search(song, {
        requestedBy: interaction.user,
        searchEngine: isUrl ? "auto" : "youtube"
      });

      if (!results.hasTracks()) {
        return interaction.followUp(`❌ Nie znaleziono nic dla: **${song}**`);
      }

      const { track } = await player.play(voiceChannel, results, {
        nodeOptions: {
          metadata: interaction,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 300000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 300000,
          selfDeaf: true,
          bufferingTimeout: 20000,
        }
      });

      if (results.playlist) {
         await interaction.followUp(`🎵 Dodano playlistę **${results.playlist.title}** (${results.tracks.length} utworów).`);
      } else {
         await interaction.followUp(`🎵 Dodano do kolejki: **${track.title}**`);
      }
    } catch (e: any) {
      console.error(e);
      const errorMessage = e.message || '';
      if (errorMessage.includes('decipher')) {
         await interaction.followUp('❌ Błąd YouTube (signature decipher). Próbuję zrestartować silnik... Spróbuj ponownie za chwilę.');
         // Potentially re-initialize or log for admin
         logEvent('error', 'bot', 'Signature decipher error detected during play', { error: e.stack });
      } else {
         await interaction.followUp('Wystąpił błąd. Jeśli to link do YouTube, spróbuj wyszukać utwór wpisując jego nazwę w `/search` lub użyj innego źródła.');
      }
    }
  } else if (commandName === 'search') {
    if (!voiceChannel) {
      return interaction.reply({ content: 'Musisz być na kanale głosowym aby tego użyć!', flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    let query = interaction.options.getString('query', true);
    if (query.includes('?si=')) {
      query = query.split('?si=')[0];
    }

    try {
      const isUrl = query.startsWith('http');
      const results = await player.search(query, {
        requestedBy: interaction.user,
        searchEngine: isUrl ? "auto" : "youtube"
      });

      if (!results.hasTracks()) {
        return interaction.followUp("Niestety nic nie znaleziono.");
      }

      const tracks = results.tracks.slice(0, 10);
      
    const select = new StringSelectMenuBuilder()
        .setCustomId('search_results')
        .setPlaceholder('Wybierz utwór do odtworzenia')
        .addOptions(
          tracks.map((track, i) => 
            new StringSelectMenuOptionBuilder()
              .setLabel(track.title.substring(0, 100))
              .setDescription(`${track.author.substring(0, 80)} - ${track.duration}`)
              .setValue(track.url)
          )
        );

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select);

      await interaction.followUp({
        content: `Oto co znalazłem dla **${query}**:`,
        components: [row]
      });

    } catch (e) {
      console.error(e);
      await interaction.followUp('Wystąpił błąd podczas wyszukiwania. Spróbuj zmodyfikować zapytanie.');
    }
  } else if (commandName === 'pause') {
    const queue = player.nodes.get(guildId);
    if (!queue || !queue.isPlaying()) return interaction.reply({ content: 'Nie ma czego pauzować.', ephemeral: true });
    queue.node.setPaused(true);
    await interaction.reply('⏸️ Zapauzowano.');
  } else if (commandName === 'resume') {
    const queue = player.nodes.get(guildId);
    if (!queue) return interaction.reply({ content: 'Brak aktywnego odtwarzania.', ephemeral: true });
    queue.node.setPaused(false);
    await interaction.reply('▶️ Wznowiono.');
  } else if (commandName === 'skip') {
    const queue = player.nodes.get(guildId);
    if (!queue) return interaction.reply({ content: 'Brak utworu do pominięcia.', ephemeral: true });
    queue.node.skip();
    await interaction.reply('⏭️ Pominięto utwór.');
  } else if (commandName === 'stop') {
    const queue = player.nodes.get(guildId);
    if (!queue) return interaction.reply({ content: 'Brak aktywnego odtwarzania.', ephemeral: true });
    queue.delete();
    await interaction.reply('⏹️ Odtwarzacz zatrzymany, kolejka wyczyszczona.');
  } else if (commandName === 'volume') {
    const level = interaction.options.getInteger('level', true);
    const queue = player.nodes.get(guildId);
    if (!queue) return interaction.reply({ content: 'Brak aktywnego odtwarzania.', ephemeral: true });
    const clampedLevel = Math.max(0, Math.min(100, level));
    queue.node.setVolume(clampedLevel);
    await interaction.reply(`🔊 Głośność zmieniona na ${clampedLevel}%`);
  }
});

// Dashboard Web API hooks
app.post("/api/players/:guildId/volume", (req, res) => {
  const { guildId } = req.params;
  const { volume } = req.body;
  const queue = player.nodes.get(guildId);
  
  if (queue && typeof volume === "number") {
    queue.node.setVolume(volume);
    res.json({ success: true, volume });
  } else {
    res.status(404).json({ error: "Player not found" });
  }
});

app.post("/api/players/:guildId/playback", (req, res) => {
  const { guildId } = req.params;
  const { state } = req.body;
  const queue = player.nodes.get(guildId);
  
  if (queue && (state === "playing" || state === "paused")) {
    queue.node.setPaused(state === "paused");
    res.json({ success: true, state });
  } else {
    res.status(404).json({ error: "Player not found" });
  }
});

app.post("/api/players/:guildId/skip", (req, res) => {
  const { guildId } = req.params;
  const queue = player.nodes.get(guildId);
  
  if (queue) {
    queue.node.skip();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Player not found" });
  }
});

app.post("/api/players/:guildId/clear", (req, res) => {
  const { guildId } = req.params;
  const queue = player.nodes.get(guildId);
  
  if (queue) {
    queue.tracks.clear();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Player not found" });
  }
});

app.get("/api/search", async (req, res) => {
  const { query } = req.query;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing query" });
  }
  if (!client.isReady()) {
    return res.status(503).json({ error: "Bot not ready" });
  }
  try {
    const results = await player.search(query, { searchEngine: "auto" });
    const tracks = results.tracks.slice(0, 10).map((t) => ({
      title: t.title,
      author: t.author,
      duration: t.duration,
      durationMS: t.durationMS,
      url: t.url,
      thumbnail: t.thumbnail
    }));
    res.json({ success: true, tracks });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

app.post("/api/players/:guildId/play", async (req, res) => {
  const { guildId } = req.params;
  const { url } = req.body;
  
  const queue = player.nodes.get(guildId);
  
  if (queue) {
    try {
      const results = await player.search(url, { searchEngine: "auto" });
      if (results.hasTracks()) {
         queue.addTrack(results.tracks[0]);
         res.json({ success: true, track: results.tracks[0].title });
      } else {
         res.status(404).json({ error: "Track not found" });
      }
    } catch(err) {
      console.error("Add track error:", err);
      res.status(500).json({ error: "Failed to add track" });
    }
  } else {
    res.status(400).json({ error: "Użyj komendy /play na Discordzie, aby najpierw dołączyć bota do kanału głosowego." });
  }
});

    // Initialize Vite/Static serving after all API routes
    if (process.env.NODE_ENV !== "production") {
        try {
            const vite = await createViteServer({
                server: { middlewareMode: true },
                appType: "spa",
            });
            app.use(vite.middlewares);
        } catch (err) {
            console.error('Failed to init Vite middleware:', err);
        }
    } else {
        const distPath = path.join(process.cwd(), 'build');
        app.use(express.static(distPath));
    }

    // Final SPA fallback for production (MUST be after all routes)
    if (process.env.NODE_ENV === "production") {
        const distPath = path.join(process.cwd(), 'build');
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }

    // Start the bot
    await bootstrapBot();
}

bootstrap();
