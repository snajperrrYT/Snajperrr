const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '../../data/economy.json');
const tmpEconomyPath = path.join(__dirname, '../../data/economy.json.tmp');

function getEconomy() {
  try {
    if (!fs.existsSync(economyPath)) {
      fs.writeFileSync(economyPath, '{}');
    }
    const raw = fs.readFileSync(economyPath, 'utf8');
    try {
      return JSON.parse(raw || '{}');
    } catch (e) {
      console.error('Corrupted economy.json, resetting file.', e);
      fs.writeFileSync(economyPath, '{}');
      return {};
    }
  } catch (err) {
    console.error('Error reading economy file:', err);
    return {};
  }
}

function saveEconomy(economy) {
  try {
    // atomic write: write to temp file and rename
    fs.writeFileSync(tmpEconomyPath, JSON.stringify(economy, null, 2));
    fs.renameSync(tmpEconomyPath, economyPath);
  } catch (err) {
    console.error('Error saving economy file:', err);
    // best-effort fallback
    try { fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2)); } catch (e) { console.error('Fallback write failed:', e); }
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

      if (target.id === robber.id) {
        return await interaction.reply({ content: '❌ Nie możesz okraść samego siebie!', ephemeral: true });
      }

      if (target.bot) {
        return await interaction.reply({ content: '❌ Nie możesz okraść bota!', ephemeral: true });
      }

      const cooldownKey = robber.id;
      const lastUsed = cooldowns.get(cooldownKey);
      const cooldownTime = 60 * 60 * 1000; // 1 godzina

      if (lastUsed && Date.now() - lastUsed < cooldownTime) {
        const timeLeft = Math.ceil((cooldownTime - (Date.now() - lastUsed)) / 1000 / 60);
        return await interaction.reply({ 
          content: `⏰ Musisz poczekać **${timeLeft} minut** przed następną kradzieżą!`, 
          ephemeral: true 
        });
      }

      const economy = getEconomy();

      if (!economy[robber.id]) {
        economy[robber.id] = { balance: 100, bank: 0, inventory: [] };
      }
      if (!economy[target.id]) {
        economy[target.id] = { balance: 100, bank: 0, inventory: [] };
      }

      if (economy[target.id].balance < 100) {
        return await interaction.reply({ content: `❌ ${target.username} ma za mało gotówki aby go okraść!`, ephemeral: true });
      }

      const success = Math.random() > 0.5;

      if (success) {
        const stolen = Math.floor(economy[target.id].balance * (Math.random() * 0.3 + 0.1));
        economy[target.id].balance = Math.max(0, economy[target.id].balance - stolen);
        economy[robber.id].balance = Math.max(0, economy[robber.id].balance + stolen);
        
        saveEconomy(economy);
        cooldowns.set(cooldownKey, Date.now());

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('💰 Udana Kradzież!')
          .setDescription(`Udało Ci się ukraść **${stolen} 🪙** od <@${target.id}>!`)
          .addFields(
            { name: '💼 Twoje saldo', value: `${economy[robber.id].balance} 🪙` }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } else {
        const fine = Math.floor(economy[robber.id].balance * 0.2);
        economy[robber.id].balance = Math.max(0, economy[robber.id].balance - fine);
        
        saveEconomy(economy);
        cooldowns.set(cooldownKey, Date.now());

        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🚨 Przyłapano!')
          .setDescription(`Zostałeś przyłapany! Płacisz grzywnę **${fine} 🪙**!`)
          .addFields(
            { name: '💼 Twoje saldo', value: `${economy[robber.id].balance} 🪙` }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Błąd w komendzie rob:', error);
      try { await interaction.reply({ content: '❌ Wystąpił błąd podczas kradzieży!', ephemeral: true }); } catch(e) { console.error('Reply failed:', e); }
    }
  },
};
