// server.ts
import express from "express";
import path2 from "path";
import "dotenv/config";
import cookieParser from "cookie-parser";
import {
  Client,
  GatewayIntentBits,
  ActivityType,
  REST,
  Routes,
  SlashCommandBuilder as SlashCommandBuilder2,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder
} from "discord.js";
import { Player } from "discord-player";
import { DefaultExtractors } from "@discord-player/extractor";
import { YoutubeiExtractor } from "discord-player-youtubei";
import jwt from "jsonwebtoken";
import Stripe from "stripe";
import crypto2 from "crypto";
import ms2 from "ms";
import { GoogleGenAI } from "@google/genai";
import nodemailer from "nodemailer";

// src/db.ts
import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import path from "path";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var db = new Database("database.db");
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT,
    avatar TEXT,
    is_admin INTEGER DEFAULT 0,
    premium INTEGER DEFAULT 0,
    premium_expires_at INTEGER,
    audio_quality TEXT DEFAULT 'high',
    premium_settings TEXT DEFAULT '{}'
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
var seedStats = [
  { key: "last_repair", value: "0" },
  { key: "total_repairs", value: "0" },
  { key: "reboot_count", value: "0" }
];
var seedSettings = [
  { key: "admin_dm_notifications", value: "1" },
  { key: "maintenance_mode", value: "0" }
];
var insertStat = db.prepare("INSERT OR IGNORE INTO system_stats (key, value) VALUES (?, ?)");
seedStats.forEach((stat) => insertStat.run(stat.key, stat.value));
var insertSetting = db.prepare("INSERT OR IGNORE INTO global_settings (key, value) VALUES (?, ?)");
seedSettings.forEach((setting) => insertSetting.run(setting.key, setting.value));
var db_default = db;

