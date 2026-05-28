const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const OpenAI = require('openai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('code')
    .setDescription('Wygeneruj kod programistyczny')
    .addStringOption(option =>
      option.setName('język')
        .setDescription('Język programowania')
        .setRequired(true)
        .addChoices(
          { name: 'JavaScript', value: 'javascript' },
          { name: 'Python', value: 'python' },
          { name: 'Java', value: 'java' },
          { name: 'C++', value: 'cpp' },
          { name: 'HTML/CSS', value: 'html' }
        )
    )
    .addStringOption(option =>
      option.setName('opis')
        .setDescription('Opisz co ma robić kod')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    try {
      const language = interaction.options.getString('język');
      const description = interaction.options.getString('opis');

      await interaction.deferReply();

      if (!process.env.OPENAI_API_KEY) {
        const embed = new EmbedBuilder()
          .setColor('#E74C3C')
          .setTitle('💻 Generator Kodu')
          .addFields(
            { name: '📝 Język', value: language, inline: true },
            { name: '🎯 Zadanie', value: description },
            { name: 'ℹ️ Informacja', value: 'Aby używać prawdziwego AI, skonfiguruj klucz OpenAI API!' }
          )
          .setTimestamp();

        return await interaction.editReply({ content: '', embeds: [embed] });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `Jesteś ekspertem programowania. Generuj kod w języku ${language}. Odpowiadaj tylko kodem z krótkimi komentarzami.` 
          },
          { role: 'user', content: description }
        ],
        max_tokens: 800,
      });

      const code = completion.choices[0].message.content;

      const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle('💻 Wygenerowany Kod')
        .addFields(
          { name: '📝 Język', value: language, inline: true },
          { name: '🎯 Zadanie', value: description }
        )
        .setDescription(`\`\`\`${language}\n${code.substring(0, 1500)}\n\`\`\``)
        .setTimestamp();

      await interaction.editReply({ content: '', embeds: [embed] });
    } catch (error) {
      console.error('Błąd w komendzie code:', error);
      await interaction.editReply({ content: '❌ Wystąpił błąd podczas generowania kodu!', embeds: [] });
    }
  },
};
