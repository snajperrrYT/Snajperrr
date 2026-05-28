const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const OpenAI = require('openai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('recipe')
    .setDescription('Wygeneruj przepis kulinarny')
    .addStringOption(option =>
      option.setName('danie')
        .setDescription('Nazwa dania lub składniki')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    try {
      const dish = interaction.options.getString('danie');

      await interaction.deferReply();

      if (!process.env.OPENAI_API_KEY) {
        const embed = new EmbedBuilder()
          .setColor('#E67E22')
          .setTitle('👨‍🍳 Przepis Kulinarny')
          .setDescription(`**Danie:** ${dish}\n\n**Składniki:**\n- Fantazja\n- Kreatywność\n- Klucz OpenAI API\n\n**Instrukcje:**\n1. Dodaj klucz API\n2. Wymieszaj z AI\n3. Gotowe! 🍳`)
          .setTimestamp();

        return await interaction.editReply({ content: '', embeds: [embed] });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'Jesteś szefem kuchni. Twórz szczegółowe przepisy kulinarne po polsku ze składnikami i instrukcjami.' 
          },
          { role: 'user', content: `Stwórz przepis na: ${dish}` }
        ],
        max_tokens: 600,
      });

      const recipe = completion.choices[0].message.content;

      const embed = new EmbedBuilder()
        .setColor('#E67E22')
        .setTitle('👨‍🍳 Przepis Kulinarny')
        .setDescription(recipe.substring(0, 1500))
        .addFields(
          { name: '🍽️ Danie', value: dish }
        )
        .setTimestamp();

      await interaction.editReply({ content: '', embeds: [embed] });
    } catch (error) {
      console.error('Błąd w komendzie recipe:', error);
      await interaction.editReply({ content: '❌ Wystąpił błąd podczas generowania przepisu!', embeds: [] });
    }
  },
};
