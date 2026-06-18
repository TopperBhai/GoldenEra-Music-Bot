import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getQueue } from '../utils/musicPlayer.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song'),
    
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    
    if (!queue.isPlaying) {
      return interaction.reply({
        content: '❌ Abhi koi gaana nahi chal raha hai.',
        ephemeral: true
      });
    }

    if (queue.resume()) {
      const embed = new EmbedBuilder()
        .setColor('#4CAF50')
        .setDescription('▶️ Gaana phir se chalu… yaadon ka safar jari.')
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } else {
      return interaction.reply({
        content: '❌ Gaana pehle se hi chal raha hai.',
        ephemeral: true
      });
    }
  }
};
