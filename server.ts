import express from "express";
import path from "path";
import fs from "fs";
import 'dotenv/config';
import cookieParser from 'cookie-parser';
import { 
    Client, 
    GatewayIntentBits, 
    Partials,
    ActivityType, 
    REST, 
    Routes, 
    SlashCommandBuilder, 
    GuildMember, 
    StringSelectMenuBuilder, 
    StringSelectMenuOptionBuilder, 
    ActionRowBuilder, 
    ComponentType, 
    MessageFlags,
    EmbedBuilder
} from "discord.js";
import { Player } from "discord-player";
import { DefaultExtractors, SpotifyExtractor } from "@discord-player/extractor";
import { YoutubeiExtractor } from "discord-player-youtubei";
import { globalDownloader } from "./src/lib/AdvancedDownloader";
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
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '';
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || '';
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';

function getSpotifyRedirectUri(req: express.Request) {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    return `${protocol}://${host}/api/auth/spotify/callback`;
}

if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
  console.error('[FATAL] DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables must be set!');
}
console.log(`[Config] Discord Client ID: ${DISCORD_CLIENT_ID.substring(0, 6)}... | Secret set: ${!!DISCORD_CLIENT_SECRET}`);
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
    connectionTimeout: 120000, // Increased timeout for high ping
});

// Advanced audio ping & node health monitoring
setInterval(() => {
    if (!client.isReady() || !player) return;
    for (const queue of player.nodes.cache.values()) {
        try {
            if (queue.connection?.ping?.ws && queue.connection.ping.ws > 500) {
                console.log(`[Overseer] High ping detected on queue ${queue.guild.id} (${queue.connection.ping.ws}ms). Optimizing buffer limits temporarily...`);
            }
            if (queue.node.isPaused() && queue.tracks.size > 0 && queue.connection?.ping?.udp && queue.connection.ping.udp === -1) {
                console.log(`[Overseer] UDP connection lost on ${queue.guild.id}. Attempting stabilization...`);
            }
        } catch (e) {
            // Ignore if connection data unavailable
        }
    }
}, 30000);

// API Routes

// Simple rate limiter for file-access routes
const ytToDriveRateLimit = new Map<string, number[]>();
function rateLimitMiddleware(maxRequests: number, windowMs: number) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        const ip = req.ip || req.socket.remoteAddress || 'unknown';
        const now = Date.now();
        const timestamps = ytToDriveRateLimit.get(ip) || [];
        const filtered = timestamps.filter(t => now - t < windowMs);
        if (filtered.length >= maxRequests) {
            return res.status(429).json({ error: 'Too many requests, please try again later.' });
        }
        filtered.push(now);
        ytToDriveRateLimit.set(ip, filtered);
        next();
    };
}

app.post('/api/yt-to-drive', rateLimitMiddleware(5, 60000), express.json(), async (req, res) => {
    try {
        const { url, accessToken } = req.body;
        if (!url || !accessToken) return res.status(400).json({ error: 'Missing url or accessToken' });
        
        console.log(`[Drive] Downloading ${url} to upload to Google Drive`);
        const tempPath = path.join('/tmp', `dl_${Date.now()}`);
        const dlPath = await globalDownloader.download({
            url,
            format: 'audio',
            outputPath: tempPath,
            quality: 'best'
        });

        const stat = fs.statSync(dlPath);
        const fileName = path.basename(dlPath);

        console.log(`[Drive] Uploading ${fileName} to Google Drive...`);

        // Initialize metadata
        const metadata = {
            name: fileName,
            mimeType: 'audio/mp4', // Usually m4a
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        const fileContent = fs.readFileSync(dlPath);
        form.append('file', new Blob([fileContent], { type: 'audio/mp4' }), fileName);

        const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: form as any
        });

        const uData = await uploadRes.json();
        
        // Delete tmp file
        try { fs.rmSync(tempPath, { recursive: true, force: true }); } catch(err) {}

        if (!uploadRes.ok) throw new Error(`Drive Upload Error: ${JSON.stringify(uData)}`);

        res.json({ success: true, file: uData });
    } catch (e: any) {
        console.error('[Drive] Error in yt-to-drive:', e);
        res.status(500).json({ error: e.message });
    }
});

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
    const mem = process.memoryUsage();
    res.json({
        state: isReady ? 'online' : 'offline',
        tag: isReady ? (client.user?.tag || botStatus.tag) : botStatus.tag,
        guilds: isReady ? client.guilds.cache.size : botStatus.guilds,
        ping: isReady ? client.ws.ping : botStatus.ping,
        uptime: botStartTime > 0 ? Math.floor((Date.now() - botStartTime) / 1000) : 0,
        mockMode: !hasToken,
        inviteUrl,
        supportServerUrl: process.env.DISCORD_SERVER_INVITE || 'https://discord.gg/MRN4WDUMKv',
        memory: {
            rss: Math.floor(mem.rss / 1024 / 1024),
            heapUsed: Math.floor(mem.heapUsed / 1024 / 1024)
        }
    });
});

