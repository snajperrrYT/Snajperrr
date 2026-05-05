import { Client, GatewayIntentBits } from 'discord.js';
import { Player } from 'discord-player';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

async function run() {
  const player = new Player(client);
  await player.extractors.loadDefault();
  try {
    const results = await player.search("Never gonna give you up", { searchEngine: "youtube" });
    console.log("YouTube:", results.hasTracks(), results.tracks[0]?.title);
  } catch(e) {
    console.error("YouTube Error", e);
  }

  try {
    const results = await player.search("Never gonna give you up", { searchEngine: "auto" });
    console.log("Auto:", results.hasTracks(), results.tracks[0]?.title);
  } catch(e) {
    console.error("Auto Error", e);
  }
  process.exit(0);
}

run();
