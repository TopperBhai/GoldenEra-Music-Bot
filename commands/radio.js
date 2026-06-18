import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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
      const player = await interaction.client.manager.createPlayer({
        guildId: interaction.guildId,
        textId: interaction.channelId,
        voiceId: member.voice.channel.id,
        volume: 100, deaf: true, mute: false
      });

      const allSongs = getAllSongs();
      let firstTrack = null;
      let firstSongDetails = null;
      let addedCount = 0;

      const shuffled = [...allSongs].sort(() => Math.random() - 0.5).slice(0, 10);

      // Search all 10 songs in parallel via SoundCloud (reliable streaming)
      const searchPromises = shuffled.map(song => {
        const q = `${song.title} ${song.artist}`;
        return interaction.client.manager.search(`scsearch:${q}`, { requester: interaction.user })
          .then(res => ({ res, song }))
          .catch(() => ({ res: null, song }));
      });

      const results = await Promise.all(searchPromises);

      for (const { res, song } of results) {
        if (res?.tracks?.length) {
          player.queue.add(res.tracks[0]);
          addedCount++;
          if (!firstTrack) {
            firstTrack = res.tracks[0];
            firstSongDetails = song;
          }
        }
      }

      if (!firstTrack || addedCount === 0) {
        return interaction.editReply('❌ Radio start nahi ho paya, search failed.');
      }

      if (!player.playing && !player.paused) player.play();

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
      return interaction.editReply('❌ Radio mein dikkat aayi. Dobara try karo.');
    }
  }
};
