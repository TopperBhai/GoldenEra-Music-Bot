import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { playlists, getRandomSong } from '../data/playlists.js';

export default {
  data: new SlashCommandBuilder()
    .setName('mood')
    .setDescription('Play songs based on your mood')
    .addStringOption(option =>
      option.setName('feeling')
        .setDescription('How are you feeling?')
        .setRequired(true)
        .addChoices(
          { name: '😢 Sad - Emotional old songs', value: 'sad' },
          { name: '❤️ Romantic - Love classics', value: 'romantic' },
          { name: '😌 Chill - Relaxing vibes', value: 'chill' },
          { name: '🌧️ Rain - Rainy night classics', value: 'rain' }
        )),
        
  async execute(interaction) {
    const mood = interaction.options.getString('feeling');
    const member = interaction.member;

    if (!member.voice.channel) {
      return interaction.reply({
        content: '❌ Pehle voice channel mein aao… phir gaana sunenge 🎵',
        ephemeral: true
      });
    }

    await interaction.deferReply();

    try {
      const playlist = playlists[mood];
      if (!playlist) {
        return interaction.editReply('❌ Invalid mood selected.');
      }

      const song = getRandomSong(playlist);
      const searchQuery = `${song.title} ${song.artist}`;

      const player = await interaction.client.manager.createPlayer({
        guildId: interaction.guildId,
        textId: interaction.channelId,
        voiceId: member.voice.channel.id,
        volume: 50,
        deaf: true
      });

      const res = await interaction.client.manager.search(searchQuery, { requester: interaction.user });

      if (!res.tracks.length) {
        return interaction.editReply('❌ Kuch nahi mila! Cannot find the mood song.');
      }

      const track = res.tracks[0];
      player.queue.add(track);

      if (!player.playing && !player.paused) {
        player.play();
      }

      const moodMessages = {
        sad: 'Dard bhi ek ehsaas hai… 💔',
        romantic: 'Pyar mein dil ka kho jana… ❤️',
        chill: 'Aaram se… sukoon se… 😌',
        rain: 'Baarish aur purane gaane… perfect combination 🌧️'
      };

      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎶 Now Playing')
        .setDescription(`**${song.title}**\n${song.artist} • ${song.year}`)
        .addFields({ name: 'Mood', value: moodMessages[mood] })
        .setFooter({ text: song.message })
        .setTimestamp();

      if (track.thumbnail) {
        embed.setThumbnail(track.thumbnail);
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
      console.error('Error in mood command:', error);
      return interaction.editReply('Thoda ruk jao… connection establish ho raha hai 🎵');
    }
  }
};
