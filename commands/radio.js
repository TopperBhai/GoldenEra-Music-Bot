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

      // Play the first song immediately
      firstSongDetails = shuffled[0];
      const firstResult = await player.play(member.voice.channel, `${firstSongDetails.title} ${firstSongDetails.artist}`, {
        searchEngine: QueryType.SOUNDCLOUD,
        nodeOptions: {
          metadata: interaction,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 60000,
          leaveOnEnd: false,
          selfDeaf: true
        }
      });
      
      firstTrack = firstResult.track;
      addedCount++;

      // Queue the rest in the background
      for (let i = 1; i < shuffled.length; i++) {
        const song = shuffled[i];
        try {
          await player.play(member.voice.channel, `${song.title} ${song.artist}`, {
            searchEngine: QueryType.SOUNDCLOUD,
            nodeOptions: { metadata: interaction } // don't need full options for subsequent tracks
          });
          addedCount++;
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
          new ButtonBuilder().setCustomId('resume').setLabel('Resume').setEmoji('▶️').setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId('skip').setLabel('Skip').setEmoji('⏭️').setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId('stop').setLabel('Stop Radio').setEmoji('⏹️').setStyle(ButtonStyle.Danger)
        );

      return interaction.editReply({ embeds: [embed], components: [buttons] });
    } catch (error) {
      console.error('Error in radio command:', error);
      return interaction.editReply('❌ Radio start nahi ho paya. Dobara try karo.');
    }
  }
};
