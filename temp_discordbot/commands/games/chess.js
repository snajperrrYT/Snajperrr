const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const games = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chess')
    .setDescription('Zagraj w szachy! ♟️')
    .addUserOption(option =>
      option.setName('przeciwnik')
        .setDescription('Wybierz przeciwnika')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const player1 = interaction.user;
    const player2 = isSlash ? interaction.options.getUser('przeciwnik') : interaction.mentions.users.first();

    if (!player2) {
      const msg = '❌ Musisz oznaczyć przeciwnika!';
      return isSlash ? await interaction.reply(msg) : interaction.reply(msg);
    }

    if (player2.bot) {
      const msg = '❌ Nie możesz grać z botem!';
      return isSlash ? await interaction.reply(msg) : interaction.reply(msg);
    }

    if (player1.id === player2.id) {
      const msg = '❌ Nie możesz grać sam ze sobą!';
      return isSlash ? await interaction.reply(msg) : interaction.reply(msg);
    }

    const gameId = `${player1.id}-${player2.id}`;
    
    const board = [
      ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
      ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
      ['⬜', '⬛', '⬜', '⬛', '⬜', '⬛', '⬜', '⬛'],
      ['⬛', '⬜', '⬛', '⬜', '⬛', '⬜', '⬛', '⬜'],
      ['⬜', '⬛', '⬜', '⬛', '⬜', '⬛', '⬜', '⬛'],
      ['⬛', '⬜', '⬛', '⬜', '⬛', '⬜', '⬛', '⬜'],
      ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
      ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
    ];
    
    games.set(gameId, {
      board,
      currentPlayer: player1.id,
      player1: player1.id,
      player2: player2.id,
      moves: []
    });

    const boardDisplay = board.map((row, i) => `${8-i} ${row.join('')}`).join('\n');
    const letters = '  🇦🇧🇨🇩🇪🇫🇬🇭';

    const embed = new EmbedBuilder()
      .setColor('#8B4513')
      .setTitle('♟️ Szachy')
      .setDescription(`**Biały:** ${player1.username}\n**Czarny:** ${player2.username}\n\n${boardDisplay}\n${letters}\n\n**Kolej:** ${player1.username} (Biały)\n\nWpisz ruch w notacji: np. 'e2 e4'`)
      .setFooter({ text: 'Uproszczona wersja - gra wygasa po 10 minutach' })
      .setTimestamp();

    setTimeout(() => {
      if (games.has(gameId)) {
        games.delete(gameId);
      }
    }, 600000);

    const msg = isSlash ? await interaction.reply({ embeds: [embed], fetchReply: true }) : await interaction.reply({ embeds: [embed] });
    
    const filter = m => {
      const game = games.get(gameId);
      if (!game) return false;
      return (m.author.id === game.currentPlayer) && /^[a-h][1-8]\s[a-h][1-8]$/i.test(m.content);
    };

    const collector = msg.channel.createMessageCollector({ filter, time: 600000 });

    collector.on('collect', async m => {
      const game = games.get(gameId);
      if (!game) return;

      const [from, to] = m.content.toLowerCase().split(' ');
      const fromCol = from.charCodeAt(0) - 97;
      const fromRow = 8 - parseInt(from[1]);
      const toCol = to.charCodeAt(0) - 97;
      const toRow = 8 - parseInt(to[1]);

      const piece = game.board[fromRow][fromCol];
      
      game.board[toRow][toCol] = piece;
      game.board[fromRow][fromCol] = (fromRow + fromCol) % 2 === 0 ? '⬜' : '⬛';
      
      game.moves.push(m.content);
      game.currentPlayer = game.currentPlayer === game.player1 ? game.player2 : game.player1;
      
      const currentUser = game.currentPlayer === game.player1 ? player1 : player2;
      const color = game.currentPlayer === game.player1 ? 'Biały' : 'Czarny';
      
      const boardDisplay = game.board.map((row, i) => `${8-i} ${row.join('')}`).join('\n');
      
      const updateEmbed = new EmbedBuilder()
        .setColor('#8B4513')
        .setTitle('♟️ Szachy')
        .setDescription(`**Biały:** ${player1.username}\n**Czarny:** ${player2.username}\n\n${boardDisplay}\n${letters}\n\n**Ostatni ruch:** ${m.content}\n**Kolej:** ${currentUser.username} (${color})\n\n**Ruchy:** ${game.moves.length}`)
        .setTimestamp();
      
      await m.channel.send({ embeds: [updateEmbed] });
    });

    collector.on('end', () => {
      if (games.has(gameId)) {
        games.delete(gameId);
      }
    });
  },
};
