import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getQueue } from '../utils/musicPlayer.js';
import { getAllSongs, getRandomSong } from '../data/playlists.js';

export default {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Nonstop old songs until stopped'),
    
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

      // Enable radio mode
      queue.setRadioMode(true);

      // Get all songs and add 5 random songs to queue
      const allSongs = getAllSongs();
      for (let i = 0; i < 5; i++) {
        const randomSong = allSongs[Math.floor(Math.random() * allSongs.length)];
        await queue.addToQueue(randomSong);
      }

      // If not playing, start
      if (!queue.isPlaying) {
        const nowPlaying = await queue.playSong(queue.queue.shift());
        
        if (nowPlaying) {
          const embed = new EmbedBuilder()
            .setColor('#E91E63')
            .setTitle('📻 GoldenEra Radio - ON AIR')
            .setDescription(`**${nowPlaying.title}**\n${nowPlaying.artist} • ${nowPlaying.year}`)
            .addFields({ name: '🎵 Mode', value: 'Non-stop classics playing...' })
            .setFooter({ text: 'Use /stop to turn off radio' })
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
                .setCustomId('stop')
                .setLabel('Stop Radio')
                .setEmoji('⏹️')
                .setStyle(ButtonStyle.Danger)
            );

          return interaction.editReply({ embeds: [embed], components: [buttons] });
        }
      } else {
        const embed = new EmbedBuilder()
          .setColor('#E91E63')
          .setTitle('📻 Radio Mode Activated')
          .setDescription('Non-stop classics will play after current queue ends.')
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in radio command:', error);
      return interaction.editReply('Thoda ruk jao… yaadon ka record load ho raha hai 🎵');
    }
  }
};
