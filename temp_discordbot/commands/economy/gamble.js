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

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gamble')
    .setDescription('Zagraj o wszystko albo nic!')
    .addIntegerOption(option =>
      option.setName('stawka')
        .setDescription('Kwota zakładu')
        .setRequired(true)
        .setMinValue(50)
    ),
  
  async execute(interaction) {
    try {
      const userId = interaction.user.id;
      const bet = interaction.options.getInteger('stawka');

      if (!bet || bet <= 0 || isNaN(bet)) {
        return await interaction.reply({ content: '❌ Podaj poprawną stawkę!', ephemeral: true });
      }
      
      const economy = getEconomy();

      if (!economy[userId]) {
        economy[userId] = { balance: 100, bank: 0, inventory: [] };
      }

      if (economy[userId].balance < bet) {
        return await interaction.reply({ 
          content: `❌ Nie masz wystarczająco monet! Masz: ${economy[userId].balance} 🪙`, 
          ephemeral: true 
        });
      }

      const win = Math.random() > 0.5;
      const winAmount = win ? bet : -bet;

      economy[userId].balance = Math.max(0, economy[userId].balance + winAmount);
      saveEconomy(economy);

      const embed = new EmbedBuilder()
        .setColor(win ? '#00FF00' : '#FF0000')
        .setTitle('🎲 Hazard!')
        .setDescription(win ? '🎉 **WYGRANA!**' : '😢 **PRZEGRANA!**')
        .addFields(
          { name: '💰 Stawka', value: `${bet} 🪙`, inline: true },
          { name: win ? '✅ Wygrałeś' : '❌ Straciłeś', value: `${bet} 🪙`, inline: true },
          { name: '💼 Nowe saldo', value: `${economy[userId].balance} 🪙`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Błąd w komendzie gamble:', error);
      await interaction.reply({ content: '❌ Wystąpił błąd podczas hazardu!', ephemeral: true });
    }
  },
};
