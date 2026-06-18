import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { useQueue } from 'discord-player';

export default {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show current song details'),
    
  async execute(interaction) {
    const queue = useQueue(interaction.guildId);
    
    if (!queue || !queue.currentTrack) {
      return interaction.reply({
        content: '❌ Abhi koi gaana nahi chal raha hai.',
        flags: 64
      });
    }

    const song = queue.currentTrack;
    const queueLength = queue.tracks.size;
    
    const embed = new EmbedBuilder()
      .setColor('#00BCD4')
      .setTitle('🎶 Now Playing')
      .setDescription(`**${song.title}**`)
      .addFields(
        { name: '🎤 Artist', value: song.author || 'Unknown', inline: true },
        { name: '📋 Queue', value: `${queueLength} songs`, inline: true }
      )
      .setFooter({ text: queue.node.isPaused() ? '⏸️ Paused' : `▶️ Playing • ${song.duration}` })
      .setTimestamp();

    if (song.thumbnail) {
      embed.setThumbnail(song.thumbnail);
    }

    return interaction.reply({ embeds: [embed] });
  }
};
