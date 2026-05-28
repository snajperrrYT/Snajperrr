const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const OpenAI = require('openai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('story')
    .setDescription('Wygeneruj krótką historię')
    .addStringOption(option =>
      option.setName('temat')
        .setDescription('Temat lub główny bohater historii')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('gatunek')
        .setDescription('Gatunek historii')
        .setRequired(false)
        .addChoices(
          { name: 'Fantasy', value: 'fantasy' },
          { name: 'Sci-Fi', value: 'scifi' },
          { name: 'Horror', value: 'horror' },
          { name: 'Komedia', value: 'comedy' },
          { name: 'Przygoda', value: 'adventure' }
        )
    ),
  
  async execute(interaction) {
    try {
      const topic = interaction.options.getString('temat');
      const genre = interaction.options.getString('gatunek') || 'przygoda';

      await interaction.deferReply();

      if (!process.env.OPENAI_API_KEY) {
        const embed = new EmbedBuilder()
          .setColor('#9B59B6')
          .setTitle('📖 Historia')
          .setDescription(`**Temat:** ${topic}\n**Gatunek:** ${genre}\n\nAby wygenerować prawdziwą historię AI, skonfiguruj klucz OpenAI API!`)
          .setTimestamp();

        return await interaction.editReply({ content: '', embeds: [embed] });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `Jesteś utalentowanym pisarzem. Napisz krótką historię (200-300 słów) po polsku w gatunku ${genre}.` 
          },
          { role: 'user', content: `Napisz historię o: ${topic}` }
        ],
        max_tokens: 600,
      });

      const story = completion.choices[0].message.content;

      const embed = new EmbedBuilder()
        .setColor('#9B59B6')
        .setTitle('📖 Wygenerowana Historia')
        .setDescription(story.substring(0, 1500))
        .addFields(
          { name: '🎯 Temat', value: topic, inline: true },
          { name: '🎭 Gatunek', value: genre, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ content: '', embeds: [embed] });
    } catch (error) {
      console.error('Błąd w komendzie story:', error);
      await interaction.editReply({ content: '❌ Wystąpił błąd podczas generowania historii!', embeds: [] });
    }
  },
};
