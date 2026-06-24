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

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_config = require("dotenv/config");
var import_cookie_parser = __toESM(require("cookie-parser"), 1);
var import_discord2 = require("discord.js");
var import_discord_player = require("discord-player");
var import_extractor = require("@discord-player/extractor");
var import_discord_player_youtubei = require("discord-player-youtubei");

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
var import_jsonwebtoken = __toESM(require("jsonwebtoken"), 1);
var import_stripe = __toESM(require("stripe"), 1);
var import_crypto2 = __toESM(require("crypto"), 1);
var import_ms2 = __toESM(require("ms"), 1);
var import_genai = require("@google/genai");
var import_nodemailer = __toESM(require("nodemailer"), 1);
var import_form_data = __toESM(require("form-data"), 1);

// src/db.ts
var MockStatement = class {
  constructor(query) {
    this.query = query;
  }
  query;
  run(...params) {
    return { changes: 0, lastInsertRowid: 0 };
  }
  get(...params) {
    return null;
  }
  all(...params) {
    return [];
  }
};
var db = {
  pragma: (s) => {
  },
  exec: (s) => {
  },
  prepare: (s) => new MockStatement(s),
  transaction: (fn) => fn
};
var db_default = db;

// src/adminCommands.ts
var import_discord = require("discord.js");
var import_ms = __toESM(require("ms"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var adminCommandsDefinitions = [
  new import_discord.SlashCommandBuilder().setName("ban").setDescription("Banuje u\u017Cytkownika").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.BanMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d")),
  new import_discord.SlashCommandBuilder().setName("unban").setDescription("Odbanowuje u\u017Cytkownika").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.BanMembers).addStringOption((o) => o.setName("user_id").setDescription("ID U\u017Cytkownika").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d")),
  new import_discord.SlashCommandBuilder().setName("kick").setDescription("Wyrzuca u\u017Cytkownika").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.KickMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d")),
  new import_discord.SlashCommandBuilder().setName("mute").setDescription("Wycisza (timeout) u\u017Cytkownika").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("duration").setDescription("Czas (np. 10m, 1h, 1d)").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d")),
  new import_discord.SlashCommandBuilder().setName("unmute").setDescription("Odcisza u\u017Cytkownika").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d")),
  new import_discord.SlashCommandBuilder().setName("clear").setDescription("Czy\u015Bci wiadomo\u015Bci").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ManageMessages).addIntegerOption((o) => o.setName("amount").setDescription("Ilo\u015B\u0107 (1-100)").setRequired(true)),
  new import_discord.SlashCommandBuilder().setName("clearuser").setDescription("Czy\u015Bci wiadomo\u015Bci u\u017Cytkownika na tym kanale").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ManageMessages).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addIntegerOption((o) => o.setName("amount").setDescription("Ile wiadomo\u015Bci przeszuka\u0107 (1-100)").setRequired(true)),
  new import_discord.SlashCommandBuilder().setName("lock").setDescription("Zamyka kana\u0142").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ManageChannels).addChannelOption((o) => o.setName("channel").setDescription("Kana\u0142")),
  new import_discord.SlashCommandBuilder().setName("unlock").setDescription("Otwiera kana\u0142").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ManageChannels).addChannelOption((o) => o.setName("channel").setDescription("Kana\u0142")),
  new import_discord.SlashCommandBuilder().setName("slowmode").setDescription("Ustawia slowmode").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ManageChannels).addIntegerOption((o) => o.setName("seconds").setDescription("Sekundy (0 aby wy\u0142\u0105czy\u0107)").setRequired(true)).addChannelOption((o) => o.setName("channel").setDescription("Kana\u0142")),
  new import_discord.SlashCommandBuilder().setName("setnick").setDescription("Zmienia pseudonim").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ManageNicknames).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("nick").setDescription("Nowy pseudonim (puste aby zresetowa\u0107)")),
  new import_discord.SlashCommandBuilder().setName("warn").setDescription("Ostrzega u\u017Cytkownika").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d").setRequired(true)),
  new import_discord.SlashCommandBuilder().setName("warnings").setDescription("Lista ostrze\u017Ce\u0144").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)),
  new import_discord.SlashCommandBuilder().setName("clearwarns").setDescription("Czy\u015Bci ostrze\u017Cenia").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)),
  new import_discord.SlashCommandBuilder().setName("addrole").setDescription("Dodaje rol\u0119").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ManageRoles).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addRoleOption((o) => o.setName("role").setDescription("Rola").setRequired(true)),
  new import_discord.SlashCommandBuilder().setName("removerole").setDescription("Odbiera rol\u0119").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ManageRoles).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addRoleOption((o) => o.setName("role").setDescription("Rola").setRequired(true)),
  new import_discord.SlashCommandBuilder().setName("tempban").setDescription("Tymczasowo banuje u\u017Cytkownika").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.BanMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("duration").setDescription("Czas (np. 1d, 1w)").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d")),
  new import_discord.SlashCommandBuilder().setName("announce").setDescription("Wysy\u0142a og\u0142oszenie").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.Administrator).addStringOption((o) => o.setName("message").setDescription("Wiadomo\u015B\u0107").setRequired(true)).addChannelOption((o) => o.setName("channel").setDescription("Kana\u0142")),
  new import_discord.SlashCommandBuilder().setName("userinfo").setDescription("Informacje o u\u017Cytkowniku").addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik")),
  new import_discord.SlashCommandBuilder().setName("serverinfo").setDescription("Informacje o serwerze"),
  new import_discord.SlashCommandBuilder().setName("nuke").setDescription("Od\u015Bwie\u017Ca (klonuje i usuwa) obecny kana\u0142").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.ManageChannels),
  new import_discord.SlashCommandBuilder().setName("ping").setDescription("Sprawdza op\xF3\u017Anienie bota"),
  new import_discord.SlashCommandBuilder().setName("createvoucher").setDescription("Tworzy nowy voucher").setDefaultMemberPermissions(import_discord.PermissionFlagsBits.Administrator).addStringOption((o) => o.setName("type").setDescription("Typ vouchera").setRequired(true).addChoices({ name: "User Premium", value: "user_premium" }, { name: "Guild Premium", value: "guild_premium" })).addStringOption((o) => o.setName("duration").setDescription("Czas trwania (np. 30d, 1y)").setRequired(true)).addIntegerOption((o) => o.setName("max_uses").setDescription("Maksymalna liczba u\u017Cy\u0107 (domy\u015Blnie 1)")),
  new import_discord.SlashCommandBuilder().setName("redeem").setDescription("Realizuje voucher").addStringOption((o) => o.setName("code").setDescription("Kod vouchera").setRequired(true))
];
async function handleAdminCommands(interaction) {
  const { commandName, guildId, guild } = interaction;
  if (!guild || !guildId) return false;
  switch (commandName) {
    case "ping": {
      await interaction.reply({ content: `\u{1F3D3} Pong! Op\xF3\u017Anienie: **${interaction.client.ws.ping}ms**`, ephemeral: true });
      return true;
    }
    case "ban": {
      const user = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") || "Brak powodu";
      try {
        await guild.members.ban(user, { reason });
        await interaction.reply({ content: `Zbanowano ${user.tag}. Pow\xF3d: ${reason}`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "Nie uda\u0142o si\u0119 zbanowa\u0107. Sprawd\u017A moje uprawnienia.", ephemeral: true });
      }
      return true;
    }
    case "tempban": {
      const user = interaction.options.getUser("user", true);
      const durationStr = interaction.options.getString("duration", true);
      const reason = interaction.options.getString("reason") || "Brak powodu";
      const duration = (0, import_ms.default)(durationStr);
      if (!duration) {
        await interaction.reply({ content: "Nieprawid\u0142owy czas formatowany (np. 1d, 12h).", ephemeral: true });
        return true;
      }
      try {
        await guild.members.ban(user, { reason: `[Tempban ${durationStr}] ${reason}` });
        await interaction.reply({ content: `Tymczasowo zbanowano ${user.tag} na ${durationStr}. Pow\xF3d: ${reason}`, ephemeral: true });
        setTimeout(() => {
          guild.members.unban(user, "Koniec tempbana").catch(console.error);
        }, duration);
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "Nie uda\u0142o si\u0119 zbanowa\u0107. Sprawd\u017A moje uprawnienia.", ephemeral: true });
      }
      return true;
    }
    case "unban": {
      const userId = interaction.options.getString("user_id", true);
      const reason = interaction.options.getString("reason") || "Brak powodu";
      try {
        await guild.members.unban(userId, reason);
        await interaction.reply({ content: `Odbanowano u\u017Cytkownika o ID ${userId}. Pow\xF3d: ${reason}`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "Nie uda\u0142o si\u0119 odbanowa\u0107. Mo\u017Cliwe, \u017Ce to nieprawid\u0142owe ID lub u\u017Cytkownik nie ma bana.", ephemeral: true });
      }
      return true;
    }
    case "kick": {
      const user = interaction.options.getMember("user");
      const reason = interaction.options.getString("reason") || "Brak powodu";
      if (!user) {
        await interaction.reply({ content: "Nie znaleziono u\u017Cytkownika na serwerze.", ephemeral: true });
        return true;
      }
      try {
        await user.kick(reason);
        await interaction.reply({ content: `Wyrzucono ${user.user.tag}. Pow\xF3d: ${reason}`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "Nie uda\u0142o si\u0119 wyrzuci\u0107. Sprawd\u017A moje uprawnienia.", ephemeral: true });
      }
      return true;
    }
    case "mute": {
      const user = interaction.options.getMember("user");
      const durationStr = interaction.options.getString("duration", true);
      const reason = interaction.options.getString("reason") || "Brak powodu";
      if (!user) {
        await interaction.reply({ content: "Nie znaleziono u\u017Cytkownika na serwerze.", ephemeral: true });
        return true;
      }
      const duration = (0, import_ms.default)(durationStr);
      if (!duration) {
        await interaction.reply({ content: "Nieprawid\u0142owy czas (np. 10m, 1h).", ephemeral: true });
        return true;
      }
      try {
        await user.timeout(duration, reason);
        await interaction.reply({ content: `Wyciszono ${user.user.tag} na ${durationStr}. Pow\xF3d: ${reason}`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "Nie uda\u0142o si\u0119 wyciszy\u0107. Sprawd\u017A moje uprawnienia (musi byc ponizej 28 dni).", ephemeral: true });
      }
      return true;
    }
    case "unmute": {
      const user = interaction.options.getMember("user");
      const reason = interaction.options.getString("reason") || "Brak powodu";
      if (!user) {
        await interaction.reply({ content: "Nie znaleziono u\u017Cytkownika na serwerze.", ephemeral: true });
        return true;
      }
      try {
        await user.timeout(null, reason);
        await interaction.reply({ content: `Odciszono ${user.user.tag}. Pow\xF3d: ${reason}`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "Nie uda\u0142o si\u0119 odciszy\u0107. Sprawd\u017A moje uprawnienia.", ephemeral: true });
      }
      return true;
    }
    case "clear": {
      const amount = interaction.options.getInteger("amount", true);
      if (amount < 1 || amount > 100) {
        await interaction.reply({ content: "Podaj liczb\u0119 od 1 do 100.", ephemeral: true });
        return true;
      }
      const channel = interaction.channel;
      try {
        const deleted = await channel.bulkDelete(amount, true);
        await interaction.reply({ content: `Usuni\u0119to ${deleted.size} wiadomo\u015Bci.`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "Nie uda\u0142o si\u0119 usun\u0105\u0107 wiadomo\u015Bci. Sprawd\u017A uprawnienia lub czy wiadomo\u015Bci nie s\u0105 starsze ni\u017C 14 dni.", ephemeral: true });
      }
      return true;
    }
    case "clearuser": {
      const targetUser = interaction.options.getUser("user", true);
      const amount = interaction.options.getInteger("amount", true);
      if (amount < 1 || amount > 100) {
        await interaction.reply({ content: "Podaj liczb\u0119 od 1 do 100.", ephemeral: true });
        return true;
      }
      const channel = interaction.channel;
      try {
        const fetchMessages = await channel.messages.fetch({ limit: amount });
        const targetMessages = fetchMessages.filter((m) => m.author.id === targetUser.id);
        if (targetMessages.size === 0) {
          await interaction.reply({ content: `Nie znaleziono wiadomo\u015Bci gracza ${targetUser.tag} w ostatnich ${amount} wiadomo\u015Bciach.`, ephemeral: true });
          return true;
        }
        const deleted = await channel.bulkDelete(targetMessages, true);
        await interaction.reply({ content: `Usuni\u0119to ${deleted.size} wiadomo\u015Bci gracza ${targetUser.tag}.`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "Nie uda\u0142o si\u0119 usun\u0105\u0107 wiadomo\u015Bci. Sprawd\u017A uprawnienia lub czy wiadomo\u015Bci nie s\u0105 starsze ni\u017C 14 dni.", ephemeral: true });
      }
      return true;
    }
    case "lock": {
      const channel = interaction.options.getChannel("channel") || interaction.channel;
      if (!channel?.permissionOverwrites) {
        await interaction.reply({ content: "To nie jest obs\u0142ugiwany kana\u0142.", ephemeral: true });
        return true;
      }
      try {
        await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
        await interaction.reply({ content: `Zawieszono pisanie na kanale ${channel}.`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "Wyst\u0105pi\u0142 b\u0142\u0105d podczas zamykania kana\u0142u.", ephemeral: true });
      }
      return true;
    }
    case "unlock": {
      const channel = interaction.options.getChannel("channel") || interaction.channel;
      if (!channel?.permissionOverwrites) {
        await interaction.reply({ content: "To nie jest obs\u0142ugiwany kana\u0142.", ephemeral: true });
        return true;
      }
      try {
        await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
        await interaction.reply({ content: `Otwarto kana\u0142 ${channel}.`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "Wyst\u0105pi\u0142 b\u0142\u0105d podczas otwierania kana\u0142u.", ephemeral: true });
      }
      return true;
    }
    case "slowmode": {
      const seconds = interaction.options.getInteger("seconds", true);
      const channel = interaction.options.getChannel("channel") || interaction.channel;
      if (!channel?.setRateLimitPerUser) {
        await interaction.reply({ content: "To nie jest obs\u0142ugiwany kana\u0142.", ephemeral: true });
        return true;
      }
      try {
        await channel.setRateLimitPerUser(seconds);
        await interaction.reply({ content: `Ustawiono slowmode na ${seconds} sekund na kanale ${channel}.`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "B\u0142\u0105d podczas ustawiania slowmode.", ephemeral: true });
      }
      return true;
    }
    case "setnick": {
      const user = interaction.options.getMember("user");
      const nick = interaction.options.getString("nick");
      if (!user) {
        await interaction.reply({ content: "Nie znaleziono u\u017Cytkownika na serwerze.", ephemeral: true });
        return true;
      }
      try {
        await user.setNickname(nick);
        await interaction.reply({ content: `Zmieniono pseudonim gracza ${user.user.tag}.`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "Nie uda\u0142o si\u0119 zmieni\u0107 nicku (mo\u017Ce mam ni\u017Csz\u0105 rol\u0119?).", ephemeral: true });
      }
      return true;
    }
    case "warn": {
      const target = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason", true);
      try {
        const stmt = db_default.prepare("INSERT INTO warnings (guild_id, user_id, moderator_id, reason, timestamp) VALUES (?, ?, ?, ?, ?)");
        stmt.run(guildId, target.id, interaction.user.id, reason, Date.now());
        await interaction.reply({ content: `Ostrze\u017Cono gracza ${target.tag}. Pow\xF3d: ${reason}`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "B\u0142\u0105d bazy danych.", ephemeral: true });
      }
      return true;
    }
    case "warnings": {
      const target = interaction.options.getUser("user", true);
      try {
        const warns = db_default.prepare("SELECT * FROM warnings WHERE guild_id = ? AND user_id = ?").all(guildId, target.id);
        if (warns.length === 0) {
          await interaction.reply({ content: `${target.tag} nie ma \u017Cadnych ostrze\u017Ce\u0144.`, ephemeral: true });
        } else {
          const text = warns.map((w, i) => `**${i + 1}.** Pow\xF3d: ${w.reason} (przez <@${w.moderator_id}>, ${new Date(w.timestamp).toLocaleDateString()})`).join("\n");
          await interaction.reply({ content: `Ostrze\u017Cenia gracza ${target.tag}:
${text}`, ephemeral: true });
        }
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "B\u0142\u0105d bazy danych.", ephemeral: true });
      }
      return true;
    }
    case "clearwarns": {
      const target = interaction.options.getUser("user", true);
      try {
        const stmt = db_default.prepare("DELETE FROM warnings WHERE guild_id = ? AND user_id = ?");
        stmt.run(guildId, target.id);
        await interaction.reply({ content: `Wyczyszczono ostrze\u017Cenia gracza ${target.tag}.`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "B\u0142\u0105d bazy danych.", ephemeral: true });
      }
      return true;
    }
    case "addrole": {
      const member = interaction.options.getMember("user");
      const role = interaction.options.getRole("role", true);
      if (!member) {
        await interaction.reply({ content: "Nie znaleziono u\u017Cytkownika.", ephemeral: true });
        return true;
      }
      try {
        await member.roles.add(role.id);
        await interaction.reply({ content: `Dodano rol\u0119 ${role.name} u\u017Cytkownikowi ${member.user.tag}.`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "B\u0142\u0105d: brak uprawnie\u0144 do przypisania tej roli.", ephemeral: true });
      }
      return true;
    }
    case "removerole": {
      const member = interaction.options.getMember("user");
      const role = interaction.options.getRole("role", true);
      if (!member) {
        await interaction.reply({ content: "Nie znaleziono u\u017Cytkownika.", ephemeral: true });
        return true;
      }
      try {
        await member.roles.remove(role.id);
        await interaction.reply({ content: `Zabrano rol\u0119 ${role.name} u\u017Cytkownikowi ${member.user.tag}.`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "B\u0142\u0105d: brak uprawnie\u0144 do odebrania tej roli.", ephemeral: true });
      }
      return true;
    }
    case "announce": {
      const message = interaction.options.getString("message", true);
      const channel = interaction.options.getChannel("channel") || interaction.channel;
      if (!channel?.send) {
        await interaction.reply({ content: "To nie jest prawid\u0142owy kana\u0142 tekstowy.", ephemeral: true });
        return true;
      }
      try {
        await channel.send(message);
        await interaction.reply({ content: `Wys\u0142ano og\u0142oszenie na ${channel}.`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "B\u0142\u0105d podczas wysy\u0142ania og\u0142oszenia.", ephemeral: true });
      }
      return true;
    }
    case "userinfo": {
      const user = interaction.options.getUser("user") || interaction.user;
      const member = interaction.options.getMember("user") || interaction.member;
      const roleCount = member?.roles?.cache.size || 0;
      await interaction.reply({ content: `**Info o ${user.tag}**
ID: ${user.id}
Do\u0142\u0105czy\u0142 do Discorda: ${user.createdAt.toLocaleDateString()}
Konto Bota: ${user.bot ? "Tak" : "Nie"}
Ilo\u015B\u0107 r\xF3l na serwerze: ${roleCount}`, ephemeral: true });
      return true;
    }
    case "serverinfo": {
      const g = interaction.guild;
      await interaction.reply({ content: `**Info o ${g.name}**
ID: ${g.id}
Utworzony: ${g.createdAt.toLocaleDateString()}
Cz\u0142onkowie: ${g.memberCount}
Ilo\u015B\u0107 r\xF3l: ${g.roles.cache.size}
Ilo\u015B\u0107 kana\u0142\xF3w: ${g.channels.cache.size}`, ephemeral: true });
      return true;
    }
    case "nuke": {
      const channel = interaction.channel;
      if (!channel?.clone) {
        await interaction.reply({ content: "Ten kana\u0142 nie mo\u017Ce zosta\u0107 zresetowany.", ephemeral: true });
        return true;
      }
      try {
        const cloned = await channel.clone();
        await cloned.setPosition(channel.position);
        await cloned.send("Nuked \u{1F4A5}");
        await channel.delete("Nuke command executed");
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "Brak uprawnie\u0144 by to zrobi\u0107.", ephemeral: true });
      }
      return true;
    }
    case "createvoucher": {
      const type = interaction.options.getString("type", true);
      const durationStr = interaction.options.getString("duration", true);
      const maxUses = interaction.options.getInteger("max_uses") || 1;
      const duration = (0, import_ms.default)(durationStr);
      if (!duration) {
        await interaction.reply({ content: "Nieprawid\u0142owy czas (np. 30d, 1y).", ephemeral: true });
        return true;
      }
      const code = import_crypto.default.randomBytes(6).toString("hex").toUpperCase();
      try {
        const stmt = db_default.prepare("INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        stmt.run(code, type, duration, maxUses, 0, interaction.user.id, Date.now());
        await interaction.reply({ content: `Utworzono voucher: **${code}**
Typ: ${type}
Czas: ${durationStr}
U\u017Cycia: ${maxUses}`, ephemeral: true });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "B\u0142\u0105d bazy danych przy tworzeniu vouchera.", ephemeral: true });
      }
      return true;
    }
    case "redeem": {
      const code = interaction.options.getString("code", true).toUpperCase();
      try {
        const checkRedeemed = db_default.prepare("SELECT * FROM redeemed_vouchers WHERE code = ? AND user_id = ?").get(code, interaction.user.id);
        if (checkRedeemed) {
          await interaction.reply({ content: "Ju\u017C u\u017Cy\u0142e\u015B/a\u015B tego vouchera.", ephemeral: true });
          return true;
        }
        const voucher = db_default.prepare("SELECT * FROM vouchers WHERE code = ?").get(code);
        if (!voucher) {
          await interaction.reply({ content: "Poda\u0142e\u015B/a\u015B nieprawid\u0142owy kod vouchera.", ephemeral: true });
          return true;
        }
        if (voucher.uses >= voucher.max_uses) {
          await interaction.reply({ content: "Ten voucher zosta\u0142 ju\u017C w pe\u0142ni wykorzystany.", ephemeral: true });
          return true;
        }
        db_default.prepare("BEGIN").run();
        try {
          db_default.prepare("UPDATE vouchers SET uses = uses + 1 WHERE code = ?").run(code);
          db_default.prepare("INSERT INTO redeemed_vouchers (code, user_id, redeemed_at) VALUES (?, ?, ?)").run(code, interaction.user.id, Date.now());
          if (voucher.type === "user_premium") {
            db_default.prepare("INSERT INTO users (id, username, premium) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET premium = premium + ?").run(interaction.user.id, interaction.user.tag, voucher.duration, voucher.duration);
          } else if (voucher.type === "guild_premium") {
            db_default.prepare("INSERT INTO guilds_premium (guild_id, added_by, active) VALUES (?, ?, 1) ON CONFLICT(guild_id) DO NOTHING").run(guildId, interaction.user.id);
          }
          db_default.prepare("COMMIT").run();
          await interaction.reply({ content: `Pomy\u015Blnie zrealizowano voucher! Typ nagrody: **${voucher.type}**`, ephemeral: true });
        } catch (e) {
          db_default.prepare("ROLLBACK").run();
          throw e;
        }
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: "Wyst\u0105pi\u0142 b\u0142\u0105d podczas odbierania vouchera.", ephemeral: true });
      }
      return true;
    }
  }
  return false;
}

