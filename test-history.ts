import { GuildQueue } from "discord-player";

function test(queue: GuildQueue) {
  queue.history.tracks.toArray().forEach(track => {
    console.log(track.title);
  });
}
