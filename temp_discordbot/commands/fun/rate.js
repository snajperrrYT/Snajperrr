const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rate')
    .setDescription('Oceń coś w skali 1-10! ⭐')
    .addStringOption(option =>
      option.setName('rzecz')
        .setDescription('Co chcesz ocenić?')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const thing = isSlash ? interaction.options.getString('rzecz') : interaction.content.split(' ').slice(1).join(' ');

    if (!thing) {
      const msg = '❌ Musisz podać co chcesz ocenić!';
      return isSlash ? await interaction.reply(msg) : interaction.reply(msg);
    }

    const hash = thing.toLowerCase().split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const rating = (Math.abs(hash) % 10) + 1;

    const stars = '⭐'.repeat(rating) + '☆'.repeat(10 - rating);
    
    let comment;
    if (rating === 10) {
      comment = 'Absolutnie perfekcyjne! 🏆';
    } else if (rating >= 8) {
      comment = 'Naprawdę świetne! 🎉';
    } else if (rating >= 6) {
      comment = 'Całkiem dobre! 👍';
    } else if (rating >= 4) {
      comment = 'Meh, średnio... 😐';
    } else if (rating >= 2) {
      comment = 'Nie najlepiej... 😕';
    } else {
      comment = 'Okropne! 💀';
    }

    const percentage = rating * 10;
    const barLength = 20;
    const filledLength = Math.floor(barLength * rating / 10);
    const emptyLength = barLength - filledLength;
    const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);

    const embed = new EmbedBuilder()
      .setColor(rating >= 7 ? '#00FF00' : rating >= 4 ? '#FFD700' : '#FF0000')
      .setTitle('⭐ Ocena')
      .setDescription(`**${thing}**\n\n${stars}\n\n**Ocena:** ${rating}/10 (${percentage}%)\n${progressBar}\n\n${comment}`)
      .setFooter({ text: 'Matematycznie wyliczone! 🤓' })
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