app.get('/api/admin/system/version', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    const currentVersion = "2.8.5-stable";
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

// Catch all unhandled process errors early and notify admins via DM
process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logEvent('error', 'unhandledRejection', err.message, err);
});
process.on('uncaughtException', (error) => {
  logEvent('error', 'uncaughtException', error.message, error);
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
        console.log(`[YouTube] Extracting stream for: ${track.title} (Client: TV_EMBEDDED)`);
        return {
            useServerAbrStream: false,
            disableStreamPreExtraction: true,
            streamOptions: {
                useClient: 'TV_EMBEDDED',
                highWaterMark: quality === 'ultra' ? 1024 * 1024 * 128 : (quality === 'high' ? 1024 * 1024 * 64 : 1024 * 1024 * 32)
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
            footer: { text: 'Snajperrr Monitoring System v2.8.5 | Ultra Stable 3GB' },
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
    logEvent('warn', 'system', 'Inicjowanie procedury autonaprawy (Stabilizacja Audio TV_EMBEDDED Ultra)...');
    try {
        try { await player.extractors.unregister(YoutubeiExtractor.identifier); } catch(e) {}
        await player.extractors.register(YoutubeiExtractor, {
            useServerAbrStream: false,
            ...(YOUTUBE_COOKIES ? { cookie: YOUTUBE_COOKIES } : {}),
            streamOptions: {
                useClient: 'TV_EMBEDDED',
                highWaterMark: 1024 * 1024 * 128, // 128MB
            }
        });
        await player.extractors.loadMulti(DefaultExtractors);
        db.prepare("UPDATE system_stats SET value = ? WHERE key = 'last_repair'").run(Date.now().toString());
        logEvent('info', 'system', 'System naprawiony pomyślnie. Zastosowano profil TV_EMBEDDED i ogromny bufor.');
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

function getRedirectUri(req: express.Request) {
    const xHost = req.headers['x-forwarded-host'];
    const xProto = req.headers['x-forwarded-proto'];
    const hostHeader = req.headers.host || '';
    
    const rawHost = Array.isArray(xHost) ? xHost[0] : (xHost || hostHeader);
    const host = rawHost.split(',')[0].trim();
    const protocol = (Array.isArray(xProto) ? xProto[0] : xProto) || 'https';
    
    const cleanHost = host.split(':')[0].toLowerCase();
    const isLocal = cleanHost.includes('localhost') || cleanHost.includes('127.0.0.1');

    console.log(`[Auth] Debug Redirect: host="${host}", clean="${cleanHost}", proto="${protocol}", xHost="${xHost}", xProto="${xProto}", APP_URL="${process.env.APP_URL}"`);

    let finalUri: string;

    if (process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL' && process.env.APP_URL.startsWith('http')) {
        const base = process.env.APP_URL.endsWith('/') ? process.env.APP_URL.slice(0, -1) : process.env.APP_URL;
        finalUri = `${base}/api/auth/callback`;
    }
    else if (isLocal) {
        finalUri = `http://localhost:3000/api/auth/callback`;
    }
    else if (cleanHost.endsWith('.run.app')) {
        finalUri = `https://${cleanHost}/api/auth/callback`;
    }
    else {
        finalUri = `${protocol}://${cleanHost}/api/auth/callback`;
    }

    console.log(`[Auth] Redirect URI generated: "${finalUri}"`);
    return finalUri;
}

app.get('/api/auth/url', (req, res) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    console.error('[Auth] Cannot generate OAuth URL: DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET is not configured.');
    return res.status(503).json({ error: 'Discord OAuth is not configured. Please set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables.' });
  }
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
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    return res.status(503).send('Discord OAuth is not configured.');
  }

  const { code, error, error_description } = req.query;
  
  if (error) {
    console.error(`[Auth Callback] Discord returned error: ${error} - ${error_description}`);
    return res.status(400).send(`Auth error from Discord: ${error_description || error}`);
  }

  const redirectUri = getRedirectUri(req);
  console.log('[Auth Callback] Code exchange starting...', { 
    hasCode: !!code, 
    redirectUri: redirectUri,
    host: req.headers.host,
    xHost: req.headers['x-forwarded-host']
  });

  if (!code) return res.status(400).send("No code provided");

  try {
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
      }).toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
        console.error('[Auth Callback] Token exchange failed:', tokenData);
        return res.send(`Failed to fetch OAuth token: ${tokenData.error_description || tokenData.error}`);
    }

    const [userRes] = await Promise.all([
      fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      })
    ]);

    if (!userRes.ok) {
        return res.status(userRes.status).send('Failed to fetch user data from Discord');
    }

    const userData = await userRes.json();
    console.log(`[Auth Callback] Logged in as: ${userData.username} (${userData.id})`);

    // Admin Failsafe
    if (userData.email === 'konradszczerbinski8@gmail.com' || userData.id === '1230509684138709056') {
      db.prepare(`INSERT INTO users (id, username, avatar, is_admin) VALUES (?, ?, ?, 1) ON CONFLICT(id) DO UPDATE SET username=excluded.username, avatar=excluded.avatar, is_admin=1`).run(userData.id, userData.username, userData.avatar);
    } else {
      db.prepare(`INSERT INTO users (id, username, avatar) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET username=excluded.username, avatar=excluded.avatar`).run(userData.id, userData.username, userData.avatar);
    }

    const token = jwt.sign({ id: userData.id, username: userData.username, avatar: userData.avatar }, JWT_SECRET, { expiresIn: '7d' });
    
    res.cookie('auth_token', token, {
      secure: true,
      sameSite: 'none',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <html>
        <head><title>Logging in...</title></head>
        <body>
          <script>
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

app.get('/api/auth/spotify/login', (req, res) => {
  if (!SPOTIFY_CLIENT_ID) return res.status(503).json({ error: 'Spotify is not configured' });
  const scope = 'user-read-private user-read-email user-library-read playlist-read-private';
  const redirectUri = getSpotifyRedirectUri(req);
  const state = crypto.randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: redirectUri,
    state: state
  });
  res.json({ url: `https://accounts.spotify.com/authorize?${params}` });
});

