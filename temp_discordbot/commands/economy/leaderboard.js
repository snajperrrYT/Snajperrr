const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '../../data/economy.json');

function getEconomy() {
  if (!fs.existsSync(economyPath)) {
    fs.writeFileSync(economyPath, '{}');
  }
  return JSON.parse(fs.readFileSync(economyPath, 'utf8'));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Ranking najbogatszych użytkowników'),
  async execute(interaction, args, client) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const author = isSlash ? interaction.user : interaction.author;
    
    const economy = getEconomy();
    
    const sorted = Object.entries(economy)
      .map(([userId, data]) => ({
        userId,
        total: (data.balance || 0) + (data.bank || 0)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    if (sorted.length === 0) {
      const message = '❌ Brak danych ekonomicznych!';
      if (isSlash) {
        return await interaction.reply(message);
      } else {
        return interaction.reply(message);
      }
    }

    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 Ranking Najbogatszych')
      .setDescription('Top 10 użytkowników z największą ilością pieniędzy')
      .setTimestamp();

    const leaderboardText = await Promise.all(
      sorted.map(async (entry, index) => {
        try {
          const user = await client.users.fetch(entry.userId);
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
          return `${medal} **${user.username}** - ${entry.total} 🪙`;
        } catch {
          return `${index + 1}. Nieznany użytkownik - ${entry.total} 🪙`;
        }
      })
    );

    embed.setDescription(leaderboardText.join('\n'));

    const userRank = sorted.findIndex(entry => entry.userId === author.id);
    if (userRank !== -1) {
      embed.setFooter({ text: `Twoja pozycja: #${userRank + 1}` });
    }

    if (isSlash) {
      await interaction.reply({ embeds: [embed] });
    } else {
      interaction.reply({ embeds: [embed] });
    }
  },
};
