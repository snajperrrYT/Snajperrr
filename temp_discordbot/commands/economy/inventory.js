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
    .setName('inventory')
    .setDescription('Zobacz swoje przedmioty')
    .addUserOption(option =>
      option.setName('użytkownik')
        .setDescription('Użytkownik którego ekwipunek chcesz zobaczyć')
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
    const inventory = userData.inventory || [];

    const embed = new EmbedBuilder()
      .setColor('#E91E63')
      .setTitle(`🎒 Ekwipunek ${target.username}`)
      .setThumbnail(target.displayAvatarURL())
      .setTimestamp();

    if (inventory.length === 0) {
      embed.setDescription('Ekwipunek jest pusty! Kup coś w sklepie (/shop)');
    } else {
      const itemCounts = {};
      inventory.forEach(item => {
        const key = `${item.emoji} ${item.name}`;
        itemCounts[key] = (itemCounts[key] || 0) + 1;
      });

      const itemsList = Object.entries(itemCounts)
        .map(([item, count]) => `${item} x${count}`)
        .join('\n');

      embed.setDescription(itemsList);
      embed.addFields({ name: '📦 Liczba przedmiotów', value: `${inventory.length}`, inline: true });
    }

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      interaction.reply({ embeds: [embed] });
    }
  },
};
