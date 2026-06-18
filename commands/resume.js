import { SlashCommandBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song'),
    
  async execute(interaction) {
    const queue = useQueue(interaction.guildId);
    if (!queue) {
      return interaction.reply({ content: '❌ Yahan koi gaana nahi chal raha.', flags: 64 });
    }
    
    if (!queue.node.isPaused()) {
      return interaction.reply({ content: '❌ Gaana pehle se hi chal raha hai.', flags: 64 });
    }
    
    queue.node.resume();
    return interaction.reply('▶️ Gaana phir se chalu.');
  }
};
