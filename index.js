import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getQueue } from './utils/musicPlayer.js';
import sodium from 'libsodium-wrappers-sumo';

// Wait for libsodium to be ready before proceeding
await sodium.ready;

const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  defaultVolume: 0.5,
  eraStart: 1960,
  eraEnd: 2000,
  maxQueueSize: 100
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

// Command collection
client.commands = new Collection();

// Load commands
const commandFiles = readdirSync(join(__dirname, 'commands')).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
}

// Register slash commands
const rest = new REST({ version: '10' }).setToken(config.token);

async function registerCommands() {
  try {
    console.log('🔄 Registering slash commands...');
    
    const commands = [];
    for (const file of commandFiles) {
      const command = await import(`./commands/${file}`);
      commands.push(command.default.data.toJSON());
    }

    await rest.put(
      Routes.applicationCommands(config.clientId),
      { body: commands }
    );

    console.log('✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

// Bot ready event
client.once('clientReady', async () => {
  console.log(`\n🎵 ════════════════════════════════════════════════ 🎵`);
  console.log(`   GoldenEra Bot is Online!`);
  console.log(`   Logged in as: ${client.user.tag}`);
  console.log(`   Serving: ${client.guilds.cache.size} servers`);
  console.log(`🎵 ════════════════════════════════════════════════ 🎵\n`);
  
  client.user.setActivity('Old Is Gold 🎶', { type: 'LISTENING' });
  
  await registerCommands();
});

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('Error executing command:', error);
      
      const reply = {
        content: 'Thoda ruk jao… yaadon ka record load ho raha hai 🎵',
        ephemeral: true
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  }

  // Handle button interactions
  if (interaction.isButton()) {
    const queue = getQueue(interaction.guildId);

    try {
      switch (interaction.customId) {
        case 'pause':
          if (queue.pause()) {
            await interaction.reply({ content: '⏸️ Gaana roka gaya.', ephemeral: true });
          } else {
            await interaction.reply({ content: '❌ Gaana pehle se hi ruka hua hai.', ephemeral: true });
          }
          break;

        case 'resume':
          if (queue.resume()) {
            await interaction.reply({ content: '▶️ Gaana phir se chalu.', ephemeral: true });
          } else {
            await interaction.reply({ content: '❌ Gaana pehle se hi chal raha hai.', ephemeral: true });
          }
          break;

        case 'skip':
          if (queue.skip()) {
            await interaction.reply({ content: '⏭️ Agle gaane par…', ephemeral: true });
          } else {
            await interaction.reply({ content: '❌ Skip nahi ho saka.', ephemeral: true });
          }
          break;

        case 'loop':
          const loopEnabled = queue.toggleLoop();
          await interaction.reply({ 
            content: loopEnabled ? '🔁 Loop mode ON' : '🔁 Loop mode OFF', 
            ephemeral: true 
          });
          break;

        case 'stop':
          queue.stop();
          await interaction.reply({ content: '⏹️ Music band ho gayi.', ephemeral: true });
          break;

        default:
          await interaction.reply({ content: '❌ Unknown button.', ephemeral: true });
      }
    } catch (error) {
      console.error('Error handling button:', error);
      await interaction.reply({ content: '❌ Kuch galat ho gaya.', ephemeral: true });
    }
  }
});

// Handle voice state updates (auto-leave when channel is empty)
client.on('voiceStateUpdate', (oldState, newState) => {
  // Check if bot was in a channel and that channel is now empty
  if (oldState.channel && oldState.channel.members.size === 1 && oldState.channel.members.has(client.user.id)) {
    const queue = getQueue(oldState.guild.id);
    if (queue && queue.connection) {
      queue.stop();
      console.log(`🚪 Left empty voice channel in: ${oldState.guild.name}`);
    }
  }
});

// Error handling
client.on('error', error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Login
client.login(config.token).catch(error => {
  console.error('❌ Failed to login:', error);
  console.log('\n💡 Make sure you have:');
  console.log('   1. Added your bot token in config.json');
  console.log('   2. Added your client ID in config.json');
  console.log('   3. Enabled necessary intents in Discord Developer Portal\n');
});
