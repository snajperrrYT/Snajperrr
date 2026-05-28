const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const questions = [
  { a: 'Móc latać', b: 'Być niewidzialnym' },
  { a: 'Czytać myśli', b: 'Przewidywać przyszłość' },
  { a: 'Żyć bez muzyki', b: 'Żyć bez telewizji' },
  { a: 'Mieć super siłę', b: 'Mieć super szybkość' },
  { a: 'Podróżować w czasie do przeszłości', b: 'Podróżować w czasie do przyszłości' },
  { a: 'Mieszkać na plaży', b: 'Mieszkać w górach' },
  { a: 'Zawsze być za zimno', b: 'Zawsze być za gorąco' },
  { a: 'Nie spać nigdy', b: 'Spać cały czas' },
  { a: 'Być najbogatszym człowiekiem', b: 'Być najszczęśliwszym człowiekiem' },
  { a: 'Mieć możliwość teleportacji', b: 'Mieć możliwość kontroli czasu' },
  { a: 'Znać wszystkie języki świata', b: 'Znać każdy instrument muzyczny' },
  { a: 'Żyć bez internetu', b: 'Żyć bez klimatyzacji/ogrzewania' },
  { a: 'Mieć nieskończoną wiedzę', b: 'Mieć nieskończone bogactwo' },
  { a: 'Spotykać sławne osoby', b: 'Być sławnym' },
  { a: 'Móc rozmawiać ze zwierzętami', b: 'Móc mówić wszystkimi językami ludzkimi' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wouldyourather')
    .setDescription('Wolałbyś...? 🤷'),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

    const embed = new EmbedBuilder()
      .setColor('#E67E22')
      .setTitle('🤷 Wolałbyś...?')
      .setDescription(`**A)** ${randomQuestion.a}\n\n**ALBO**\n\n**B)** ${randomQuestion.b}`)
      .setFooter({ text: 'Zastanów się dobrze!' })
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
