import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { playlists, getRandomSong } from '../data/playlists.js';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube, search, or play a classic category')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('YouTube link, search term, or category (kishore, lata, 90s, old-hindi, old-english)')
        .setRequired(true)
    ),
        
  async execute(interaction) {
    try {
      const member = interaction.member;
      if (!member.voice.channel) {
        return interaction.reply({ 
          content: '❌ Pehle voice channel mein aao… phir gaana sunenge 🎵',
          ephemeral: true 
        });
      }

      await interaction.deferReply();
      
      const query = interaction.options.getString('query');
      let searchQuery = query;
      let isCategory = false;
      let songDetails = null;

      // Convert YouTube links to text search to bypass YouTube IP blocks
      if (query.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)) {
        try {
          const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(query)}&format=json`);
          if (oembedRes.ok) {
            const data = await oembedRes.json();
            // Clean up the title aggressively for SoundCloud
            let cleanTitle = data.title;
            // Remove everything after | or - as they usually contain movie names, actors, or "official video"
            cleanTitle = cleanTitle.split('|')[0].split('-')[0];
            // Remove bracketed text like (Official Video) or [Lyrical]
            cleanTitle = cleanTitle.replace(/(\(|\[).*?(\)|\])/g, '');
            searchQuery = cleanTitle.trim();
          } else {
            return interaction.editReply('❌ YouTube link invalid or blocked. Please type the song name instead!');
          }
        } catch (e) {
          console.error("oEmbed fetch failed", e);
        }
      } else if (playlists[query.toLowerCase()]) {
        const playlist = playlists[query.toLowerCase()];
        songDetails = getRandomSong(playlist);
        searchQuery = `${songDetails.title} ${songDetails.artist}`;
        isCategory = true;
      }

      // Create or get Lavalink player
      const player = await interaction.client.manager.createPlayer({
        guildId: interaction.guildId,
        textId: interaction.channelId,
        voiceId: member.voice.channel.id,
        volume: 100,
        deaf: true,
        mute: false
      });

      // Force discord.js to explicitly unmute the bot in case it got stuck in a muted state
      setTimeout(async () => {
        try {
          const me = interaction.guild.members.me;
          if (me && me.voice && me.voice.channelId) {
            // This forces self-mute to false and self-deaf to true natively
            await me.edit({ mute: false, deaf: true }).catch(() => {});
            await me.voice.setMute(false, 'Ensuring bot can play audio').catch(() => {});
          }
        } catch (e) {}
      }, 1500);


      // Search for the track using Kazagumo
      let res = await interaction.client.manager.search(searchQuery, { requester: interaction.user });

      // If soundcloud fails to find the track, aggressively fallback to YouTube Music search
      if (!res || !res.tracks || !res.tracks.length) {
        res = await interaction.client.manager.search(`ytmsearch:${searchQuery}`, { requester: interaction.user });
      }

      if (!res || !res.tracks || !res.tracks.length) {
        return interaction.editReply('❌ Kuch nahi mila! Please try a different link or search term.');
      }

      const track = res.tracks[0];
      player.queue.add(track);

      if (!player.playing && !player.paused) {
        player.play();
      }

      const title = isCategory && songDetails ? songDetails.title : track.title;
      const author = isCategory && songDetails ? songDetails.artist : track.author;

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎶 Now Playing')
        .setDescription(`**${title}**\n${author}`)
        .setTimestamp();

      if (track.thumbnail) {
        embed.setThumbnail(track.thumbnail);
      }
      
      if (isCategory && songDetails && songDetails.message) {
        embed.setFooter({ text: songDetails.message });
      }

      const buttons = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('pause')
            .setLabel('Pause')
            .setEmoji('⏸️')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('resume')
            .setLabel('Resume')
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('skip')
            .setLabel('Skip')
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('loop')
            .setLabel('Loop')
            .setEmoji('🔁')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('stop')
            .setLabel('Stop')
            .setEmoji('⏹️')
            .setStyle(ButtonStyle.Danger)
        );

      return interaction.editReply({ embeds: [embed], components: [buttons] });

    } catch (error) {
      console.error('Error in play command:', error);
      if (interaction.deferred) {
        return interaction.editReply('Thoda ruk jao… connection establish ho raha hai 🎵');
      } else {
        return interaction.reply({ 
          content: 'Thoda ruk jao… connection establish ho raha hai 🎵',
          ephemeral: true 
        });
      }
    }
  }
};
