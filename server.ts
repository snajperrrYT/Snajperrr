import express from "express";
import path from "path";
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { 
    Client, 
    GatewayIntentBits, 
    ActivityType, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    GuildMember, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ActionRowBuilder, 
    ComponentType, 
    MessageFlags 
} from "discord.js";
import { Player } from "discord-player";
import { DefaultExtractors } from "@discord-player/extractor";
import { YoutubeiExtractor } from "discord-player-youtubei";
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import crypto from 'crypto';
import ms from 'ms';
import { GoogleGenAI } from "@google/genai";
import nodemailer from 'nodemailer';
import db from './src/db.ts';
import { adminCommandsDefinitions, handleAdminCommands } from './src/adminCommands.ts';

const app = express();
const portEnv = process.env.PORT;
const parsedPort = portEnv ? Number.parseInt(portEnv, 10) : Number.NaN;
const PORT = Number.isNaN(parsedPort) ? 3000 : parsedPort;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1470848278718316636';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || 'r1nFnl5Upci2rmiDi1WA5UlSk6XiQrLX';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_jwt';
const YOUTUBE_COOKIES = process.env.YOUTUBE_COOKIES || '';

// Shared globally
let client: Client;
let player: Player;
let botStartTime = 0;
let botStatus: any = { 
    state: 'offline', 
    guilds: 0, 
    ping: 0, 
    tag: '',
    uptime: 0
};

// API middleware to prevent caching and handle basic rate limit headers
app.use('/api', (req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

// JSON and Cookie middlewares registered IMMEDIATELY
app.use((req, res, next) => {
    if (req.originalUrl === '/api/stripe/webhook') {
        next();
    } else {
        express.json()(req, res, next);
    }
});
app.use(cookieParser());

let playbackHistory = new Map<string, any[]>();
let stripeClient: Stripe | null = null;
let aiAssistant: GoogleGenAI | null = null;
let repairCooldown = false;
let lastRepairAttempt = 0;

// Initialize clients
const geminiKey = process.env.GEMINI_API_KEY;
if (geminiKey && geminiKey !== 'MY_GEMINI_API_KEY' && !geminiKey.startsWith('YOUR_')) {
    aiAssistant = new GoogleGenAI({ apiKey: geminiKey });
}
if (process.env.STRIPE_SECRET_KEY) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
}

client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
    ],
});
player = new Player(client, {
    skipFFmpeg: false,
    connectionTimeout: 60000,
});

// API Routes
app.get('/api/health', (req, res) => {
    logEvent('info', 'system', 'Health check performed.');
    res.status(200).send('OK');
});

app.get('/api/status', (req, res) => {
    const hasToken = !!(process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== "YOUR_DISCORD_BOT_TOKEN_HERE");
    const isReady = client && client.isReady();
    const inviteUrl = DISCORD_CLIENT_ID
        ? `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&scope=bot+applications.commands&permissions=8`
        : undefined;
    res.json({
        state: isReady ? 'online' : 'offline',
        tag: isReady ? (client.user?.tag || botStatus.tag) : botStatus.tag,
        guilds: isReady ? client.guilds.cache.size : botStatus.guilds,
        ping: isReady ? client.ws.ping : botStatus.ping,
        uptime: botStartTime > 0 ? Math.floor((Date.now() - botStartTime) / 1000) : 0,
        mockMode: !hasToken,
        inviteUrl,
        supportServerUrl: process.env.DISCORD_SERVER_INVITE || 'https://discord.gg/MRN4WDUMKv',
    });
});

app.get('/api/admin/system/version', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    const currentVersion = "2.4.0-stable";
    let latestVersion = currentVersion;
    try {
        const ghRes = await fetch('https://api.github.com/repos/bbbbbbbbbc/Snajperrr/releases/latest', {
            headers: { 'User-Agent': 'Snajperrr-Dashboard' }
        });
        if (ghRes.ok) {
            const data: any = await ghRes.json();
            latestVersion = data.tag_name || currentVersion;
        }
    } catch (e) {
        console.warn('Could not fetch latest version from GitHub');
    }

    res.json({ 
        success: true, 
        current: currentVersion, 
        latest: latestVersion,
        needsUpdate: currentVersion !== latestVersion 
    });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/system/update', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    logEvent('info', 'System', 'Użytkownik zainicjował ręczną aktualizację/naprawę systemu.');
    performSystemRepair();
    
    res.json({ success: true, message: "Inicjowanie aktualizacji extractors i czyszczenie pamięci podręcznej..." });
  } catch(err) { res.status(500).json({ success: false }); }
});

