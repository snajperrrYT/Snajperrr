const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const pickupLines = [
  'Czy twój ojciec jest złodziejem? Bo wygląda na to, że ukradł gwiazdy z nieba i włożył je w twoje oczy!',
  'Czy masz mapę? Bo właśnie zgubiłem się w twoich oczach.',
  'Czy wierzysz w miłość od pierwszego wejrzenia, czy mam przejść jeszcze raz?',
  'Czy jesteś z McDonald\'s? Bo właśnie się zakochałem!',
  'Jesteś jak czerwone światło - kasujesz mnie, gdy próbuję przejść.',
  'Czy to iPhone w kieszeni, czy cieszysz się, że mnie widzisz?',
  'Gdybym był kotem, wydałbym wszystkie 9 żyć z tobą.',
  'Czy jesteś Wi-Fi? Bo czuję połączenie!',
  'Czy jesteś klawiaturą? Bo jesteś moim typem!',
  'Jesteś jak Google - masz wszystko, czego szukam.',
  'Czy jesteś bankiem? Bo chcę złożyć w tobie moje serce!',
  'Jeśli byłaś warzywem, byłabyś słodkim ziemniakiem!',
  'Czy pracujesz w Starbucks? Bo mi się latte podobasz!',
  'Jesteś jak słońce - rozświetlasz mój dzień!',
  'Czy jesteś czarodziejką? Bo gdy na ciebie patrzę, wszyscy inni znikają!',
  'Gdybyś była słowem w słowniku, byłabyś definicją piękna.',
  'Czy jesteś pożyczką? Bo masz moje zainteresowanie!',
  'Jesteś jak telefon - chcę cię trzymać przez cały dzień!',
  'Czy to trzęsienie ziemi, czy właśnie wstrząsnąłeś moim światem?',
  'Jesteś jak parking - miejsce zajęte, ale chętnie zaparkuję nielegalnie!'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pickup')
    .setDescription('Losowy tekst podrywowy (śmieszny)! 😏')
    .addUserOption(option =>
      option.setName('użytkownik')
        .setDescription('Do kogo chcesz użyć tekstu?')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const target = isSlash 
      ? interaction.options.getUser('użytkownik')
      : interaction.mentions.users.first();

    const randomLine = pickupLines[Math.floor(Math.random() * pickupLines.length)];

    const embed = new EmbedBuilder()
      .setColor('#E91E63')
      .setTitle('😏 Tekst Podrywowy')
      .setDescription(target ? `${target}, ${randomLine}` : randomLine)
      .setFooter({ text: 'Nie bierz tego na poważnie! 😂' })
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
