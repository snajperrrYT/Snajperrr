const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const OpenAI = require('openai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('poem')
    .setDescription('Wygeneruj wiersz')
    .addStringOption(option =>
      option.setName('temat')
        .setDescription('Temat wiersza')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('styl')
        .setDescription('Styl wiersza')
        .setRequired(false)
        .addChoices(
          { name: 'Romantyczny', value: 'romantic' },
          { name: 'Nowoczesny', value: 'modern' },
          { name: 'Haiku', value: 'haiku' },
          { name: 'Limeryk', value: 'limerick' }
        )
    ),
  
  async execute(interaction) {
    try {
      const topic = interaction.options.getString('temat');
      const style = interaction.options.getString('styl') || 'nowoczesny';

      await interaction.deferReply();

      if (!process.env.OPENAI_API_KEY) {
        const embed = new EmbedBuilder()
          .setColor('#E91E63')
          .setTitle('✍️ Wiersz')
          .setDescription(`**Temat:** ${topic}\n**Styl:** ${style}\n\n*Róże są czerwone,\nFiołki niebieskie,\nAby mieć AI wiersze,\nDodaj klucz OpenAI!*`)
          .setTimestamp();

        return await interaction.editReply({ content: '', embeds: [embed] });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `Jesteś poetą. Napisz krótki wiersz po polsku w stylu ${style}.` 
          },
          { role: 'user', content: `Napisz wiersz o: ${topic}` }
        ],
        max_tokens: 300,
      });

      const poem = completion.choices[0].message.content;

      const embed = new EmbedBuilder()
        .setColor('#E91E63')
        .setTitle('✍️ Wygenerowany Wiersz')
        .setDescription(poem.substring(0, 1500))
        .addFields(
          { name: '🎯 Temat', value: topic, inline: true },
          { name: '🎨 Styl', value: style, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ content: '', embeds: [embed] });
    } catch (error) {
      console.error('Błąd w komendzie poem:', error);
      await interaction.editReply({ content: '❌ Wystąpił błąd podczas generowania wiersza!', embeds: [] });
    }
  },
};