// Catch all unhandled process errors early
process.on('unhandledRejection', (reason) => {
  console.error(`Unhandled Rejection:`, reason);
});
process.on('uncaughtException', (error) => {
  console.error(`Uncaught Exception:`, error);
});

// Dynamic stream options
(player as any).onBeforeCreateStream = async (track: any, queryType: any, queue: any) => {
    const userId = queue.metadata?.user?.id || queue.metadata?.member?.id || (queue.metadata?.interaction?.user?.id);
    if (!userId) return;

    const user = db.prepare('SELECT audio_quality, premium FROM users WHERE id = ?').get(userId) as any;
    if (!user) return;

    let quality = user.audio_quality || 'standard';
    if (user.premium !== 1 && quality === 'ultra') quality = 'high';

    if (track.extractor?.identifier === 'youtubei' || track.source === 'youtube') {
        console.log(`[YouTube] Extracting stream for: ${track.title} (Client: WEB_EMBEDDED)`);
        return {
            useServerAbrStream: false,
            disableStreamPreExtraction: true,
            streamOptions: {
                useClient: 'WEB_EMBEDDED',
                highWaterMark: quality === 'ultra' ? 1024 * 1024 * 64 : (quality === 'high' ? 1024 * 1024 * 32 : 1024 * 1024 * 8)
            }
        };
    }
};

const analyzeAndStoreSolution = async (logId: number, message: string, details: string) => {
    if (!aiAssistant) return;
    try {
        const prompt = `Jesteś systemem autodiagnostyki bota muzycznego. Wystąpił błąd:\nWIADOMOŚĆ: ${message}\nSZCZEGÓŁY: ${details}\n\nPodaj krótkie, konkretne rozwiązanie (max 2 zdania). Jeśli to błąd YouTube (decipher), zasugeruj "Restart Silnika Extractors".\nOdpowiedz w JSON: {"solution": "treść", "canAutoFix": true/false}`;
        
        const response = await aiAssistant.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        const text = response.text;
        
        const data = JSON.parse(text || '{}');
        if (data.solution) {
            db.prepare('UPDATE system_logs SET solution = ? WHERE id = ?').run(data.solution, logId);
        }
    } catch (err: any) {
        // Disable AI assistant if hit with auth errors to prevent log flooding
        if (err.message?.includes('API key not valid') || err.message?.includes('INVALID_ARGUMENT')) {
            console.warn('[AI] Gemini API Key is invalid. Disabling AI Assistant features.');
            aiAssistant = null;
        } else {
            console.error('AI Analysis Error (Background):', err);
        }
    }
};

