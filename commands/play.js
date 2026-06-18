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

      // Check if the query is a classic category
      if (playlists[query.toLowerCase()]) {
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

      // Search for the track using Kazagumo
      const res = await interaction.client.manager.search(searchQuery, { requester: interaction.user });

      if (!res.tracks.length) {
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
