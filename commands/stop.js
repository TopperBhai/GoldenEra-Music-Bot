import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),
    
  async execute(interaction) {
    const player = interaction.client.manager.players.get(interaction.guildId);
    if (!player) {
      return interaction.reply({ content: '❌ Yahan koi gaana nahi chal raha.', flags: 64 });
    }
    
    try {
      player.queue.clear();
      player.destroy();
    } catch(e) {
      console.error('Destroy failed:', e.message);
      try { player.skip(); } catch(e2) {}
    }
    return interaction.reply('⏹️ Music band ho gayi aur queue clear ho gaya.');
  }
};