const logEvent = (level: 'info' | 'warn' | 'error', source: string, message: string, details?: any) => {
    try {
        let detailsStr = null;
        if (details) {
            if (details instanceof Error) {
                detailsStr = `${details.message}\n${details.stack}`;
            } else if (typeof details === 'object') {
                detailsStr = JSON.stringify(details, null, 2);
            } else {
                detailsStr = String(details);
            }
        }
        
        const result = db.prepare('INSERT INTO system_logs (level, source, message, details, created_at) VALUES (?, ?, ?, ?, ?)')
            .run(level, source, message, detailsStr, Date.now());
        
        const logId = result.lastInsertRowid as number;

        if (level === 'error' || level === 'warn') {
            const msg = message.toLowerCase();
            if (level === 'error' && (msg.includes('decipher') || msg.includes('signature') || msg.includes('youtubejs') || msg.includes('streaming data not available'))) {
                performSystemRepair();
            }
            
            if (aiAssistant && level === 'error') {
                analyzeAndStoreSolution(logId, message, detailsStr || '');
            }

            // Notify admins via DM if it's an error and bot is ready
            if (client && client.isReady()) {
                notifyAdmins(level, source, message, detailsStr || '');
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

async function notifyAdmins(level: string, source: string, message: string, details?: string) {
    try {
        // Check if notifications are enabled
        const setting = db.prepare("SELECT value FROM global_settings WHERE key = 'admin_dm_notifications'").get() as any;
        if (!setting || setting.value !== '1') return;

        // Only notify about certain sources or high level errors to avoid spam
        if (level === 'warn' && !message.toLowerCase().includes('critical') && !message.toLowerCase().includes('fail')) return;

        const admins = db.prepare("SELECT id FROM users WHERE is_admin = 1").all() as any[];
        if (admins.length === 0) return;

        const embed = {
            title: `🚨 System Alert: ${level.toUpperCase()}`,
            color: level === 'error' ? 0xff0000 : 0xffaa00,
            fields: [
                { name: 'Source', value: source, inline: true },
                { name: 'Time', value: new Date().toLocaleString(), inline: true },
                { name: 'Message', value: message.substring(0, 1024) }
            ],
            footer: { text: 'Snajperrr Monitoring System' },
            timestamp: new Date().toISOString()
        };

        if (details) {
            const cleanDetails = details.length > 900 ? details.substring(0, 900) + '...' : details;
            (embed.fields as any).push({ name: 'Details', value: `\`\`\`\n${cleanDetails}\n\`\`\`` });
        }

        for (const admin of admins) {
            try {
                const user = await client.users.fetch(admin.id);
                if (user) {
                    await user.send({ embeds: [embed] });
                }
            } catch (e) {
                // Silently fail if DM is blocked or user not found
            }
        }
    } catch (e) {
        console.error('Failed to notify admins:', e);
    }
}

    const performSystemRepair = async () => {
        if (repairCooldown && Date.now() - lastRepairAttempt < 60000) return false;
        repairCooldown = true;
        lastRepairAttempt = Date.now();
        logEvent('warn', 'system', 'Inicjowanie procedury autonaprawy (Stabilizacja Audio WEB_EMBEDDED)...');
        try {
            try { await player.extractors.unregister(YoutubeiExtractor.identifier); } catch(e) {}
            await player.extractors.register(YoutubeiExtractor, {
                useServerAbrStream: false,
                ...(YOUTUBE_COOKIES ? { cookie: YOUTUBE_COOKIES } : {}),
                streamOptions: {
                    useClient: 'WEB_EMBEDDED',
                    highWaterMark: 1024 * 1024 * 32,
                }
            });
            await player.extractors.loadMulti(DefaultExtractors);
            db.prepare("UPDATE system_stats SET value = ? WHERE key = 'last_repair'").run(Date.now().toString());
            logEvent('info', 'system', 'System naprawiony pomyślnie. Zastosowano profil WEB_EMBEDDED dla audio.');
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

    // Use global variables already declared at the top level
    lastRepairAttempt = 0;
    repairCooldown = false;
    playbackHistory.clear();

function getRedirectUri(req: express.Request) {
    const xHost = req.headers['x-forwarded-host'];
    const xProto = req.headers['x-forwarded-proto'];
    const hostHeader = req.headers.host || '';
    
    // In Cloud Run/AI Studio environment, we usually get x-forwarded-host
    // It can be a comma-separated list: "domain1, domain2"
    const rawHost = Array.isArray(xHost) ? xHost[0] : (xHost || hostHeader);
    const host = rawHost.split(',')[0].trim();
    const protocol = (Array.isArray(xProto) ? xProto[0] : xProto) || 'https';
    
    // Clean host: remove port and convert to lowercase for comparison
    const cleanHost = host.split(':')[0].toLowerCase();
    const isLocal = cleanHost.includes('localhost') || cleanHost.includes('127.0.0.1');

    console.log(`[Auth] Debug Redirect: host="${host}", clean="${cleanHost}", proto="${protocol}", xHost="${xHost}", xProto="${xProto}", APP_URL="${process.env.APP_URL}"`);

    let finalUri: string;

    // PRIORITY 1: Use APP_URL if explicitly set (most reliable for Cloud Run)
    if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL' && process.env.APP_URL.startsWith('http')) {
        const base = process.env.APP_URL.endsWith('/') ? process.env.APP_URL.slice(0, -1) : process.env.APP_URL;
        finalUri = `${base}/api/auth/callback`;
    }
    // PRIORITY 2: Local development
    else if (isLocal) {
        finalUri = `http://localhost:3000/api/auth/callback`;
    }
    // PRIORITY 3: Cloud Run domains (detected from headers)
    else if (cleanHost.endsWith('.run.app')) {
        finalUri = `https://${cleanHost}/api/auth/callback`;
    }
    // PRIORITY 4: Fallback to protocol + host
    else {
        finalUri = `${protocol}://${cleanHost}/api/auth/callback`;
    }

    console.log(`[Auth] Redirect URI generated: "${finalUri}"`);
    return finalUri;
}

app.get('/api/auth/url', (req, res) => {
  const redirectUri = getRedirectUri(req);
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'identify email guilds',
  });
  console.log(`[Auth] Login attempt. ID: ${DISCORD_CLIENT_ID}. Redirect: ${redirectUri}`);
  res.json({ url: `https://discord.com/api/oauth2/authorize?${params}` });
});

app.get('/api/auth/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;
  
  if (error) {
    console.error(`[Auth Callback] Discord returned error: ${error} - ${error_description}`);
    return res.status(400).send(`Auth error from Discord: ${error_description || error}`);
  }

  // Try to use the host from headers
  const redirectUri = getRedirectUri(req);
  console.log('[Auth Callback] Debug Info:', {
    headers: req.headers,
    redirectUri: redirectUri,
    query: req.query
  });
  console.log('[Auth Callback] Code exchange starting...', { 
    hasCode: !!code, 
    redirectUri: redirectUri,
    host: req.headers.host,
    xHost: req.headers['x-forwarded-host']
  });

  if (!code) return res.status(400).send("No code provided");

  try {
    console.log('[Auth Callback] Fetching token from Discord...');
    const tokenParams = {
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET.substring(0, 4) + '...',
        grant_type: 'authorization_code',
        code: (code as string).substring(0, 5) + '...',
        redirect_uri: redirectUri,
    };
    console.log('[Auth Callback] Token request params (sanitized):', tokenParams);

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
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
        console.error('[Auth Callback] Token exchange failed:', tokenData);
        return res.send(`Failed to fetch OAuth token: ${tokenData.error_description || tokenData.error}`);
    }

    console.log('[Auth Callback] Token exchange successful, fetching user data...');
    const [userRes, guildsRes] = await Promise.all([
      fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }),
      fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      })
    ]);

    if (!userRes.ok) {
        const errData = await userRes.json();
        console.error('[Auth Callback] Failed to fetch @me:', errData);
        return res.status(userRes.status).send('Failed to fetch user data from Discord');
    }

    const userData = await userRes.json();
    console.log(`[Auth Callback] Logged in as: ${userData.username} (${userData.id})`);

    // Admin Failsafe for konradszczerbinski8@gmail.com
    if (userData.email === 'konradszczerbinski8@gmail.com') {
      db.prepare(`INSERT INTO users (id, username, avatar, is_admin) VALUES (?, ?, ?, 1) ON CONFLICT(id) DO UPDATE SET username=excluded.username, avatar=excluded.avatar, is_admin=1`).run(userData.id, userData.username, userData.avatar);
    } else {
      db.prepare(`INSERT INTO users (id, username, avatar) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET username=excluded.username, avatar=excluded.avatar`).run(userData.id, userData.username, userData.avatar);
    }

    if (userData.id === '1230509684138709056') {
      db.prepare('UPDATE users SET is_admin = 1 WHERE id = ?').run(userData.id);
    }

    const token = jwt.sign({ id: userData.id, username: userData.username, avatar: userData.avatar }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('auth_token', token, {
      secure: true,
      sameSite: 'lax',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <html>
        <head><title>Logging in...</title></head>
        <body>
          <script>
            console.log('[Auth] Login successful, sending message to opener');
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              setTimeout(() => window.close(), 100);
            } else {
              window.location.href = '/';
            }
          </script>
          <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
            <p>Logowanie udane. To okno zostanie zamknięte.</p>
            <p><a href="/">Kliknij tutaj, jeśli okno się nie zamknie automatycznie.</a></p>
          </div>
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

function parsePremiumSettings(raw: string | null): object | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

app.get('/api/me', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) {
    if (Object.keys(req.cookies).length > 0) {
      console.log('[API Me] Auth token missing. Other cookies present:', Object.keys(req.cookies));
    }
    return res.json({ loggedIn: false });
  }

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

    // Parse premium_settings JSON
    user.premium_settings = parsePremiumSettings(user.premium_settings);

    res.json({ loggedIn: true, user });
  } catch(err) {
    res.json({ loggedIn: false });
  }
});

