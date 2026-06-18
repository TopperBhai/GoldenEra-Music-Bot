import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getAllSongs } from '../data/playlists.js';

export default {
  data: new SlashCommandBuilder()
    .setName('surprise')
    .setDescription('Play a legendary random old song'),
    
  async execute(interaction) {
    const member = interaction.member;
    if (!member.voice.channel) {
      return interaction.reply({
        content: '❌ Pehle voice channel mein aao… phir gaana sunenge 🎵',
        flags: 64
      });
    }

    await interaction.deferReply();

    try {
      const allSongs = getAllSongs();
      const song = allSongs[Math.floor(Math.random() * allSongs.length)];
      const searchQuery = `${song.title} ${song.artist}`;

      const player = await interaction.client.manager.createPlayer({
        guildId: interaction.guildId,
        textId: interaction.channelId,
        voiceId: member.voice.channel.id,
        volume: 100,
        deaf: true,
        mute: false
      });

      // Try YouTube Music first, then YouTube, then SoundCloud
      let res = await interaction.client.manager.search(`ytmsearch:${searchQuery}`, { requester: interaction.user });
      if (!res?.tracks?.length) {
        res = await interaction.client.manager.search(`ytsearch:${searchQuery}`, { requester: interaction.user });
      }
      if (!res?.tracks?.length) {
        res = await interaction.client.manager.search(`scsearch:${searchQuery}`, { requester: interaction.user });
      }

      if (!res?.tracks?.length) {
        return interaction.editReply('❌ Surprise song nahi mila! Dobara try karo.');
      }

      const track = res.tracks[0];
      player.queue.add(track);

      if (!player.playing && !player.paused) {
        player.play();
      }

      const embed = new EmbedBuilder()
        .setColor('#9C27B0')
        .setTitle('🎲 Surprise Song!')
        .setDescription(`**${song.title}**\n${song.artist} • ${song.year}`)
        .setFooter({ text: 'Yeh surprise acha laga? ✨' })
        .setTimestamp();

      if (track.thumbnail) {
        embed.setThumbnail(track.thumbnail);
      }

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId('pause').setLabel('Pause').setEmoji('⏸️').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('resume').setLabel('Resume').setEmoji('▶️').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('skip').setLabel('Skip').setEmoji('⏭️').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('loop').setLabel('Loop').setEmoji('🔁').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('stop').setLabel('Stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger)
        );

      return interaction.editReply({ embeds: [embed], components: [buttons] });

    } catch (error) {
      console.error('Error in surprise command:', error);
      return interaction.editReply('❌ Surprise mein dikkat aayi. Dobara try karo.');
    }
  }
};
