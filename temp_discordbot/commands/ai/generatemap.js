const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('generatemap')
    .setDescription('Wygeneruj mapę do gry za pomocą AI')
    .addStringOption(option =>
      option.setName('typ')
        .setDescription('Typ mapy')
        .setRequired(true)
        .addChoices(
          { name: '2D Platformówka', value: '2d_platformer' },
          { name: 'Top-Down RPG', value: 'topdown_rpg' },
          { name: 'Labirynt', value: 'maze' },
          { name: 'Dungeon', value: 'dungeon' },
          { name: 'Minecraft Budowla', value: 'minecraft_build' }
        )
    )
    .addStringOption(option =>
      option.setName('opis')
        .setDescription('Opisz czego chcesz (np. "zamek na wzgórzu", "futurystyczne miasto")')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('rozmiar')
        .setDescription('Rozmiar mapy')
        .setRequired(false)
        .addChoices(
          { name: 'Mały (32x32)', value: 'small' },
          { name: 'Średni (64x64)', value: 'medium' },
          { name: 'Duży (128x128)', value: 'large' }
        )
    ),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    if (!process.env.OPENAI_API_KEY) {
      const msg = '❌ Funkcja AI nie jest skonfigurowana! Brak klucza OpenAI API.';
      return isSlash ? await interaction.reply(msg) : interaction.reply(msg);
    }

    const mapType = isSlash ? interaction.options.getString('typ') : '2d_platformer';
    const description = isSlash ? interaction.options.getString('opis') : interaction.content.split(' ').slice(1).join(' ');
    const size = isSlash ? (interaction.options.getString('rozmiar') || 'medium') : 'medium';

    if (!description) {
      const msg = '❌ Musisz podać opis mapy!';
      return isSlash ? await interaction.reply(msg) : interaction.reply(msg);
    }

    if (isSlash) {
      await interaction.deferReply();
    } else {
      await interaction.reply('🤖 Generuję mapę za pomocą AI... To może potrwać chwilę...');
    }

    try {
      const sizeDescriptions = {
        small: '32x32 tiles',
        medium: '64x64 tiles',
        large: '128x128 tiles'
      };

      const typeDescriptions = {
        '2d_platformer': 'a 2D platformer game level with platforms, obstacles, and collectibles',
        'topdown_rpg': 'a top-down RPG map with towns, forests, mountains, and dungeons',
        'maze': 'a challenging maze with multiple paths and dead ends',
        'dungeon': 'a dungeon map with rooms, corridors, traps, and treasure',
        'minecraft_build': 'a Minecraft build design with blocks and structure'
      };

      const prompt = `Generate a detailed game map design for ${typeDescriptions[mapType]}.

Description: ${description}
Size: ${sizeDescriptions[size]}

Provide:
1. ASCII art representation of the map layout
2. Legend explaining symbols used
3. Detailed description of each area
4. Gameplay suggestions
5. Recommended tile/block types

Format the response in a clear, structured way with sections.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional game level designer. Create detailed, playable game maps with clear layouts and creative designs."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      });

      const mapDesign = completion.choices[0].message.content;

      const sanitizedDesc = description.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30);
      const fileName = `map_${sanitizedDesc}_${Date.now()}.txt`;
      const filePath = path.join(__dirname, '..', '..', 'downloads', fileName);
      fs.writeFileSync(filePath, mapDesign);

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🗺️ Wygenerowana Mapa')
        .setDescription(`**Typ:** ${typeDescriptions[mapType]}\n**Opis:** ${description}\n**Rozmiar:** ${sizeDescriptions[size]}`)
        .addFields(
          { name: '📊 Model AI', value: 'GPT-4', inline: true },
          { name: '📁 Plik', value: fileName, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Wygenerowano przez AI' });

      const preview = mapDesign.substring(0, 1500);
      if (preview.length < mapDesign.length) {
        embed.addFields({ name: '👀 Podgląd', value: `\`\`\`\n${preview}\n...\n\`\`\`` });
      } else {
        embed.addFields({ name: '👀 Podgląd', value: `\`\`\`\n${preview}\n\`\`\`` });
      }

      const attachment = new AttachmentBuilder(filePath, { name: fileName });

      if (isSlash) {
        await interaction.editReply({ embeds: [embed], files: [attachment] });
      } else {
        await interaction.channel.send({ embeds: [embed], files: [attachment] });
      }

      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 60000);

    } catch (error) {
      console.error('Generate map error:', error);
      
      let errorMsg = '❌ Wystąpił błąd podczas generowania mapy!';
      if (error.status === 401) {
        errorMsg = '❌ Nieprawidłowy klucz OpenAI API!';
      } else if (error.status === 429) {
        errorMsg = '❌ Przekroczono limit zapytań do OpenAI. Spróbuj za chwilę.';
      } else if (error.message) {
        errorMsg = `❌ Błąd: ${error.message}`;
      }

      if (isSlash) {
        if (interaction.deferred) {
          await interaction.editReply(errorMsg);
        } else {
          await interaction.reply(errorMsg);
        }
      } else {
        await interaction.channel.send(errorMsg);
      }
    }
  },
};