app.post('/api/user/settings', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const { audioQuality, premiumSettings } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user) return res.status(404).json({ success: false, error: 'Użytkownik nie znaleziony.' });

    if (audioQuality !== undefined) {
      if (!['standard', 'high', 'ultra'].includes(audioQuality)) {
        return res.status(400).json({ success: false, error: 'Nieprawidłowy poziom jakości.' });
      }
      db.prepare('UPDATE users SET audio_quality = ? WHERE id = ?').run(audioQuality, decoded.id);
    }

    if (premiumSettings !== undefined) {
      if (user.premium !== 1) {
        return res.status(403).json({ success: false, error: 'Ustawienia premium wymagają subskrypcji Premium.' });
      }
      const existing = parsePremiumSettings(user.premium_settings) ?? {};
      const merged = { ...existing, ...premiumSettings };
      db.prepare('UPDATE users SET premium_settings = ? WHERE id = ?').run(JSON.stringify(merged), decoded.id);
    }

    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ success: false });
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

// --- Public Logs Endpoint ---
app.get('/api/public-logs', async (req, res) => {
  try {
    // Ensure table exists and provide clean feed
    const logs = db.prepare('SELECT level, source, message, details, created_at FROM system_logs ORDER BY created_at DESC LIMIT 150').all() as any[];
    res.setHeader('Cache-Control', 'no-cache');
    res.json({ success: true, logs });
  } catch(err) { 
    console.error('Public Logs Error:', err);
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

    const logs = db.prepare('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 500').all() as any[];
    res.json({ success: true, logs });
  } catch(err) { res.status(500).json({ success: false }); }
});

