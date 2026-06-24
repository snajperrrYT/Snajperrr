"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server.ts
var server_exports = {};
module.exports = __toCommonJS(server_exports);
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_config = require("dotenv/config");
var import_cookie_parser = __toESM(require("cookie-parser"), 1);
var import_discord = require("discord.js");
var import_discord_player = require("discord-player");

// src/lib/AdvancedDownloader.ts
var import_youtubei = require("youtubei.js");
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_events = __toESM(require("events"), 1);
var AdvancedDownloader = class extends import_events.default {
  yt = null;
  constructor() {
    super();
  }
  async initialize() {
    if (!this.yt) {
      this.yt = await import_youtubei.Innertube.create({ cache: new import_youtubei.UniversalCache(false), generate_session_locally: true });
    }
  }
  async download(options) {
    await this.initialize();
    if (!this.yt) throw new Error("Innertube not initialized");
    this.emit("start", options.url);
    try {
      const info = await this.yt.getBasicInfo(options.url);
      const title = info.basic_info.title?.replace(/[^a-zA-Z0-9 ]/g, "") || "download";
      let finalPath = "";
      const ensureDir = (p) => {
        if (!import_fs.default.existsSync(p)) import_fs.default.mkdirSync(p, { recursive: true });
      };
      ensureDir(options.outputPath);
      if (options.format === "audio") {
        finalPath = import_path.default.join(options.outputPath, `${title}.m4a`);
        await this.downloadStream(options.url, finalPath, { type: "audio", quality: options.quality || "best" });
      } else if (options.format === "video") {
        finalPath = import_path.default.join(options.outputPath, `${title}.mp4`);
        await this.downloadStream(options.url, finalPath, { type: "video+audio", quality: options.quality || "best" });
      } else {
        const audioPath = import_path.default.join(options.outputPath, `${title}.m4a`);
        const videoPath = import_path.default.join(options.outputPath, `${title}_video.mp4`);
        await this.downloadStream(options.url, audioPath, { type: "audio", quality: options.quality || "best" });
        await this.downloadStream(options.url, videoPath, { type: "video", quality: options.quality || "best" });
        finalPath = options.outputPath;
      }
      this.emit("finish", finalPath);
      return finalPath;
    } catch (error) {
      this.emit("error", error);
      throw error;
    }
  }
  async downloadStream(url, dest, opts) {
    return new Promise(async (resolve, reject) => {
      try {
        const stream = await this.yt.download(url, {
          type: opts.type,
          quality: opts.quality,
          format: "mp4"
        });
        const file = import_fs.default.createWriteStream(dest);
        let downloadedBytes = 0;
        const reader = stream.getReader();
        const pump = async () => {
          const { done, value } = await reader.read();
          if (done) {
            file.end();
          } else {
            downloadedBytes += value.length;
            this.emit("progress", downloadedBytes);
            file.write(Buffer.from(value), async (err) => {
              if (err) return reject(err);
              await pump();
            });
          }
        };
        file.on("finish", () => resolve());
        file.on("error", (err) => reject(err));
        await pump();
      } catch (err) {
        reject(err);
      }
    });
  }
};
var globalDownloader = new AdvancedDownloader();

// server.ts
var import_stripe = __toESM(require("stripe"), 1);
var import_genai = require("@google/genai");
var import_form_data = __toESM(require("form-data"), 1);
var app = (0, import_express.default)();
var portEnv = process.env.PORT;
var parsedPort = portEnv ? Number.parseInt(portEnv, 10) : Number.NaN;
var PORT = Number.isNaN(parsedPort) ? 3e3 : parsedPort;
var DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
var DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
var SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
var SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";
if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
  console.error("[FATAL] DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables must be set!");
}
console.log(`[Config] Discord Client ID: ${DISCORD_CLIENT_ID.substring(0, 6)}... | Secret set: ${!!DISCORD_CLIENT_SECRET}`);
var JWT_SECRET = process.env.JWT_SECRET || "dev_secret_jwt";
var YOUTUBE_COOKIES = process.env.YOUTUBE_COOKIES || "";
var client;
var player;
app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});
app.use((req, res, next) => {
  if (req.originalUrl === "/api/stripe/webhook") {
    next();
  } else {
    import_express.default.json()(req, res, next);
  }
});
app.use((0, import_cookie_parser.default)());
var stripeClient = null;
var aiAssistant = null;
var geminiKey = process.env.GEMINI_API_KEY;
if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY" && !geminiKey.startsWith("YOUR_")) {
  aiAssistant = new import_genai.GoogleGenAI({ apiKey: geminiKey });
}
if (process.env.STRIPE_SECRET_KEY) {
  stripeClient = new import_stripe.default(process.env.STRIPE_SECRET_KEY);
}
client = new import_discord.Client({
  intents: [
    import_discord.GatewayIntentBits.Guilds,
    import_discord.GatewayIntentBits.GuildVoiceStates,
    import_discord.GatewayIntentBits.GuildMessages
  ]
});
player = new import_discord_player.Player(client, {
  skipFFmpeg: false,
  connectionTimeout: 12e4
  // Increased timeout for high ping
});
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
    }
  }
}, 3e4);
app.post("/api/yt-to-drive", import_express.default.json(), async (req, res) => {
  try {
    const { url, accessToken } = req.body;
    if (!url || !accessToken) return res.status(400).json({ error: "Missing url or accessToken" });
    console.log(`[Drive] Downloading ${url} to upload to Google Drive`);
    const tempPath = import_path2.default.join("/tmp", `dl_${Date.now()}`);
    const dlPath = await globalDownloader.download({
      url,
      format: "audio",
      outputPath: tempPath,
      quality: "best"
    });
    const stat = import_fs2.default.statSync(dlPath);
    const fileName = import_path2.default.basename(dlPath);
    console.log(`[Drive] Uploading ${fileName} to Google Drive...`);
    const metadata = {
      name: fileName,
      mimeType: "audio/mp4"
      // Usually m4a
    };
    const form = new import_form_data.default();
    form.append("metadata", JSON.stringify(metadata), { contentType: "application/json" });
    form.append("file", import_fs2.default.createReadStream(dlPath), { filename: fileName, contentType: "audio/mp4" });
    const headers = { Authorization: `Bearer ${accessToken}`, ...form.getHeaders() };
    const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
      method: "POST",
      headers,
      body: form
    });
    const uData = await uploadRes.json();
    try {
      import_fs2.default.rmSync(tempPath, { recursive: true, force: true });
    } catch (err) {
    }
    if (!uploadRes.ok) throw new Error(`Drive Upload Error: ${JSON.stringify(uData)}`);
    res.json({ success: true, file: uData });
  } catch (e) {
    console.error("[Drive] Error in yt-to-drive:", e);
    res.status(500).json({ error: e.message });
  }
});
app.post("/api/genai/query", import_express.default.json(), async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });
    if (!aiAssistant) return res.status(500).json({ error: "GenAI not configured" });
    const response = await aiAssistant.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    const text = response && (response.text || response.output_text) || JSON.stringify(response);
    res.json({ success: true, text, raw: response });
  } catch (err) {
    console.error("[GenAI] Error:", err);
    res.status(500).json({ error: err.message || "GenAI error" });
  }
});
app.get("/api/health", (req, res) => {
  logEvent("info", "system", "Health check performed.");
  res.status(200).send("OK");
});
//# sourceMappingURL=server.cjs.map
