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

const animals = [
  { name: '🐰 Królik', value: 20 },
  { name: '🦌 Jeleń', value: 75 },
  { name: '🦊 Lis', value: 50 },
  { name: '🐻 Niedźwiedź', value: 150 },
  { name: '🦅 Orzeł', value: 100 },
  { name: '🐗 Dzik', value: 80 }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('hunt')
    .setDescription('Idź na polowanie!'),
  
  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      
      const cooldownKey = userId;
      const lastUsed = cooldowns.get(cooldownKey);
      const cooldownTime = 15 * 60 * 1000; // 15 minut

      if (lastUsed && Date.now() - lastUsed < cooldownTime) {
        const timeLeft = Math.ceil((cooldownTime - (Date.now() - lastUsed)) / 1000 / 60);
        return await interaction.reply({ 
          content: `⏰ Musisz poczekać **${timeLeft} minut** przed następnym polowaniem!`, 
          ephemeral: true 
        });
      }

      const economy = getEconomy();

      if (!economy[userId]) {
        economy[userId] = { balance: 100, bank: 0, inventory: [] };
      }

      const success = Math.random() > 0.3;

      if (success) {
        const animal = animals[Math.floor(Math.random() * animals.length)];
        economy[userId].balance = Math.max(0, economy[userId].balance + animal.value);
        
        saveEconomy(economy);
        cooldowns.set(cooldownKey, Date.now());

        const embed = new EmbedBuilder()
          .setColor('#27AE60')
          .setTitle('🏹 Polowanie')
          .setDescription(`Udało się! Złowiłeś: **${animal.name}**!`)
          .addFields(
            { name: '💰 Wartość', value: `${animal.value} 🪙`, inline: true },
            { name: '💼 Nowe saldo', value: `${economy[userId].balance} 🪙`, inline: true }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } else {
        cooldowns.set(cooldownKey, Date.now());

        const embed = new EmbedBuilder()
          .setColor('#E67E22')
          .setTitle('🏹 Polowanie')
          .setDescription('Nie udało się nic złapać... Spróbuj ponownie później!')
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Błąd w komendzie hunt:', error);
      await interaction.reply({ content: '❌ Wystąpił błąd podczas polowania!', ephemeral: true });
    }
  },
};
