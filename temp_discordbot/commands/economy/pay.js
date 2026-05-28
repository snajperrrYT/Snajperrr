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
    .setName('pay')
    .setDescription('Przekaż pieniądze innemu użytkownikowi')
    .addUserOption(option =>
      option.setName('użytkownik')
        .setDescription('Użytkownik któremu chcesz przekazać pieniądze')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('kwota')
        .setDescription('Kwota do przekazania')
        .setRequired(true)
        .setMinValue(1)
    ),
  async execute(interaction, args, client) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const author = isSlash ? interaction.user : interaction.author;
    
    let target, amount;
    if (isSlash) {
      target = interaction.options.getUser('użytkownik');
      amount = interaction.options.getInteger('kwota');
    } else {
      target = interaction.mentions.users.first();
      amount = parseInt(args[1]);

      if (!target) {
        return interaction.reply('❌ Oznacz użytkownika któremu chcesz przekazać pieniądze!');
      }

      if (!amount || amount <= 0 || isNaN(amount)) {
        return interaction.reply('❌ Podaj poprawną kwotę do przekazania!');
      }
    }

    if (target.id === author.id) {
      const message = '❌ Nie możesz przekazać pieniędzy samemu sobie!';
      if (isSlash) {
        return await interaction.reply(message);
      } else {
        return interaction.reply(message);
      }
    }

    if (target.bot) {
      const message = '❌ Nie możesz przekazać pieniędzy botowi!';
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
    if (!economy[target.id]) {
      economy[target.id] = { balance: 0, bank: 0, inventory: [] };
    }

    const sender = economy[author.id];

    if (sender.balance < amount) {
      const message = `❌ Nie masz wystarczająco pieniędzy! Masz ${sender.balance} 🪙`;
      if (isSlash) {
        return await interaction.reply(message);
      } else {
        return interaction.reply(message);
      }
    }

    sender.balance = Math.max(0, sender.balance - amount);
    economy[target.id].balance = Math.max(0, economy[target.id].balance + amount);

    fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));

    const embed = new EmbedBuilder()
      .setColor('#4CAF50')
      .setTitle('💸 Transfer wykonany!')
      .setDescription(`${author} przekazał **${amount} 🪙** dla ${target}`)
      .addFields(
        { name: 'Twoje saldo', value: `${sender.balance} 🪙`, inline: true },
        { name: 'Saldo odbiorcy', value: `${economy[target.id].balance} 🪙`, inline: true }
      )
      .setTimestamp();

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      interaction.reply({ embeds: [embed] });
    }
  },
};
