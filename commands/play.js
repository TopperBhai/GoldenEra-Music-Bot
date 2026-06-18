import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { useMainPlayer, QueryType } from 'discord-player';
import { playlists, getRandomSong } from '../data/playlists.js';
import { preloadJioSaavnTrack } from '../extractors/JioSaavnExtractor.js';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song — type name, paste YouTube link, or pick a category')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Song name, YouTube link, or category (kishore, lata, 90s, old-hindi, old-english)')
        .setRequired(true)
    ),
        
  async execute(interaction) {
    const member = interaction.member;
    if (!member.voice.channel) {
      return interaction.reply({ content: '❌ Pehle voice channel mein aao… phir gaana sunenge 🎵', flags: 64 });
    }

    await interaction.deferReply();

    try {
      const player = useMainPlayer();
      const query = interaction.options.getString('query');
      let searchQuery = query;
      let isCategory = false;
      let songDetails = null;

      // Check if query is a classic category
      if (playlists[query.toLowerCase()]) {
        const playlist = playlists[query.toLowerCase()];
        songDetails = getRandomSong(playlist);
        searchQuery = `${songDetails.title} ${songDetails.artist}`;
        isCategory = true;
      }

      // 1. Route search intelligently to our indestructible JioSaavn engine
      const isUrl = /^https?:\/\//.test(searchQuery);
      const engine = isUrl ? QueryType.AUTO : 'ext:JioSaavnExtractor';

      let ytSearch = await player.search(searchQuery, {
        requestedBy: interaction.user,
        searchEngine: engine
      });

      if (!ytSearch || !ytSearch.tracks.length) {
        return interaction.editReply('❌ Kuch nahi mila! Search term check karo.');
      }

      let trackToPlay = ytSearch.tracks[0];

      // PRE-DOWNLOAD: Download the MP4 BEFORE joining voice.
      // WHY: discord-player joins voice then calls extractor.stream().
      // The 10-second download blocks the voice WS handshake → it times out → no audio.
      // By downloading first, stream() returns the local path INSTANTLY → voice handshake completes fine.
      if (trackToPlay.source === 'arbitrary' && trackToPlay.raw?.id) {
        try {
          const localPath = await preloadJioSaavnTrack(trackToPlay.raw.id);
          trackToPlay.raw.localPath = localPath;
        } catch(e) {
          console.error('Pre-download failed:', e.message);
          return interaction.editReply('❌ JioSaavn download failed: ' + e.message);
        }
      }

      // Play the track — stream() will return the pre-downloaded path instantly
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
      const title = isCategory && songDetails ? songDetails.title : track.title;
      const author = isCategory && songDetails ? songDetails.artist : track.author;

      const embed = new EmbedBuilder()
        .setColor('#2BC5B4') // JioSaavn Teal
        .setTitle('🎶 Now Playing')
        .setDescription(`**${title}**\n${author}`)
        .setFooter({ text: isCategory && songDetails?.message ? songDetails.message : `Source: JioSaavn Premium • ${track.duration}` })
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
      console.error('Error in play command:', error);
      return interaction.editReply('❌ Gaana nahi mila ya play nahi ho paya. Dobara try karo.');
    }
  }
};
