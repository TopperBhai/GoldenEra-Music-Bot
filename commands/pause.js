import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getQueue } from '../utils/musicPlayer.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song'),
    
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    
    if (!queue.isPlaying) {
      return interaction.reply({
        content: '❌ Abhi koi gaana nahi chal raha hai.',
        ephemeral: true
      });
    }

    if (queue.pause()) {
      const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setDescription('⏸️ Gaana roka gaya… thoda break le lo.')
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } else {
      return interaction.reply({
        content: '❌ Gaana pehle se hi ruka hua hai.',
        ephemeral: true
      });
    }
  }
};
