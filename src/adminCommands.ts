import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, GuildMember, TextChannel } from "discord.js";
import ms from "ms";
import crypto from "crypto";
import db from "./db.js";

export const adminCommandsDefinitions = [
    new SlashCommandBuilder().setName('ban').setDescription('Banuje użytkownika').setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Powód')),
    new SlashCommandBuilder().setName('unban').setDescription('Odbanowuje użytkownika').setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addStringOption(o => o.setName('user_id').setDescription('ID Użytkownika').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Powód')),
    new SlashCommandBuilder().setName('kick').setDescription('Wyrzuca użytkownika').setDefaultMemberPermissions(PermissionFlagsBits.KickMembers).addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Powód')),
    new SlashCommandBuilder().setName('mute').setDescription('Wycisza (timeout) użytkownika').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)).addStringOption(o => o.setName('duration').setDescription('Czas (np. 10m, 1h, 1d)').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Powód')),
    new SlashCommandBuilder().setName('unmute').setDescription('Odcisza użytkownika').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Powód')),
    new SlashCommandBuilder().setName('clear').setDescription('Czyści wiadomości').setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addIntegerOption(o => o.setName('amount').setDescription('Ilość (1-100)').setRequired(true)),
    new SlashCommandBuilder().setName('clearuser').setDescription('Czyści wiadomości użytkownika na tym kanale').setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages).addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)).addIntegerOption(o => o.setName('amount').setDescription('Ile wiadomości przeszukać (1-100)').setRequired(true)),
    new SlashCommandBuilder().setName('lock').setDescription('Zamyka kanał').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).addChannelOption(o => o.setName('channel').setDescription('Kanał')),
    new SlashCommandBuilder().setName('unlock').setDescription('Otwiera kanał').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).addChannelOption(o => o.setName('channel').setDescription('Kanał')),
    new SlashCommandBuilder().setName('slowmode').setDescription('Ustawia slowmode').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels).addIntegerOption(o => o.setName('seconds').setDescription('Sekundy (0 aby wyłączyć)').setRequired(true)).addChannelOption(o => o.setName('channel').setDescription('Kanał')),
    new SlashCommandBuilder().setName('setnick').setDescription('Zmienia pseudonim').setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames).addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)).addStringOption(o => o.setName('nick').setDescription('Nowy pseudonim (puste aby zresetować)')),
    new SlashCommandBuilder().setName('warn').setDescription('Ostrzega użytkownika').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Powód').setRequired(true)),
    new SlashCommandBuilder().setName('warnings').setDescription('Lista ostrzeżeń').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)),
    new SlashCommandBuilder().setName('clearwarns').setDescription('Czyści ostrzeżenia').setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers).addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)),
    new SlashCommandBuilder().setName('addrole').setDescription('Dodaje rolę').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)).addRoleOption(o => o.setName('role').setDescription('Rola').setRequired(true)),
    new SlashCommandBuilder().setName('removerole').setDescription('Odbiera rolę').setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles).addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)).addRoleOption(o => o.setName('role').setDescription('Rola').setRequired(true)),
    new SlashCommandBuilder().setName('tempban').setDescription('Tymczasowo banuje użytkownika').setDefaultMemberPermissions(PermissionFlagsBits.BanMembers).addUserOption(o => o.setName('user').setDescription('Użytkownik').setRequired(true)).addStringOption(o => o.setName('duration').setDescription('Czas (np. 1d, 1w)').setRequired(true)).addStringOption(o => o.setName('reason').setDescription('Powód')),
    new SlashCommandBuilder().setName('announce').setDescription('Wysyła ogłoszenie').setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addStringOption(o => o.setName('message').setDescription('Wiadomość').setRequired(true)).addChannelOption(o => o.setName('channel').setDescription('Kanał')),
    new SlashCommandBuilder().setName('userinfo').setDescription('Informacje o użytkowniku').addUserOption(o => o.setName('user').setDescription('Użytkownik')),
    new SlashCommandBuilder().setName('serverinfo').setDescription('Informacje o serwerze'),
    new SlashCommandBuilder().setName('nuke').setDescription('Odświeża (klonuje i usuwa) obecny kanał').setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    new SlashCommandBuilder().setName('createvoucher').setDescription('Tworzy nowy voucher').setDefaultMemberPermissions(PermissionFlagsBits.Administrator).addStringOption(o => o.setName('type').setDescription('Typ vouchera').setRequired(true).addChoices({name: 'User Premium', value: 'user_premium'}, {name: 'Guild Premium', value: 'guild_premium'})).addStringOption(o => o.setName('duration').setDescription('Czas trwania (np. 30d, 1y)').setRequired(true)).addIntegerOption(o => o.setName('max_uses').setDescription('Maksymalna liczba użyć (domyślnie 1)')),
    new SlashCommandBuilder().setName('redeem').setDescription('Realizuje voucher').addStringOption(o => o.setName('code').setDescription('Kod vouchera').setRequired(true))
];

