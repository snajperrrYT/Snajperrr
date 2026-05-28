const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cat')
    .setDescription('Losowe zdjęcie kota'),
  async execute(interaction, args, client) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    try {
      const response = await axios.get('https://api.thecatapi.com/v1/images/search');
      const catImage = response.data[0].url;

      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('🐱 Oto twój kot!')
        .setImage(catImage)
        .setTimestamp();

      if (isSlash) {
        await interaction.reply({ embeds: [embed] });
      } else {
        interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
      const message = '❌ Nie udało się pobrać zdjęcia kota!';
      if (isSlash) {
        await interaction.reply(message);
      } else {
        interaction.reply(message);
      }
    }
  },
};