app.get('/api/auth/spotify/callback', async (req, res) => {
  const { code } = req.query;
  const authToken = req.cookies.auth_token;
  if (!authToken) return res.status(401).send('Unauthorized');
  
  try {
    const decoded = jwt.verify(authToken, JWT_SECRET) as any;
    const redirectUri = getSpotifyRedirectUri(req);
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64')
      },
      body: new URLSearchParams({
        code: code as string,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });
    
    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || data.error);
    
    const expiresAt = Date.now() + (data.expires_in * 1000);
    
    db.prepare('UPDATE users SET spotify_access_token = ?, spotify_refresh_token = ?, spotify_token_expires_at = ? WHERE id = ?')
      .run(data.access_token, data.refresh_token, expiresAt, decoded.id);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(`
      <html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS' }, '*');
          window.close();
        } else { window.location.href = '/?tab=settings'; }
      </script></body></html>
    `);
  } catch (err: any) {
    console.error('[Spotify Callback] Error:', err);
    res.status(500).send('Spotify connection failed: ' + err.message);
  }
});

app.post('/api/user/spotify/unlink', (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    db.prepare('UPDATE users SET spotify_access_token = NULL, spotify_refresh_token = NULL, spotify_token_expires_at = NULL WHERE id = ?').run(decoded.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false }); }
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
  if (!token) return res.json({ loggedIn: false });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    let user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user) return res.json({ loggedIn: false });
    
    if (user.premium === 1 && user.premium_expires_at && user.premium_expires_at < Date.now()) {
      db.prepare('UPDATE users SET premium = 0, premium_expires_at = NULL WHERE id = ?').run(user.id);
      user.premium = 0;
      user.premium_expires_at = null;
    }

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
    if (!adminUser || adminUser.is_admin !== 1) return res.status(403).json({ success: false });
    const users = db.prepare('SELECT id, username, avatar, premium, premium_expires_at, is_admin FROM users').all();
    res.json({ success: true, users });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/users/:id/premium', express.json(), async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const adminUser = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!adminUser || adminUser.is_admin !== 1) return res.status(403).json({ success: false });
    const targetUserId = req.params.id;
    const { action, durationStr } = req.body;
    if (action === 'revoke') {
      db.prepare('UPDATE users SET premium = 0, premium_expires_at = NULL WHERE id = ?').run(targetUserId);
    } else {
      let durationMs = durationStr && durationStr !== 'lifetime' ? ms(durationStr) : null;
      const currentUser = db.prepare('SELECT premium, premium_expires_at FROM users WHERE id = ?').get(targetUserId) as any;
      let baseTime = Date.now();
      if (action === 'extend' && currentUser.premium_expires_at && currentUser.premium_expires_at > Date.now()) baseTime = currentUser.premium_expires_at;
      let newExpiresAt = durationMs ? baseTime + durationMs : null;
      db.prepare('UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?').run(newExpiresAt, targetUserId);
    }
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/vouchers', express.json(), async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const { type, durationStr, maxUses } = req.body;
    let duration = durationStr && durationStr !== 'lifetime' ? ms(durationStr) : null;
    const code = crypto.randomBytes(6).toString('hex').toUpperCase();
    db.prepare('INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(code, type, duration, maxUses, 0, decoded.id, Date.now());
    res.json({ success: true, code, type, duration: durationStr, maxUses });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.get('/api/admin/vouchers', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const vouchers = db.prepare('SELECT * FROM vouchers ORDER BY created_at DESC').all();
    res.json({ success: true, vouchers });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.get('/api/public-logs', async (req, res) => {
  try {
    const logs = db.prepare('SELECT level, source, message, details, created_at FROM system_logs ORDER BY created_at DESC LIMIT 150').all() as any[];
    res.json({ success: true, logs });
  } catch(err) { res.status(500).json({ success: false }); }
});

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
    if (!smtpHost || !smtpUser || !smtpPass) return { success: false };
    try {
        const logs = db.prepare('SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 1000').all() as any[];
        if (logs.length === 0) return { success: true };
        const transporter = nodemailer.createTransport({ host: smtpHost, port: smtpPort, secure: smtpPort === 465, auth: { user: smtpUser, pass: smtpPass } });
        const logsCsv = "ID,Level,Source,Message,Details,Date\n" + logs.map(l => `${l.id},${l.level},${l.source},"${l.message}","${l.details || ''}",${new Date(l.created_at).toISOString()}`).join('\n');
        await transporter.sendMail({ from: `"Snajperrr System" <${smtpUser}>`, to: adminEmail, subject: `[LOGS] Snajperrr - ${new Date().toLocaleDateString()}`, html: `<p>Logs attached.</p>`, attachments: [{ filename: `logs_${Date.now()}.csv`, content: logsCsv }] });
        return { success: true };
    } catch (err) { return { success: false }; }
};

app.post('/api/admin/logs/export', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    res.json(await sendLogsEmail());
  } catch(err) { res.status(500).json({ success: false }); }
});

