const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const OpenAI = require('openai');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('name')
    .setDescription('Wygeneruj kreatywne nazwy')
    .addStringOption(option =>
      option.setName('typ')
        .setDescription('Typ nazwy do wygenerowania')
        .setRequired(true)
        .addChoices(
          { name: 'Firma', value: 'company' },
          { name: 'Projekt', value: 'project' },
          { name: 'Postać', value: 'character' },
          { name: 'Zwierzak', value: 'pet' },
          { name: 'Zespół', value: 'band' }
        )
    )
    .addStringOption(option =>
      option.setName('opis')
        .setDescription('Krótki opis (opcjonalnie)')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    try {
      const type = interaction.options.getString('typ');
      const description = interaction.options.getString('opis') || '';

      await interaction.deferReply();

      if (!process.env.OPENAI_API_KEY) {
        const examples = {
          'company': ['TechNova', 'CloudSpark', 'DataFlow', 'NexusCore'],
          'project': ['ProjectX', 'AlphaWave', 'BetaStream', 'GammaHub'],
          'character': ['Aiden Shadowblade', 'Luna Starfire', 'Rex Thunder'],
          'pet': ['Fluffy', 'Shadow', 'Whiskers', 'Buddy'],
          'band': ['Electric Dreams', 'Neon Nights', 'Sound Wave']
        };

        const names = examples[type] || ['SuperName', 'MegaName', 'UltraName'];
        const nameList = names.map((n, i) => `${i + 1}. **${n}**`).join('\n');

        const embed = new EmbedBuilder()
          .setColor('#1ABC9C')
          .setTitle('💡 Generator Nazw')
          .setDescription(`**Typ:** ${type}\n\n${nameList}\n\n*Dodaj klucz OpenAI dla lepszych propozycji!*`)
          .setTimestamp();

        return await interaction.editReply({ content: '', embeds: [embed] });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: `Jesteś ekspertem od brandingu. Generuj 5 kreatywnych nazw dla typu: ${type}. Odpowiadaj tylko listą nazw.` 
          },
          { role: 'user', content: `Wygeneruj nazwy. ${description}` }
        ],
        max_tokens: 200,
      });

      const names = completion.choices[0].message.content;

      const embed = new EmbedBuilder()
        .setColor('#1ABC9C')
        .setTitle('💡 Wygenerowane Nazwy')
        .setDescription(names.substring(0, 1500))
        .addFields(
          { name: '🎯 Typ', value: type, inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ content: '', embeds: [embed] });
    } catch (error) {
      console.error('Błąd w komendzie name:', error);
      await interaction.editReply({ content: '❌ Wystąpił błąd podczas generowania nazw!', embeds: [] });
    }
  },
};
