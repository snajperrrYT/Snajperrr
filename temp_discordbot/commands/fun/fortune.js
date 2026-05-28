const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const fortunes = [
  'Wielkie rzeczy czekają na ciebie w najbliższej przyszłości!',
  'Twoja wytrwałość wkrótce zostanie nagrodzona.',
  'Szczęście uśmiechnie się do ciebie w tym tygodniu.',
  'Nadchodzi czas pozytywnych zmian.',
  'Spotkasz kogoś, kto zmieni twoje życie.',
  'Twoje ciężka praca przyniesie owoce szybciej, niż myślisz.',
  'Nieoczekiwana wiadomość przyniesie radość.',
  'Dobra karma powraca do ciebie.',
  'Nowa przygoda rozpocznie się wkrótce.',
  'Twoja kreatywność osiągnie nowe wyżyny.',
  'Ktoś myśli o tobie w pozytywny sposób.',
  'Nadchodzi okres prosperity i szczęścia.',
  'Zaufaj swoim instynktom - są prawidłowe.',
  'Sukces jest tuż za rogiem.',
  'Twoje marzenia zaczynają się spełniać.',
  'Wkrótce otrzymasz prezent lub niespodziewany bonus.',
  'Miłość i przyjaźń rozkwitną wokół ciebie.',
  'Twoja pozytywna energia przyciąga dobre rzeczy.',
  'Nadszedł czas, by podążać za swoją pasją.',
  'Wszystko ułoży się po twojej myśli.'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fortune')
    .setDescription('Otwórz ciasteczko z wróżbą! 🥠'),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    const randomFortune = fortunes[Math.floor(Math.random() * fortunes.length)];

    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('🥠 Ciasteczko z Wróżbą')
      .setDescription(`*${randomFortune}*`)
      .setFooter({ text: 'Twoja wróżba na dziś' })
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
