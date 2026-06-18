import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { useMainPlayer, QueryType } from 'discord-player';
import { getAllSongs } from '../data/playlists.js';

export default {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Nonstop old songs (queues 10 random classics)'),
    
  async execute(interaction) {
    const member = interaction.member;
    if (!member.voice.channel) {
      return interaction.reply({ content: '❌ Pehle voice channel mein aao… phir gaana sunenge 🎵', flags: 64 });
    }

    await interaction.deferReply();

    try {
      const player = useMainPlayer();
      const allSongs = getAllSongs();
      const shuffled = [...allSongs].sort(() => Math.random() - 0.5).slice(0, 10);
      
      let firstTrack = null;
      let firstSongDetails = null;
      let addedCount = 0;

      // Helper function to prepare track
      const youtubedl = (await import('youtube-dl-exec')).default;
      const getTrack = async (songDetails) => {
        const ytSearch = await player.search(`${songDetails.title} ${songDetails.artist}`, {
          requestedBy: interaction.user,
          searchEngine: QueryType.YOUTUBE
        });
        if (!ytSearch || ytSearch.tracks.length === 0) return null;
        let track = ytSearch.tracks[0];
        
        try {
          const ytdlOutput = await youtubedl(track.url, {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            noCheckCertificate: true,
            youtubeSkipDashManifest: true,
            format: 'bestaudio',
          });
          track.rawUrl = ytdlOutput.url;
        } catch(e) {
          console.error(e);
          return null;
        }
        return track;
      };

      await interaction.editReply('⏳ Bypassing YouTube stream blocks...');

      // Play the first song immediately
      firstSongDetails = shuffled[0];
      const firstTrackObj = await getTrack(firstSongDetails);
      if (!firstTrackObj) return interaction.editReply('❌ Pehla gaana nahi mila!');

      const firstResult = await player.play(member.voice.channel, firstTrackObj.rawUrl, {
        nodeOptions: {
          metadata: interaction,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 60000,
          leaveOnEnd: false,
          selfDeaf: true
        }
      });
      
      firstResult.track.title = firstTrackObj.title;
      firstResult.track.author = firstTrackObj.author;
      firstResult.track.thumbnail = firstTrackObj.thumbnail;
      firstResult.track.url = firstTrackObj.url;

      firstTrack = firstResult.track;
      addedCount++;

      // Queue the rest in the background
      for (let i = 1; i < shuffled.length; i++) {
        const song = shuffled[i];
        try {
          const t = await getTrack(song);
          if (t) {
            const res = await player.play(member.voice.channel, t.rawUrl, {
              nodeOptions: { metadata: interaction }
            });
            res.track.title = t.title;
            res.track.author = t.author;
            res.track.thumbnail = t.thumbnail;
            res.track.url = t.url;
            addedCount++;
          }
        } catch (e) {
          console.error(`Failed to queue ${song.title}`);
        }
      }

      const embed = new EmbedBuilder()
        .setColor('#E91E63')
        .setTitle('📻 GoldenEra Radio - ON AIR')
        .setDescription(`**${firstSongDetails.title}**\n${firstSongDetails.artist} • ${firstSongDetails.year}`)
        .addFields({ name: '🎵 Mode', value: `Queued ${addedCount} classics!` })
        .setFooter({ text: 'Use /stop to turn off radio' })
        .setTimestamp();

      if (firstTrack.thumbnail) embed.setThumbnail(firstTrack.thumbnail);

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder().setCustomId('pause').setLabel('Pause').setEmoji('⏸️').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('skip').setLabel('Skip').setEmoji('⏭️').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('stop').setLabel('Stop Radio').setEmoji('⏹️').setStyle(ButtonStyle.Danger)
        );

      await interaction.editReply({ embeds: [embed], components: [buttons] });
    } catch (e) {
      console.error(e);
      // If we haven't replied yet, let user know
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: '❌ Kuch gadbad ho gayi!', flags: 64 });
      }
    }
  },
};
