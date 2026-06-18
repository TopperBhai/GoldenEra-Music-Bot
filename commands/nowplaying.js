import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show current song details'),
    
  async execute(interaction) {
    const player = interaction.client.manager.players.get(interaction.guildId);
    
    if (!player || !player.queue.current) {
      return interaction.reply({
        content: '❌ Abhi koi gaana nahi chal raha hai.',
        ephemeral: true
      });
    }

    const song = player.queue.current;
    const queueLength = player.queue.length;
    
    const embed = new EmbedBuilder()
      .setColor('#00BCD4')
      .setTitle('🎶 Now Playing')
      .setDescription(`**${song.title}**`)
      .addFields(
        { name: '🎤 Artist', value: song.author || 'Unknown', inline: true },
        { name: '📋 Queue', value: `${queueLength} songs`, inline: true }
      )
      .setFooter({ text: player.paused ? '⏸️ Paused' : '▶️ Playing' })
      .setTimestamp();

    if (song.thumbnail) {
      embed.setThumbnail(song.thumbnail);
    }

    return interaction.reply({ embeds: [embed] });
  }
};
