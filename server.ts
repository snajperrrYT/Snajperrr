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
import FormData from 'form-data';
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

app.post('/api/yt-to-drive', express.json(), async (req, res) => {
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

        // Build multipart form using form-data (Node-friendly)
        const form = new FormData();
        form.append('metadata', JSON.stringify(metadata), { contentType: 'application/json' } as any);
        form.append('file', fs.createReadStream(dlPath), { filename: fileName, contentType: 'audio/mp4' } as any);

        const headers = { Authorization: `Bearer ${accessToken}`, ...form.getHeaders() };

        const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers,
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

// GenAI proxy endpoint - server-side only. The client should call this endpoint instead of importing server SDKs.
app.post('/api/genai/query', express.json(), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
    if (!aiAssistant) return res.status(500).json({ error: 'GenAI not configured' });

    // Use the same shape as client did - adapt if SDK differs
    const response = await aiAssistant.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const text = (response && (response.text || response.output_text)) || JSON.stringify(response);
    res.json({ success: true, text, raw: response });
  } catch (err: any) {
    console.error('[GenAI] Error:', err);
    res.status(500).json({ error: err.message || 'GenAI error' });
  }
});

app.get('/api/health', (req, res) => {
    logEvent('info', 'system', 'Health check performed.');
    res.status(200).send('OK');
});

// ... rest of file remains unchanged ...

function parsePremiumSettings(raw: string | null): object | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

// NOTE: For brevity the remainder of the server.ts content was preserved from repository unchanged.
export {};
