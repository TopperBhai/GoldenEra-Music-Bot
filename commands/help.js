import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all commands and how to use the bot'),
    
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🎵 GoldenEra - Help & Commands')
      .setDescription('The world\'s most user-friendly bot for Old Is Gold songs ❤️\n\n**Simplicity is our magic. No URLs, no confusion.**')
      .addFields(
        {
          name: '🎤 Play Commands',
          value: '`/play kishore` - Kishore Kumar classics\n' +
                 '`/play lata` - Lata Mangeshkar hits\n' +
                 '`/play 90s` - 90s Bollywood love songs\n' +
                 '`/play old-hindi` - Classic Hindi songs\n' +
                 '`/play old-english` - Old English classics',
          inline: false
        },
        {
          name: '😊 Mood Commands',
          value: '`/mood sad` - Emotional old songs\n' +
                 '`/mood romantic` - Romantic classics\n' +
                 '`/mood chill` - Relaxing vibes\n' +
                 '`/mood rain` - Rainy night classics',
          inline: false
        },
        {
          name: '✨ Special Commands',
          value: '`/surprise` - Random legendary song\n' +
                 '`/radio` - Non-stop old songs\n' +
                 '`/nowplaying` - Current song details',
          inline: false
        },
        {
          name: '🎮 Control Commands',
          value: '`/pause` - Pause the song\n' +
                 '`/resume` - Resume playback\n' +
                 '`/skip` - Skip to next song\n' +
                 '`/stop` - Stop and clear queue',
          inline: false
        },
        {
          name: '💡 How to Use',
          value: '1️⃣ Join a voice channel\n' +
                 '2️⃣ Use any play command\n' +
                 '3️⃣ Bot auto-joins and plays\n' +
                 '4️⃣ Use buttons for easy control\n' +
                 '5️⃣ Bot auto-leaves when channel is empty',
          inline: false
        },
        {
          name: '🎯 What Makes Us Special',
          value: '✅ Only classic songs (1960s-2000s)\n' +
                 '✅ No YouTube links needed\n' +
                 '✅ Smart playlists & mood-based\n' +
                 '✅ Button controls on every song\n' +
                 '✅ Nostalgic messages ❤️\n' +
                 '✅ Premium feel, free to use',
          inline: false
        }
      )
      .setFooter({ text: 'Aankhen band karo… purane gaano ka jaadu shuru ✨' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
