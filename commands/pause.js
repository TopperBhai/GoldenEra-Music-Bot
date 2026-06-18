import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song'),
    
  async execute(interaction) {
    const player = interaction.client.manager.players.get(interaction.guildId);
    if (!player) {
      return interaction.reply({ content: '❌ Yahan koi gaana nahi chal raha.', flags: 64 });
    }
    
    if (player.paused) {
      return interaction.reply({ content: '❌ Gaana pehle se hi ruka hua hai.', flags: 64 });
    }
    
    player.pause(true);
    return interaction.reply('⏸️ Gaana roka gaya.');
  }
};
