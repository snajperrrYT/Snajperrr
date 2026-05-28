const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const quotes = [
  { text: 'Bądź zmianą, którą chcesz zobaczyć w świecie.', author: 'Mahatma Gandhi' },
  { text: 'Jedynym sposobem na wykonanie świetnej pracy jest kochanie tego, co robisz.', author: 'Steve Jobs' },
  { text: 'Życie to 10% tego, co się dzieje, i 90% tego, jak na to reagujesz.', author: 'Charles R. Swindoll' },
  { text: 'Wyobraźnia jest ważniejsza niż wiedza.', author: 'Albert Einstein' },
  { text: 'Przyszłość należy do tych, którzy wierzą w piękno swoich marzeń.', author: 'Eleanor Roosevelt' },
  { text: 'Sukces to porażka po porażce bez utraty entuzjazmu.', author: 'Winston Churchill' },
  { text: 'Nie liczą się lata twojego życia, liczy się życie twoich lat.', author: 'Abraham Lincoln' },
  { text: 'Możesz, jeśli myślisz, że możesz.', author: 'Napoleon Hill' },
  { text: 'Najlepszy czas, by zasadzić drzewo, był 20 lat temu. Drugi najlepszy jest teraz.', author: 'Przysłowie chińskie' },
  { text: 'Droga do sukcesu jest zawsze w budowie.', author: 'Lily Tomlin' },
  { text: 'Nie bój się porażki, bój się tego, że nigdy nie spróbujesz.', author: 'Michael Jordan' },
  { text: 'Wierz w siebie i wszystko jest możliwe.', author: 'Nieznany' },
  { text: 'Jedyną niemożliwością jest to, czego nie spróbujesz.', author: 'Nieznany' },
  { text: 'Szczęście to nie przypadek, to wybór.', author: 'Jim Rohn' },
  { text: 'Każdy dzień to nowa szansa na zmianę swojego życia.', author: 'Nieznany' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Inspirujący cytat! 💭'),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('💭 Inspirujący Cytat')
      .setDescription(`*"${randomQuote.text}"*`)
      .setFooter({ text: `— ${randomQuote.author}` })
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