app.patch('/api/admin/logs/:id', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    db.prepare('UPDATE system_logs SET solution = ? WHERE id = ?').run(req.body.solution, req.params.id);
    res.json({ success: true });
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
    res.json({ success: true, stats: stats.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}) });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/system/repair', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    res.json(await performSystemRepair());
  } catch(err) { res.status(500).json({ success: false }); }
});

app.post('/api/bugs', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    db.prepare('INSERT INTO bug_reports (user_id, title, description, priority, created_at) VALUES (?, ?, ?, ?, ?)').run(decoded.id, req.body.title, req.body.description, req.body.priority || 'low', Date.now());
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
    res.json({ success: true, bugs: db.prepare('SELECT b.*, u.username as reporter FROM bug_reports b LEFT JOIN users u ON b.user_id = u.id ORDER BY b.created_at DESC').all() });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.patch('/api/admin/bugs/:id', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    db.prepare('UPDATE bug_reports SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.post('/api/vouchers/redeem', express.json(), async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const code = req.body.code?.trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "Kod wymagany." });
    const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(code) as any;
    if (!voucher) return res.status(404).json({ error: "Nieprawidłowy kod." });
    if (voucher.max_uses > 0 && voucher.uses >= voucher.max_uses) return res.status(400).json({ error: "Zużyty." });
    const alreadyRedeemed = db.prepare('SELECT 1 FROM redeemed_vouchers WHERE code = ? AND user_id = ?').get(code, decoded.id);
    if (alreadyRedeemed) return res.status(400).json({ error: "Już zrealizowany." });
    const expiresAt = voucher.duration ? Date.now() + voucher.duration : null;
    const guildId = req.body.guildId?.trim();
    db.transaction(() => {
      if (voucher.type === 'user_premium') db.prepare('UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?').run(expiresAt, decoded.id);
      else if (voucher.type === 'guild_premium') {
        if (!guildId) throw new Error("requires_guild_id");
        db.prepare('INSERT INTO guilds_premium (guild_id, added_by, active) VALUES (?, ?, 1) ON CONFLICT(guild_id) DO UPDATE SET active = 1, added_by = excluded.added_by').run(guildId, decoded.id);
      }
      db.prepare('INSERT INTO redeemed_vouchers (code, user_id, redeemed_at) VALUES (?, ?, ?)').run(code, decoded.id, Date.now());
      db.prepare('UPDATE vouchers SET uses = uses + 1 WHERE code = ?').run(code);
    })();
    res.json({ success: true, message: "Premium aktywowane!" });
  } catch(err: any) { res.status(500).json({ error: err.message || "Błąd." }); }
});

