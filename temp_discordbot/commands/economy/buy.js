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
    .setName('buy')
    .setDescription('Kup przedmiot ze sklepu')
    .addStringOption(option =>
      option.setName('przedmiot')
        .setDescription('ID przedmiotu do zakupu')
        .setRequired(true)
        .addChoices(
          { name: '🍪 Ciastko (100 🪙)', value: 'cookie' },
          { name: '☕ Kawa (150 🪙)', value: 'coffee' },
          { name: '🍕 Pizza (300 🪙)', value: 'pizza' },
          { name: '🏆 Trofeum (1000 🪙)', value: 'trophy' },
          { name: '👑 Korona (5000 🪙)', value: 'crown' },
          { name: '💎 Klejnot (10000 🪙)', value: 'gem' }
        )
    ),
  async execute(interaction, args, client) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const author = isSlash ? interaction.user : interaction.author;
    
    const shop = [
      { id: 'cookie', name: 'Ciastko', price: 100, emoji: '🍪' },
      { id: 'coffee', name: 'Kawa', price: 150, emoji: '☕' },
      { id: 'pizza', name: 'Pizza', price: 300, emoji: '🍕' },
      { id: 'trophy', name: 'Trofeum', price: 1000, emoji: '🏆' },
      { id: 'crown', name: 'Korona', price: 5000, emoji: '👑' },
      { id: 'gem', name: 'Klejnot', price: 10000, emoji: '💎' },
    ];

    let itemId;
    if (isSlash) {
      itemId = interaction.options.getString('przedmiot');
    } else {
      if (!args[0]) {
        return interaction.reply('❌ Podaj ID przedmiotu! Użyj /shop aby zobaczyć dostępne przedmioty.');
      }
      itemId = args[0].toLowerCase();
    }

    const item = shop.find(i => i.id === itemId);
    if (!item) {
      const message = '❌ Nie znaleziono przedmiotu o takim ID!';
      if (isSlash) {
        return await interaction.reply(message);
      } else {
        return interaction.reply(message);
      }
    }

    const economy = getEconomy();
    if (!economy[author.id]) {
      economy[author.id] = { balance: 0, bank: 0, inventory: [] };
    }

    const userData = economy[author.id];

    if (userData.balance < item.price) {
      const message = `❌ Nie masz wystarczająco pieniędzy! Potrzebujesz ${item.price} 🪙, a masz ${userData.balance} 🪙`;
      if (isSlash) {
        return await interaction.reply(message);
      } else {
        return interaction.reply(message);
      }
    }

    userData.balance -= item.price;
    if (!userData.inventory) userData.inventory = [];
    userData.inventory.push({ id: item.id, name: item.name, emoji: item.emoji });

    fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('✅ Zakup udany!')
      .setDescription(`Kupiłeś ${item.emoji} **${item.name}** za ${item.price} 🪙`)
      .addFields({ name: '💰 Pozostałe saldo', value: `${userData.balance} 🪙` })
      .setTimestamp();

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      interaction.reply({ embeds: [embed] });
    }
  },
};