const sendLogsEmail = async (isAuto = false) => {
    const adminEmail = process.env.ADMIN_EMAIL || 'konradszczerbinski8@gmail.com';
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
        const error = "Konfiguracja SMTP nie jest kompletna. Sprawdź zmienne środowiskowe (SMTP_HOST, SMTP_USER, SMTP_PASS).";
        
        // Only log to DB if manually triggered to avoid noise from daily auto-export failing
        if (!isAuto) {
            logEvent('warn', 'EmailExport', error);
        } else {
            console.warn(`[AutoExport] ${error}`);
        }
        return { success: false, error };
    }

    try {
        const logs = db.prepare('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 1000').all() as any[];
        if (logs.length === 0) return { success: true, message: "Brak logów do przesłania." };

        const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
                user: smtpUser,
                pass: smtpPass
            }
        });

        const logsCsv = "ID,Level,Source,Message,Details,Date\n" + logs.map(l => {
            const date = new Date(l.created_at).toISOString();
            return `${l.id},${l.level},${l.source},"${l.message.replace(/"/g, '""')}","${(l.details || '').replace(/"/g, '""')}",${date}`;
        }).join('\n');

        const htmlContent = `
            <h2>Zrzut logów systemowych - Snajperrr</h2>
            <p>Data wygenerowania: ${new Date().toLocaleString()}</p>
            <p>Typ: ${isAuto ? 'Automatyczny' : 'Ręczny'}</p>
            <p>Łączna liczba logów: ${logs.length}</p>
            <hr>
            <p>Logi zostały dołączone w pliku CSV.</p>
        `;

        await transporter.sendMail({
            from: `"Snajperrr System" <${smtpUser}>`,
            to: adminEmail,
            subject: `[LOGS] Zrzut logów systemowych - ${new Date().toLocaleDateString()}`,
            html: htmlContent,
            attachments: [
                {
                    filename: `logs_${Date.now()}.csv`,
                    content: logsCsv
                }
            ]
        });

        logEvent('info', 'EmailExport', `Pomyślnie wysłano logi na adres: ${adminEmail}`);
        return { success: true };
    } catch (err: any) {
        logEvent('error', 'EmailExport', `Błąd wysyłki e-mail: ${err.message}`);
        return { success: false, error: err.message };
    }
};

