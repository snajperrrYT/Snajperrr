const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const dadJokes = [
  { q: 'Dlaczego szkielet nie poszedł na imprezę?', a: 'Bo nie miał ciała, z kim iść!' },
  { q: 'Co mówi ser do swojego odbicia w lustrze?', a: 'Hallo-umi!' },
  { q: 'Dlaczego rowery nie mogą stać same?', a: 'Bo są dwu-zmęczone!' },
  { q: 'Jak nazywa się niedźwiedź bez zębów?', a: 'Gummi bear!' },
  { q: 'Co robi pszczoła w siłowni?', a: 'Bzz-upsy!' },
  { q: 'Dlaczego kawa poszła na policję?', a: 'Została zrabowana!' },
  { q: 'Co mówi ocean do plaży?', a: 'Nic, tylko macha!' },
  { q: 'Dlaczego pingwiny są dobrymi detektywami?', a: 'Zawsze mają na sobie smoking!' },
  { q: 'Co jadają matematycy na śniadanie?', a: 'Kwadraty!' },
  { q: 'Dlaczego komputer poszedł do lekarza?', a: 'Bo złapał wirusa!' },
  { q: 'Jak nazywa się fałszywy makaron?', a: 'Im-pasta!' },
  { q: 'Co robi atomka gdy jest smutna?', a: 'Rozpada się!' },
  { q: 'Dlaczego nie możesz zaufać atomowi?', a: 'Bo składają się z wszystkiego!' },
  { q: 'Co ma cztery koła i muchy?', a: 'Śmieciarka!' },
  { q: 'Dlaczego księżyc nie potrzebuje jedzenia?', a: 'Bo jest już pełny!' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dadjoke')
    .setDescription('Żart taty! 👨'),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    const randomJoke = dadJokes[Math.floor(Math.random() * dadJokes.length)];

    const embed = new EmbedBuilder()
      .setColor('#F39C12')
      .setTitle('👨 Żart Taty')
      .addFields(
        { name: '❓', value: randomJoke.q },
        { name: '😄', value: randomJoke.a }
      )
      .setFooter({ text: 'Śmieszne? Nie? Cóż...' })
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
