const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const compliments = [
  'Jesteś niesamowity! Twoja energia rozświetla każde pomieszczenie!',
  'Masz niesamowity uśmiech, który potrafi rozjaśnić każdy dzień!',
  'Jesteś świetnym przyjacielem i cenną osobą!',
  'Twoja inteligencja i kreatywność są inspirujące!',
  'Świat jest lepszy z tobą w nim!',
  'Masz wspaniałe poczucie humoru!',
  'Jesteś silniejszy, niż myślisz!',
  'Twoja dobroć jest zaraźliwa!',
  'Jesteś wyjątkowy na swój własny, niepowtarzalny sposób!',
  'Masz talent do sprawiania, że inni czują się dobrze!',
  'Twoja pasja jest inspirująca!',
  'Jesteś jedną z najbardziej pozytywnych osób, jakie znam!',
  'Twoje pomysły są innowacyjne i fascynujące!',
  'Masz cudowną osobowość!',
  'Jesteś typem osoby, którą wszyscy chcą mieć w swoim życiu!',
  'Twoja determinacja jest godna podziwu!',
  'Jesteś najlepszą wersją siebie!',
  'Masz niesamowite zdolności!',
  'Twoja obecność sprawia, że wszystko jest lepsze!',
  'Jesteś absolutnie wspaniały!'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('compliment')
    .setDescription('Zrób komuś komplement! 💝')
    .addUserOption(option =>
      option.setName('użytkownik')
        .setDescription('Komu chcesz zrobić komplement?')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const target = isSlash 
      ? interaction.options.getUser('użytkownik') || interaction.user 
      : interaction.mentions.users.first() || interaction.author;

    const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];

    const embed = new EmbedBuilder()
      .setColor('#FF69B4')
      .setTitle('💝 Komplement')
      .setDescription(`${target}, ${randomCompliment}`)
      .setFooter({ text: 'Miłego dnia! ✨' })
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
