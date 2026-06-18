import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getAllSongs } from '../data/playlists.js';

export default {
  data: new SlashCommandBuilder()
    .setName('radio')
    .setDescription('Nonstop old songs (queues 10 random classics)'),
    
  async execute(interaction) {
    const member = interaction.member;
    if (!member.voice.channel) {
      return interaction.reply({
        content: '❌ Pehle voice channel mein aao… phir gaana sunenge 🎵',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    try {
      const player = await interaction.client.manager.createPlayer({
        guildId: interaction.guildId,
        textId: interaction.channelId,
        voiceId: member.voice.channel.id,
        volume: 50,
        deaf: true
      });

      const allSongs = getAllSongs();
      let firstTrack = null;
      let firstSongDetails = null;

      // Queue 10 random songs
      for (let i = 0; i < 10; i++) {
        const randomSong = allSongs[Math.floor(Math.random() * allSongs.length)];
        const searchQuery = `${randomSong.title} ${randomSong.artist}`;
        const res = await interaction.client.manager.search(searchQuery, { requester: interaction.user });
        
        if (res.tracks.length) {
          const track = res.tracks[0];
          player.queue.add(track);
          if (i === 0) {
            firstTrack = track;
            firstSongDetails = randomSong;
          }
        }
      }

      if (!player.playing && !player.paused) {
        player.play();
      }

      if (firstTrack) {
        const embed = new EmbedBuilder()
          .setColor('#E91E63')
          .setTitle('📻 GoldenEra Radio - ON AIR')
          .setDescription(`**${firstSongDetails.title}**\n${firstSongDetails.artist} • ${firstSongDetails.year}`)
          .addFields({ name: '🎵 Mode', value: 'Queued 10 random classics!' })
          .setFooter({ text: 'Use /stop to turn off radio' })
          .setTimestamp();

        if (firstTrack.thumbnail) {
          embed.setThumbnail(firstTrack.thumbnail);
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
      } else {
        return interaction.editReply('❌ Radio start nahi ho paya, search failed.');
      }

    } catch (error) {
      console.error('Error in radio command:', error);
      return interaction.editReply('Thoda ruk jao… connection establish ho raha hai 🎵');
    }
  }
};
