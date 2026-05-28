const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const economyPath = path.join(__dirname, '../../data/economy.json');

function getEconomy() {
  if (!fs.existsSync(economyPath)) {
    fs.writeFileSync(economyPath, '{}');
  }
  return JSON.parse(fs.readFileSync(economyPath, 'utf8'));
}

function saveEconomy(economy) {
  fs.writeFileSync(economyPath, JSON.stringify(economy, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('bingo')
    .setDescription('Zagraj w bingo! 🎱')
    .addIntegerOption(option =>
      option.setName('stawka')
        .setDescription('Kwota zakładu')
        .setRequired(true)
        .setMinValue(30)
    ),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    const userId = interaction.user.id;
    const bet = isSlash ? interaction.options.getInteger('stawka') : parseInt(interaction.content.split(' ')[1]) || 30;

    if (bet < 30) {
      const msg = '❌ Minimalna stawka to 30 monet!';
      return isSlash ? await interaction.reply(msg) : interaction.reply(msg);
    }

    const economy = getEconomy();
    
    if (!economy[userId]) {
      economy[userId] = { balance: 100, bank: 0, inventory: [] };
    }

    if (economy[userId].balance < bet) {
      const msg = `❌ Nie masz wystarczająco monet! Masz: ${economy[userId].balance} 🪙`;
      return isSlash ? await interaction.reply(msg) : interaction.reply(msg);
    }

    const playerCard = Array.from({length: 5}, () => 
      Array.from({length: 5}, () => Math.floor(Math.random() * 75) + 1)
    );
    
    const drawnNumbers = Array.from({length: 20}, () => Math.floor(Math.random() * 75) + 1);
    
    let markedCount = 0;
    let lines = 0;
    
    for (let i = 0; i < 5; i++) {
      let rowMarked = 0;
      let colMarked = 0;
      
      for (let j = 0; j < 5; j++) {
        if (drawnNumbers.includes(playerCard[i][j])) {
          markedCount++;
          rowMarked++;
        }
        if (drawnNumbers.includes(playerCard[j][i])) {
          colMarked++;
        }
      }
      
      if (rowMarked === 5) lines++;
      if (colMarked === 5) lines++;
    }

    let winAmount = 0;
    let result = '';
    
    if (lines >= 2) {
      winAmount = bet * 15;
      result = '🏆 BINGO! Pełna karta!';
    } else if (lines === 1) {
      winAmount = bet * 5;
      result = '🎉 LINIA! Świetna gra!';
    } else if (markedCount >= 15) {
      winAmount = bet * 2;
      result = '✨ Dużo trafień!';
    } else if (markedCount >= 10) {
      winAmount = bet;
      result = '👍 Zwrot stawki!';
    } else {
      winAmount = -bet;
      result = '😢 Za mało trafień!';
    }

    economy[userId].balance += winAmount;
    saveEconomy(economy);

    const embed = new EmbedBuilder()
      .setColor(winAmount > 0 ? '#00FF00' : '#FF0000')
      .setTitle('🎱 Bingo')
      .setDescription(`**Trafione liczby:** ${markedCount}/25\n**Pełne linie:** ${lines}\n\n${result}`)
      .addFields(
        { name: '💰 Stawka', value: `${bet} 🪙`, inline: true },
        { name: winAmount > 0 ? '✅ Wygrana' : '❌ Strata', value: `${Math.abs(winAmount)} 🪙`, inline: true },
        { name: '💼 Saldo', value: `${economy[userId].balance} 🪙`, inline: true }
      )
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
