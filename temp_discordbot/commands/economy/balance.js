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
    .setName('balance')
    .setDescription('Sprawdź swoje saldo')
    .addUserOption(option =>
      option.setName('użytkownik')
        .setDescription('Użytkownik którego saldo chcesz sprawdzić')
        .setRequired(false)
    ),
  async execute(interaction, args, client) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    let target;
    if (isSlash) {
      target = interaction.options.getUser('użytkownik') || interaction.user;
    } else {
      target = interaction.mentions.users.first() || interaction.author;
    }
    
    const economy = getEconomy();
    
    if (!economy[target.id]) {
      economy[target.id] = { balance: 0, bank: 0, inventory: [] };
      fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
    }

    const userData = economy[target.id];
    const total = userData.balance + userData.bank;

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`💰 Portfel ${target.username}`)
      .addFields(
        { name: '💵 Gotówka', value: `${userData.balance} 🪙`, inline: true },
        { name: '🏦 Bank', value: `${userData.bank} 🪙`, inline: true },
        { name: '💎 Razem', value: `${total} 🪙`, inline: true }
      )
      .setThumbnail(target.displayAvatarURL())
      .setTimestamp();

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      interaction.reply({ embeds: [embed] });
    }
  },
};
