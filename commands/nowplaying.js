import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getQueue } from '../utils/musicPlayer.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show current song details'),
    
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    
    if (!queue.isPlaying || !queue.currentSong) {
      return interaction.reply({
        content: '❌ Abhi koi gaana nahi chal raha hai.',
        ephemeral: true
      });
    }

    const song = queue.currentSong;
    const queueLength = queue.queue.length;
    
    const embed = new EmbedBuilder()
      .setColor('#00BCD4')
      .setTitle('🎶 Now Playing')
      .setDescription(`**${song.title}**`)
      .addFields(
        { name: '🎤 Artist', value: song.artist, inline: true },
        { name: '📅 Year', value: song.year.toString(), inline: true },
        { name: '📋 Queue', value: `${queueLength} songs`, inline: true }
      )
      .setFooter({ text: queue.isPaused ? '⏸️ Paused' : '▶️ Playing' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};