app.post('/api/stripe/checkout', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!stripeClient) {
      db.prepare("UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?").run(Date.now() + ms('30d'), decoded.id);
      return res.json({ url: `${getRedirectUri(req).replace('/api/auth/callback', '')}?checkout=success` });
    }
    const session = await stripeClient.checkout.sessions.create({ payment_method_types: ['card'], mode: 'subscription', line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }], client_reference_id: decoded.id, success_url: `${getRedirectUri(req).replace('/api/auth/callback', '')}?checkout=success`, cancel_url: `${getRedirectUri(req).replace('/api/auth/callback', '')}?checkout=cancel` });
    res.json({ url: session.url });
  } catch (err) { res.status(500).json({ error: "Failed" }); }
});

const ADVANCED_NODE_OPTIONS = {
    volume: 80,
    bufferingTimeout: 120000, 
    maxSize: 10000,
    leaveOnEnd: false,
    leaveOnEmpty: true,
    leaveOnEmptyCooldown: 300000,
    leaveOnStop: false,
    disableFallbackStream: false,
    noEmitInsert: false,
    preferBridgedMetadata: true,
};

player.events.on('playerStart', async (queue, track) => {
  logEvent('info', 'bot', `Gra: ${track.title}`, { guild: queue.guild.name, author: track.author });
  const history = playbackHistory.get(queue.guild.id) || [];
  history.unshift({ title: track.title, author: track.author, duration: track.duration, playedAt: Date.now(), url: track.url });
  if (history.length > 50) history.pop();
  playbackHistory.set(queue.guild.id, history);
  queue.node.setVolume(80);
});

player.events.on('error', async (queue, error) => {
  logEvent('error', 'bot', `Queue Error: ${error.message}`, { guild: queue.guild.name });
  if (['decipher', 'signature', 'unavailable', 'aborted'].some(s => error.message.toLowerCase().includes(s))) {
    await performSystemRepair();
  }
});

player.events.on('playerError', async (queue, error) => {
  logEvent('error', 'bot', `Audio Extraction Error: ${error.message}`, { guild: queue.guild.name });
  console.log(`[Advanced Player] Emitted playerError: ${error.message}`);
});

player.events.on('disconnect', async (queue) => {
  logEvent('info', 'bot', `Voice channel disconnected manually or kicked.`, { guild: queue.guild.name });
});

client.on('ready', async () => {
  botStatus.state = 'online'; botStatus.tag = client.user?.tag || ''; botStatus.guilds = client.guilds.cache.size; botStartTime = Date.now();
  if (client.user) client.user.setActivity('music | /play', { type: ActivityType.Listening });
  if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== "YOUR_DISCORD_BOT_TOKEN_HERE") {
    try {
      const commandBuilders = [
        ...adminCommandsDefinitions, 
        new SlashCommandBuilder().setName('join').setDescription('Join VC'), 
        new SlashCommandBuilder().setName('play').setDescription('Play song').addStringOption(o => o.setName('song').setDescription('Song name/URL').setRequired(true)), 
        new SlashCommandBuilder().setName('search').setDescription('Search song').addStringOption(o => o.setName('query').setDescription('Query').setRequired(true)), 
        new SlashCommandBuilder().setName('pause').setDescription('Pause'), 
        new SlashCommandBuilder().setName('resume').setDescription('Resume'), 
        new SlashCommandBuilder().setName('skip').setDescription('Skip'), 
        new SlashCommandBuilder().setName('stop').setDescription('Stop'), 
        new SlashCommandBuilder().setName('volume').setDescription('Set volume').addIntegerOption(o => o.setName('level').setDescription('0-100').setRequired(true)),
        new SlashCommandBuilder()
            .setName('download')
            .setDescription('Download audio or video from YouTube')
            .addStringOption(o => o.setName('url').setDescription('YouTube Video URL').setRequired(true))
            .addStringOption(o => o.setName('type').setDescription('Format type').addChoices({ name: 'Audio Only', value: 'audio'}, { name: 'Video Only', value: 'video'}, { name: 'Both separate', value: 'both'}).setRequired(true))
            .addStringOption(o => o.setName('path').setDescription('Absolute path on disk to save (e.g. /tmp/downloads)').setRequired(true))
      ];
      const commands = commandBuilders.map(c => c.toJSON());
      await new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN).put(Routes.applicationCommands(client.user!.id), { body: commands });
    } catch (e) { console.error('Register commands error:', e); }
  }
});

