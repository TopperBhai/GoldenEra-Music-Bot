import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { playlists, getRandomSong } from '../data/playlists.js';

// Helper: robust multi-engine search with YouTube Music priority
async function robustSearch(manager, query, requester) {
  const engines = ['ytmsearch', 'ytsearch', 'scsearch'];
  
  for (const engine of engines) {
    try {
      const res = await manager.search(`${engine}:${query}`, { requester });
      if (res && res.tracks && res.tracks.length > 0) {
        return res;
      }
    } catch (e) {
      console.error(`Search failed on ${engine}:`, e.message);
    }
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
            // Clean up the title: remove bracketed text and everything after |
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
          // If oEmbed fails, just use the raw query as search text
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

      // Robust multi-engine search
      const res = await robustSearch(interaction.client.manager, searchQuery, interaction.user);

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
        return interaction.editReply('❌ Gaana search karne mein dikkat aayi. Dobara try karo.');
      } else {
        return interaction.reply({ 
          content: '❌ Gaana search karne mein dikkat aayi. Dobara try karo.',
          flags: 64 
        });
      }
    }
  }
};