// src/lib/botStability.ts
var DISCORD_TOKEN_PLACEHOLDER = "YOUR_DISCORD_BOT_TOKEN_HERE";
var RECOVERABLE_AUDIO_ERROR_PATTERNS = [
  "aborted",
  "decipher",
  "ffmpeg",
  "premature close",
  "signature",
  "streaming data not available",
  "unavailable",
  "voice connection"
];
function hasConfiguredDiscordToken(token) {
  return !!token && token !== DISCORD_TOKEN_PLACEHOLDER && token.length > 20;
}
function isRecoverableAudioError(message) {
  const normalizedMessage = message?.toLowerCase() || "";
  return RECOVERABLE_AUDIO_ERROR_PATTERNS.some((pattern) => normalizedMessage.includes(pattern));
}
function getReconnectDelay(attempt) {
  if (attempt <= 1) return 5e3;
  return Math.min(3e5, 5e3 * 2 ** (attempt - 1));
}

// server.ts
var app = (0, import_express.default)();
var portEnv = process.env.PORT;
var parsedPort = portEnv ? Number.parseInt(portEnv, 10) : Number.NaN;
var PORT = Number.isNaN(parsedPort) ? 3e3 : parsedPort;
var DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
var DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
var SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
var SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";
function getSpotifyRedirectUri(req) {
  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${protocol}://${host}/api/auth/spotify/callback`;
}
if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
  console.error("[FATAL] DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables must be set!");
}
console.log(`[Config] Discord Client ID: ${DISCORD_CLIENT_ID.substring(0, 6)}... | Secret set: ${!!DISCORD_CLIENT_SECRET}`);
var JWT_SECRET = process.env.JWT_SECRET || "dev_secret_jwt";
var YOUTUBE_COOKIES = process.env.YOUTUBE_COOKIES || "";
var DISCORD_TOKEN = process.env.DISCORD_TOKEN;
var client;
var player;
var server = null;
var botStartTime = 0;
var botStatus = {
  state: "offline",
  guilds: 0,
  ping: 0,
  tag: "",
  uptime: 0
};
function clearReconnectTimer() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}
function scheduleBotReconnect(reason) {
  if (shuttingDown || !hasConfiguredDiscordToken(DISCORD_TOKEN) || botLoginInFlight || reconnectTimer || client.isReady()) {
    return;
  }
  reconnectAttempts += 1;
  const delay = getReconnectDelay(reconnectAttempts);
  botStatus.state = "reconnecting";
  logEvent("warn", "discord", `Po\u0142\u0105czenie z Discord zosta\u0142o przerwane (${reason}). Ponowna pr\xF3ba za ${Math.round(delay / 1e3)}s.`);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void bootstrapBot(true);
  }, delay);
}
function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  clearReconnectTimer();
  botStatus.state = "offline";
  logEvent("warn", "system", `Otrzymano ${signal}. Rozpoczynam bezpieczne zamykanie us\u0142ugi.`);
  const closeServer = server ? new Promise((resolve) => server.close(() => resolve())) : Promise.resolve();
  for (const queue of player.nodes.cache.values()) {
    try {
      queue.delete();
    } catch {
    }
  }
  try {
    client.destroy();
  } catch {
  }
  closeServer.catch(() => void 0).finally(() => process.exit(0));
}
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
var playbackHistory = /* @__PURE__ */ new Map();
var stripeClient = null;
var aiAssistant = null;
var repairCooldown = false;
var lastRepairAttempt = 0;
var reconnectTimer = null;
var reconnectAttempts = 0;
var botLoginInFlight = false;
var shuttingDown = false;
var geminiKey = process.env.GEMINI_API_KEY;
if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY" && !geminiKey.startsWith("YOUR_")) {
  aiAssistant = new import_genai.GoogleGenAI({ apiKey: geminiKey });
}
if (process.env.STRIPE_SECRET_KEY) {
  stripeClient = new import_stripe.default(process.env.STRIPE_SECRET_KEY);
}
client = new import_discord2.Client({
  intents: [
    import_discord2.GatewayIntentBits.Guilds,
    import_discord2.GatewayIntentBits.GuildVoiceStates,
    import_discord2.GatewayIntentBits.GuildMessages
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
    const text = response && response.text || "AI response unavailable";
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
app.get("/api/status", (req, res) => {
  const hasToken = !!(process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== "YOUR_DISCORD_BOT_TOKEN_HERE");
  const isReady = client && client.isReady();
  const inviteUrl = DISCORD_CLIENT_ID ? `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&scope=bot+applications.commands&permissions=8` : void 0;
  const mem = process.memoryUsage();
  res.json({
    state: isReady ? "online" : "offline",
    tag: isReady ? client.user?.tag || botStatus.tag : botStatus.tag,
    guilds: isReady ? client.guilds.cache.size : botStatus.guilds,
    ping: isReady ? client.ws.ping : botStatus.ping,
    uptime: botStartTime > 0 ? Math.floor((Date.now() - botStartTime) / 1e3) : 0,
    mockMode: !hasToken,
    inviteUrl,
    supportServerUrl: process.env.DISCORD_SERVER_INVITE || "https://discord.gg/MRN4WDUMKv",
    memory: {
      rss: Math.floor(mem.rss / 1024 / 1024),
      heapUsed: Math.floor(mem.heapUsed / 1024 / 1024)
    }
  });
});
app.get("/api/admin/system/version", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const currentVersion = "2.8.5-stable";
    let latestVersion = currentVersion;
    try {
      const ghRes = await fetch("https://api.github.com/repos/bbbbbbbbbc/Snajperrr/releases/latest", {
        headers: { "User-Agent": "Snajperrr-Dashboard" }
      });
      if (ghRes.ok) {
        const data = await ghRes.json();
        latestVersion = data.tag_name || currentVersion;
      }
    } catch (e) {
      console.warn("Could not fetch latest version from GitHub");
    }
    res.json({
      success: true,
      current: currentVersion,
      latest: latestVersion,
      needsUpdate: currentVersion !== latestVersion
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/admin/system/update", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    logEvent("info", "System", "U\u017Cytkownik zainicjowa\u0142 r\u0119czn\u0105 aktualizacj\u0119/napraw\u0119 systemu.");
    performSystemRepair();
    res.json({ success: true, message: "Inicjowanie aktualizacji extractors i czyszczenie pami\u0119ci podr\u0119cznej..." });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logEvent("error", "unhandledRejection", err.message, err);
});
process.on("uncaughtException", (error) => {
  logEvent("error", "uncaughtException", error.message, error);
});
player.onBeforeCreateStream = async (track, queryType, queue) => {
  const userId = queue.metadata?.user?.id || queue.metadata?.member?.id || queue.metadata?.interaction?.user?.id;
  if (!userId) return;
  const user = db_default.prepare("SELECT audio_quality, premium FROM users WHERE id = ?").get(userId);
  if (!user) return;
  let quality = user.audio_quality || "standard";
  if (user.premium !== 1 && quality === "ultra") quality = "high";
  if (track.extractor?.identifier === "youtubei" || track.source === "youtube") {
    console.log(`[YouTube] Extracting stream for: ${track.title} (Client: TV_EMBEDDED)`);
    return {
      useServerAbrStream: false,
      disableStreamPreExtraction: true,
      streamOptions: {
        useClient: "TV_EMBEDDED",
        highWaterMark: quality === "ultra" ? 1024 * 1024 * 128 : quality === "high" ? 1024 * 1024 * 64 : 1024 * 1024 * 32
      }
    };
  }
};
var analyzeAndStoreSolution = async (logId, message, details) => {
  if (!aiAssistant) return;
  try {
    const prompt = `Jeste\u015B systemem autodiagnostyki bota muzycznego. Wyst\u0105pi\u0142 b\u0142\u0105d:
WIADOMO\u015A\u0106: ${message}
SZCZEG\xD3\u0141Y: ${details}

Podaj kr\xF3tkie, konkretne rozwi\u0105zanie (max 2 zdania). Je\u015Bli to b\u0142\u0105d YouTube (decipher), zasugeruj "Restart Silnika Extractors".
Odpowiedz w JSON: {"solution": "tre\u015B\u0107", "canAutoFix": true/false}`;
    const response = await aiAssistant.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });
    const text = response.text;
    const data = JSON.parse(text || "{}");
    if (data.solution) {
      db_default.prepare("UPDATE system_logs SET solution = ? WHERE id = ?").run(data.solution, logId);
    }
  } catch (err) {
    if (err.message?.includes("API key not valid") || err.message?.includes("INVALID_ARGUMENT")) {
      console.warn("[AI] Gemini API Key is invalid. Disabling AI Assistant features.");
      aiAssistant = null;
    } else {
      console.error("AI Analysis Error (Background):", err);
    }
  }
};
var logEvent = (level, source, message, details) => {
  try {
    let detailsStr = null;
    if (details) {
      if (details instanceof Error) {
        detailsStr = `${details.message}
${details.stack}`;
      } else if (typeof details === "object") {
        detailsStr = JSON.stringify(details, null, 2);
      } else {
        detailsStr = String(details);
      }
    }
    const result = db_default.prepare("INSERT INTO system_logs (level, source, message, details, created_at) VALUES (?, ?, ?, ?, ?)").run(level, source, message, detailsStr, Date.now());
    const logId = result.lastInsertRowid;
    if (level === "error" || level === "warn") {
      if (level === "error" && (isRecoverableAudioError(message) || message.toLowerCase().includes("youtubejs"))) {
        performSystemRepair();
      }
      if (aiAssistant && level === "error") {
        analyzeAndStoreSolution(logId, message, detailsStr || "");
      }
      if (client && client.isReady()) {
        notifyAdmins(level, source, message, detailsStr || "");
      }
    }
    const time = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    if (level === "error") console.log(`\x1B[31m[${time}] [ERROR] [${source}] ${message}\x1B[0m`);
    else if (level === "warn") console.log(`\x1B[33m[${time}] [WARN] [${source}] ${message}\x1B[0m`);
    else console.log(`\x1B[32m[${time}] [INFO] [${source}] ${message}\x1B[0m`);
  } catch (err) {
    console.error("Failed to write to system_logs:", err);
  }
};
async function notifyAdmins(level, source, message, details) {
  try {
    const setting = db_default.prepare("SELECT value FROM global_settings WHERE key = 'admin_dm_notifications'").get();
    if (!setting || setting.value !== "1") return;
    const admins = db_default.prepare("SELECT id FROM users WHERE is_admin = 1").all();
    if (admins.length === 0) return;
    const embed = {
      title: `\u{1F6A8} System Alert: ${level.toUpperCase()}`,
      color: level === "error" ? 16711680 : 16755200,
      fields: [
        { name: "Source", value: source, inline: true },
        { name: "Time", value: (/* @__PURE__ */ new Date()).toLocaleString(), inline: true },
        { name: "Message", value: message.substring(0, 1024) }
      ],
      footer: { text: "Snajperrr Monitoring System v2.8.5 | Ultra Stable 3GB" },
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (details) {
      const cleanDetails = details.length > 900 ? details.substring(0, 900) + "..." : details;
      embed.fields.push({ name: "Details", value: `\`\`\`
${cleanDetails}
\`\`\`` });
    }
    for (const admin of admins) {
      try {
        const user = await client.users.fetch(admin.id);
        if (user) {
          await user.send({ embeds: [embed] });
        }
      } catch (e) {
      }
    }
  } catch (e) {
    console.error("Failed to notify admins:", e);
  }
}
var performSystemRepair = async () => {
  if (repairCooldown && Date.now() - lastRepairAttempt < 6e4) return false;
  repairCooldown = true;
  lastRepairAttempt = Date.now();
  logEvent("warn", "system", "Inicjowanie procedury autonaprawy (Stabilizacja Audio TV_EMBEDDED Ultra)...");
  try {
    try {
      await player.extractors.unregister(import_discord_player_youtubei.YoutubeiExtractor.identifier);
    } catch (e) {
    }
    await player.extractors.register(import_discord_player_youtubei.YoutubeiExtractor, {
      useServerAbrStream: false,
      ...YOUTUBE_COOKIES ? { cookie: YOUTUBE_COOKIES } : {},
      streamOptions: {
        useClient: "TV_EMBEDDED",
        highWaterMark: 1024 * 1024 * 128
        // 128MB
      }
    });
    await player.extractors.loadMulti(import_extractor.DefaultExtractors);
    db_default.prepare("UPDATE system_stats SET value = ? WHERE key = 'last_repair'").run(Date.now().toString());
    logEvent("info", "system", "System naprawiony pomy\u015Blnie. Zastosowano profil TV_EMBEDDED i ogromny bufor.");
    setTimeout(() => {
      repairCooldown = false;
    }, 6e4);
    return { success: true };
  } catch (err) {
    repairCooldown = false;
    logEvent("error", "system", `B\u0142\u0105d autonaprawy: ${err.message}`);
    return false;
  }
};
player.on("debug", (message) => {
  const spamPatterns = ["Querying all extractors", "appropriate extractor", "Failed to query metadata query using N/A extractor", "Using N/A extractor"];
  if (!spamPatterns.some((pattern) => message.includes(pattern))) {
    console.log(`[Player Debug] ${message}`);
    if (message.includes("Failed") || message.includes("Error") || message.includes("decipher") || message.includes("signature") || message.includes("Streaming data not available")) {
      logEvent("warn", "player-debug", message);
      if (message.includes("decipher") || message.includes("signature") || message.includes("Streaming data not available")) {
        if (!repairCooldown || Date.now() - lastRepairAttempt > 6e4) performSystemRepair();
      }
    }
  }
});
function getRedirectUri(req) {
  const xHost = req.headers["x-forwarded-host"];
  const xProto = req.headers["x-forwarded-proto"];
  const hostHeader = req.headers.host || "";
  const rawHost = Array.isArray(xHost) ? xHost[0] : xHost || hostHeader;
  const host = rawHost.split(",")[0].trim();
  const protocol = (Array.isArray(xProto) ? xProto[0] : xProto) || "https";
  const cleanHost = host.split(":")[0].toLowerCase();
  const isLocal = cleanHost.includes("localhost") || cleanHost.includes("127.0.0.1");
  console.log(`[Auth] Debug Redirect: host="${host}", clean="${cleanHost}", proto="${protocol}", xHost="${xHost}", xProto="${xProto}", APP_URL="${process.env.APP_URL}"`);
  let finalUri;
  if (process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL" && process.env.APP_URL.startsWith("http")) {
    const base = process.env.APP_URL.endsWith("/") ? process.env.APP_URL.slice(0, -1) : process.env.APP_URL;
    finalUri = `${base}/api/auth/callback`;
  } else if (isLocal) {
    finalUri = `http://localhost:3000/api/auth/callback`;
  } else if (cleanHost.endsWith(".run.app")) {
    finalUri = `https://${cleanHost}/api/auth/callback`;
  } else {
    finalUri = `${protocol}://${cleanHost}/api/auth/callback`;
  }
  console.log(`[Auth] Redirect URI generated: "${finalUri}"`);
  return finalUri;
}
app.get("/api/auth/url", (req, res) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    console.error("[Auth] Cannot generate OAuth URL: DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET is not configured.");
    return res.status(503).json({ error: "Discord OAuth is not configured. Please set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables." });
  }
  const redirectUri = getRedirectUri(req);
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "identify email guilds"
  });
  console.log(`[Auth] Login attempt. ID: ${DISCORD_CLIENT_ID}. Redirect: ${redirectUri}`);
  res.json({ url: `https://discord.com/api/oauth2/authorize?${params}` });
});
app.get("/api/auth/callback", async (req, res) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    return res.status(503).send("Discord OAuth is not configured.");
  }
  const { code, error, error_description } = req.query;
  if (error) {
    console.error(`[Auth Callback] Discord returned error: ${error} - ${error_description}`);
    return res.status(400).send(`Auth error from Discord: ${error_description || error}`);
  }
  const redirectUri = getRedirectUri(req);
  console.log("[Auth Callback] Code exchange starting...", {
    hasCode: !!code,
    redirectUri,
    host: req.headers.host,
    xHost: req.headers["x-forwarded-host"]
  });
  if (!code) return res.status(400).send("No code provided");
  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri
      }).toString(),
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      }
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error("[Auth Callback] Token exchange failed:", tokenData);
      return res.send(`Failed to fetch OAuth token: ${tokenData.error_description || tokenData.error}`);
    }
    const [userRes] = await Promise.all([
      fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      })
    ]);
    if (!userRes.ok) {
      return res.status(userRes.status).send("Failed to fetch user data from Discord");
    }
    const userData = await userRes.json();
    console.log(`[Auth Callback] Logged in as: ${userData.username} (${userData.id})`);
    if (userData.email === "konradszczerbinski8@gmail.com" || userData.id === "1230509684138709056") {
      db_default.prepare(`INSERT INTO users (id, username, avatar, is_admin) VALUES (?, ?, ?, 1) ON CONFLICT(id) DO UPDATE SET username=excluded.username, avatar=excluded.avatar, is_admin=1`).run(userData.id, userData.username, userData.avatar);
    } else {
      db_default.prepare(`INSERT INTO users (id, username, avatar) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET username=excluded.username, avatar=excluded.avatar`).run(userData.id, userData.username, userData.avatar);
    }
    const token = import_jsonwebtoken.default.sign({ id: userData.id, username: userData.username, avatar: userData.avatar }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("auth_token", token, {
      secure: true,
      sameSite: "none",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1e3
    });
    res.setHeader("Content-Type", "text/html");
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
            <p>Logowanie udane. To okno zostanie zamkni\u0119te.</p>
            <p><a href="/">Kliknij tutaj, je\u015Bli okno si\u0119 nie zamknie automatycznie.</a></p>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error during OAuth");
  }
});
app.get("/api/auth/spotify/login", (req, res) => {
  if (!SPOTIFY_CLIENT_ID) return res.status(503).json({ error: "Spotify is not configured" });
  const scope = "user-read-private user-read-email user-library-read playlist-read-private";
  const redirectUri = getSpotifyRedirectUri(req);
  const state = import_crypto2.default.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    response_type: "code",
    client_id: SPOTIFY_CLIENT_ID,
    scope,
    redirect_uri: redirectUri,
    state
  });
  res.json({ url: `https://accounts.spotify.com/authorize?${params}` });
});
app.get("/api/auth/spotify/callback", async (req, res) => {
  const { code } = req.query;
  const authToken = req.cookies.auth_token;
  if (!authToken) return res.status(401).send("Unauthorized");
  try {
    const decoded = import_jsonwebtoken.default.verify(authToken, JWT_SECRET);
    const redirectUri = getSpotifyRedirectUri(req);
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(SPOTIFY_CLIENT_ID + ":" + SPOTIFY_CLIENT_SECRET).toString("base64")
      },
      body: new URLSearchParams({
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error_description || data.error);
    const expiresAt = Date.now() + data.expires_in * 1e3;
    db_default.prepare("UPDATE users SET spotify_access_token = ?, spotify_refresh_token = ?, spotify_token_expires_at = ? WHERE id = ?").run(data.access_token, data.refresh_token, expiresAt, decoded.id);
    res.setHeader("Content-Type", "text/html");
    res.send(`
      <html><body><script>
        if (window.opener) {
          window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS' }, '*');
          window.close();
        } else { window.location.href = '/?tab=settings'; }
      </script></body></html>
    `);
  } catch (err) {
    console.error("[Spotify Callback] Error:", err);
    res.status(500).send("Spotify connection failed: " + err.message);
  }
});
app.post("/api/user/spotify/unlink", (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    db_default.prepare("UPDATE users SET spotify_access_token = NULL, spotify_refresh_token = NULL, spotify_token_expires_at = NULL WHERE id = ?").run(decoded.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/auth/logout", (req, res) => {
  res.clearCookie("auth_token", {
    secure: true,
    sameSite: "none",
    httpOnly: true
  });
  res.json({ success: true });
});
function parsePremiumSettings(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}
app.get("/api/me", (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.json({ loggedIn: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    let user = db_default.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id);
    if (!user) return res.json({ loggedIn: false });
    if (user.premium === 1 && user.premium_expires_at && user.premium_expires_at < Date.now()) {
      db_default.prepare("UPDATE users SET premium = 0, premium_expires_at = NULL WHERE id = ?").run(user.id);
      user.premium = 0;
      user.premium_expires_at = null;
    }
    user.premium_settings = parsePremiumSettings(user.premium_settings);
    res.json({ loggedIn: true, user });
  } catch (err) {
    res.json({ loggedIn: false });
  }
});
app.post("/api/user/settings", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const { audioQuality, premiumSettings } = req.body;
    const user = db_default.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id);
    if (!user) return res.status(404).json({ success: false, error: "U\u017Cytkownik nie znaleziony." });
    if (audioQuality !== void 0) {
      db_default.prepare("UPDATE users SET audio_quality = ? WHERE id = ?").run(audioQuality, decoded.id);
    }
    if (premiumSettings !== void 0) {
      if (user.premium !== 1) {
        return res.status(403).json({ success: false, error: "Ustawienia premium wymagaj\u0105 subskrypcji Premium." });
      }
      const existing = parsePremiumSettings(user.premium_settings) ?? {};
      const merged = { ...existing, ...premiumSettings };
      db_default.prepare("UPDATE users SET premium_settings = ? WHERE id = ?").run(JSON.stringify(merged), decoded.id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.get("/api/admin/users", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const adminUser = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!adminUser || adminUser.is_admin !== 1) return res.status(403).json({ success: false });
    const users = db_default.prepare("SELECT id, username, avatar, premium, premium_expires_at, is_admin FROM users").all();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/admin/users/:id/premium", import_express.default.json(), async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const adminUser = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!adminUser || adminUser.is_admin !== 1) return res.status(403).json({ success: false });
    const targetUserId = req.params.id;
    const { action, durationStr } = req.body;
    if (action === "revoke") {
      db_default.prepare("UPDATE users SET premium = 0, premium_expires_at = NULL WHERE id = ?").run(targetUserId);
    } else {
      let durationMs = durationStr && durationStr !== "lifetime" ? (0, import_ms2.default)(durationStr) : null;
      const currentUser = db_default.prepare("SELECT premium, premium_expires_at FROM users WHERE id = ?").get(targetUserId);
      let baseTime = Date.now();
      if (action === "extend" && currentUser.premium_expires_at && currentUser.premium_expires_at > Date.now()) baseTime = currentUser.premium_expires_at;
      let newExpiresAt = durationMs ? baseTime + durationMs : null;
      db_default.prepare("UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?").run(newExpiresAt, targetUserId);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/admin/vouchers", import_express.default.json(), async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const { type, durationStr, maxUses } = req.body;
    let duration = durationStr && durationStr !== "lifetime" ? (0, import_ms2.default)(durationStr) : null;
    const code = import_crypto2.default.randomBytes(6).toString("hex").toUpperCase();
    db_default.prepare("INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(code, type, duration, maxUses, 0, decoded.id, Date.now());
    res.json({ success: true, code, type, duration: durationStr, maxUses });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.get("/api/admin/vouchers", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const vouchers = db_default.prepare("SELECT * FROM vouchers ORDER BY created_at DESC").all();
    res.json({ success: true, vouchers });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.get("/api/public-logs", async (req, res) => {
  try {
    const logs = db_default.prepare("SELECT level, source, message, details, created_at FROM system_logs ORDER BY created_at DESC LIMIT 150").all();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.get("/api/admin/logs", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const logs = db_default.prepare("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 500").all();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
var sendLogsEmail = async (isAuto = false) => {
  const adminEmail = process.env.ADMIN_EMAIL || "konradszczerbinski8@gmail.com";
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  if (!smtpHost || !smtpUser || !smtpPass) return { success: false };
  try {
    const logs = db_default.prepare("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 1000").all();
    if (logs.length === 0) return { success: true };
    const transporter = import_nodemailer.default.createTransport({ host: smtpHost, port: smtpPort, secure: smtpPort === 465, auth: { user: smtpUser, pass: smtpPass } });
    const logsCsv = "ID,Level,Source,Message,Details,Date\n" + logs.map((l) => `${l.id},${l.level},${l.source},"${l.message}","${l.details || ""}",${new Date(l.created_at).toISOString()}`).join("\n");
    await transporter.sendMail({ from: `"Snajperrr System" <${smtpUser}>`, to: adminEmail, subject: `[LOGS] Snajperrr - ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`, html: `<p>Logs attached.</p>`, attachments: [{ filename: `logs_${Date.now()}.csv`, content: logsCsv }] });
    return { success: true };
  } catch (err) {
    return { success: false };
  }
};
app.post("/api/admin/logs/export", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    res.json(await sendLogsEmail());
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.patch("/api/admin/logs/:id", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    db_default.prepare("UPDATE system_logs SET solution = ? WHERE id = ?").run(req.body.solution, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.get("/api/admin/system/stats", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const stats = db_default.prepare("SELECT * FROM system_stats").all();
    res.json({ success: true, stats: stats.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {}) });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/admin/system/repair", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    res.json(await performSystemRepair());
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/bugs", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    db_default.prepare("INSERT INTO bug_reports (user_id, title, description, priority, created_at) VALUES (?, ?, ?, ?, ?)").run(decoded.id, req.body.title, req.body.description, req.body.priority || "low", Date.now());
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.get("/api/admin/bugs", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    res.json({ success: true, bugs: db_default.prepare("SELECT b.*, u.username as reporter FROM bug_reports b LEFT JOIN users u ON b.user_id = u.id ORDER BY b.created_at DESC").all() });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.patch("/api/admin/bugs/:id", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    db_default.prepare("UPDATE bug_reports SET status = ? WHERE id = ?").run(req.body.status, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/vouchers/redeem", import_express.default.json(), async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const code = req.body.code?.trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "Kod wymagany." });
    const voucher = db_default.prepare("SELECT * FROM vouchers WHERE code = ?").get(code);
    if (!voucher) return res.status(404).json({ error: "Nieprawid\u0142owy kod." });
    if (voucher.max_uses > 0 && voucher.uses >= voucher.max_uses) return res.status(400).json({ error: "Zu\u017Cyty." });
    const alreadyRedeemed = db_default.prepare("SELECT 1 FROM redeemed_vouchers WHERE code = ? AND user_id = ?").get(code, decoded.id);
    if (alreadyRedeemed) return res.status(400).json({ error: "Ju\u017C zrealizowany." });
    const expiresAt = voucher.duration ? Date.now() + voucher.duration : null;
    const guildId = req.body.guildId?.trim();
    db_default.transaction(() => {
      if (voucher.type === "user_premium") db_default.prepare("UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?").run(expiresAt, decoded.id);
      else if (voucher.type === "guild_premium") {
        if (!guildId) throw new Error("requires_guild_id");
        db_default.prepare("INSERT INTO guilds_premium (guild_id, added_by, active) VALUES (?, ?, 1) ON CONFLICT(guild_id) DO UPDATE SET active = 1, added_by = excluded.added_by").run(guildId, decoded.id);
      }
      db_default.prepare("INSERT INTO redeemed_vouchers (code, user_id, redeemed_at) VALUES (?, ?, ?)").run(code, decoded.id, Date.now());
      db_default.prepare("UPDATE vouchers SET uses = uses + 1 WHERE code = ?").run(code);
    })();
    res.json({ success: true, message: "Premium aktywowane!" });
  } catch (err) {
    res.status(500).json({ error: err.message || "B\u0142\u0105d." });
  }
});
app.post("/api/stripe/checkout", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    if (!stripeClient) {
      db_default.prepare("UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?").run(Date.now() + (0, import_ms2.default)("30d"), decoded.id);
      return res.json({ url: `${getRedirectUri(req).replace("/api/auth/callback", "")}?checkout=success` });
    }
    const session = await stripeClient.checkout.sessions.create({ payment_method_types: ["card"], mode: "subscription", line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }], client_reference_id: decoded.id, success_url: `${getRedirectUri(req).replace("/api/auth/callback", "")}?checkout=success`, cancel_url: `${getRedirectUri(req).replace("/api/auth/callback", "")}?checkout=cancel` });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: "Failed" });
  }
});
var ADVANCED_NODE_OPTIONS = {
  volume: 80,
  bufferingTimeout: 12e4,
  maxSize: 1e4,
  leaveOnEnd: false,
  leaveOnEmpty: true,
  leaveOnEmptyCooldown: 3e5,
  leaveOnStop: false,
  disableFallbackStream: false,
  noEmitInsert: false,
  preferBridgedMetadata: true
};
player.events.on("playerStart", async (queue, track) => {
  logEvent("info", "bot", `Gra: ${track.title}`, { guild: queue.guild.name, author: track.author });
  const history = playbackHistory.get(queue.guild.id) || [];
  history.unshift({ title: track.title, author: track.author, duration: track.duration, playedAt: Date.now(), url: track.url });
  if (history.length > 50) history.pop();
  playbackHistory.set(queue.guild.id, history);
  queue.node.setVolume(80);
});
player.events.on("error", async (queue, error) => {
  logEvent("error", "bot", `Queue Error: ${error.message}`, { guild: queue.guild.name });
  if (isRecoverableAudioError(error.message)) {
    await performSystemRepair();
  }
});
player.events.on("playerError", async (queue, error) => {
  logEvent("error", "bot", `Audio Extraction Error: ${error.message}`, { guild: queue.guild.name });
  console.log(`[Advanced Player] Emitted playerError: ${error.message}`);
  if (isRecoverableAudioError(error.message)) {
    await performSystemRepair();
  }
});
player.events.on("disconnect", async (queue) => {
  logEvent("info", "bot", `Voice channel disconnected manually or kicked.`, { guild: queue.guild.name });
});
client.on("ready", async () => {
  clearReconnectTimer();
  reconnectAttempts = 0;
  botStatus.state = "online";
  botStatus.tag = client.user?.tag || "";
  botStatus.guilds = client.guilds.cache.size;
  botStartTime = Date.now();
  if (client.user) client.user.setActivity("music | /play", { type: import_discord2.ActivityType.Listening });
  if (hasConfiguredDiscordToken(DISCORD_TOKEN)) {
    try {
      const commandBuilders = [
        ...adminCommandsDefinitions,
        new import_discord2.SlashCommandBuilder().setName("join").setDescription("Join VC"),
        new import_discord2.SlashCommandBuilder().setName("play").setDescription("Play song").addStringOption((o) => o.setName("song").setDescription("Song name/URL").setRequired(true)),
        new import_discord2.SlashCommandBuilder().setName("search").setDescription("Search song").addStringOption((o) => o.setName("query").setDescription("Query").setRequired(true)),
        new import_discord2.SlashCommandBuilder().setName("pause").setDescription("Pause"),
        new import_discord2.SlashCommandBuilder().setName("resume").setDescription("Resume"),
        new import_discord2.SlashCommandBuilder().setName("skip").setDescription("Skip"),
        new import_discord2.SlashCommandBuilder().setName("stop").setDescription("Stop"),
        new import_discord2.SlashCommandBuilder().setName("volume").setDescription("Set volume").addIntegerOption((o) => o.setName("level").setDescription("0-100").setRequired(true)),
        new import_discord2.SlashCommandBuilder().setName("download").setDescription("Download audio or video from YouTube").addStringOption((o) => o.setName("url").setDescription("YouTube Video URL").setRequired(true)).addStringOption((o) => o.setName("type").setDescription("Format type").addChoices({ name: "Audio Only", value: "audio" }, { name: "Video Only", value: "video" }, { name: "Both separate", value: "both" }).setRequired(true)).addStringOption((o) => o.setName("path").setDescription("Absolute path on disk to save (e.g. /tmp/downloads)").setRequired(true))
      ];
      const commands = commandBuilders.map((c) => c.toJSON());
      await new import_discord2.REST({ version: "10" }).setToken(DISCORD_TOKEN).put(import_discord2.Routes.applicationCommands(client.user.id), { body: commands });
    } catch (e) {
      console.error("Register commands error:", e);
    }
  }
});
client.on("shardDisconnect", (_event, shardId) => {
  if (shuttingDown) return;
  scheduleBotReconnect(`shard ${shardId}`);
});
client.on("shardError", (error, shardId) => {
  logEvent("error", "discord", `B\u0142\u0105d shard ${shardId}: ${error.message}`, error);
  scheduleBotReconnect(`b\u0142\u0105d shard ${shardId}`);
});
client.on("shardReconnecting", (shardId) => {
  botStatus.state = "reconnecting";
  logEvent("warn", "discord", `Shard ${shardId} pr\xF3buje wznowi\u0107 po\u0142\u0105czenie.`);
});
client.on("shardResume", (_replayedEvents, shardId) => {
  reconnectAttempts = 0;
  botStatus.state = "online";
  logEvent("info", "discord", `Shard ${shardId} wznowi\u0142 po\u0142\u0105czenie.`);
});
client.on("invalidated", () => {
  botStatus.state = "error";
  logEvent("error", "discord", "Sesja Discord zosta\u0142a uniewa\u017Cniona. Sprawd\u017A token i wdro\u017Cenie us\u0142ugi.");
});
var isAdmin = (req, res, next) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ error: "Forbidden" });
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
app.get("/api/admin/system/diag", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const diag = {
      discord: {
        tokenSet: !!process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== "YOUR_DISCORD_BOT_TOKEN_HERE",
        clientIdSet: !!DISCORD_CLIENT_ID,
        clientSecretSet: !!DISCORD_CLIENT_SECRET,
        isReady: client?.isReady(),
        guilds: client?.isReady() ? client.guilds.cache.size : 0,
        user: client?.user?.tag || "Not logged in"
      },
      player: {
        extractorsCount: player?.extractors.size || 0,
        nodesCount: player?.nodes.cache.size || 0
      },
      env: {
        appUrl: process.env.APP_URL || "Not set",
        nodeEnv: process.env.NODE_ENV || "development",
        calculatedRedirectUri: getRedirectUri(req)
      },
      system: {
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage()
      },
      activePlayers: client?.isReady() && player?.nodes ? Array.from(player.nodes.cache.values()).map((q) => ({
        guildId: q.guild.id,
        guildName: q.guild.name,
        channelName: q.channel?.name || "Voice",
        nowPlaying: q.currentTrack ? { title: q.currentTrack.title, author: q.currentTrack.author, duration: Math.floor(q.currentTrack.durationMS / 1e3) } : null,
        queueLength: q.tracks.size,
        state: q.node.isPaused() ? "paused" : "playing",
        volume: q.node.volume
      })) : []
    };
    res.json({ success: true, diag });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.delete("/api/admin/vouchers/:code", isAdmin, (req, res) => {
  try {
    db_default.prepare("DELETE FROM vouchers WHERE code = ?").run(req.params.code);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/admin/broadcast", import_express.default.json(), isAdmin, async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!client.isReady()) return res.status(400).json({ success: false, message: "Bot nie jest gotowy" });
    db_default.prepare("INSERT INTO announcements (title, body, created_at, created_by) VALUES (?, ?, ?, ?)").run(title, message, Date.now(), req.user.id);
    let sentCount = 0;
    const embed = new import_discord2.EmbedBuilder().setTitle(title || "Powiadomienie Systemowe").setDescription(message).setColor(5793266).setTimestamp();
    for (const guild of client.guilds.cache.values()) {
      try {
        const channel = guild.channels.cache.find((c) => c.isTextBased() && c.permissionsFor(client.user)?.has(["SendMessages", "EmbedLinks"]));
        if (channel) {
          await channel.send({ embeds: [embed] });
          sentCount++;
        }
      } catch (e) {
      }
    }
    res.json({ success: true, sentCount });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.get("/api/admin/broadcasts", isAdmin, (req, res) => {
  try {
    const broadcasts = db_default.prepare("SELECT * FROM announcements ORDER BY created_at DESC").all();
    res.json({ success: true, broadcasts });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/admin/system/maintenance", import_express.default.json(), isAdmin, (req, res) => {
  try {
    const { enabled } = req.body;
    db_default.prepare("INSERT OR REPLACE INTO global_settings (key, value) VALUES ('maintenance_mode', ?)").run(enabled ? "1" : "0");
    res.json({ success: true, maintenance: enabled });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.get("/api/admin/config", isAdmin, (req, res) => {
  try {
    res.json({
      success: true,
      config: {
        DISCORD_TOKEN: process.env.DISCORD_TOKEN ? "\u2022\u2022\u2022\u2022\u2022\u2022" + (process.env.DISCORD_TOKEN.slice(-4) || "") : "",
        DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || "",
        DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ? "\u2022\u2022\u2022\u2022\u2022\u2022" + (process.env.DISCORD_CLIENT_SECRET.slice(-4) || "") : "",
        SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || "",
        SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET ? "\u2022\u2022\u2022\u2022\u2022\u2022" + (process.env.SPOTIFY_CLIENT_SECRET.slice(-4) || "") : "",
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "\u2022\u2022\u2022\u2022\u2022\u2022" + (process.env.GEMINI_API_KEY.slice(-4) || "") : "",
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "\u2022\u2022\u2022\u2022\u2022\u2022" + (process.env.STRIPE_SECRET_KEY.slice(-4) || "") : "",
        JWT_SECRET: process.env.JWT_SECRET ? "\u2022\u2022\u2022\u2022\u2022\u2022" + (process.env.JWT_SECRET.slice(-4) || "") : "",
        YOUTUBE_COOKIES: process.env.YOUTUBE_COOKIES ? "(ustawione)" : "",
        APP_URL: process.env.APP_URL || ""
      }
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/admin/config", import_express.default.json(), isAdmin, (req, res) => {
  try {
    const { key, value } = req.body;
    const ALLOWED_KEYS = [
      "DISCORD_TOKEN",
      "DISCORD_CLIENT_ID",
      "DISCORD_CLIENT_SECRET",
      "SPOTIFY_CLIENT_ID",
      "SPOTIFY_CLIENT_SECRET",
      "GEMINI_API_KEY",
      "STRIPE_SECRET_KEY",
      "JWT_SECRET",
      "YOUTUBE_COOKIES",
      "APP_URL"
    ];
    if (!key || !ALLOWED_KEYS.includes(key)) {
      return res.status(400).json({ success: false, error: "Nieprawid\u0142owy klucz konfiguracji." });
    }
    if (typeof value !== "string") {
      return res.status(400).json({ success: false, error: "Warto\u015B\u0107 musi by\u0107 tekstem." });
    }
    process.env[key] = value;
    db_default.prepare("INSERT OR REPLACE INTO global_settings (key, value) VALUES (?, ?)").run(`config_${key}`, value);
    logEvent("info", "admin", `Zaktualizowano klucz konfiguracji: ${key}`);
    res.json({ success: true, message: `Zaktualizowano ${key}` });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/admin/config/restart-bot", import_express.default.json(), isAdmin, async (req, res) => {
  try {
    logEvent("info", "admin", "Administrator za\u017C\u0105da\u0142 restartu bota z now\u0105 konfiguracj\u0105.");
    try {
      client.destroy();
    } catch {
    }
    botStatus.state = "offline";
    reconnectAttempts = 0;
    botLoginInFlight = false;
    setTimeout(async () => {
      await bootstrapExtractors();
      await bootstrapBot(true);
    }, 2e3);
    res.json({ success: true, message: "Bot jest restartowany z now\u0105 konfiguracj\u0105." });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
async function bootstrapExtractors() {
  try {
    console.log("[Bot] \u0141adowanie ekstraktor\xF3w...");
    if (SPOTIFY_CLIENT_ID && SPOTIFY_CLIENT_SECRET) {
      await player.extractors.register(import_extractor.SpotifyExtractor, {
        clientId: SPOTIFY_CLIENT_ID,
        clientSecret: SPOTIFY_CLIENT_SECRET
      });
      console.log("[Bot] Spotify Extractor skonfigurowany.");
    }
    await player.extractors.loadMulti(import_extractor.DefaultExtractors);
    try {
      await player.extractors.unregister("YouTubeExtractor");
    } catch (e) {
    }
    try {
      await player.extractors.unregister(import_discord_player_youtubei.YoutubeiExtractor.identifier);
    } catch (e) {
    }
    await player.extractors.register(import_discord_player_youtubei.YoutubeiExtractor, {
      useServerAbrStream: false,
      ...YOUTUBE_COOKIES ? { cookie: YOUTUBE_COOKIES } : {},
      streamOptions: {
        highWaterMark: 1024 * 1024 * 128,
        // Zwiększony bufor dla ogromnych pingow
        useClient: "TV_EMBEDDED"
      }
    });
    logEvent("info", "system", "Ekstraktory za\u0142adowane pomy\u015Blnie.");
  } catch (e) {
    logEvent("error", "system", `B\u0142\u0105d \u0142adowania ekstraktor\xF3w: ${e.message}`, e);
  }
}
async function bootstrapBot(_force = false) {
  if (!hasConfiguredDiscordToken(DISCORD_TOKEN)) {
    logEvent("warn", "system", "Brak poprawnego DISCORD_TOKEN. Bot pozostanie offline.");
    return;
  }
  if (shuttingDown || botLoginInFlight || client.isReady()) return;
  clearReconnectTimer();
  botLoginInFlight = true;
  console.log("[Bot] Pr\xF3ba logowania...");
  let loginError = null;
  try {
    await client.login(DISCORD_TOKEN);
    reconnectAttempts = 0;
    logEvent("info", "system", "Discord Bot zalogowany pomy\u015Blnie.");
  } catch (e) {
    loginError = e instanceof Error ? e : new Error(String(e));
    logEvent("error", "system", `Nieudane logowanie do Discord: ${loginError.message}`, loginError);
    botStatus.state = "error";
  } finally {
    botLoginInFlight = false;
  }
  if (loginError) {
    scheduleBotReconnect(loginError.message);
  }
}
app.get("/api/players", (req, res) => {
  const info = [];
  if (client?.isReady() && player?.nodes) {
    for (const [id, q] of player.nodes.cache) {
      if (!q) continue;
      const t = q.currentTrack;
      info.push({ guildId: id, guildName: q.guild.name, channelName: q.channel?.name || "Voice", nowPlaying: t ? { title: t.title, author: t.author, duration: Math.floor(t.durationMS / 1e3), current: Math.floor(q.node.streamTime / 1e3), thumbnail: t.thumbnail } : null, queueLength: q.tracks.size, queue: q.tracks.toArray().map((t2) => ({ id: t2.id, title: t2.title, author: t2.author, duration: Math.floor(t2.durationMS / 1e3) })), history: playbackHistory.get(id) || [], state: q.node.isPaused() ? "paused" : "playing", volume: q.node.volume });
    }
  }
  res.json(info);
});
app.delete("/api/players/:guildId/queue/:trackId", (req, res) => {
  const q = player.nodes.get(req.params.guildId);
  if (!q) return res.status(404).json({ success: false });
  const t = q.tracks.toArray().find((tr) => tr.id === req.params.trackId);
  if (t) q.node.remove(t);
  res.json({ success: true });
});
app.post("/api/players/:guildId/queue/move", import_express.default.json(), (req, res) => {
  const q = player.nodes.get(req.params.guildId);
  if (q) {
    const tracks = q.tracks.toArray();
    const { from, to } = req.body;
    if (tracks[from]) {
      q.node.move(tracks[from], to);
      return res.json({ success: true });
    }
  }
  res.status(400).json({ success: false });
});
client.on("interactionCreate", async (interaction) => {
  const maintenance = db_default.prepare("SELECT value FROM global_settings WHERE key = 'maintenance_mode'").get();
  if (maintenance?.value === "1") {
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(interaction.user.id);
    if (!user || user.is_admin !== 1) {
      if (interaction.isRepliable()) return interaction.reply({ content: "\u26A0\uFE0F Tryb Konserwacji.", ephemeral: true });
      return;
    }
  }
  if (interaction.isStringSelectMenu() && interaction.customId === "search_results") {
    const member2 = interaction.member;
    if (!member2.voice?.channel) return interaction.reply({ content: "Musisz by\u0107 na kanale!", ephemeral: true });
    await interaction.deferReply();
    const res = await player.search(interaction.values[0], { requestedBy: interaction.user });
    if (res.hasTracks()) {
      const { track } = await player.play(member2.voice.channel, res, {
        nodeOptions: {
          metadata: interaction,
          ...ADVANCED_NODE_OPTIONS
        }
      });
      await interaction.followUp(`\u{1F3B5} Wybrano: **${track.title}**`);
    } else await interaction.followUp("\u274C Nie znaleziono.");
  }
  if (!interaction.isChatInputCommand()) return;
  if (await handleAdminCommands(interaction)) return;
  const member = interaction.member;
  const { commandName, guildId } = interaction;
  if (commandName === "join") {
    if (!member.voice?.channel) return interaction.reply({ content: "Musisz by\u0107 na kanale!", ephemeral: true });
    try {
      const q = player.nodes.create(interaction.guild, {
        metadata: interaction,
        ...ADVANCED_NODE_OPTIONS
      });
      await q.connect(member.voice.channel);
      await interaction.reply("\u2705 Do\u0142\u0105czono!");
    } catch (err) {
      logEvent("error", "bot", `B\u0142\u0105d do\u0142\u0105czania do kana\u0142u g\u0142osowego: ${err.message}`, err);
      if (isRecoverableAudioError(err.message)) {
        await performSystemRepair();
      }
      await interaction.reply({ content: "\u274C Nie uda\u0142o si\u0119 do\u0142\u0105czy\u0107 do kana\u0142u g\u0142osowego. Spr\xF3buj ponownie za chwil\u0119.", ephemeral: true });
    }
  } else if (commandName === "play") {
    if (!member.voice?.channel) return interaction.reply({ content: "Musisz by\u0107 na kanale!", ephemeral: true });
    await interaction.deferReply();
    try {
      const res = await player.search(interaction.options.getString("song", true), { requestedBy: interaction.user });
      if (res.hasTracks()) {
        const { track } = await player.play(member.voice.channel, res, {
          nodeOptions: {
            metadata: interaction,
            ...ADVANCED_NODE_OPTIONS
          }
        });
        await interaction.followUp(`\u{1F3B5} Dodano: **${track.title}**`);
      } else await interaction.followUp("\u274C Nie znaleziono.");
    } catch (err) {
      logEvent("error", "bot", `B\u0142\u0105d odtwarzania audio: ${err.message}`, err);
      if (isRecoverableAudioError(err.message)) {
        await performSystemRepair();
      }
      await interaction.followUp("\u274C Nie uda\u0142o si\u0119 odtworzy\u0107 utworu. Silnik audio zosta\u0142 od\u015Bwie\u017Cony \u2014 spr\xF3buj ponownie.");
    }
  } else if (commandName === "pause") {
    const q = player.nodes.get(guildId);
    if (q) {
      q.node.setPaused(true);
      await interaction.reply("\u23F8\uFE0F Wstrzymano.");
    } else await interaction.reply({ content: "\u274C Brak aktywnej kolejki.", ephemeral: true });
  } else if (commandName === "resume") {
    const q = player.nodes.get(guildId);
    if (q) {
      q.node.setPaused(false);
      await interaction.reply("\u25B6\uFE0F Wznowiono.");
    } else await interaction.reply({ content: "\u274C Brak aktywnej kolejki.", ephemeral: true });
  } else if (commandName === "skip") {
    const q = player.nodes.get(guildId);
    if (q) {
      q.node.skip();
      await interaction.reply("\u23ED\uFE0F Pomini\u0119to.");
    } else await interaction.reply({ content: "\u274C Brak aktywnej kolejki.", ephemeral: true });
  } else if (commandName === "stop") {
    const q = player.nodes.get(guildId);
    if (q) {
      q.delete();
      await interaction.reply("\u23F9\uFE0F Zatrzymano.");
    } else await interaction.reply({ content: "\u274C Brak aktywnej kolejki.", ephemeral: true });
  } else if (commandName === "volume") {
    const q = player.nodes.get(guildId);
    if (q) {
      const level = interaction.options.getInteger("level", true);
      const clamped = Math.max(0, Math.min(100, level));
      q.node.setVolume(clamped);
      await interaction.reply(`\u{1F50A} G\u0142o\u015Bno\u015B\u0107 ustawiona na **${clamped}%**.`);
    } else await interaction.reply({ content: "\u274C Brak aktywnej kolejki.", ephemeral: true });
  } else if (commandName === "search") {
    if (!member.voice?.channel) return interaction.reply({ content: "Musisz by\u0107 na kanale!", ephemeral: true });
    await interaction.deferReply();
    try {
      const query = interaction.options.getString("query", true);
      const res = await player.search(query, { requestedBy: interaction.user });
      if (!res.hasTracks()) return interaction.followUp("\u274C Nie znaleziono.");
      const top = res.tracks.slice(0, 10);
      const menu = new import_discord2.StringSelectMenuBuilder().setCustomId("search_results").setPlaceholder("Wybierz utw\xF3r").addOptions(top.map((t, i) => new import_discord2.StringSelectMenuOptionBuilder().setLabel(`${i + 1}. ${t.title}`.substring(0, 100)).setDescription(t.author.substring(0, 100)).setValue(t.url)));
      const row = new import_discord2.ActionRowBuilder().addComponents(menu);
      await interaction.followUp({ content: `\u{1F50D} Wyniki wyszukiwania dla: **${query}**`, components: [row] });
    } catch (err) {
      logEvent("error", "bot", `B\u0142\u0105d wyszukiwania: ${err.message}`, err);
      await interaction.followUp("\u274C B\u0142\u0105d wyszukiwania.");
    }
  } else if (commandName === "download") {
    await interaction.deferReply();
    const url = interaction.options.getString("url", true);
    const type = interaction.options.getString("type", true);
    const rawPath = interaction.options.getString("path", true);
    const savePath = import_path2.default.resolve(rawPath);
    if (!savePath.startsWith("/tmp")) {
      return interaction.followUp("\u274C Ze wzgl\u0119d\xF3w bezpiecze\u0144stwa \u015Bcie\u017Cka musi zaczyna\u0107 si\u0119 od /tmp.");
    }
    try {
      await interaction.followUp(`\u23F3 Downloading...`);
      const dlPath = await globalDownloader.download({
        url,
        format: type,
        outputPath: savePath,
        quality: "best"
      });
      await interaction.followUp(`\u2705 Downloaded successfully to: ${dlPath}`);
    } catch (err) {
      await interaction.followUp(`\u274C Failed to download: ${err.message}`);
    }
  }
});
app.post("/api/players/:guildId/volume", (req, res) => {
  const q = player.nodes.get(req.params.guildId);
  if (q && typeof req.body.volume === "number") {
    q.node.setVolume(req.body.volume);
    res.json({ success: true });
  } else res.status(404).json({ error: "Not found" });
});
app.post("/api/players/:guildId/playback", (req, res) => {
  const q = player.nodes.get(req.params.guildId);
  if (q) {
    q.node.setPaused(req.body.state === "paused");
    res.json({ success: true });
  } else res.status(404).json({ error: "Not found" });
});
app.get("/api/search", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query || typeof query !== "string") return res.status(400).json({ success: false, error: "Missing query parameter" });
    const r = await player.search(query);
    res.json({ success: true, tracks: r.tracks.slice(0, 10).map((t) => ({ title: t.title, author: t.author, duration: t.duration, url: t.url, thumbnail: t.thumbnail })) });
  } catch {
    res.status(500).json({ success: false });
  }
});
app.post("/api/players/:guildId/play", async (req, res) => {
  const q = player.nodes.get(req.params.guildId);
  if (q) {
    const r = await player.search(req.body.url);
    if (r.hasTracks()) {
      q.addTrack(r.tracks[0]);
      res.json({ success: true });
    } else res.status(404).json({ error: "Not found" });
  } else res.status(400).json({ error: "Connect on Discord first." });
});
async function start() {
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  server = app.listen(PORT, "0.0.0.0", () => console.log(`Run on ${PORT}`));
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const v = await createServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(v.middlewares);
  } else {
    const d = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(d));
    app.get("*", (req, res) => res.sendFile(import_path2.default.join(d, "index.html")));
  }
  await bootstrapExtractors();
  await bootstrapBot();
}
start();
//# sourceMappingURL=server.cjs.map
