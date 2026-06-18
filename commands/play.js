import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { playlists, getRandomSong } from '../data/playlists.js';

// Smart search: tries SoundCloud first (reliable streaming), then YouTube Music
async function smartSearch(manager, query, requester) {
  // 1. Try SoundCloud first — streaming is 100% reliable, no IP blocks
  try {
    const scRes = await manager.search(`scsearch:${query}`, { requester });
    if (scRes?.tracks?.length > 0) {
      console.log(`🔍 Found on SoundCloud: ${scRes.tracks[0].title}`);
      return scRes;
    }
  } catch (e) {
    console.error('SoundCloud search failed:', e.message);
  }

  // 2. Fallback to YouTube Music (may get IP blocked but worth trying)
  try {
    const ytmRes = await manager.search(`ytmsearch:${query}`, { requester });
    if (ytmRes?.tracks?.length > 0) {
      console.log(`🔍 Found on YouTube Music: ${ytmRes.tracks[0].title}`);
      return ytmRes;
    }
  } catch (e) {
    console.error('YouTube Music search failed:', e.message);
  }

  // 3. Last resort: standard YouTube search
  try {
    const ytRes = await manager.search(`ytsearch:${query}`, { requester });
    if (ytRes?.tracks?.length > 0) {
      console.log(`🔍 Found on YouTube: ${ytRes.tracks[0].title}`);
      return ytRes;
    }
  } catch (e) {
    console.error('YouTube search failed:', e.message);
  }

  return null;
}

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
          flags: 64 
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
            let cleanTitle = data.title;
            cleanTitle = cleanTitle.split('|')[0];
            cleanTitle = cleanTitle.replace(/(\(|\[).*?(\)|\])/g, '');
            cleanTitle = cleanTitle.replace(/official|video|lyric|full|hd|hq|audio|song/gi, '');
            searchQuery = cleanTitle.trim();
          } else {
            return interaction.editReply('❌ YouTube link invalid ya blocked hai. Gaane ka naam likh ke try karo!');
          }
        } catch (e) {
          console.error("oEmbed fetch failed:", e.message);
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

      // Force unmute the bot after joining (fixes Discord sometimes auto-muting bots)
      setTimeout(async () => {
        try {
          const me = interaction.guild.members.me;
          if (me?.voice?.channelId) {
            await me.voice.setMute(false, 'Ensuring bot audio works').catch(() => {});
          }
        } catch (e) {}
      }, 2000);

      // Smart search: SoundCloud first (reliable streaming), YouTube as fallback
      const res = await smartSearch(interaction.client.manager, searchQuery, interaction.user);

      if (!res || !res.tracks || !res.tracks.length) {
        return interaction.editReply('❌ Kuch nahi mila! Please try a different search term.');
      }

      const track = res.tracks[0];
      player.queue.add(track);

      if (!player.playing && !player.paused) {
        player.play();
      }

      const title = isCategory && songDetails ? songDetails.title : track.title;
      const author = isCategory && songDetails ? songDetails.artist : track.author;
      const source = track.sourceName || 'unknown';

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎶 Now Playing')
        .setDescription(`**${title}**\n${author}`)
        .setFooter({ text: isCategory && songDetails?.message ? songDetails.message : `Source: ${source}` })
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
      if (interaction.deferred) {
        return interaction.editReply('❌ Gaana search karne mein dikkat aayi. Dobara try karo.');
      } else {
        return interaction.reply({ content: '❌ Gaana search karne mein dikkat aayi. Dobara try karo.', flags: 64 });
      }
    }
  }
};
