const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const facts = [
  'Miód nigdy nie psuje się. Archeolodzy znaleźli 3000-letni miód w egipskich grobowcach, który nadal był jadalny!',
  'Ośmiornice mają trzy serca i niebieską krew.',
  'Banan to jagoda, a truskawka nie jest jagodą.',
  'Jesteś wyższy rano niż wieczorem. W ciągu dnia kręgosłup się ściska.',
  'Leniwce potrzebują dwóch tygodni na strawienie jedzenia.',
  'Wieża Eiffla może być wyższa o 15 cm w lecie z powodu rozszerzalności cieplnej.',
  'Rekiny istniały wcześniej niż drzewa.',
  'Fioletowe marchewki były pierwotnie bardziej popularne niż pomarańczowe.',
  'Koala śpi do 22 godzin dziennie.',
  'W ciągu życia produkujesz wystarczająco śliny, by wypełnić dwa baseny.',
  'Człowiek ma tyle samo włosów na ciele co szympans - są tylko cieńsze.',
  'Układ nerwowy może przekazywać sygnały z prędkością 430 km/h.',
  'Dinozaury żyły na każdym kontynencie, nawet na Antarktydzie.',
  'Jeden kubek gleby zawiera więcej organizmów niż ludzi na Ziemi.',
  'Złota rybka może odróżnić miliony kolorów, więcej niż człowiek.',
  'Błyskawica jest pięć razy gorętsza niż powierzchnia Słońca.',
  'Mózg zużywa 20% tlenu i kalorii ciała, mimo że waży tylko 2% masy ciała.',
  'Jeden milion sekund to około 11,5 dnia. Miliard sekund to prawie 32 lata.',
  'Twoje oczy widzą świat do góry nogami. Mózg odwraca obraz.',
  'Kości są mocniejsze niż stal - gram kości wytrzyma więcej niż gram stali.'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fact')
    .setDescription('Losowy ciekawy fakt! 📚'),
  
  async execute(interaction) {
    const isSlash = interaction.isChatInputCommand && interaction.isChatInputCommand();
    
    const randomFact = facts[Math.floor(Math.random() * facts.length)];

    const embed = new EmbedBuilder()
      .setColor('#4A90E2')
      .setTitle('📚 Ciekawy Fakt')
      .setDescription(randomFact)
      .setFooter({ text: 'Czy to wiedziałeś?' })
      .setTimestamp();

    isSlash ? await interaction.reply({ embeds: [embed] }) : interaction.reply({ embeds: [embed] });
  },
};