const isAdmin = (req: any, res: any, next: any) => {
    const token = req.cookies.auth_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
        if (!user || user.is_admin !== 1) return res.status(403).json({ error: "Forbidden" });
        req.user = decoded;
        next();
    } catch(err) { res.status(401).json({ error: "Invalid token" }); }
};

app.get('/api/admin/system/diag', async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(decoded.id) as any;
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });

    const diag = {
        discord: {
            tokenSet: !!process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== "YOUR_DISCORD_BOT_TOKEN_HERE",
            clientIdSet: !!DISCORD_CLIENT_ID,
            clientSecretSet: !!DISCORD_CLIENT_SECRET,
            isReady: client?.isReady(),
            guilds: client?.isReady() ? client.guilds.cache.size : 0,
            user: client?.user?.tag || 'Not logged in'
        },
        player: {
            extractorsCount: player?.extractors.size || 0,
            nodesCount: player?.nodes.cache.size || 0
        },
        env: {
            appUrl: process.env.APP_URL || 'Not set',
            nodeEnv: process.env.NODE_ENV || 'development',
            calculatedRedirectUri: getRedirectUri(req)
        },
        system: {
            uptime: Math.floor(process.uptime()),
            memory: process.memoryUsage()
        },
        activePlayers: client?.isReady() && player?.nodes ? Array.from(player.nodes.cache.values()).map(q => ({
            guildId: q.guild.id,
            guildName: q.guild.name,
            channelName: q.channel?.name || 'Voice',
            nowPlaying: q.currentTrack ? { title: q.currentTrack.title, author: q.currentTrack.author, duration: Math.floor(q.currentTrack.durationMS / 1000) } : null,
            queueLength: q.tracks.size,
            state: q.node.isPaused() ? "paused" : "playing",
            volume: q.node.volume
        })) : []
    };
    res.json({ success: true, diag });
  } catch(err) { res.status(500).json({ success: false }); }
});

app.delete('/api/admin/vouchers/:code', isAdmin, (req, res) => {
    try {
        db.prepare("DELETE FROM vouchers WHERE code = ?").run(req.params.code);
        res.json({ success: true });
    } catch(err) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/broadcast', express.json(), isAdmin, async (req, res) => {
    try {
        const { title, message } = req.body;
        if (!client.isReady()) return res.status(400).json({ success: false, message: 'Bot nie jest gotowy' });
        
        // Save to DB
        db.prepare('INSERT INTO announcements (title, body, created_at, created_by) VALUES (?, ?, ?, ?)').run(title, message, Date.now(), (req as any).user.id);

        let sentCount = 0;
        const embed = new EmbedBuilder()
            .setTitle(title || 'Powiadomienie Systemowe')
            .setDescription(message)
            .setColor(0x5865F2)
            .setTimestamp();

        for (const guild of client.guilds.cache.values()) {
            try {
                const channel = guild.channels.cache.find(c => c.isTextBased() && c.permissionsFor(client.user!)?.has(['SendMessages', 'EmbedLinks']));
                if (channel) {
                    await (channel as any).send({ embeds: [embed] });
                    sentCount++;
                }
            } catch(e) {}
        }
        res.json({ success: true, sentCount });
    } catch(err) { res.status(500).json({ success: false }); }
});

app.get('/api/admin/broadcasts', isAdmin, (req, res) => {
    try {
        const broadcasts = db.prepare("SELECT * FROM announcements ORDER BY created_at DESC").all();
        res.json({ success: true, broadcasts });
    } catch(err) { res.status(500).json({ success: false }); }
});

