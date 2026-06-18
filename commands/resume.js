import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song'),
    
  async execute(interaction) {
    const player = interaction.client.manager.players.get(interaction.guildId);
    if (!player) {
      return interaction.reply({ content: '❌ Yahan koi gaana nahi chal raha.', flags: 64 });
    }
    
    if (!player.paused) {
      return interaction.reply({ content: '❌ Gaana pehle se hi chal raha hai.', flags: 64 });
    }
    
    player.pause(false);
    return interaction.reply('▶️ Gaana phir se chalu.');
  }
};
