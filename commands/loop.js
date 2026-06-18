import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle loop mode'),
    
  async execute(interaction) {
    const queue = useQueue(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: '❌ Yahan koi gaana nahi chal raha.', flags: 64 });
    }
    
    // 0 = Off, 1 = Track, 2 = Queue, 3 = Autoplay
    if (queue.repeatMode === 0) {
      queue.setRepeatMode(1);
      return interaction.reply('🔁 Loop mode ON - Yeh gaana repeat hota rahega!');
    } else {
      queue.setRepeatMode(0);
      return interaction.reply('🔁 Loop mode OFF');
    }
  }
};
