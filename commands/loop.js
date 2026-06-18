import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle loop mode'),
    
  async execute(interaction) {
    const player = interaction.client.manager.players.get(interaction.guildId);
    if (!player) {
      return interaction.reply({ content: '❌ Yahan koi gaana nahi chal raha.', ephemeral: true });
    }
    
    if (player.loop === 'none') {
      player.setLoop('track');
      return interaction.reply('🔁 Loop mode ON');
    } else {
      player.setLoop('none');
      return interaction.reply('🔁 Loop mode OFF');
    }
  }
};