export async function handleAdminCommands(interaction: ChatInputCommandInteraction): Promise<boolean> {
  const { commandName, guildId, guild } = interaction;
  if (!guild || !guildId) return false;

  switch (commandName) {
    case 'ban': {
      const user = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason') || 'Brak powodu';
      try {
        await guild.members.ban(user, { reason });
        await interaction.reply({ content: `Zbanowano ${user.tag}. Powód: ${reason}`, flags: 64 });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: 'Nie udało się zbanować. Sprawdź moje uprawnienia.', flags: 64 });
      }
      return true;
    }
    case 'tempban': {
      const user = interaction.options.getUser('user', true);
      const durationStr = interaction.options.getString('duration', true);
      const reason = interaction.options.getString('reason') || 'Brak powodu';
      // @ts-ignore
      const duration = ms(durationStr);
      if (!duration) {
         await interaction.reply({ content: 'Nieprawidłowy czas formatowany (np. 1d, 12h).', flags: 64 });
         return true;
      }
      try {
        await guild.members.ban(user, { reason: `[Tempban ${durationStr}] ${reason}` });
        await interaction.reply({ content: `Tymczasowo zbanowano ${user.tag} na ${durationStr}. Powód: ${reason}`, flags: 64 });
        setTimeout(() => {
          guild.members.unban(user, 'Koniec tempbana').catch(console.error);
        }, duration);
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: 'Nie udało się zbanować. Sprawdź moje uprawnienia.', flags: 64 });
      }
      return true;
    }
    case 'unban': {
      const userId = interaction.options.getString('user_id', true);
      const reason = interaction.options.getString('reason') || 'Brak powodu';
      try {
        await guild.members.unban(userId, reason);
        await interaction.reply({ content: `Odbanowano użytkownika o ID ${userId}. Powód: ${reason}`, flags: 64 });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: 'Nie udało się odbanować. Możliwe, że to nieprawidłowe ID lub użytkownik nie ma bana.', flags: 64 });
      }
      return true;
    }
    case 'kick': {
      const user = interaction.options.getMember('user') as GuildMember;
      const reason = interaction.options.getString('reason') || 'Brak powodu';
      if (!user) { await interaction.reply({ content: 'Nie znaleziono użytkownika na serwerze.', flags: 64 }); return true; }
      try {
        await user.kick(reason);
        await interaction.reply({ content: `Wyrzucono ${user.user.tag}. Powód: ${reason}`, flags: 64 });
      } catch (e) {
        console.error(e);
        await interaction.reply({ content: 'Nie udało się wyrzucić. Sprawdź moje uprawnienia.', flags: 64 });
      }
      return true;
    }
    case 'mute': {
      const user = interaction.options.getMember('user') as GuildMember;
      const durationStr = interaction.options.getString('duration', true);
      const reason = interaction.options.getString('reason') || 'Brak powodu';
      if (!user) { await interaction.reply({ content: 'Nie znaleziono użytkownika na serwerze.', flags: 64 }); return true; }
      // @ts-ignore
      const duration = ms(durationStr);
      if (!duration) { await interaction.reply({ content: 'Nieprawidłowy czas (np. 10m, 1h).', flags: 64 }); return true; }
      try {
        await user.timeout(duration, reason);
        await interaction.reply({ content: `Wyciszono ${user.user.tag} na ${durationStr}. Powód: ${reason}`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Nie udało się wyciszyć. Sprawdź moje uprawnienia (musi byc ponizej 28 dni).', flags: 64 });
      }
      return true;
    }
    case 'unmute': {
      const user = interaction.options.getMember('user') as GuildMember;
      const reason = interaction.options.getString('reason') || 'Brak powodu';
      if (!user) { await interaction.reply({ content: 'Nie znaleziono użytkownika na serwerze.', flags: 64 }); return true; }
      try {
        await user.timeout(null, reason);
        await interaction.reply({ content: `Odciszono ${user.user.tag}. Powód: ${reason}`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Nie udało się odciszyć. Sprawdź moje uprawnienia.', flags: 64 });
      }
      return true;
    }
    case 'clear': {
      const amount = interaction.options.getInteger('amount', true);
      if (amount < 1 || amount > 100) { await interaction.reply({ content: 'Podaj liczbę od 1 do 100.', flags: 64 }); return true; }
      const channel = interaction.channel as TextChannel;
      try {
        const deleted = await channel.bulkDelete(amount, true);
        await interaction.reply({ content: `Usunięto ${deleted.size} wiadomości.`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Nie udało się usunąć wiadomości. Sprawdź uprawnienia lub czy wiadomości nie są starsze niż 14 dni.', flags: 64 });
      }
      return true;
    }
    case 'clearuser': {
      const targetUser = interaction.options.getUser('user', true);
      const amount = interaction.options.getInteger('amount', true);
      if (amount < 1 || amount > 100) { await interaction.reply({ content: 'Podaj liczbę od 1 do 100.', flags: 64 }); return true; }
      const channel = interaction.channel as TextChannel;
      try {
        const fetchMessages = await channel.messages.fetch({ limit: amount });
        const targetMessages = fetchMessages.filter(m => m.author.id === targetUser.id);
        if (targetMessages.size === 0) {
           await interaction.reply({ content: `Nie znaleziono wiadomości gracza ${targetUser.tag} w ostatnich ${amount} wiadomościach.`, flags: 64 });
           return true; 
        }
        const deleted = await channel.bulkDelete(targetMessages, true);
        await interaction.reply({ content: `Usunięto ${deleted.size} wiadomości gracza ${targetUser.tag}.`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Nie udało się usunąć wiadomości. Sprawdź uprawnienia lub czy wiadomości nie są starsze niż 14 dni.', flags: 64 });
      }
      return true;
    }
    case 'lock': {
      const channel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;
      if (!channel?.permissionOverwrites) { await interaction.reply({ content: 'To nie jest obsługiwany kanał.', flags: 64 }); return true; }
      try {
        await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
        await interaction.reply({ content: `Zawieszono pisanie na kanale ${channel}.`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Wystąpił błąd podczas zamykania kanału.', flags: 64 });
      }
      return true;
    }
    case 'unlock': {
      const channel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;
      if (!channel?.permissionOverwrites) { await interaction.reply({ content: 'To nie jest obsługiwany kanał.', flags: 64 }); return true; }
      try {
        await channel.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null });
        await interaction.reply({ content: `Otwarto kanał ${channel}.`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Wystąpił błąd podczas otwierania kanału.', flags: 64 });
      }
      return true;
    }
    case 'slowmode': {
      const seconds = interaction.options.getInteger('seconds', true);
      const channel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;
      if (!channel?.setRateLimitPerUser) { await interaction.reply({ content: 'To nie jest obsługiwany kanał.', flags: 64 }); return true; }
      try {
        await channel.setRateLimitPerUser(seconds);
        await interaction.reply({ content: `Ustawiono slowmode na ${seconds} sekund na kanale ${channel}.`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Błąd podczas ustawiania slowmode.', flags: 64 });
      }
      return true;
    }
    case 'setnick': {
      const user = interaction.options.getMember('user') as GuildMember;
      const nick = interaction.options.getString('nick');
      if (!user) { await interaction.reply({ content: 'Nie znaleziono użytkownika na serwerze.', flags: 64 }); return true; }
      try {
        await user.setNickname(nick);
        await interaction.reply({ content: `Zmieniono pseudonim gracza ${user.user.tag}.`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Nie udało się zmienić nicku (może mam niższą rolę?).', flags: 64 });
      }
      return true;
    }
    case 'warn': {
      const target = interaction.options.getUser('user', true);
      const reason = interaction.options.getString('reason', true);
      try {
        const stmt = db.prepare('INSERT INTO warnings (guild_id, user_id, moderator_id, reason, timestamp) VALUES (?, ?, ?, ?, ?)');
        stmt.run(guildId, target.id, interaction.user.id, reason, Date.now());
        await interaction.reply({ content: `Ostrzeżono gracza ${target.tag}. Powód: ${reason}`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Błąd bazy danych.', flags: 64 });
      }
      return true;
    }
    case 'warnings': {
      const target = interaction.options.getUser('user', true);
      try {
        const warns = db.prepare('SELECT * FROM warnings WHERE guild_id = ? AND user_id = ?').all(guildId, target.id) as any[];
        if (warns.length === 0) {
          await interaction.reply({ content: `${target.tag} nie ma żadnych ostrzeżeń.`, flags: 64 });
        } else {
          const text = warns.map((w, i) => `**${i+1}.** Powód: ${w.reason} (przez <@${w.moderator_id}>, ${new Date(w.timestamp).toLocaleDateString()})`).join('\\n');
          await interaction.reply({ content: `Ostrzeżenia gracza ${target.tag}:\\n${text}`, flags: 64 });
        }
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Błąd bazy danych.', flags: 64 });
      }
      return true;
    }
    case 'clearwarns': {
      const target = interaction.options.getUser('user', true);
      try {
        const stmt = db.prepare('DELETE FROM warnings WHERE guild_id = ? AND user_id = ?');
        stmt.run(guildId, target.id);
        await interaction.reply({ content: `Wyczyszczono ostrzeżenia gracza ${target.tag}.`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Błąd bazy danych.', flags: 64 });
      }
      return true;
    }
    case 'addrole': {
      const member = interaction.options.getMember('user') as GuildMember;
      const role = interaction.options.getRole('role', true);
      if(!member) { await interaction.reply({ content: 'Nie znaleziono użytkownika.', flags: 64 }); return true; }
      try {
        await member.roles.add(role.id);
        await interaction.reply({ content: `Dodano rolę ${role.name} użytkownikowi ${member.user.tag}.`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Błąd: brak uprawnień do przypisania tej roli.', flags: 64 });
      }
      return true;
    }
    case 'removerole': {
      const member = interaction.options.getMember('user') as GuildMember;
      const role = interaction.options.getRole('role', true);
      if(!member) { await interaction.reply({ content: 'Nie znaleziono użytkownika.', flags: 64 }); return true; }
      try {
        await member.roles.remove(role.id);
        await interaction.reply({ content: `Zabrano rolę ${role.name} użytkownikowi ${member.user.tag}.`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Błąd: brak uprawnień do odebrania tej roli.', flags: 64 });
      }
      return true;
    }
    case 'announce': {
      const message = interaction.options.getString('message', true);
      const channel = (interaction.options.getChannel('channel') || interaction.channel) as TextChannel;
      if (!channel?.send) { await interaction.reply({ content: 'To nie jest prawidłowy kanał tekstowy.', flags: 64 }); return true; }
      try {
        await channel.send(message);
        await interaction.reply({ content: `Wysłano ogłoszenie na ${channel}.`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Błąd podczas wysyłania ogłoszenia.', flags: 64 });
      }
      return true;
    }
    case 'userinfo': {
      const user = interaction.options.getUser('user') || interaction.user;
      const member = interaction.options.getMember('user') as GuildMember | null || interaction.member as GuildMember;
      const roleCount = member?.roles?.cache.size || 0;
      await interaction.reply({ content: `**Info o ${user.tag}**\\nID: ${user.id}\\nDołączył do Discorda: ${user.createdAt.toLocaleDateString()}\\nKonto Bota: ${user.bot ? 'Tak' : 'Nie'}\\nIlość ról na serwerze: ${roleCount}`, flags: 64 });
      return true;
    }
    case 'serverinfo': {
      const g = interaction.guild!;
      await interaction.reply({ content: `**Info o ${g.name}**\\nID: ${g.id}\\nUtworzony: ${g.createdAt.toLocaleDateString()}\\nCzłonkowie: ${g.memberCount}\\nIlość ról: ${g.roles.cache.size}\\nIlość kanałów: ${g.channels.cache.size}`, flags: 64 });
      return true;
    }
    case 'nuke': {
      const channel = interaction.channel as TextChannel;
      if (!channel?.clone) { await interaction.reply({ content: 'Ten kanał nie może zostać zresetowany.', flags: 64 }); return true; }
      try {
        const cloned = await channel.clone();
        await cloned.setPosition(channel.position);
        await cloned.send('Nuked 💥');
        await channel.delete('Nuke command executed');
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Brak uprawnień by to zrobić.', flags: 64 });
      }
      return true;
    }
    case 'createvoucher': {
      const type = interaction.options.getString('type', true);
      const durationStr = interaction.options.getString('duration', true);
      const maxUses = interaction.options.getInteger('max_uses') || 1;
      // @ts-ignore
      const duration = ms(durationStr);
      if (!duration) { await interaction.reply({ content: 'Nieprawidłowy czas (np. 30d, 1y).', flags: 64 }); return true; }
      
      const code = crypto.randomBytes(6).toString('hex').toUpperCase();
      try {
        const stmt = db.prepare('INSERT INTO vouchers (code, type, duration, max_uses, uses, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
        stmt.run(code, type, duration, maxUses, 0, interaction.user.id, Date.now());
        await interaction.reply({ content: `Utworzono voucher: **${code}**\\nTyp: ${type}\\nCzas: ${durationStr}\\nUżycia: ${maxUses}`, flags: 64 });
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Błąd bazy danych przy tworzeniu vouchera.', flags: 64 });
      }
      return true;
    }
    case 'redeem': {
      const code = interaction.options.getString('code', true).toUpperCase();
      try {
        const checkRedeemed = db.prepare('SELECT * FROM redeemed_vouchers WHERE code = ? AND user_id = ?').get(code, interaction.user.id);
        if (checkRedeemed) {
          await interaction.reply({ content: 'Już użyłeś/aś tego vouchera.', flags: 64 });
          return true;
        }

        const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ?').get(code) as any;
        if (!voucher) {
          await interaction.reply({ content: 'Podałeś/aś nieprawidłowy kod vouchera.', flags: 64 });
          return true;
        }

        if (voucher.uses >= voucher.max_uses) {
          await interaction.reply({ content: 'Ten voucher został już w pełni wykorzystany.', flags: 64 });
          return true;
        }

        db.prepare('BEGIN').run();
        try {
          db.prepare('UPDATE vouchers SET uses = uses + 1 WHERE code = ?').run(code);
          db.prepare('INSERT INTO redeemed_vouchers (code, user_id, redeemed_at) VALUES (?, ?, ?)').run(code, interaction.user.id, Date.now());
          
          if (voucher.type === 'user_premium') {
             // Basic dummy logic, this just saves it in users
             // You'd probably add existing premium + voucher.duration
             db.prepare('INSERT INTO users (id, username, premium) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET premium = premium + ?').run(interaction.user.id, interaction.user.tag, voucher.duration, voucher.duration);
          } else if (voucher.type === 'guild_premium') {
             db.prepare('INSERT INTO guilds_premium (guild_id, added_by, active) VALUES (?, ?, 1) ON CONFLICT(guild_id) DO NOTHING').run(guildId, interaction.user.id);
             // Alternatively store an expiration date for guild too. Let's just activate it.
          }
          db.prepare('COMMIT').run();
          
          await interaction.reply({ content: `Pomyślnie zrealizowano voucher! Typ nagrody: **${voucher.type}**`, flags: 64 });
        } catch(e) {
          db.prepare('ROLLBACK').run();
          throw e;
        }
      } catch(e) {
        console.error(e);
        await interaction.reply({ content: 'Wystąpił błąd podczas odbierania vouchera.', flags: 64 });
      }
      return true;
    }
  }

  return false;
}
