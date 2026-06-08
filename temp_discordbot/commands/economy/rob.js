const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', '..', 'data');
const economyPath = path.join(dataDir, 'economy.json');
const tmpEconomyPath = economyPath + '.tmp';

function ensureEconomyFile() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    if (!fs.existsSync(economyPath)) fs.writeFileSync(economyPath, '{}', { encoding: 'utf8' });
  } catch (err) {
    console.error('ensureEconomyFile error:', err);
    throw err;
  }
}

function getEconomy() {
  try {
    ensureEconomyFile();
    const raw = fs.readFileSync(economyPath, 'utf8');
    try {
      return JSON.parse(raw || '{}');
    } catch (parseErr) {
      console.error('Corrupted economy.json, backing up and resetting:', parseErr);
      try {
        const backup = economyPath + '.bak.' + Date.now();
        fs.copyFileSync(economyPath, backup);
      } catch (copyErr) {
        console.error('Failed to backup corrupted economy.json:', copyErr);
      }
      fs.writeFileSync(economyPath, '{}', { encoding: 'utf8' });
      return {};
    }
  } catch (err) {
    console.error('Error reading economy file:', err);
    try {
      ensureEconomyFile();
      return {};
    } catch (e) {
      console.error('Failed to recreate economy file:', e);
      return {};
    }
  }
}

function saveEconomy(economy) {
  try {
    ensureEconomyFile();
    fs.writeFileSync(tmpEconomyPath, JSON.stringify(economy, null, 2), { encoding: 'utf8' });
    fs.renameSync(tmpEconomyPath, economyPath);
  } catch (err) {
    console.error('Error saving economy file (atomic):', err);
    try {
      fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2), { encoding: 'utf8' });
    } catch (fallbackErr) {
      console.error('Fallback write failed:', fallbackErr);
    }
  }
}

const cooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rob')
    .setDescription('Okradnij użytkownika')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Użytkownik którego chcesz okraść')
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const robber = interaction.user;
      const target = interaction.options.getUser('user');

      if (!target) return interaction.reply({ content: '❌ Nie znaleziono użytkownika.', ephemeral: true });

      if (target.id === robber.id) return interaction.reply({ content: '❌ Nie możesz okraść samego siebie!', ephemeral: true });
      if (target.bot) return interaction.reply({ content: '❌ Nie możesz okraść bota!', ephemeral: true });

      const cooldownKey = robber.id;
      const lastUsed = cooldowns.get(cooldownKey) || 0;
      const cooldownTime = 60 * 60 * 1000; // 1 hour

      if (Date.now() - lastUsed < cooldownTime) {
        const timeLeftMs = cooldownTime - (Date.now() - lastUsed);
        const minutesLeft = Math.ceil(timeLeftMs / 1000 / 60);
        return interaction.reply({ content: `⏰ Musisz poczekać **${minutesLeft} minut** przed następną kradzieżą!`, ephemeral: true });
      }

      const economy = getEconomy();

      if (!economy[robber.id]) economy[robber.id] = { balance: 100, bank: 0, inventory: [] };
      if (!economy[target.id]) economy[target.id] = { balance: 100, bank: 0, inventory: [] };

      // sanitize balances
      economy[robber.id].balance = Number(economy[robber.id].balance) || 0;
      economy[target.id].balance = Number(economy[target.id].balance) || 0;

      if (economy[target.id].balance < 100) return interaction.reply({ content: `❌ <@${target.id}> ma za mało gotówki aby go okraść!`, ephemeral: true });

      const success = Math.random() > 0.5;

      if (success) {
        const stolen = Math.max(1, Math.floor(economy[target.id].balance * (Math.random() * 0.3 + 0.1)));
        economy[target.id].balance = Math.max(0, economy[target.id].balance - stolen);
        economy[robber.id].balance = Math.max(0, economy[robber.id].balance + stolen);

        saveEconomy(economy);
        cooldowns.set(cooldownKey, Date.now());

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('💰 Udana Kradzież!')
          .setDescription(`Udało Ci się ukraść **${stolen} 🪙** od <@${target.id}>!`)
          .addFields({ name: '💼 Twoje saldo', value: `${economy[robber.id].balance} 🪙`, inline: false })
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      } else {
        const fine = Math.floor(economy[robber.id].balance * 0.2);
        economy[robber.id].balance = Math.max(0, economy[robber.id].balance - fine);

        saveEconomy(economy);
        cooldowns.set(cooldownKey, Date.now());

        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🚨 Przyłapano!')
          .setDescription(`Zostałeś przyłapany! Płacisz grzywnę **${fine} 🪙**!`)
          .addFields({ name: '💼 Twoje saldo', value: `${economy[robber.id].balance} 🪙`, inline: false })
          .setTimestamp();

        return interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Błąd w komendzie rob:', error);
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: '❌ Wystąpił błąd podczas kradzieży!', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ Wystąpił błąd podczas kradzieży!', ephemeral: true });
        }
      } catch (replyErr) {
        console.error('Failed to notify user about error:', replyErr);
      }
    }
  },
};
