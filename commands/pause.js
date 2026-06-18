import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song'),
    
  async execute(interaction) {
    const queue = useQueue(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: '❌ Yahan koi gaana nahi chal raha.', flags: 64 });
    }
    
    if (queue.node.isPaused()) {
      return interaction.reply({ content: '❌ Gaana pehle se hi ruka hua hai.', flags: 64 });
    }
    
    queue.node.pause();
    return interaction.reply('⏸️ Gaana roka gaya.');
  }
};
