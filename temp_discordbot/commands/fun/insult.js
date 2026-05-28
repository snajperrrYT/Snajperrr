const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const insults = [
  'Gdybym chciał zabić się, wspiąłbym się na twoje ego i skoczył na twój IQ.',
  'Nie jesteś zupełnie bezużyteczny - możesz służyć jako zły przykład.',
  'Niektórzy ludzie przynoszą radość wszędzie, gdzie idą. Ty przynosisz radość, gdy wychodzisz.',
  'Kiedyś myślałem, że jesteś nieznośny, ale potem zdałem sobie sprawę, że to po prostu twoja osobowość.',
  'Jesteś jak poniedziałek - nikt cię nie lubi.',
  'Masz twarz, którą tylko matka mogłaby kochać... i pewnie ona ma wątpliwości.',
  'Nie wiem, co sprawia, że jesteś tak głupi, ale to naprawdę działa.',
  'Widziałem już puste pudełka ciekawsze od ciebie.',
  'Jesteś jak chmura - gdy znikniesz, dzień staje się piękniejszy.',
  'Twoja tajemnica jest bezpieczna ze mną. Nigdy nie słuchałem.',
  'Nie jesteś głupi, po prostu masz pecha w myśleniu.',
  'Jesteś dowodem na to, że ewolucja może działać wstecz.',
  'Gdyby głupota była super mocą, byłbyś Supermanem.',
  'Jesteś jak biały kolor - nudny i bez charakteru.',
  'Masz rzadką chorobę - nikt nie chce być w pobliżu!'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('insult')
    .setDescription('"Obraza" dla kogoś (friendly, śmieszna)! 💢')
    .addUserOption(option =>
      option.setName('użytkownik')
        .setDescription('Kogo chcesz "obrazić"?')
        .setRequired(false)
    ),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const target = isSlash 
      ? interaction.options.getUser('użytkownik') || interaction.user
      : interaction.mentions.users.first() || interaction.author;

    const randomInsult = insults[Math.floor(Math.random() * insults.length)];

    const embed = new EmbedBuilder()
      .setColor('#95A5A6')
      .setTitle('💢 Friendly Insult')
      .setDescription(`${target}, ${randomInsult}`)
      .setFooter({ text: 'To tylko żart! Nie obrażaj się naprawdę! 😄' })
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
