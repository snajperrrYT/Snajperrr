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

const crimes = [
  { name: 'Kradzież w sklepie', reward: [50, 200] },
  { name: 'Włamanie do samochodu', reward: [100, 300] },
  { name: 'Kradzież roweru', reward: [75, 150] },
  { name: 'Oszustwo', reward: [150, 400] },
  { name: 'Kradzież tożsamości', reward: [200, 500] }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('crime')
    .setDescription('Popełnij przestępstwo (ryzykowne!)'),
  
  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      
      const cooldownKey = userId;
      const lastUsed = cooldowns.get(cooldownKey);
      const cooldownTime = 30 * 60 * 1000; // 30 minut

      if (lastUsed && Date.now() - lastUsed < cooldownTime) {
        const timeLeft = Math.ceil((cooldownTime - (Date.now() - lastUsed)) / 1000 / 60);
        return await interaction.reply({ 
          content: `⏰ Musisz poczekać **${timeLeft} minut** przed następnym przestępstwem!`, 
          ephemeral: true 
        });
      }

      const economy = getEconomy();

      if (!economy[userId]) {
        economy[userId] = { balance: 100, bank: 0, inventory: [] };
      }

      const success = Math.random() > 0.4;
      const crime = crimes[Math.floor(Math.random() * crimes.length)];

      if (success) {
        const reward = Math.floor(Math.random() * (crime.reward[1] - crime.reward[0] + 1)) + crime.reward[0];
        economy[userId].balance = Math.max(0, economy[userId].balance + reward);
        
        saveEconomy(economy);
        cooldowns.set(cooldownKey, Date.now());

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Udane Przestępstwo!')
          .setDescription(`**${crime.name}**\n\nUdało się! Zdobyłeś **${reward} 🪙**!`)
          .addFields(
            { name: '💼 Nowe saldo', value: `${economy[userId].balance} 🪙` }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } else {
        const fine = Math.floor(Math.random() * 200) + 100;
        economy[userId].balance = Math.max(0, economy[userId].balance - fine);
        
        saveEconomy(economy);
        cooldowns.set(cooldownKey, Date.now());

        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🚨 Przyłapano!')
          .setDescription(`**${crime.name}**\n\nZostałeś przyłapany! Płacisz grzywnę **${fine} 🪙**!`)
          .addFields(
            { name: '💼 Nowe saldo', value: `${economy[userId].balance} 🪙` }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Błąd w komendzie crime:', error);
      await interaction.reply({ content: '❌ Wystąpił błąd podczas przestępstwa!', ephemeral: true });
    }
  },
};