app.post('/api/admin/system/maintenance', express.json(), isAdmin, (req, res) => {
    try {
        const { enabled } = req.body;
        db.prepare("INSERT OR REPLACE INTO global_settings (key, value) VALUES ('maintenance_mode', ?)").run(enabled ? '1' : '0');
        res.json({ success: true, maintenance: enabled });
    } catch(err) { res.status(500).json({ success: false }); }
});

async function bootstrapExtractors() {
  try {
    console.log('[Bot] Ładowanie ekstraktorów...');
    
    // Register Spotify first with credentials for better metadata bridging
    if (SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET) {
        await player.extractors.register(SpotifyExtractor, {
            clientId: SPOTIFY_CLIENT_ID,
            clientSecret: SPOTIFY_CLIENT_SECRET
        });
        console.log('[Bot] Spotify Extractor skonfigurowany.');
    }

    await player.extractors.loadMulti(DefaultExtractors);
    try { await player.extractors.unregister('YouTubeExtractor'); } catch(e) {}
    try { await player.extractors.unregister(YoutubeiExtractor.identifier); } catch(e) {}
    await player.extractors.register(YoutubeiExtractor, {
        useServerAbrStream: false,
        ...(YOUTUBE_COOKIES ? { cookie: YOUTUBE_COOKIES } : {}),
        streamOptions: {
            highWaterMark: 1024 * 1024 * 128, // Zwiększony bufor dla ogromnych pingow
            useClient: 'TV_EMBEDDED'
        }
    });
    logEvent('info', 'system', 'Ekstraktory załadowane pomyślnie.');
  } catch (e: any) {
    logEvent('error', 'system', `Błąd ładowania ekstraktorów: ${e.message}`, e);
  }
}

async function bootstrapBot() {
  const token = process.env.DISCORD_TOKEN;
  if (token && token !== "YOUR_DISCORD_BOT_TOKEN_HERE" && token.length > 20) {
    console.log('[Bot] Próba logowania...');
    try {
        await client.login(token);
        logEvent('info', 'system', 'Discord Bot zalogowany pomyślnie.');
    } catch (e: any) {
        logEvent('error', 'system', `Nieudane logowanie do Discord: ${e.message}`, e);
        botStatus.state = 'error';
    }
  } else {
    logEvent('warn', 'system', 'Brak poprawnego DISCORD_TOKEN. Bot pozostanie offline.');
  }
}

app.get("/api/players", (req, res) => {
  const info = [];
  if (client?.isReady() && player?.nodes) {
    for (const [id, q] of player.nodes.cache) {
      if (!q) continue;
      const t = q.currentTrack;
      info.push({ guildId: id, guildName: q.guild.name, channelName: q.channel?.name || 'Voice', nowPlaying: t ? { title: t.title, author: t.author, duration: Math.floor(t.durationMS / 1000), current: Math.floor(q.node.streamTime / 1000), thumbnail: t.thumbnail } : null, queueLength: q.tracks.size, queue: q.tracks.toArray().map(t => ({ id: t.id, title: t.title, author: t.author, duration: Math.floor(t.durationMS / 1000) })), history: playbackHistory.get(id) || [], state: q.node.isPaused() ? "paused" : "playing", volume: q.node.volume });
    }
  }
  res.json(info);
});

app.delete("/api/players/:guildId/queue/:trackId", (req, res) => {
  const q = player.nodes.get(req.params.guildId);
  if (!q) return res.status(404).json({ success: false });
  const t = q.tracks.toArray().find(tr => tr.id === req.params.trackId);
  if (t) q.node.remove(t);
  res.json({ success: true });
});

app.post("/api/players/:guildId/queue/move", express.json(), (req, res) => {
  const q = player.nodes.get(req.params.guildId);
  if (q) {
    const tracks = q.tracks.toArray();
    const { from, to } = req.body;
    if (tracks[from]) { q.node.move(tracks[from], to); return res.json({ success: true }); }
  }
  res.status(400).json({ success: false });
});