// src/adminCommands.ts
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import ms from "ms";
import crypto from "crypto";
var adminCommandsDefinitions = [
  new SlashCommandBuilder().setName("ban").setDescription("Banuje u\u017Cytkownika").setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d")),
  new SlashCommandBuilder().setName("unban").setDescription("Odbanowuje u\u017Cytkownika").setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addStringOption((o) => o.setName("user_id").setDescription("ID U\u017Cytkownika").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d")),
  new SlashCommandBuilder().setName("kick").setDescription("Wyrzuca u\u017Cytkownika").setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d")),
  new SlashCommandBuilder().setName("mute").setDescription("Wycisza (timeout) u\u017Cytkownika").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("duration").setDescription("Czas (np. 10m, 1h, 1d)").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d")),
  new SlashCommandBuilder().setName("unmute").setDescription("Odcisza u\u017Cytkownika").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d")),
  new SlashCommandBuilder().setName("clear").setDescription("Czy\u015Bci wiadomo\u015Bci").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addIntegerOption((o) => o.setName("amount").setDescription("Ilo\u015B\u0107 (1-100)").setRequired(true)),
  new SlashCommandBuilder().setName("clearuser").setDescription("Czy\u015Bci wiadomo\u015Bci u\u017Cytkownika na tym kanale").setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addIntegerOption((o) => o.setName("amount").setDescription("Ile wiadomo\u015Bci przeszuka\u0107 (1-100)").setRequired(true)),
  new SlashCommandBuilder().setName("lock").setDescription("Zamyka kana\u0142").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).addChannelOption((o) => o.setName("channel").setDescription("Kana\u0142")),
  new SlashCommandBuilder().setName("unlock").setDescription("Otwiera kana\u0142").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).addChannelOption((o) => o.setName("channel").setDescription("Kana\u0142")),
  new SlashCommandBuilder().setName("slowmode").setDescription("Ustawia slowmode").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).addIntegerOption((o) => o.setName("seconds").setDescription("Sekundy (0 aby wy\u0142\u0105czy\u0107)").setRequired(true)).addChannelOption((o) => o.setName("channel").setDescription("Kana\u0142")),
  new SlashCommandBuilder().setName("setnick").setDescription("Zmienia pseudonim").setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("nick").setDescription("Nowy pseudonim (puste aby zresetowa\u0107)")),
  new SlashCommandBuilder().setName("warn").setDescription("Ostrzega u\u017Cytkownika").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d").setRequired(true)),
  new SlashCommandBuilder().setName("warnings").setDescription("Lista ostrze\u017Ce\u0144").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)),
  new SlashCommandBuilder().setName("clearwarns").setDescription("Czy\u015Bci ostrze\u017Cenia").setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)),
  new SlashCommandBuilder().setName("addrole").setDescription("Dodaje rol\u0119").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addRoleOption((o) => o.setName("role").setDescription("Rola").setRequired(true)),
  new SlashCommandBuilder().setName("removerole").setDescription("Odbiera rol\u0119").setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addRoleOption((o) => o.setName("role").setDescription("Rola").setRequired(true)),
  new SlashCommandBuilder().setName("tempban").setDescription("Tymczasowo banuje u\u017Cytkownika").setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik").setRequired(true)).addStringOption((o) => o.setName("duration").setDescription("Czas (np. 1d, 1w)").setRequired(true)).addStringOption((o) => o.setName("reason").setDescription("Pow\xF3d")),
  new SlashCommandBuilder().setName("announce").setDescription("Wysy\u0142a og\u0142oszenie").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addStringOption((o) => o.setName("message").setDescription("Wiadomo\u015B\u0107").setRequired(true)).addChannelOption((o) => o.setName("channel").setDescription("Kana\u0142")),
  new SlashCommandBuilder().setName("userinfo").setDescription("Informacje o u\u017Cytkowniku").addUserOption((o) => o.setName("user").setDescription("U\u017Cytkownik")),
  new SlashCommandBuilder().setName("serverinfo").setDescription("Informacje o serwerze"),
  new SlashCommandBuilder().setName("nuke").setDescription("Od\u015Bwie\u017Ca (klonuje i usuwa) obecny kana\u0142").setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  new SlashCommandBuilder().setName("ping").setDescription("Sprawdza op\xF3\u017Anienie bota"),
  new SlashCommandBuilder().setName("createvoucher").setDescription("Tworzy nowy voucher").setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addStringOption((o) => o.setName("type").setDescription("Typ vouchera").setRequired(true).addChoices({ name: "User Premium", value: "user_premium" }, { name: "Guild Premium", value: "guild_premium" })).addStringOption((o) => o.setName("duration").setDescription("Czas trwania (np. 30d, 1y)").setRequired(true)).addIntegerOption((o) => o.setName("max_uses").setDescription("Maksymalna liczba u\u017Cy\u0107 (domy\u015Blnie 1)")),
  new SlashCommandBuilder().setName("redeem").setDescription("Realizuje voucher").addStringOption((o) => o.setName("code").setDescription("Kod vouchera").setRequired(true))
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
      const duration = ms(durationStr);
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
      const duration = ms(durationStr);
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
          const text = warns.map((w, i) => `**${i + 1}.** Pow\xF3d: ${w.reason} (przez <@${w.moderator_id}>, ${new Date(w.timestamp).toLocaleDateString()})`).join("\\n");
          await interaction.reply({ content: `Ostrze\u017Cenia gracza ${target.tag}:\\n${text}`, ephemeral: true });
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
      await interaction.reply({ content: `**Info o ${user.tag}**\\nID: ${user.id}\\nDo\u0142\u0105czy\u0142 do Discorda: ${user.createdAt.toLocaleDateString()}\\nKonto Bota: ${user.bot ? "Tak" : "Nie"}\\nIlo\u015B\u0107 r\xF3l na serwerze: ${roleCount}`, ephemeral: true });
      return true;
    }
    case "serverinfo": {
      const g = interaction.guild;
      await interaction.reply({ content: `**Info o ${g.name}**\\nID: ${g.id}\\nUtworzony: ${g.createdAt.toLocaleDateString()}\\nCz\u0142onkowie: ${g.memberCount}\\nIlo\u015B\u0107 r\xF3l: ${g.roles.cache.size}\\nIlo\u015B\u0107 kana\u0142\xF3w: ${g.channels.cache.size}`, ephemeral: true });
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
      const duration = ms(durationStr);
      if (!duration) {
        await interaction.reply({ content: "Nieprawid\u0142owy czas (np. 30d, 1y).", ephemeral: true });
        return true;
      }
      const code = crypto.randomBytes(6).toString("hex").toUpperCase();
      try {
        const stmt = db_default.prepare("INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
        stmt.run(code, type, duration, maxUses, 0, interaction.user.id, Date.now());
        await interaction.reply({ content: `Utworzono voucher: **${code}**\\nTyp: ${type}\\nCzas: ${durationStr}\\nU\u017Cycia: ${maxUses}`, ephemeral: true });
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

// server.ts
var app = express();
var portEnv = process.env.PORT;
var parsedPort = portEnv ? Number.parseInt(portEnv, 10) : Number.NaN;
var PORT = Number.isNaN(parsedPort) ? 3e3 : parsedPort;
var DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
var DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
  console.error("[FATAL] DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET environment variables must be set!");
}
console.log(`[Config] Discord Client ID: ${DISCORD_CLIENT_ID.substring(0, 6)}... | Secret set: ${!!DISCORD_CLIENT_SECRET}`);
var JWT_SECRET = process.env.JWT_SECRET || "dev_secret_jwt";
var YOUTUBE_COOKIES = process.env.YOUTUBE_COOKIES || "";
var client;
var player;
var botStartTime = 0;
var botStatus = {
  state: "offline",
  guilds: 0,
  ping: 0,
  tag: "",
  uptime: 0
};
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
    express.json()(req, res, next);
  }
});
app.use(cookieParser());
var playbackHistory = /* @__PURE__ */ new Map();
var stripeClient = null;
var aiAssistant = null;
var repairCooldown = false;
var lastRepairAttempt = 0;
var geminiKey = process.env.GEMINI_API_KEY;
if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY" && !geminiKey.startsWith("YOUR_")) {
  aiAssistant = new GoogleGenAI({ apiKey: geminiKey });
}
if (process.env.STRIPE_SECRET_KEY) {
  stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
}
client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages
  ]
});
player = new Player(client, {
  skipFFmpeg: false,
  connectionTimeout: 6e4
});
app.get("/api/health", (req, res) => {
  logEvent("info", "system", "Health check performed.");
  res.status(200).send("OK");
});
app.get("/api/status", (req, res) => {
  const hasToken = !!(process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== "YOUR_DISCORD_BOT_TOKEN_HERE");
  const isReady = client && client.isReady();
  const inviteUrl = DISCORD_CLIENT_ID ? `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&scope=bot+applications.commands&permissions=8` : void 0;
  res.json({
    state: isReady ? "online" : "offline",
    tag: isReady ? client.user?.tag || botStatus.tag : botStatus.tag,
    guilds: isReady ? client.guilds.cache.size : botStatus.guilds,
    ping: isReady ? client.ws.ping : botStatus.ping,
    uptime: botStartTime > 0 ? Math.floor((Date.now() - botStartTime) / 1e3) : 0,
    mockMode: !hasToken,
    inviteUrl,
    supportServerUrl: process.env.DISCORD_SERVER_INVITE || "https://discord.gg/MRN4WDUMKv"
  });
});
app.get("/api/admin/system/version", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const currentVersion = "2.4.0-stable";
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
    const decoded = jwt.verify(token, JWT_SECRET);
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
  console.error(`Unhandled Rejection:`, reason);
});
process.on("uncaughtException", (error) => {
  console.error(`Uncaught Exception:`, error);
});
player.onBeforeCreateStream = async (track, queryType, queue) => {
  const userId = queue.metadata?.user?.id || queue.metadata?.member?.id || queue.metadata?.interaction?.user?.id;
  if (!userId) return;
  const user = db_default.prepare("SELECT audio_quality, premium FROM users WHERE id = ?").get(userId);
  if (!user) return;
  let quality = user.audio_quality || "standard";
  if (user.premium !== 1 && quality === "ultra") quality = "high";
  if (track.extractor?.identifier === "youtubei" || track.source === "youtube") {
    console.log(`[YouTube] Extracting stream for: ${track.title} (Client: WEB_EMBEDDED)`);
    return {
      useServerAbrStream: false,
      disableStreamPreExtraction: true,
      streamOptions: {
        useClient: "WEB_EMBEDDED",
        highWaterMark: quality === "ultra" ? 1024 * 1024 * 64 : quality === "high" ? 1024 * 1024 * 32 : 1024 * 1024 * 8
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
      const msg = message.toLowerCase();
      if (level === "error" && (msg.includes("decipher") || msg.includes("signature") || msg.includes("youtubejs") || msg.includes("streaming data not available"))) {
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
    if (level === "warn" && !message.toLowerCase().includes("critical") && !message.toLowerCase().includes("fail")) return;
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
      footer: { text: "Snajperrr Monitoring System" },
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
  logEvent("warn", "system", "Inicjowanie procedury autonaprawy (Stabilizacja Audio WEB_EMBEDDED)...");
  try {
    try {
      await player.extractors.unregister(YoutubeiExtractor.identifier);
    } catch (e) {
    }
    await player.extractors.register(YoutubeiExtractor, {
      useServerAbrStream: false,
      ...YOUTUBE_COOKIES ? { cookie: YOUTUBE_COOKIES } : {},
      streamOptions: {
        useClient: "WEB_EMBEDDED",
        highWaterMark: 1024 * 1024 * 32
      }
    });
    await player.extractors.loadMulti(DefaultExtractors);
    db_default.prepare("UPDATE system_stats SET value = ? WHERE key = 'last_repair'").run(Date.now().toString());
    logEvent("info", "system", "System naprawiony pomy\u015Blnie. Zastosowano profil WEB_EMBEDDED dla audio.");
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
lastRepairAttempt = 0;
repairCooldown = false;
playbackHistory.clear();
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
  const { code, state, error, error_description } = req.query;
  if (error) {
    console.error(`[Auth Callback] Discord returned error: ${error} - ${error_description}`);
    return res.status(400).send(`Auth error from Discord: ${error_description || error}`);
  }
  const redirectUri = getRedirectUri(req);
  console.log("[Auth Callback] Debug Info:", {
    headers: req.headers,
    redirectUri,
    query: req.query
  });
  console.log("[Auth Callback] Code exchange starting...", {
    hasCode: !!code,
    redirectUri,
    host: req.headers.host,
    xHost: req.headers["x-forwarded-host"]
  });
  if (!code) return res.status(400).send("No code provided");
  try {
    console.log("[Auth Callback] Fetching token from Discord...");
    const tokenParams = {
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET.substring(0, 4) + "...",
      grant_type: "authorization_code",
      code: code.substring(0, 5) + "...",
      redirect_uri: redirectUri
    };
    console.log("[Auth Callback] Token request params (sanitized):", tokenParams);
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
    console.log("[Auth Callback] Token exchange successful, fetching user data...");
    const [userRes, guildsRes] = await Promise.all([
      fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      }),
      fetch("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      })
    ]);
    if (!userRes.ok) {
      const errData = await userRes.json();
      console.error("[Auth Callback] Failed to fetch @me:", errData);
      return res.status(userRes.status).send("Failed to fetch user data from Discord");
    }
    const userData = await userRes.json();
    console.log(`[Auth Callback] Logged in as: ${userData.username} (${userData.id})`);
    if (userData.email === "konradszczerbinski8@gmail.com") {
      db_default.prepare(`INSERT INTO users (id, username, avatar, is_admin) VALUES (?, ?, ?, 1) ON CONFLICT(id) DO UPDATE SET username=excluded.username, avatar=excluded.avatar, is_admin=1`).run(userData.id, userData.username, userData.avatar);
    } else {
      db_default.prepare(`INSERT INTO users (id, username, avatar) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET username=excluded.username, avatar=excluded.avatar`).run(userData.id, userData.username, userData.avatar);
    }
    if (userData.id === "1230509684138709056") {
      db_default.prepare("UPDATE users SET is_admin = 1 WHERE id = ?").run(userData.id);
    }
    const token = jwt.sign({ id: userData.id, username: userData.username, avatar: userData.avatar }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("auth_token", token, {
      secure: true,
      sameSite: "lax",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1e3
    });
    res.setHeader("Content-Type", "text/html");
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
  if (!token) {
    if (Object.keys(req.cookies).length > 0) {
      console.log("[API Me] Auth token missing. Other cookies present:", Object.keys(req.cookies));
    }
    return res.json({ loggedIn: false });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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
    const decoded = jwt.verify(token, JWT_SECRET);
    const { audioQuality, premiumSettings } = req.body;
    const user = db_default.prepare("SELECT * FROM users WHERE id = ?").get(decoded.id);
    if (!user) return res.status(404).json({ success: false, error: "U\u017Cytkownik nie znaleziony." });
    if (audioQuality !== void 0) {
      if (!["standard", "high", "ultra"].includes(audioQuality)) {
        return res.status(400).json({ success: false, error: "Nieprawid\u0142owy poziom jako\u015Bci." });
      }
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
    const decoded = jwt.verify(token, JWT_SECRET);
    const adminUser = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!adminUser || adminUser.is_admin !== 1) {
      return res.status(403).json({ success: false, error: "Brak uprawnie\u0144 administratora." });
    }
    const users = db_default.prepare("SELECT id, username, avatar, premium, premium_expires_at, is_admin FROM users").all();
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/admin/users/:id/premium", express.json(), async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const adminUser = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!adminUser || adminUser.is_admin !== 1) {
      return res.status(403).json({ success: false, error: "Brak uprawnie\u0144 administratora." });
    }
    const targetUserId = req.params.id;
    const { action, durationStr } = req.body;
    let newExpiresAt = null;
    if (action === "revoke") {
      db_default.prepare("UPDATE users SET premium = 0, premium_expires_at = NULL WHERE id = ?").run(targetUserId);
    } else if (action === "grant" || action === "extend") {
      let durationMs = durationStr && durationStr !== "lifetime" ? ms2(durationStr) : null;
      if (durationStr && durationStr !== "lifetime" && !durationMs) {
        return res.status(400).json({ success: false, error: "Nieprawid\u0142owy format czasu (np. 30d)" });
      }
      const currentUser = db_default.prepare("SELECT premium, premium_expires_at FROM users WHERE id = ?").get(targetUserId);
      if (!currentUser) return res.status(404).json({ success: false, error: "U\u017Cytkownik nie znaleziony." });
      let baseTime = Date.now();
      if (action === "extend" && currentUser.premium_expires_at && currentUser.premium_expires_at > Date.now()) {
        baseTime = currentUser.premium_expires_at;
      }
      newExpiresAt = durationMs ? baseTime + durationMs : null;
      db_default.prepare("UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?").run(newExpiresAt, targetUserId);
    } else {
      return res.status(400).json({ success: false, error: "Nieznana akcja." });
    }
    const updatedUser = db_default.prepare("SELECT id, premium, premium_expires_at FROM users WHERE id = ?").get(targetUserId);
    res.json({ success: true, user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});
app.post("/api/admin/vouchers", express.json(), async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) {
      return res.status(403).json({ success: false, error: "Brak uprawnie\u0144 administratora." });
    }
    const { type, durationStr, maxUses } = req.body;
    let duration = null;
    if (durationStr && durationStr !== "lifetime") {
      duration = ms2(durationStr);
      if (!duration) return res.status(400).json({ success: false, error: "Nieprawid\u0142owy format czasu (np. 30d)" });
    }
    const code = crypto2.randomBytes(6).toString("hex").toUpperCase();
    const stmt = db_default.prepare("INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    stmt.run(code, type, duration, maxUses, 0, decoded.id, Date.now());
    res.json({ success: true, code, type, duration: durationStr, maxUses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});
app.get("/api/admin/vouchers", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) {
      return res.status(403).json({ success: false, error: "Brak uprawnie\u0144 administratora." });
    }
    const vouchers = db_default.prepare("SELECT * FROM vouchers ORDER BY created_at DESC").all();
    res.json({ success: true, vouchers });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});
app.get("/api/public-logs", async (req, res) => {
  try {
    const logs = db_default.prepare("SELECT level, source, message, details, created_at FROM system_logs ORDER BY created_at DESC LIMIT 150").all();
    res.setHeader("Cache-Control", "no-cache");
    res.json({ success: true, logs });
  } catch (err) {
    console.error("Public Logs Error:", err);
    res.status(500).json({ success: false });
  }
});
app.get("/api/admin/logs", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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
  if (!smtpHost || !smtpUser || !smtpPass) {
    const error = "Konfiguracja SMTP nie jest kompletna. Sprawd\u017A zmienne \u015Brodowiskowe (SMTP_HOST, SMTP_USER, SMTP_PASS).";
    if (!isAuto) {
      logEvent("warn", "EmailExport", error);
    } else {
      console.warn(`[AutoExport] ${error}`);
    }
    return { success: false, error };
  }
  try {
    const logs = db_default.prepare("SELECT * FROM system_logs ORDER BY created_at DESC LIMIT 1000").all();
    if (logs.length === 0) return { success: true, message: "Brak log\xF3w do przes\u0142ania." };
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    const logsCsv = "ID,Level,Source,Message,Details,Date\n" + logs.map((l) => {
      const date = new Date(l.created_at).toISOString();
      return `${l.id},${l.level},${l.source},"${l.message.replace(/"/g, '""')}","${(l.details || "").replace(/"/g, '""')}",${date}`;
    }).join("\n");
    const htmlContent = `
            <h2>Zrzut log\xF3w systemowych - Snajperrr</h2>
            <p>Data wygenerowania: ${(/* @__PURE__ */ new Date()).toLocaleString()}</p>
            <p>Typ: ${isAuto ? "Automatyczny" : "R\u0119czny"}</p>
            <p>\u0141\u0105czna liczba log\xF3w: ${logs.length}</p>
            <hr>
            <p>Logi zosta\u0142y do\u0142\u0105czone w pliku CSV.</p>
        `;
    await transporter.sendMail({
      from: `"Snajperrr System" <${smtpUser}>`,
      to: adminEmail,
      subject: `[LOGS] Zrzut log\xF3w systemowych - ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
      html: htmlContent,
      attachments: [
        {
          filename: `logs_${Date.now()}.csv`,
          content: logsCsv
        }
      ]
    });
    logEvent("info", "EmailExport", `Pomy\u015Blnie wys\u0142ano logi na adres: ${adminEmail}`);
    return { success: true };
  } catch (err) {
    logEvent("error", "EmailExport", `B\u0142\u0105d wysy\u0142ki e-mail: ${err.message}`);
    return { success: false, error: err.message };
  }
};
app.post("/api/admin/logs/export", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const result = await sendLogsEmail();
    res.json(result);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ success: false, error: "B\u0142\u0105d podczas wysy\u0142ania e-maila." });
  }
});
app.patch("/api/admin/logs/:id", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const { solution } = req.body;
    db_default.prepare("UPDATE system_logs SET solution = ? WHERE id = ?").run(solution, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/admin/logs/:id/analyze", async (req, res) => {
  res.json({ success: true, analysis: "AI Analysis moved to frontend. Please check dashboard." });
});
app.get("/api/admin/system/stats", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const stats = db_default.prepare("SELECT * FROM system_stats").all();
    const statsObj = stats.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    res.json({ success: true, stats: statsObj });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/admin/system/repair", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const result = await performSystemRepair();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/bugs", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  const { title, description, priority } = req.body;
  if (!title || !description) return res.status(400).json({ success: false, error: "Tytu\u0142 i opis s\u0105 wymagane." });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    db_default.prepare("INSERT INTO bug_reports (user_id, title, description, priority, created_at) VALUES (?, ?, ?, ?, ?)").run(decoded.id, title, description, priority || "low", Date.now());
    logEvent("info", "frontend", `Nowe zg\u0142oszenie b\u0142\u0119du: ${title}`, { userId: decoded.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.get("/api/admin/system/debug", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    res.json({
      success: true,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        DISCORD_CLIENT_ID,
        HAS_DISCORD_SECRET: !!process.env.DISCORD_CLIENT_SECRET,
        HAS_BOT_TOKEN: !!process.env.DISCORD_TOKEN,
        APP_URL: process.env.APP_URL,
        PORT: process.env.PORT,
        JWT_SECRET_SET: process.env.JWT_SECRET !== void 0
      },
      headers: req.headers
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.get("/api/admin/settings", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const settings = db_default.prepare("SELECT * FROM global_settings").all();
    const settingsObj = settings.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    res.json({ success: true, settings: settingsObj });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/admin/settings", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const { settings } = req.body;
    if (settings && typeof settings === "object") {
      const stmt = db_default.prepare("INSERT OR REPLACE INTO global_settings (key, value) VALUES (?, ?)");
      for (const [key, value] of Object.entries(settings)) {
        stmt.run(key, String(value));
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.get("/api/admin/bugs", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    const bugs = db_default.prepare(`
      SELECT b.*, u.username as reporter 
      FROM bug_reports b 
      LEFT JOIN users u ON b.user_id = u.id 
      ORDER BY b.created_at DESC
    `).all();
    res.json({ success: true, bugs });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.patch("/api/admin/bugs/:id", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ success: false });
  const { status } = req.body;
  const { id } = req.params;
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(decoded.id);
    if (!user || user.is_admin !== 1) return res.status(403).json({ success: false });
    db_default.prepare("UPDATE bug_reports SET status = ? WHERE id = ?").run(status, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post("/api/vouchers/redeem", express.json(), async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const code = req.body.code?.trim().toUpperCase();
    if (!code) return res.status(400).json({ error: "Kod vouchera jest wymagany." });
    const voucher = db_default.prepare("SELECT * FROM vouchers WHERE code = ?").get(code);
    if (!voucher) return res.status(404).json({ error: "Nieprawid\u0142owy kod vouchera." });
    if (voucher.max_uses > 0 && voucher.uses >= voucher.max_uses) {
      return res.status(400).json({ error: "Voucher zosta\u0142 ju\u017C w pe\u0142ni wykorzystany." });
    }
    const alreadyRedeemed = db_default.prepare("SELECT 1 FROM redeemed_vouchers WHERE code = ? AND user_id = ?").get(code, decoded.id);
    if (alreadyRedeemed) return res.status(400).json({ error: "Ju\u017C zrealizowa\u0142e\u015B ten voucher." });
    const now = Date.now();
    const expiresAt = voucher.duration ? now + voucher.duration : null;
    const guildId = req.body.guildId?.trim();
    db_default.transaction(() => {
      if (voucher.type === "user_premium") {
        db_default.prepare("UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?").run(expiresAt, decoded.id);
      } else if (voucher.type === "guild_premium") {
        if (!guildId) {
          throw new Error("requires_guild_id");
        }
        db_default.prepare("INSERT INTO guilds_premium (guild_id, added_by, active) VALUES (?, ?, 1) ON CONFLICT(guild_id) DO UPDATE SET active = 1, added_by = excluded.added_by").run(guildId, decoded.id);
      } else {
        throw new Error("Unknown voucher type");
      }
      db_default.prepare("INSERT INTO redeemed_vouchers (code, user_id, redeemed_at) VALUES (?, ?, ?)").run(code, decoded.id, now);
      const newUses = voucher.uses + 1;
      if (voucher.max_uses > 0 && newUses >= voucher.max_uses) {
        db_default.prepare("DELETE FROM vouchers WHERE code = ?").run(code);
      } else {
        db_default.prepare("UPDATE vouchers SET uses = ? WHERE code = ?").run(newUses, code);
      }
    })();
    res.json({ success: true, message: "Konto Premium zosta\u0142o aktywowane pomy\u015Blnie!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "B\u0142\u0105d serwera." });
  }
});
app.post("/api/stripe/checkout", async (req, res) => {
  const token = req.cookies.auth_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!stripeClient) {
      console.log("[Stripe] Mocking checkout for user", decoded.id);
      const expiresAt = Date.now() + ms2("30d");
      db_default.prepare("UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?").run(expiresAt, decoded.id);
      return res.json({ url: `${getRedirectUri(req).replace("/api/auth/callback", "")}?checkout=success` });
    }
    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1
        }
      ],
      client_reference_id: decoded.id,
      // Store their discord ID
      success_url: `${getRedirectUri(req).replace("/api/auth/callback", "")}?checkout=success`,
      cancel_url: `${getRedirectUri(req).replace("/api/auth/callback", "")}?checkout=cancel`
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    if (!stripeClient) throw new Error("Stripe not configured");
    event = stripeClient.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const discordId = session.client_reference_id;
    if (discordId) {
      const expiresAt = Date.now() + ms2("30d");
      db_default.prepare(`UPDATE users SET premium = 1, premium_expires_at = ? WHERE id = ?`).run(expiresAt, discordId);
    }
  }
  res.json({ received: true });
});
player.events.on("playerStart", async (queue, track) => {
  try {
    if (queue.filters.ffmpeg) {
      await queue.filters.ffmpeg.setFilters([]);
    }
    queue.node.setVolume(80);
  } catch (e) {
  }
  logEvent("info", "bot", `Rozpocz\u0119to odtwarzanie: ${track.title}`, { guild: queue.guild.name, author: track.author });
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
  } catch (e) {
    console.error("B\u0142\u0105d podczas witania premium: ", e);
  }
});
player.events.on("error", async (queue, error) => {
  logEvent("error", "bot", `Player Engine Error: ${error.message}`, { guild: queue.guild.name, error: error.stack });
  if (error.message.toLowerCase().includes("decipher") || error.message.toLowerCase().includes("signature") || error.message.toLowerCase().includes("unavailable")) {
    logEvent("info", "bot", "Wykryto b\u0142\u0105d YouTube Signature. Uruchamiam automatyczn\u0105 napraw\u0119 silnika...");
    await performSystemRepair();
    queue.metadata?.channel?.send("\u26A0\uFE0F Wykryto problem z odtwarzaniem. System autonaprawy zosta\u0142 uruchomiony. Spr\xF3buj doda\u0107 utw\xF3r ponownie.");
  }
});
player.events.on("playerError", (queue, error) => {
  logEvent("error", "bot", `Player Connection Error: ${error.message}`, { guild: queue.guild.name, error: error.stack });
});
player.events.on("emptyChannel", (queue) => {
  queue.metadata.channel?.send("Kana\u0142 g\u0142osowy jest pusty. Zatrzymuj\u0119 odtwarzacz...");
});
client.on("ready", async () => {
  botStatus.state = "online";
  botStatus.tag = client.user?.tag || "";
  botStatus.guilds = client.guilds.cache.size;
  botStartTime = Date.now();
  if (client.user) {
    client.user.setActivity("music | /play", { type: ActivityType.Listening });
  }
  console.log(`[Discord] Logged in as ${client.user?.tag}`);
  setTimeout(async () => {
    try {
      console.log("[Discord] Loading primary YouTube extractor...");
      await player.extractors.register(YoutubeiExtractor, {
        useServerAbrStream: false,
        ...YOUTUBE_COOKIES ? { cookie: YOUTUBE_COOKIES } : {},
        streamOptions: {
          highWaterMark: 1024 * 1024 * 32,
          // Increased buffer for stability
          useClient: "WEB_EMBEDDED"
          // WEB_EMBEDDED is robust for audio-only extraction
        }
      });
      setTimeout(async () => {
        console.log("[Discord] Loading secondary extractors...");
        await player.extractors.loadMulti(DefaultExtractors);
        logEvent("info", "bot", "Extractors loaded successfully (Quality optimized)");
      }, 5e3);
    } catch (e) {
      logEvent("error", "bot", `Failed to load extractors: ${e?.message || "Unknown error"}`, e);
    }
  }, 3e3);
  if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== "YOUR_DISCORD_BOT_TOKEN_HERE") {
    try {
      const commands = [
        ...adminCommandsDefinitions,
        new SlashCommandBuilder2().setName("join").setDescription("Do\u0142\u0105cza do kana\u0142u g\u0142osowego"),
        new SlashCommandBuilder2().setName("play").setDescription("Odtwarza utw\xF3r").addStringOption((option) => option.setName("song").setDescription("Wpisz co chcesz pos\u0142ucha\u0107").setRequired(true)),
        new SlashCommandBuilder2().setName("search").setDescription("Szukaj utworu i wybierz z listy").addStringOption((option) => option.setName("query").setDescription("Czego szukasz?").setRequired(true)),
        new SlashCommandBuilder2().setName("pause").setDescription("Wstrzymuje odtwarzanie"),
        new SlashCommandBuilder2().setName("resume").setDescription("Wznawia odtwarzanie"),
        new SlashCommandBuilder2().setName("skip").setDescription("Pomija obecny utw\xF3r"),
        new SlashCommandBuilder2().setName("stop").setDescription("Zatrzymuje bota i czy\u015Bci kolejk\u0119"),
        new SlashCommandBuilder2().setName("volume").setDescription("Ustawia g\u0142o\u015Bno\u015B\u0107").addIntegerOption((option) => option.setName("level").setDescription("Poziom g\u0142o\u015Bno\u015Bci (0-100)").setRequired(true))
      ].map((c) => c.toJSON());
      const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
      await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
      console.log("[Discord] Successfully registered global slash commands.");
    } catch (error) {
      console.error("[Discord] Error registering commands:", error);
    }
  }
});
async function bootstrapBot() {
  if (process.env.DISCORD_TOKEN && process.env.DISCORD_TOKEN !== "YOUR_DISCORD_BOT_TOKEN_HERE") {
    console.log("[Discord] Connecting...");
    try {
      await client.login(process.env.DISCORD_TOKEN);
    } catch (err) {
      console.error(`[Discord] Login failed:`, err.message);
    }
  } else {
    console.log("[Discord] No valid DISCORD_TOKEN provided.");
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
          guildId,
          guildName: queue.guild.name,
          channelName: queue.channel?.name || "Voice",
          nowPlaying: currentTrack ? {
            title: currentTrack.title,
            author: currentTrack.author,
            duration: Math.floor(currentTrack.durationMS / 1e3),
            current: Math.floor(queue.node.streamTime / 1e3),
            thumbnail: currentTrack.thumbnail
          } : null,
          queueLength: queue.tracks.size,
          queue: queue.tracks.toArray().map((t, idx) => ({
            id: t.id,
            title: t.title,
            author: t.author,
            duration: Math.floor(t.durationMS / 1e3),
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
    const trackToRemove = queue.tracks.toArray().find((t) => t.id === trackId);
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
client.on("interactionCreate", async (interaction) => {
  const maintenance = db_default.prepare("SELECT value FROM global_settings WHERE key = 'maintenance_mode'").get();
  if (maintenance && maintenance.value === "1") {
    const user = db_default.prepare("SELECT is_admin FROM users WHERE id = ?").get(interaction.user.id);
    if (!user || user.is_admin !== 1) {
      const response = { content: "\u26A0\uFE0F **Tryb Konserwacji:** Bot jest obecnie niedost\u0119pny ze wzgl\u0119du na prace techniczne. Spr\xF3buj ponownie p\xF3\u017Aniej.", ephemeral: true };
      if (interaction.isRepliable()) {
        return interaction.reply(response);
      }
      return;
    }
  }
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId === "search_results") {
      const songUrl = interaction.values[0];
      const member2 = interaction.member;
      const voiceChannel2 = member2.voice?.channel;
      if (!voiceChannel2) {
        return interaction.reply({ content: "Musisz by\u0107 na kanale g\u0142osowym aby tego u\u017Cy\u0107!", ephemeral: true });
      }
      await interaction.deferReply();
      try {
        const results = await player.search(songUrl, {
          requestedBy: member2.user,
          searchEngine: "auto"
        });
        if (!results.hasTracks()) {
          return interaction.followUp("\u274C Nie uda\u0142o si\u0119 znale\u017A\u0107 tego utworu.");
        }
        const { track } = await player.play(voiceChannel2, results, {
          nodeOptions: {
            metadata: interaction,
            volume: 80,
            leaveOnEmpty: true,
            leaveOnEmptyCooldown: 3e5,
            leaveOnEnd: true,
            leaveOnEndCooldown: 3e5,
            selfDeaf: true,
            bufferingTimeout: 3e4,
            connectionTimeout: 9e4
          }
        });
        await interaction.message.delete().catch(() => {
        });
        await interaction.followUp(`\u{1F3B5} Z listy wybrano i dodano: **${track.title}**`);
      } catch (e) {
        console.error(e);
        await interaction.followUp("Wyst\u0105pi\u0142 b\u0142\u0105d podczas odtwarzania utworu.");
      }
    }
    return;
  }
  if (!interaction.isChatInputCommand()) return;
  const { commandName, guildId } = interaction;
  if (!guildId) {
    await interaction.reply({ content: "Komendy mog\u0105 by\u0107 u\u017Cywane tylko na serwerze.", ephemeral: true });
    return;
  }
  if (await handleAdminCommands(interaction)) return;
  const member = interaction.member;
  const voiceChannel = member.voice?.channel;
  if (commandName === "join") {
    if (!voiceChannel) {
      return interaction.reply({ content: "Musisz by\u0107 na kanale g\u0142osowym aby tego u\u017Cy\u0107!", ephemeral: true });
    }
    await interaction.deferReply();
    try {
      let queue = player.nodes.get(guildId);
      if (!queue) {
        queue = player.nodes.create(interaction.guild, {
          metadata: interaction,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 3e5,
          leaveOnEnd: true,
          leaveOnEndCooldown: 3e5
        });
      }
      if (!queue.connection) {
        await queue.connect(voiceChannel);
      }
      await interaction.followUp("\u2705 Do\u0142\u0105czono do kana\u0142u g\u0142osowego!");
    } catch (e) {
      console.error(e);
      await interaction.followUp("\u274C Nie uda\u0142o si\u0119 do\u0142\u0105czy\u0107 do kana\u0142u g\u0142osowego.");
    }
  } else if (commandName === "play") {
    if (!voiceChannel) {
      return interaction.reply({ content: "Musisz by\u0107 na kanale g\u0142osowym aby tego u\u017Cy\u0107!", ephemeral: true });
    }
    await interaction.deferReply();
    let song = interaction.options.getString("song", true);
    if (song.includes("youtube.com/shorts/")) {
      song = song.replace("youtube.com/shorts/", "youtube.com/watch?v=");
    }
    if (song.includes("?si=")) {
      song = song.split("?si=")[0];
    }
    try {
      const results = await player.search(song, {
        requestedBy: interaction.user,
        searchEngine: song.startsWith("http") ? "auto" : "youtube"
      });
      if (!results.hasTracks()) {
        return interaction.followUp(`\u274C Nie znaleziono nic dla: **${song}**`);
      }
      const { track } = await player.play(voiceChannel, results, {
        nodeOptions: {
          metadata: interaction,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 3e5,
          leaveOnEnd: true,
          leaveOnEndCooldown: 3e5,
          selfDeaf: true,
          bufferingTimeout: 3e4,
          connectionTimeout: 9e4
        }
      });
      if (results.playlist) {
        await interaction.followUp(`\u{1F3B5} Dodano playlist\u0119 **${results.playlist.title}** (${results.tracks.length} utwor\xF3w).`);
      } else {
        await interaction.followUp(`\u{1F3B5} Dodano do kolejki: **${track.title}**`);
      }
    } catch (e) {
      console.error(e);
      const errorMessage = e.message || "";
      if (errorMessage.includes("decipher")) {
        await interaction.followUp("\u274C B\u0142\u0105d YouTube (signature decipher). Pr\xF3buj\u0119 zrestartowa\u0107 silnik... Spr\xF3buj ponownie za chwil\u0119.");
        logEvent("error", "bot", "Signature decipher error detected during play", { error: e.stack });
      } else {
        await interaction.followUp("Wyst\u0105pi\u0142 b\u0142\u0105d. Je\u015Bli to link do YouTube, spr\xF3buj wyszuka\u0107 utw\xF3r wpisuj\u0105c jego nazw\u0119 w `/search` lub u\u017Cyj innego \u017Ar\xF3d\u0142a.");
      }
    }
  } else if (commandName === "search") {
    if (!voiceChannel) {
      return interaction.reply({ content: "Musisz by\u0107 na kanale g\u0142osowym aby tego u\u017Cy\u0107!", ephemeral: true });
    }
    await interaction.deferReply({ ephemeral: true });
    let query = interaction.options.getString("query", true);
    if (query.includes("?si=")) {
      query = query.split("?si=")[0];
    }
    try {
      const results = await player.search(query, {
        requestedBy: interaction.user,
        searchEngine: query.startsWith("http") ? "auto" : "youtube"
      });
      if (!results.hasTracks()) {
        return interaction.followUp("Niestety nic nie znaleziono.");
      }
      const tracks = results.tracks.slice(0, 10);
      const select = new StringSelectMenuBuilder().setCustomId("search_results").setPlaceholder("Wybierz utw\xF3r do odtworzenia").addOptions(
        tracks.map(
          (track, i) => new StringSelectMenuOptionBuilder().setLabel(track.title.substring(0, 100)).setDescription(`${track.author.substring(0, 80)} - ${track.duration}`).setValue(track.url)
        )
      );
      const row = new ActionRowBuilder().addComponents(select);
      await interaction.followUp({
        content: `Oto co znalaz\u0142em dla **${query}**:`,
        components: [row]
      });
    } catch (e) {
      console.error(e);
      await interaction.followUp("Wyst\u0105pi\u0142 b\u0142\u0105d podczas wyszukiwania. Spr\xF3buj zmodyfikowa\u0107 zapytanie.");
    }
  } else if (commandName === "pause") {
    const queue = player.nodes.get(guildId);
    if (!queue || !queue.isPlaying()) return interaction.reply({ content: "Nie ma czego pauzowa\u0107.", ephemeral: true });
    queue.node.setPaused(true);
    await interaction.reply("\u23F8\uFE0F Zapauzowano.");
  } else if (commandName === "resume") {
    const queue = player.nodes.get(guildId);
    if (!queue) return interaction.reply({ content: "Brak aktywnego odtwarzania.", ephemeral: true });
    queue.node.setPaused(false);
    await interaction.reply("\u25B6\uFE0F Wznowiono.");
  } else if (commandName === "skip") {
    const queue = player.nodes.get(guildId);
    if (!queue) return interaction.reply({ content: "Brak utworu do pomini\u0119cia.", ephemeral: true });
    queue.node.skip();
    await interaction.reply("\u23ED\uFE0F Pomini\u0119to utw\xF3r.");
  } else if (commandName === "stop") {
    const queue = player.nodes.get(guildId);
    if (!queue) return interaction.reply({ content: "Brak aktywnego odtwarzania.", ephemeral: true });
    queue.delete();
    await interaction.reply("\u23F9\uFE0F Odtwarzacz zatrzymany, kolejka wyczyszczona.");
  } else if (commandName === "volume") {
    const level = interaction.options.getInteger("level", true);
    const queue = player.nodes.get(guildId);
    if (!queue) return interaction.reply({ content: "Brak aktywnego odtwarzania.", ephemeral: true });
    const clampedLevel = Math.max(0, Math.min(100, level));
    queue.node.setVolume(clampedLevel);
    await interaction.reply(`\u{1F50A} G\u0142o\u015Bno\u015B\u0107 zmieniona na ${clampedLevel}%`);
  }
});
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
    } catch (err) {
      console.error("Add track error:", err);
      res.status(500).json({ error: "Failed to add track" });
    }
  } else {
    res.status(400).json({ error: "U\u017Cyj komendy /play na Discordzie, aby najpierw do\u0142\u0105czy\u0107 bota do kana\u0142u g\u0142osowego." });
  }
});
async function setupVite(app2) {
  if (process.env.NODE_ENV !== "production") {
    try {
      const { createServer: createViteServer } = await import("vite");
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa"
      });
      app2.use(vite.middlewares);
    } catch (err) {
      console.error("Failed to init Vite middleware:", err);
    }
  } else {
    const distPath = path2.join(process.cwd(), "dist");
    app2.use(express.static(distPath));
    app2.get("*", (req, res) => {
      res.sendFile(path2.join(distPath, "index.html"));
    });
  }
}
async function start() {
  console.log("[Startup] Registering remaining API routes and starting bot...");
  const restOfInit = async () => {
    try {
      await bootstrapBot();
      console.log("[Startup] Bot logic started.");
    } catch (e) {
      console.error("[Startup] Bot bootstrap error:", e);
    }
  };
  restOfInit();
  setInterval(async () => {
    console.log("[AutoExport] Triggering scheduled logs export...");
    try {
      await sendLogsEmail(true);
    } catch (e) {
      console.error("[AutoExport] Failed to auto-export logs:", e);
    }
  }, 1e3 * 60 * 60 * 24);
  console.log("[Startup] Setting up Vite...");
  await setupVite(app);
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Startup] Server fully initialized and listening on port ${PORT}`);
    logEvent("info", "system", `Serwer bota uruchomiony na porcie ${PORT}. Gotowy do odtwarzania AUDIO.`);
  });
}
start();
