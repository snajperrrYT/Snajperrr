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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('heist')
    .setDescription('Napad na bank! Wysokie ryzyko, wysoka nagroda!'),
  
  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      
      const cooldownKey = userId;
      const lastUsed = cooldowns.get(cooldownKey);
      const cooldownTime = 2 * 60 * 60 * 1000; // 2 godziny

      if (lastUsed && Date.now() - lastUsed < cooldownTime) {
        const timeLeft = Math.ceil((cooldownTime - (Date.now() - lastUsed)) / 1000 / 60 / 60);
        return await interaction.reply({ 
          content: `⏰ Musisz poczekać **${timeLeft}h** przed następnym napadem!`, 
          ephemeral: true 
        });
      }

      const economy = getEconomy();

      if (!economy[userId]) {
        economy[userId] = { balance: 100, bank: 0, inventory: [] };
      }

      const cost = 500;
      if (economy[userId].balance < cost) {
        return await interaction.reply({ 
          content: `❌ Potrzebujesz ${cost} 🪙 aby zorganizować napad!`, 
          ephemeral: true 
        });
      }

      const success = Math.random() > 0.6;

      if (success) {
        const reward = Math.floor(Math.random() * 2000) + 1000;
        economy[userId].balance = Math.max(0, economy[userId].balance + reward - cost);
        
        saveEconomy(economy);
        cooldowns.set(cooldownKey, Date.now());

        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('💰 UDANY NAPAD!')
          .setDescription('Napad na bank powiódł się!\n\n🏦 → 💰')
          .addFields(
            { name: '💵 Zdobyto', value: `${reward} 🪙`, inline: true },
            { name: '💸 Koszt', value: `${cost} 🪙`, inline: true },
            { name: '✅ Zysk', value: `${reward - cost} 🪙`, inline: true },
            { name: '💼 Nowe saldo', value: `${economy[userId].balance} 🪙` }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } else {
        const fine = Math.floor(Math.random() * 1000) + 500;
        economy[userId].balance = Math.max(0, economy[userId].balance - cost - fine);
        
        saveEconomy(economy);
        cooldowns.set(cooldownKey, Date.now());

        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🚨 NAPAD NIE POWIÓDŁ SIĘ!')
          .setDescription('Zostałeś przyłapany podczas napadu!')
          .addFields(
            { name: '💸 Koszt napadu', value: `${cost} 🪙`, inline: true },
            { name: '⚖️ Grzywna', value: `${fine} 🪙`, inline: true },
            { name: '❌ Łączna strata', value: `${cost + fine} 🪙`, inline: true },
            { name: '💼 Nowe saldo', value: `${economy[userId].balance} 🪙` }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Błąd w komendzie heist:', error);
      await interaction.reply({ content: '❌ Wystąpił błąd podczas napadu!', ephemeral: true });
    }
  },
};
