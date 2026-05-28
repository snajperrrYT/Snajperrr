const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blackjack')
    .setDescription('Gra w blackjacka'),
  async execute(interaction, args, client) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const author = isSlash ? interaction.user : interaction.author;
    const channel = isSlash ? interaction.channel : interaction.channel;
    
    const gameId = `bj_${author.id}`;
    
    if (client.games.has(gameId)) {
      const message = '❌ Masz już aktywną grę w blackjacka!';
      if (isSlash) {
        return await interaction.reply(message);
      } else {
        return interaction.reply(message);
      }
    }

    const deck = createDeck();
    const playerHand = [drawCard(deck), drawCard(deck)];
    const dealerHand = [drawCard(deck)];

    client.games.set(gameId, { deck, playerHand, dealerHand });

    const playerValue = calculateHand(playerHand);
    const gameMessage = `🃏 **Blackjack!**\n\nTwoje karty: ${playerHand.join(', ')} (${playerValue})\nKarta krupiera: ${dealerHand[0]}\n\nWpisz \`hit\` aby dobrać kartę lub \`stand\` aby się zatrzymać!`;
    
    if (isSlash) {
      await interaction.reply(gameMessage);
    } else {
      channel.send(gameMessage);
    }

    const filter = m => m.author.id === author.id && ['hit', 'stand', 'dobierz', 'pas'].includes(m.content.toLowerCase());
    const collector = channel.createMessageCollector({ filter, time: 60000 });

    collector.on('collect', async m => {
      const game = client.games.get(gameId);
      const cmd = m.content.toLowerCase();

      if (cmd === 'hit' || cmd === 'dobierz') {
        game.playerHand.push(drawCard(game.deck));
        const value = calculateHand(game.playerHand);

        if (value > 21) {
          m.reply(`🃏 Twoje karty: ${game.playerHand.join(', ')} (${value})\n💥 Przegrałeś! Przekroczyłeś 21!`);
          client.games.delete(gameId);
          collector.stop();
        } else {
          m.channel.send(`🃏 Twoje karty: ${game.playerHand.join(', ')} (${value})\n\nWpisz \`hit\` lub \`stand\`!`);
        }
      } else {
        while (calculateHand(game.dealerHand) < 17) {
          game.dealerHand.push(drawCard(game.deck));
        }

        const playerValue = calculateHand(game.playerHand);
        const dealerValue = calculateHand(game.dealerHand);

        let result;
        if (dealerValue > 21 || playerValue > dealerValue) {
          result = '🎉 Wygrałeś!';
        } else if (playerValue === dealerValue) {
          result = '🤝 Remis!';
        } else {
          result = '😢 Przegrałeś!';
        }

        m.reply(`🃏 Twoje karty: ${game.playerHand.join(', ')} (${playerValue})\n🃏 Karty krupiera: ${game.dealerHand.join(', ')} (${dealerValue})\n\n${result}`);
        client.games.delete(gameId);
        collector.stop();
      }
    });

    collector.on('end', () => {
      if (client.games.has(gameId)) {
        channel.send('⏱️ Gra zakończona - upłynął czas!');
        client.games.delete(gameId);
      }
    });
  },
};

function createDeck() {
  const suits = ['♠️', '♥️', '♦️', '♣️'];
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push(value + suit);
    }
  }
  return deck.sort(() => Math.random() - 0.5);
}

function drawCard(deck) {
  return deck.pop();
}

function calculateHand(hand) {
  let value = 0;
  let aces = 0;

  for (const card of hand) {
    const cardValue = card.slice(0, -1);
    if (cardValue === 'A') {
      aces++;
      value += 11;
    } else if (['J', 'Q', 'K'].includes(cardValue)) {
      value += 10;
    } else {
      value += parseInt(cardValue);
    }
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}
