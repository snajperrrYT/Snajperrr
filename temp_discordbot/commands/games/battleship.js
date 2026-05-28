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
    .setName('battleship')
    .setDescription('Zagraj w statki! 🚢')
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

    const gridSize = 5;
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill('🌊'));
    
    const ships = 3;
    const shipPositions = new Set();
    
    while (shipPositions.size < ships) {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      shipPositions.add(`${row},${col}`);
    }

    const shots = 5;
    let hits = 0;
    
    for (let i = 0; i < shots; i++) {
      const row = Math.floor(Math.random() * gridSize);
      const col = Math.floor(Math.random() * gridSize);
      
      if (shipPositions.has(`${row},${col}`)) {
        grid[row][col] = '💥';
        hits++;
      } else {
        grid[row][col] = '❌';
      }
    }

    shipPositions.forEach(pos => {
      const [row, col] = pos.split(',').map(Number);
      if (grid[row][col] === '🌊') {
        grid[row][col] = '🚢';
      }
    });

    let winAmount = 0;
    let result = '';
    
    if (hits === 3) {
      winAmount = bet * 10;
      result = '🏆 Zatopiłeś wszystkie statki!';
    } else if (hits === 2) {
      winAmount = bet * 4;
      result = '🎯 Dwa trafienia!';
    } else if (hits === 1) {
      winAmount = bet * 2;
      result = '💥 Jedno trafienie!';
    } else {
      winAmount = -bet;
      result = '😢 Pudło! Żadnych trafień!';
    }

    economy[userId].balance += winAmount;
    saveEconomy(economy);

    const gridDisplay = grid.map((row, i) => `${i+1} ${row.join('')}`).join('\n');
    const header = '  1️⃣2️⃣3️⃣4️⃣5️⃣';

    const embed = new EmbedBuilder()
      .setColor(winAmount > 0 ? '#00FF00' : '#FF0000')
      .setTitle('🚢 Statki')
      .setDescription(`${header}\n${gridDisplay}\n\n**Trafienia:** ${hits}/${ships}\n${result}\n\n💥 Trafiony | ❌ Pudło | 🚢 Statek`)
      .addFields(
        { name: '💰 Stawka', value: `${bet} 🪙`, inline: true },
        { name: winAmount > 0 ? '✅ Wygrana' : '❌ Strata', value: `${Math.abs(winAmount)} 🪙`, inline: true },
        { name: '💼 Saldo', value: `${economy[userId].balance} 🪙`, inline: true }
      )
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
