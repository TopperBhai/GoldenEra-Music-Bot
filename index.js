import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getQueue } from './utils/musicPlayer.js';
import sodium from 'libsodium-wrappers-sumo';
import express from 'express';

// --- RENDER FREE TIER WEBSERVER ---
// Render requires Web Services to bind to a port within 60 seconds, otherwise it kills the app.
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('GoldenEra Music Bot is alive!'));
app.listen(port, () => console.log(`🌍 Dummy web server listening on port ${port} (for Render)`));
// ----------------------------------

// Wait for libsodium to be ready before proceeding
await sodium.ready;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load config (with fallback to process.env for Render deployment)
let config = {};
try {
  config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf-8'));
} catch (e) {
  console.log('No config.json found, relying entirely on environment variables.');
}

const botToken = process.env.DISCORD_TOKEN || config.token;
const botClientId = process.env.CLIENT_ID || process.env.DISCORD_CLIENT_ID || config.clientId;

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
const rest = new REST({ version: '10' }).setToken(botToken);

async function registerCommands() {
  try {
    console.log('🔄 Registering slash commands...');
    
    const commands = [];
    for (const file of commandFiles) {
      const command = await import(`./commands/${file}`);
      commands.push(command.default.data.toJSON());
    }

    if (!botToken || !botClientId) {
      console.error('❌ Missing bot token or client ID in config.json or environment variables.');
      process.exit(1);
    }

    await rest.put(
      Routes.applicationCommands(botClientId),
      { body: commands }
    );

    console.log('✅ Slash commands registered successfully!');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
}

// Bot ready event
client.once('ready', async () => {
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
client.login(botToken).catch(err => {
  console.error('\n❌ Failed to login:', err);
  console.log('\n💡 Make sure you have:\n   1. Added your bot token to Render Environment Variables (DISCORD_TOKEN)\n   2. Or added it in config.json locally');
  process.exit(1);
});
