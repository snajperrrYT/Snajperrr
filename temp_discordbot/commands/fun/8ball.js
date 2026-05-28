const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const answers = [
  'Zdecydowanie tak!',
  'To pewne.',
  'Bez wątpienia.',
  'Tak - zdecydowanie.',
  'Możesz na to liczyć.',
  'Z mojego punktu widzenia, tak.',
  'Najprawdopodobniej.',
  'Wygląda dobrze.',
  'Tak.',
  'Znaki wskazują na tak.',
  'Odpowiedź jest niejasna, spróbuj ponownie.',
  'Zapytaj później.',
  'Lepiej ci nie mówić teraz.',
  'Nie mogę teraz przewidzieć.',
  'Skoncentruj się i zapytaj ponownie.',
  'Nie licz na to.',
  'Moja odpowiedź brzmi nie.',
  'Moje źródła mówią nie.',
  'Perspektywy nie są dobre.',
  'Bardzo wątpliwe.'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Zapytaj magiczną kulę! 🔮')
    .addStringOption(option =>
      option.setName('pytanie')
        .setDescription('Twoje pytanie do magicznej kuli')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const question = isSlash ? interaction.options.getString('pytanie') : interaction.content.split(' ').slice(1).join(' ');

    if (!question) {
      const msg = '❌ Musisz zadać pytanie!';
      return isSlash ? await interaction.reply(msg) : interaction.reply(msg);
    }

    const randomAnswer = answers[Math.floor(Math.random() * answers.length)];

    const embed = new EmbedBuilder()
      .setColor('#9B59B6')
      .setTitle('🔮 Magiczna Kula 8')
      .addFields(
        { name: '❓ Pytanie', value: question },
        { name: '🎱 Odpowiedź', value: randomAnswer }
      )
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
