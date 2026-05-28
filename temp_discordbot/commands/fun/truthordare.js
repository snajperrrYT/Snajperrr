const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const truths = [
  'Jakie jest twoje najbardziej żenujące wspomnienie?',
  'Kto był twoją pierwszą miłością?',
  'Jaka jest najgorsza rzecz, jaką kiedykolwiek zrobiłeś?',
  'Gdybyś mógł usunąć jedną osobę z życia, kto by to był?',
  'Jakie jest twoje najdziwniejsze marzenie?',
  'Czy kiedykolwiek śpiewałeś pod prysznicem?',
  'Jaki jest twój największy strach?',
  'Czy kiedykolwiek kłamałeś swojemu najlepszemu przyjacielowi?',
  'Jaką najdziwniejszą rzecz robiłeś, gdy byłeś sam?',
  'Gdybyś mógł być kimś innym przez jeden dzień, kto by to był?',
  'Jaki jest twój sekretny talent?',
  'Czy kiedykolwiek płakałeś oglądając film?',
  'Jaka jest najdziwniejsza rzecz w twojej przeglądarce?',
  'Gdybyś mógł zmienić jedną rzecz w sobie, co by to było?',
  'Jaki jest najgorszy prezent, jaki kiedykolwiek dostałeś?'
];

const dares = [
  'Zaśpiewaj swój ulubiony refren!',
  'Zrób 20 pompek!',
  'Opowiedz żart!',
  'Napisz wiersz o serwerze!',
  'Zmień swój nick na coś śmiesznego na 10 minut!',
  'Napisz wiadomość oczami zamkniętymi!',
  'Naśladuj kogoś z serwera!',
  'Tańcz przez minutę (i nagraj to)!',
  'Użyj emotek w każdym zdaniu przez następne 5 wiadomości!',
  'Opowiedz swoją najgorszą historię!',
  'Zmień zdjęcie profilowe na coś śmiesznego!',
  'Napisz rap o pizzy!',
  'Mów tylko wierszem przez następne 3 wiadomości!',
  'Opisz siebie używając tylko emoji!',
  'Pochwał każdą osobę na kanale!'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('truthordare')
    .setDescription('Prawda czy wyzwanie? 🎭')
    .addStringOption(option =>
      option.setName('wybor')
        .setDescription('Co wybierasz?')
        .setRequired(true)
        .addChoices(
          { name: 'Prawda 💭', value: 'truth' },
          { name: 'Wyzwanie 🎯', value: 'dare' }
        )
    ),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const choice = isSlash ? interaction.options.getString('wybor') : 'truth';

    let content, title, color;
    
    if (choice === 'truth') {
      content = truths[Math.floor(Math.random() * truths.length)];
      title = '💭 Prawda';
      color = '#3498DB';
    } else {
      content = dares[Math.floor(Math.random() * dares.length)];
      title = '🎯 Wyzwanie';
      color = '#E74C3C';
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(content)
      .setFooter({ text: 'Nie możesz się wycofać! 😈' })
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
