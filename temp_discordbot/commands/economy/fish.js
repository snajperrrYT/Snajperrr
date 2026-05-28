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

const fish = [
  { name: '🐟 Mała ryba', value: 10 },
  { name: '🐠 Tropikalna ryba', value: 25 },
  { name: '🐡 Fugu', value: 50 },
  { name: '🦈 Rekin', value: 100 },
  { name: '🐳 Wieloryb', value: 200 },
  { name: '🦑 Kałamarnica', value: 75 }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fish')
    .setDescription('Idź na ryby!'),
  
  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      
      const cooldownKey = userId;
      const lastUsed = cooldowns.get(cooldownKey);
      const cooldownTime = 10 * 60 * 1000; // 10 minut

      if (lastUsed && Date.now() - lastUsed < cooldownTime) {
        const timeLeft = Math.ceil((cooldownTime - (Date.now() - lastUsed)) / 1000 / 60);
        return await interaction.reply({ 
          content: `⏰ Musisz poczekać **${timeLeft} minut** przed następnym łowieniem!`, 
          ephemeral: true 
        });
      }

      const economy = getEconomy();

      if (!economy[userId]) {
        economy[userId] = { balance: 100, bank: 0, inventory: [] };
      }

      const caught = fish[Math.floor(Math.random() * fish.length)];
      economy[userId].balance = Math.max(0, economy[userId].balance + caught.value);
      
      saveEconomy(economy);
      cooldowns.set(cooldownKey, Date.now());

      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('🎣 Wędkowanie')
        .setDescription(`Złowiłeś: **${caught.name}**!`)
        .addFields(
          { name: '💰 Wartość', value: `${caught.value} 🪙`, inline: true },
          { name: '💼 Nowe saldo', value: `${economy[userId].balance} 🪙`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Błąd w komendzie fish:', error);
      await interaction.reply({ content: '❌ Wystąpił błąd podczas łowienia!', ephemeral: true });
    }
  },
};
