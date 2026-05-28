const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '../../data/economy.json');

function getEconomy() {
  if (!fs.existsSync(economyPath)) {
    fs.writeFileSync(economyPath, '{}');
  }
  return JSON.parse(fs.readFileSync(economyPath, 'utf8'));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Odbierz codzienną nagrodę'),
  async execute(interaction, args, client) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const author = isSlash ? interaction.user : interaction.author;
    
    const economy = getEconomy();
    
    if (!economy[author.id]) {
      economy[author.id] = { balance: 0, bank: 0, inventory: [], lastDaily: 0 };
    }

    const userData = economy[author.id];
    const now = Date.now();
    const oneDay = 86400000;

    if (userData.lastDaily && now - userData.lastDaily < oneDay) {
      const timeLeft = oneDay - (now - userData.lastDaily);
      const hours = Math.floor(timeLeft / 3600000);
      const minutes = Math.floor((timeLeft % 3600000) / 60000);

      const message = `⏰ Już odebrałeś dzienną nagrodę! Następna za ${hours}h ${minutes}min`;
      if (isSlash) {
        return await interaction.reply(message);
      } else {
        return interaction.reply(message);
      }
    }

    const reward = Math.floor(Math.random() * 500) + 500;
    userData.balance = Math.max(0, userData.balance + reward);
    userData.lastDaily = now;

    fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🎁 Codzienna Nagroda!')
      .setDescription(`Otrzymałeś **${reward} 🪙**!`)
      .addFields({ name: '💰 Nowe saldo', value: `${userData.balance} 🪙` })
      .setFooter({ text: 'Wróć jutro po więcej!' })
      .setTimestamp();

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      interaction.reply({ embeds: [embed] });
    }
  },
};
