const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dog')
    .setDescription('Losowe zdjęcie psa'),
  async execute(interaction, args, client) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    try {
      const response = await axios.get('https://dog.ceo/api/breeds/image/random');
      const dogImage = response.data.message;

      const embed = new EmbedBuilder()
        .setColor('#8B4513')
        .setTitle('🐕 Oto twój pies!')
        .setImage(dogImage)
        .setTimestamp();

      if (isSlash) {
        await interaction.reply({ embeds: [embed] });
      } else {
        interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
      const message = '❌ Nie udało się pobrać zdjęcia psa!';
      if (isSlash) {
        await interaction.reply(message);
      } else {
        interaction.reply(message);
      }
    }
  },
};
