import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { useMainPlayer, QueryType } from 'discord-player';
import { getAllSongs } from '../data/playlists.js';

export default {
  data: new SlashCommandBuilder()
    .setName('surprise')
    .setDescription('Play a legendary random old song'),
    
  async execute(interaction) {
    const member = interaction.member;
    if (!member.voice.channel) {
      return interaction.reply({ content: '❌ Pehle voice channel mein aao… phir gaana sunenge 🎵', flags: 64 });
    }

    await interaction.deferReply();

    try {
      const player = useMainPlayer();
      const allSongs = getAllSongs();
      const song = allSongs[Math.floor(Math.random() * allSongs.length)];
      const searchQuery = `${song.title} ${song.artist}`;

      const ytSearch = await player.search(searchQuery, {
        requestedBy: interaction.user,
        searchEngine: QueryType.YOUTUBE
      });

      if (!ytSearch || ytSearch.tracks.length === 0) {
        return interaction.editReply('❌ Gaana nahi mila!');
      }

      let trackToPlay = ytSearch.tracks[0];
      const ytDlpExt = player.extractors.get('YtDlpExtractor');
      if (ytDlpExt) trackToPlay.extractor = ytDlpExt;

      const result = await player.play(member.voice.channel, trackToPlay, {
        nodeOptions: {
          metadata: interaction,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 60000,
          leaveOnEnd: false,
          selfDeaf: true
        }
      });

      const track = result.track;

      const embed = new EmbedBuilder()
        .setColor('#9C27B0')
        .setTitle('🎲 Surprise Song!')
        .setDescription(`**${song.title}**\n${song.artist} • ${song.year}`)
        .setFooter({ text: 'Yeh surprise acha laga? ✨' })
        .setTimestamp();

      if (track.thumbnail) embed.setThumbnail(track.thumbnail);

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
