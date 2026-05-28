const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ship')
    .setDescription('Sprawdź kompatybilność dwóch osób! 💕')
    .addUserOption(option =>
      option.setName('osoba1')
        .setDescription('Pierwsza osoba')
        .setRequired(true)
    )
    .addUserOption(option =>
      option.setName('osoba2')
        .setDescription('Druga osoba')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    let person1, person2;
    
    if (isSlash) {
      person1 = interaction.options.getUser('osoba1');
      person2 = interaction.options.getUser('osoba2');
    } else {
      const mentions = interaction.mentions.users;
      if (mentions.size < 2) {
        return interaction.reply('❌ Musisz oznaczyć dwie osoby!');
      }
      [person1, person2] = Array.from(mentions.values());
    }

    if (!person1 || !person2) {
      const msg = '❌ Musisz wybrać dwie osoby!';
      return isSlash ? await interaction.reply(msg) : interaction.reply(msg);
    }

    const hash = (person1.id + person2.id).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const percentage = Math.abs(hash) % 101;

    let emoji, message, color;
    
    if (percentage >= 90) {
      emoji = '💖';
      message = 'Perfekcyjne dopasowanie! Małżeństwo od razu!';
      color = '#FF1493';
    } else if (percentage >= 70) {
      emoji = '💕';
      message = 'Świetna para! Duże szanse na sukces!';
      color = '#FF69B4';
    } else if (percentage >= 50) {
      emoji = '💗';
      message = 'Niezła para! Jest potencjał!';
      color = '#FFB6C1';
    } else if (percentage >= 30) {
      emoji = '💛';
      message = 'Meh, mogło być lepiej...';
      color = '#FFD700';
    } else if (percentage >= 10) {
      emoji = '💔';
      message = 'Niezbyt dobrze... lepiej być przyjaciółmi.';
      color = '#FFA500';
    } else {
      emoji = '💀';
      message = 'To katastrofa! Trzymajcie się od siebie z daleka!';
      color = '#8B0000';
    }

    const shipName = person1.username.slice(0, Math.ceil(person1.username.length / 2)) + 
                     person2.username.slice(Math.floor(person2.username.length / 2));

    const hearts = '❤️'.repeat(Math.floor(percentage / 10)) + '🤍'.repeat(10 - Math.floor(percentage / 10));

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle('💕 Ship Meter')
      .setDescription(`**${person1.username}** ${emoji} **${person2.username}**\n\n**Ship Name:** ${shipName}\n\n**Kompatybilność:** ${percentage}%\n${hearts}\n\n${message}`)
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
