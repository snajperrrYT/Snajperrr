const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const OpenAI = require('openai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slogan')
    .setDescription('Wygeneruj slogan reklamowy')
    .addStringOption(option =>
      option.setName('produkt')
        .setDescription('Nazwa produktu lub firmy')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('branża')
        .setDescription('Branża lub kategoria')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    try {
      const product = interaction.options.getString('produkt');
      const industry = interaction.options.getString('branża') || '';

      await interaction.deferReply();

      if (!process.env.OPENAI_API_KEY) {
        const slogans = [
          `${product} - Twoja przyszłość zaczyna się tutaj!`,
          `${product} - Innowacja w każdym detalu`,
          `${product} - Bo zasługujesz na więcej`,
          `${product} - Przełomowe rozwiązania dla Ciebie`
        ];

        const sloganList = slogans.map((s, i) => `${i + 1}. *${s}*`).join('\n\n');

        const embed = new EmbedBuilder()
          .setColor('#F39C12')
          .setTitle('✨ Wygenerowane Slogany')
          .setDescription(sloganList + '\n\n*Dodaj klucz OpenAI dla lepszych sloganów!*')
          .addFields(
            { name: '🎯 Produkt', value: product }
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
            content: 'Jesteś ekspertem marketingu. Twórz krótkie, chwytliwe slogany reklamowe po polsku.' 
          },
          { role: 'user', content: `Stwórz 5 sloganów dla: ${product}. Branża: ${industry || 'ogólna'}` }
        ],
        max_tokens: 300,
      });

      const slogans = completion.choices[0].message.content;

      const embed = new EmbedBuilder()
        .setColor('#F39C12')
        .setTitle('✨ Wygenerowane Slogany')
        .setDescription(slogans.substring(0, 1500))
        .addFields(
          { name: '🎯 Produkt', value: product, inline: true },
          { name: '🏢 Branża', value: industry || 'Ogólna', inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ content: '', embeds: [embed] });
    } catch (error) {
      console.error('Błąd w komendzie slogan:', error);
      await interaction.editReply({ content: '❌ Wystąpił błąd podczas generowania sloganów!', embeds: [] });
    }
  },
};
