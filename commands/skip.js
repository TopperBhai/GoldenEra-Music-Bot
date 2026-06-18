import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),
    
  async execute(interaction) {
    const queue = useQueue(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: '❌ Yahan koi gaana nahi chal raha.', flags: 64 });
    }
    
    queue.node.skip();
    return interaction.reply('⏭️ Agle gaane par…');
  }
};
