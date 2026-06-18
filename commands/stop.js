import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),
    
  async execute(interaction) {
    const player = interaction.client.manager.players.get(interaction.guildId);
    if (!player) {
      return interaction.reply({ content: '❌ Yahan koi gaana nahi chal raha.', ephemeral: true });
    }
    
    player.destroy();
    return interaction.reply('⏹️ Music band ho gayi aur queue clear ho gaya.');
  }
};
