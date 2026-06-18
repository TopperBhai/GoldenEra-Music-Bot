import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getQueue } from '../utils/musicPlayer.js';
import { playlists, getRandomSong } from '../data/playlists.js';

export default {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play classic old songs')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Choose a category')
        .setRequired(true)
        .addChoices(
          { name: '🎤 Kishore Kumar Classics', value: 'kishore' },
          { name: '🎵 Lata Mangeshkar Hits', value: 'lata' },
          { name: '💕 90s Bollywood Love', value: '90s' },
          { name: '🇮🇳 Classic Hindi Songs', value: 'old-hindi' },
          { name: '🎸 Old English Classics', value: 'old-english' }
        )),
        
  async execute(interaction) {
    try {
      // Check if user is in a voice channel FIRST
      const member = interaction.member;
      if (!member.voice.channel) {
        return interaction.reply({ 
          content: '❌ Pehle voice channel mein aao… phir gaana sunenge 🎵',
          ephemeral: true 
        });
      }

      // Defer reply immediately after validation
      await interaction.deferReply();
      
      const category = interaction.options.getString('category');

      // Get playlist
      const playlist = playlists[category];
      if (!playlist) {
        return interaction.editReply('❌ Invalid category selected.');
      }

      // Pick a random song from the playlist
      const song = getRandomSong(playlist);
      
      const queue = getQueue(interaction.guildId);
      
      // Connect to voice channel if not connected
      if (!queue.connection) {
        await queue.connect(member.voice.channel);
      }

      // Add song and start playing
      const nowPlaying = await queue.addAndPlay(song);
      
      if (nowPlaying) {
        const embed = new EmbedBuilder()
          .setColor('#FFD700')
          .setTitle('🎶 Now Playing')
          .setDescription(`**${nowPlaying.title}**\n${nowPlaying.artist} • ${nowPlaying.year}`)
          .setFooter({ text: nowPlaying.message })
          .setTimestamp();

        if (nowPlaying.thumbnail) {
          embed.setThumbnail(nowPlaying.thumbnail);
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
      } else {
        return interaction.editReply('Thoda ruk jao… yaadon ka record load ho raha hai 🎵');
      }

    } catch (error) {
      console.error('Error in play command:', error);
      if (interaction.deferred) {
        return interaction.editReply('Thoda ruk jao… yaadon ka record load ho raha hai 🎵');
      } else {
        return interaction.reply({ 
          content: 'Thoda ruk jao… yaadon ka record load ho raha hai 🎵',
          ephemeral: true 
        });
      }
    }
  }
};
