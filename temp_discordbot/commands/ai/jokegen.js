const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const OpenAI = require('openai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('jokegen')
    .setDescription('Wygeneruj żart AI')
    .addStringOption(option =>
      option.setName('temat')
        .setDescription('Temat żartu')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    try {
      const topic = interaction.options.getString('temat') || 'dowolny';

      await interaction.deferReply();

      if (!process.env.OPENAI_API_KEY) {
        const jokes = [
          'Dlaczego programista poszedł do baru?\nBo potrzebował **debugowania**! 🐛',
          'Co robi bot Discord na wakacjach?\nWysyła **REST**! 🏖️',
          'Dlaczego AI nie może być komikiem?\nBo wszystkie jego żarty są **wyprocesowane**! 🤖'
        ];
        const joke = jokes[Math.floor(Math.random() * jokes.length)];

        const embed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('😄 Żart')
          .setDescription(joke)
          .setFooter({ text: 'Dodaj klucz OpenAI dla lepszych żartów!' })
          .setTimestamp();

        return await interaction.editReply({ content: '', embeds: [embed] });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'Jesteś komikiem. Twórz zabawne, krótkie żarty po polsku.' 
          },
          { role: 'user', content: `Opowiedz żart o: ${topic}` }
        ],
        max_tokens: 200,
      });

      const joke = completion.choices[0].message.content;

      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('😄 Wygenerowany Żart')
        .setDescription(joke.substring(0, 1500))
        .addFields(
          { name: '🎯 Temat', value: topic }
        )
        .setTimestamp();

      await interaction.editReply({ content: '', embeds: [embed] });
    } catch (error) {
      console.error('Błąd w komendzie jokegen:', error);
      await interaction.editReply({ content: '❌ Wystąpił błąd podczas generowania żartu!', embeds: [] });
    }
  },
};
