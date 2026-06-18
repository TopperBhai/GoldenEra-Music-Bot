import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),
    
  async execute(interaction) {
    const queue = useQueue(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: '❌ Yahan koi gaana nahi chal raha.', flags: 64 });
    }
    
    queue.delete();
    return interaction.reply('⏹️ Music band ho gayi aur queue clear ho gaya.');
  }
};
