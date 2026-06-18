import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getQueue } from '../utils/musicPlayer.js';
import { getAllSongs } from '../data/playlists.js';

export default {
  data: new SlashCommandBuilder()
    .setName('surprise')
    .setDescription('Play a legendary random old song'),
    
  async execute(interaction) {
    // Check if user is in a voice channel
    const member = interaction.member;
    if (!member.voice.channel) {
      return interaction.reply({
        content: '❌ Pehle voice channel mein aao… phir gaana sunenge 🎵',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    try {
      const queue = getQueue(interaction.guildId);
      
      // Connect to voice channel if not connected
      if (!queue.connection) {
        await queue.connect(member.voice.channel);
      }

      // Get all songs and pick a random one
      const allSongs = getAllSongs();
      const song = allSongs[Math.floor(Math.random() * allSongs.length)];
      
      // Use addAndPlay - plays immediately if nothing is playing, or adds to queue
      const nowPlaying = await queue.addAndPlay(song);

      if (nowPlaying) {
        const embed = new EmbedBuilder()
          .setColor('#9C27B0')
          .setTitle('🎲 Surprise Song!')
          .setDescription(`**${nowPlaying.title}**\n${nowPlaying.artist} • ${nowPlaying.year}`)
          .setFooter({ text: 'Yeh surprise acha laga? ✨' })
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
        // Song was added to queue
        const embed = new EmbedBuilder()
          .setColor('#9C27B0')
          .setTitle('🎲 Surprise Added to Queue!')
          .setDescription(`**${song.title}**\n${song.artist} • ${song.year}`)
          .setFooter({ text: 'Queue mein add ho gaya! 🎵' })
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in surprise command:', error);
      return interaction.editReply('Thoda ruk jao… yaadon ka record load ho raha hai 🎵');
    }
  }
};
