const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '../../data/economy.json');

function getEconomy() {
  if (!fs.existsSync(economyPath)) {
    fs.writeFileSync(economyPath, '{}');
  }
  return JSON.parse(fs.readFileSync(economyPath, 'utf8'));
}

function saveEconomy(economy) {
  fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
}

const cooldowns = new Map();

const minerals = [
  { name: '🪨 Kamień', value: 5 },
  { name: '⛏️ Węgiel', value: 15 },
  { name: '🥉 Miedź', value: 30 },
  { name: '🥈 Srebro', value: 50 },
  { name: '🥇 Złoto', value: 100 },
  { name: '💎 Diament', value: 200 },
  { name: '💠 Szmaragd', value: 150 }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mine')
    .setDescription('Wykopuj minerały!'),
  
  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      
      const cooldownKey = userId;
      const lastUsed = cooldowns.get(cooldownKey);
      const cooldownTime = 10 * 60 * 1000; // 10 minut

      if (lastUsed && Date.now() - lastUsed < cooldownTime) {
        const timeLeft = Math.ceil((cooldownTime - (Date.now() - lastUsed)) / 1000 / 60);
        return await interaction.reply({ 
          content: `⏰ Musisz poczekać **${timeLeft} minut** przed następnym kopaniem!`, 
          ephemeral: true 
        });
      }

      const economy = getEconomy();

      if (!economy[userId]) {
        economy[userId] = { balance: 100, bank: 0, inventory: [] };
      }

      const found = minerals[Math.floor(Math.random() * minerals.length)];
      economy[userId].balance = Math.max(0, economy[userId].balance + found.value);
      
      saveEconomy(economy);
      cooldowns.set(cooldownKey, Date.now());

      const embed = new EmbedBuilder()
        .setColor('#8E44AD')
        .setTitle('⛏️ Kopalnia')
        .setDescription(`Wykopałeś: **${found.name}**!`)
        .addFields(
          { name: '💰 Wartość', value: `${found.value} 🪙`, inline: true },
          { name: '💼 Nowe saldo', value: `${economy[userId].balance} 🪙`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Błąd w komendzie mine:', error);
      await interaction.reply({ content: '❌ Wystąpił błąd podczas kopania!', ephemeral: true });
    }
  },
};
