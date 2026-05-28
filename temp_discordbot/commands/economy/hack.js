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
    .setName('hack')
    .setDescription('Zhakuj system bankowy!')
    .addUserOption(option =>
      option.setName('użytkownik')
        .setDescription('Użytkownik którego bank chcesz zhakować')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    try {
      const hacker = interaction.user;
      const target = interaction.options.getUser('użytkownik');

      if (target.id === hacker.id) {
        return await interaction.reply({ content: '❌ Nie możesz zhakować swojego własnego banku!', ephemeral: true });
      }

      if (target.bot) {
        return await interaction.reply({ content: '❌ Nie możesz zhakować bota!', ephemeral: true });
      }

      const cooldownKey = hacker.id;
      const lastUsed = cooldowns.get(cooldownKey);
      const cooldownTime = 90 * 60 * 1000; // 90 minut

      if (lastUsed && Date.now() - lastUsed < cooldownTime) {
        const timeLeft = Math.ceil((cooldownTime - (Date.now() - lastUsed)) / 1000 / 60);
        return await interaction.reply({ 
          content: `⏰ Musisz poczekać **${timeLeft} minut** przed następnym hackowaniem!`, 
          ephemeral: true 
        });
      }

      const economy = getEconomy();

      if (!economy[hacker.id]) {
        economy[hacker.id] = { balance: 100, bank: 0, inventory: [] };
      }
      if (!economy[target.id]) {
        economy[target.id] = { balance: 100, bank: 0, inventory: [] };
      }

      if (economy[target.id].bank < 200) {
        return await interaction.reply({ 
          content: `❌ ${target.username} ma za mało w banku aby go zhakować!`, 
          ephemeral: true 
        });
      }

      const success = Math.random() > 0.65;

      if (success) {
        const stolen = Math.floor(economy[target.id].bank * (Math.random() * 0.2 + 0.1));
        economy[target.id].bank = Math.max(0, economy[target.id].bank - stolen);
        economy[hacker.id].balance = Math.max(0, economy[hacker.id].balance + stolen);
        
        saveEconomy(economy);
        cooldowns.set(cooldownKey, Date.now());

        const embed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('💻 Udany Hack!')
          .setDescription(`Zhakowanie powiodło się!\n\nUkradłeś **${stolen} 🪙** z banku ${target}!`)
          .addFields(
            { name: '💼 Twoje saldo', value: `${economy[hacker.id].balance} 🪙` }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      } else {
        const fine = Math.floor(economy[hacker.id].balance * 0.3);
        economy[hacker.id].balance = Math.max(0, economy[hacker.id].balance - fine);
        
        saveEconomy(economy);
        cooldowns.set(cooldownKey, Date.now());

        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('🚨 Hack Wykryty!')
          .setDescription(`Twój hack został wykryty przez system bezpieczeństwa!\n\nPłacisz grzywnę **${fine} 🪙**!`)
          .addFields(
            { name: '💼 Twoje saldo', value: `${economy[hacker.id].balance} 🪙` }
          )
          .setTimestamp();

        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error('Błąd w komendzie hack:', error);
      await interaction.reply({ content: '❌ Wystąpił błąd podczas hackowania!', ephemeral: true });
    }
  },
};
