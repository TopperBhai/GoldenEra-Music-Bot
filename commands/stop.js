import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getQueue } from '../utils/musicPlayer.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),
    
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    
    if (!queue.isPlaying && !queue.connection) {
      return interaction.reply({
        content: '❌ Abhi koi gaana nahi chal raha hai.',
        ephemeral: true
      });
    }

    queue.stop();

    const embed = new EmbedBuilder()
      .setColor('#F44336')
      .setDescription('⏹️ Music band ho gayi… phir milenge yaadon ke saath. ❤️')
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
