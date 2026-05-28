const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('joke')
    .setDescription('Losowy żart'),
  async execute(interaction, args, client) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    try {
      const response = await axios.get('https://official-joke-api.appspot.com/random_joke');
      const joke = response.data;

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('😂 Żart')
        .setDescription(`**${joke.setup}**\n\n||${joke.punchline}||`)
        .setFooter({ text: 'Kliknij spoiler aby zobaczyć puentę!' })
        .setTimestamp();

      if (isSlash) {
        await interaction.reply({ embeds: [embed] });
      } else {
        interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      const polishJokes = [
        { setup: 'Co robi informatyk w ogrodzie?', punchline: 'Grzęda w źródle!' },
        { setup: 'Dlaczego programiści nie lubią natury?', punchline: 'Za dużo bugów!' },
        { setup: 'Co mówi zero do ósemki?', punchline: 'Ładny pasek!' },
        { setup: 'Dlaczego programista zginął pod prysznicem?', punchline: 'Bo instrukcja szamponu mówiła: "Nanieś, spłucz, powtórz"!' },
      ];
      
      const joke = polishJokes[Math.floor(Math.random() * polishJokes.length)];
      
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('😂 Żart')
        .setDescription(`**${joke.setup}**\n\n||${joke.punchline}||`)
        .setFooter({ text: 'Kliknij spoiler aby zobaczyć puentę!' })
        .setTimestamp();

      if (isSlash) {
        await interaction.reply({ embeds: [embed] });
      } else {
        interaction.reply({ embeds: [embed] });
      }
    }
  },
};
