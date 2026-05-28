const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const advices = [
  'Zacznij dzień od wody - twoje ciało będzie wdzięczne!',
  'Rób przerwy co godzinę, jeśli pracujesz przy komputerze.',
  'Naucz się mówić "nie" - Twój czas jest cenny.',
  'Czytaj przynajmniej 20 minut dziennie.',
  'Zacznij oszczędzać 10% swoich dochodów.',
  'Ćwicz wdzięczność - zapisuj trzy rzeczy dziennie, za które jesteś wdzięczny.',
  'Spróbuj medytacji przez 5 minut każdego ranka.',
  'Ogranicz czas spędzany w mediach społecznościowych.',
  'Zadzwoń do starego przyjaciela - umocni to więź.',
  'Ucz się czegoś nowego każdego dnia.',
  'Śpij przynajmniej 7-8 godzin każdej nocy.',
  'Jedz więcej warzyw i owoców.',
  'Wyjdź na spacer, gdy czujesz się przytłoczony.',
  'Pisz swoje cele i przeglądaj je regularnie.',
  'Bądź miły dla siebie - każdy popełnia błędy.',
  'Spróbuj nowego hobby.',
  'Utrzymuj kontakt z rodziną.',
  'Pij mniej kawy, więcej wody.',
  'Dziękuj ludziom częściej.',
  'Inwestuj w swoje zdrowie - to najlepsza inwestycja.'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('advice')
    .setDescription('Porada dnia! 💡'),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    const randomAdvice = advices[Math.floor(Math.random() * advices.length)];

    const embed = new EmbedBuilder()
      .setColor('#27AE60')
      .setTitle('💡 Porada Dnia')
      .setDescription(randomAdvice)
      .setFooter({ text: 'Mała zmiana może zrobić wielką różnicę!' })
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