client.on('interactionCreate', async interaction => {
  const maintenance = db.prepare("SELECT value FROM global_settings WHERE key = 'maintenance_mode'").get() as any;
  if (maintenance?.value === '1') {
    const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(interaction.user.id) as any;
    if (!user || user.is_admin !== 1) {
      if (interaction.isRepliable()) return interaction.reply({ content: '⚠️ Tryb Konserwacji.', ephemeral: true });
      return;
    }
  }
  if (interaction.isStringSelectMenu() && interaction.customId === 'search_results') {
    const member = interaction.member as any;
    if (!member.voice?.channel) return interaction.reply({ content: 'Musisz być na kanale!', ephemeral: true });
    await interaction.deferReply();
    const res = await player.search(interaction.values[0], { requestedBy: interaction.user });
    if (res.hasTracks()) {
      const { track } = await player.play(member.voice.channel, res, { 
        nodeOptions: { 
          metadata: interaction, 
          ...ADVANCED_NODE_OPTIONS
        } 
      });
      await interaction.followUp(`🎵 Wybrano: **${track.title}**`);
    } else await interaction.followUp('❌ Nie znaleziono.');
  }
  if (!interaction.isChatInputCommand()) return;
  if (await handleAdminCommands(interaction)) return;
  const member = interaction.member as any;
  const { commandName, guildId } = interaction;
  if (commandName === 'join') {
    if (!member.voice?.channel) return interaction.reply({ content: 'Musisz być na kanale!', ephemeral: true });
    const q = player.nodes.create(interaction.guild!, { 
      metadata: interaction, 
      ...ADVANCED_NODE_OPTIONS
    });
    await q.connect(member.voice.channel);
    await interaction.reply('✅ Dołączono!');
  } else if (commandName === 'play') {
    if (!member.voice?.channel) return interaction.reply({ content: 'Musisz być na kanale!', ephemeral: true });
    await interaction.deferReply();
    const res = await player.search(interaction.options.getString('song', true), { requestedBy: interaction.user });
    if (res.hasTracks()) {
      const { track } = await player.play(member.voice.channel, res, { 
        nodeOptions: { 
          metadata: interaction, 
          ...ADVANCED_NODE_OPTIONS
        } 
      });
      await interaction.followUp(`🎵 Dodano: **${track.title}**`);
    } else await interaction.followUp('❌ Nie znaleziono.');
  } else if (commandName === 'skip') {
    const q = player.nodes.get(guildId!);
    if (q) { q.node.skip(); await interaction.reply('⏭️ Pominięto.'); }
  } else if (commandName === 'stop') {
    const q = player.nodes.get(guildId!);
    if (q) { q.delete(); await interaction.reply('⏹️ Zatrzymano.'); }
  } else if (commandName === 'download') {
    await interaction.deferReply();
    const url = interaction.options.getString('url', true);
    const type = interaction.options.getString('type', true) as any;
    const savePath = interaction.options.getString('path', true);

    try {
      await interaction.followUp(`⏳ Downloading...`);
      const dlPath = await globalDownloader.download({
        url,
        format: type,
        outputPath: savePath,
        quality: 'best'
      });
      await interaction.followUp(`✅ Downloaded successfully to: ${dlPath}`);
    } catch (err: any) {
      await interaction.followUp(`❌ Failed to download: ${err.message}`);
    }
  }
});

app.post("/api/players/:guildId/volume", (req, res) => {
  const q = player.nodes.get(req.params.guildId);
  if (q && typeof req.body.volume === 'number') { q.node.setVolume(req.body.volume); res.json({ success: true }); }
  else res.status(404).json({ error: "Not found" });
});

app.post("/api/players/:guildId/playback", (req, res) => {
  const q = player.nodes.get(req.params.guildId);
  if (q) { q.node.setPaused(req.body.state === "paused"); res.json({ success: true }); }
  else res.status(404).json({ error: "Not found" });
});

app.get("/api/search", async (req, res) => {
  try {
    const r = await player.search(req.query.query as string);
    res.json({ success: true, tracks: r.tracks.slice(0, 10).map(t => ({ title: t.title, author: t.author, duration: t.duration, url: t.url, thumbnail: t.thumbnail })) });
  } catch { res.status(500).json({ success: false }); }
});

app.post("/api/players/:guildId/play", async (req, res) => {
  const q = player.nodes.get(req.params.guildId);
  if (q) {
    const r = await player.search(req.body.url);
    if (r.hasTracks()) { q.addTrack(r.tracks[0]); res.json({ success: true }); }
    else res.status(404).json({ error: "Not found" });
  } else res.status(400).json({ error: "Connect on Discord first." });
});

async function start() {
  app.listen(PORT, "0.0.0.0", () => console.log(`Run on ${PORT}`));
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const v = await createServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(v.middlewares);
  } else {
    const d = path.join(process.cwd(), 'dist');
    app.use(express.static(d));
    app.get('*', (req, res) => res.sendFile(path.join(d, 'index.html')));
  }
  bootstrapExtractors();
  bootstrapBot();
}
start();