app.post('/api/admin/logs/export', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    const result = await sendLogsEmail();
    res.json(result);
  } catch(err) { 
    console.error('Export error:', err);
    res.status(500).json({ success: false, error: 'Błąd podczas wysyłania e-maila.' }); 
  }
});

app.patch('/api/admin/logs/:id', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    const { solution } = req.body;
    db.prepare('UPDATE system_logs SET solution = ? WHERE id = ?').run(solution, req.params.id);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/logs/:id/analyze', async (req, res) => {
  // Logic moved to frontend, this endpoint now just returns success to avoid breaking frontend calls temporarily
  res.json({ success: true, analysis: "AI Analysis moved to frontend. Please check dashboard." });
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

app.get('/api/admin/system/debug', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    res.json({
        success: true,
        env: {
            NODE_ENV: process.env.NODE_ENV,
            DISCORD_CLIENT_ID: DISCORD_CLIENT_ID,
            HAS_DISCORD_SECRET: !!process.env.DISCORD_CLIENT_SECRET,
            HAS_BOT_TOKEN: !!process.env.DISCORD_TOKEN,
            APP_URL: process.env.APP_URL,
            PORT: process.env.PORT,
            JWT_SECRET_SET: process.env.JWT_SECRET !== undefined
        },
        headers: req.headers
    });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.get('/api/admin/settings', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    const settings = db.prepare('SELECT * FROM global_settings').all() as any[];
    const settingsObj = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    res.json({ success: true, settings: settingsObj });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/settings', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    const { settings } = req.body;
    if (settings && typeof settings === 'object') {
        const stmt = db.prepare('INSERT OR REPLACE INTO global_settings (key, value) VALUES (?, ?)');
        for (const [key, value] of Object.entries(settings)) {
            stmt.run(key, String(value));
        }
    }
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
      queue.node.setVolume(80);
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
  
  if (error.message.toLowerCase().includes('decipher') || 
      error.message.toLowerCase().includes('signature') || 
      error.message.toLowerCase().includes('unavailable')) {
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
  botStatus.guilds = client.guilds.cache.size;
  botStartTime = Date.now();
  
  if (client.user) {
    client.user.setActivity('music | /play', { type: ActivityType.Listening });
  }

  console.log(`[Discord] Logged in as ${client.user?.tag}`);
  
  // Staggered loading of extractors to prevent blocking the event loop on startup
  setTimeout(async () => {
    try {
      console.log('[Discord] Loading primary YouTube extractor...');
      // Set optimized settings for audio-only stability
      await player.extractors.register(YoutubeiExtractor, {
          useServerAbrStream: false,
          ...(YOUTUBE_COOKIES ? { cookie: YOUTUBE_COOKIES } : {}),
          streamOptions: {
              highWaterMark: 1024 * 1024 * 32, // Increased buffer for stability
              useClient: 'WEB_EMBEDDED', // WEB_EMBEDDED is robust for audio-only extraction
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
  if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== "YOUR_DISCORD_BOT_TOKEN_HERE") {
    console.log('[Discord] Connecting...');
    try {
        await client.login(process.env.DISCORD_TOKEN);
    } catch (err: any) {
        console.error(`[Discord] Login failed:`, err.message);
    }
  } else {
    console.log('[Discord] No valid DISCORD_TOKEN provided.');
  }
}

app.get("/api/players", (req, res) => {
  const playersInfo = [];
  try {
    if (client && client.isReady() && player && player.nodes) {
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
  } catch (err) {
    console.error("Error in /api/players:", err);
    res.status(500).json({ error: "Interal server error" });
  }
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
  // Global Maintenance Mode Check
  const maintenance = db.prepare("SELECT value FROM global_settings WHERE key = 'maintenance_mode'").get() as any;
  if (maintenance && maintenance.value === '1') {
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(interaction.user.id) as any;
    if (!user || user.is_admin !== 1) {
      const response = { content: '⚠️ **Tryb Konserwacji:** Bot jest obecnie niedostępny ze względu na prace techniczne. Spróbuj ponownie później.', ephemeral: true };
      if (interaction.isRepliable()) {
        return interaction.reply(response);
      }
      return;
    }
  }

  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === 'search_results') {
      const songUrl = interaction.values[0];
    const member = interaction.member as any;
      const voiceChannel = member.voice?.channel;
      
      if (!voiceChannel) {
        return interaction.reply({ content: 'Musisz być na kanale głosowym aby tego użyć!', ephemeral: true });
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
            selfDeaf: true,
            bufferingTimeout: 30000,
            connectionTimeout: 90000,
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
      return interaction.reply({ content: 'Musisz być na kanale głosowym aby tego użyć!', ephemeral: true });
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
      return interaction.reply({ content: 'Musisz być na kanale głosowym aby tego użyć!', ephemeral: true });
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
      const results = await player.search(song, {
        requestedBy: interaction.user,
        searchEngine: song.startsWith('http') ? "auto" : "youtube"
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
          bufferingTimeout: 30000,
          connectionTimeout: 90000,
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
      return interaction.reply({ content: 'Musisz być na kanale głosowym aby tego użyć!', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    let query = interaction.options.getString('query', true);
    if (query.includes('?si=')) {
      query = query.split('?si=')[0];
    }

    try {
      const results = await player.search(query, {
        requestedBy: interaction.user,
        searchEngine: query.startsWith('http') ? "auto" : "youtube"
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
  if (!client || !client.isReady() || !player) {
    return res.status(503).json({ error: "Bot not ready or initializing" });
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

// 2. Setup Static serving / Vite middleware
async function setupVite(app: express.Express) {
    if (process.env.NODE_ENV !== "production") {
        try {
            const { createServer: createViteServer } = await import("vite");
            const vite = await createViteServer({
                server: { middlewareMode: true },
                appType: "spa",
            });
            app.use(vite.middlewares);
        } catch (err) {
            console.error('Failed to init Vite middleware:', err);
        }
    } else {
        const distPath = path.join(process.cwd(), 'dist');
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
    }
}

// API Routes (Registered synchronously at the top level)

async function start() {
    console.log('[Startup] Starting server...');

    // Start listening FIRST so Cloud Run health checks pass immediately
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`[Startup] Server listening on port ${PORT}`);
    });

    console.log('[Startup] Setting up Vite...');
    await setupVite(app);

    // Auto-export logs every 24h
    setInterval(async () => {
        console.log('[AutoExport] Triggering scheduled logs export...');
        try {
            await sendLogsEmail(true);
        } catch (e) {
            console.error('[AutoExport] Failed to auto-export logs:', e);
        }
    }, 1000 * 60 * 60 * 24);

    // Bootstrap Discord bot in the background (non-blocking)
    const restOfInit = async () => {
        try {
            await bootstrapBot();
            console.log('[Startup] Bot logic started.');
        } catch (e) {
            console.error('[Startup] Bot bootstrap error:', e);
        }
    };
    
    restOfInit();
    
    logEvent('info', 'system', `Serwer bota uruchomiony na porcie ${PORT}. Gotowy do odtwarzania AUDIO.`);
    console.log('[Startup] Server fully initialized.');
}

start();

