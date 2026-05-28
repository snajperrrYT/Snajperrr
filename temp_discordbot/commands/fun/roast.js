const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const roasts = [
  'Gdyby inteligencja była nielegalna, byłbyś najuczciwszym człowiekiem na świecie!',
  'Twoja karma musi być bardzo cierpliwa.',
  'Jesteś dowodem na to, że ewolucja może iść również wstecz.',
  'Gdyby głupota bolała, krzyczałbyś przez cały dzień.',
  'Pamiętaj, że jesteś wyjątkowy - dokładnie jak wszyscy inni.',
  'Twoja tajemnica jest bezpieczna ze mną. Nie słuchałem.',
  'Jestem zazdrosny o ludzi, którzy cię nie znają.',
  'Gdziekolwiek jesteś, jest tam środek jakiejś drogi.',
  'Masz twarz do radia i głos do niemego kina.',
  'Jesteś jak chmura. Gdy znikniesz, zrobi się piękny dzień.',
  'Twój typ osobowości to „raczyłbym się powstrzymać".',
  'Gdyby sarkazm spalał kalorie, byłbyś już modelką.',
  'Nie jesteś głupi, po prostu masz pecha w myśleniu.',
  'Jesteś jak poniedziałek w formie osoby.',
  'Twój IQ jest niższy niż temperatura w lodówce.'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('roast')
    .setDescription('Wyzwij kogoś (friendly)! 🔥')
    .addUserOption(option =>
      option.setName('użytkownik')
        .setDescription('Kogo chcesz wyzwać?')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const target = isSlash 
      ? interaction.options.getUser('użytkownik') || interaction.user 
      : interaction.mentions.users.first() || interaction.author;

    const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];

    const embed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('🔥 Roast')
      .setDescription(`${target}, ${randomRoast}`)
      .setFooter({ text: 'To tylko żart! Nie bierz tego do siebie 😉' })
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
