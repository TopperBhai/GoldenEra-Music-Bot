import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getQueue } from '../utils/musicPlayer.js';

export default {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip to the next song'),
    
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    
    if (!queue.isPlaying) {
      return interaction.reply({
        content: '❌ Abhi koi gaana nahi chal raha hai.',
        ephemeral: true
      });
    }

    if (queue.skip()) {
      const embed = new EmbedBuilder()
        .setColor('#2196F3')
        .setDescription('⏭️ Chalo agle gaane par chalte hain…')
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    } else {
      return interaction.reply({
        content: '❌ Gaana skip nahi ho saka.',
        ephemeral: true
      });
    }
  }
};
