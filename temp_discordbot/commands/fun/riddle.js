const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const riddles = [
  { q: 'Co ma szyję, ale nie ma głowy?', a: 'Butelka' },
  { q: 'Jestem pełen dziur, ale trzymam wodę. Co to?', a: 'Gąbka' },
  { q: 'Im więcej mnie zabierasz, tym większy się staję. Czym jestem?', a: 'Dziura' },
  { q: 'Co można zobaczyć raz w minucie, dwa razy w momencie, ale nigdy w tysiąc lat?', a: 'Litera M' },
  { q: 'Biegnę, ale nie mam nóg. Co to?', a: 'Rzeka' },
  { q: 'Co ma ręce, ale nie może klaskać?', a: 'Zegar' },
  { q: 'Co zawsze przed tobą, ale nie można tego zobaczyć?', a: 'Przyszłość' },
  { q: 'Czym więcej dajesz, tym więcej zostawiasz za sobą?', a: 'Kroki' },
  { q: 'Co można złamać bez dotykania?', a: 'Obietnica' },
  { q: 'Mam miasta, ale nie ludzi. Mam góry, ale nie drzewa. Czym jestem?', a: 'Mapa' },
  { q: 'Jestem lekki jak piórko, ale najsilniejszy nie utrzyma mnie długo. Czym jestem?', a: 'Oddech' },
  { q: 'Co idzie w górę, ale nigdy nie spada?', a: 'Wiek' },
  { q: 'Rosnę w dół, gdy rosę w górę. Czym jestem?', a: 'Gęś' },
  { q: 'Co ma wiele kluczy, ale nie otwiera żadnych drzwi?', a: 'Klawiatura/Fortepian' },
  { q: 'Co kończy wszystko i znajduje się na końcu?', a: 'Litera G' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('riddle')
    .setDescription('Spróbuj rozwiązać zagadkę! 🤔'),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    const randomRiddle = riddles[Math.floor(Math.random() * riddles.length)];

    const embed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle('🤔 Zagadka')
      .addFields(
        { name: '❓ Pytanie', value: randomRiddle.q },
        { name: '💡 Odpowiedź', value: `||${randomRiddle.a}||` }
      )
      .setFooter({ text: 'Kliknij na odpowiedź, aby ją zobaczyć!' })
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
