import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { useMainPlayer, QueryType } from 'discord-player';
import { playlists, getRandomSong } from '../data/playlists.js';

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

      // 1. Search YouTube first to get accurate metadata (Hindi songs need this)
      let ytSearch = await player.search(searchQuery, {
        requestedBy: interaction.user,
        searchEngine: QueryType.YOUTUBE
      });

      if (!ytSearch || !ytSearch.tracks.length) {
        return interaction.editReply('❌ Kuch nahi mila! Search term check karo.');
      }

      const trackToPlay = ytSearch.tracks[0];

      // Bypass YouTube IP blocks by directly fetching the raw media stream URL using yt-dlp
      await interaction.editReply('⏳ Bypassing YouTube stream blocks...');
      const youtubedl = (await import('youtube-dl-exec')).default;
      
      let rawUrl = '';
      try {
        const ytdlOutput = await youtubedl(trackToPlay.url, {
          dumpSingleJson: true,
          noWarnings: true,
          noCallHome: true,
          noCheckCertificate: true,
          youtubeSkipDashManifest: true,
          format: 'bestaudio',
        });
        rawUrl = ytdlOutput.url;
      } catch (e) {
        console.error('yt-dlp error:', e);
        return interaction.editReply('❌ Stream link extract nahi kar paya.');
      }

      // Play the raw URL
      const result = await player.play(member.voice.channel, rawUrl, {
        nodeOptions: {
          metadata: interaction,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 60000,
          leaveOnEnd: false,
          selfDeaf: true
        }
      });

      // Restore the metadata so it looks pretty in the queue
      result.track.title = trackToPlay.title;
      result.track.author = trackToPlay.author;
      result.track.thumbnail = trackToPlay.thumbnail;
      result.track.url = trackToPlay.url;

      const track = result.track;
      const title = isCategory && songDetails ? songDetails.title : track.title;
      const author = isCategory && songDetails ? songDetails.artist : track.author;

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎶 Now Playing')
        .setDescription(`**${title}**\n${author}`)
        .setFooter({ text: isCategory && songDetails?.message ? songDetails.message : `Source: Bridged via SoundCloud • ${track.duration}` })
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
