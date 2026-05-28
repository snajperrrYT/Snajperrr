const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('meme')
    .setDescription('Losowy mem z Reddita'),
  async execute(interaction, args, client) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    try {
      const response = await axios.get('https://meme-api.com/gimme');
      const meme = response.data;

      const embed = new EmbedBuilder()
        .setColor('#FF4500')
        .setTitle(meme.title)
        .setImage(meme.url)
        .setURL(meme.postLink)
        .setFooter({ text: `👍 ${meme.ups} | r/${meme.subreddit}` })
        .setTimestamp();

      if (isSlash) {
        await interaction.reply({ embeds: [embed] });
      } else {
        interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
      const message = '❌ Nie udało się pobrać mema!';
      if (isSlash) {
        await interaction.reply(message);
      } else {
        interaction.reply(message);
      }
    }
  },
};
