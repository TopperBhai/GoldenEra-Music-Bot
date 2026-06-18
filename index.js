import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { Player, useQueue } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- RENDER FREE TIER WEBSERVER ---
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('GoldenEra Music Bot is alive!'));
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.listen(port, () => console.log(`🌍 Web server listening on port ${port}`));
// ----------------------------------

// Load config (with fallback to process.env for Render deployment)
let config = {};
try {
  config = JSON.parse(readFileSync(join(__dirname, 'config.json'), 'utf-8'));
} catch (e) {
  console.log('No config.json found, relying entirely on environment variables.');
}

const botToken = process.env.DISCORD_TOKEN || config.token;
const botClientId = process.env.CLIENT_ID || process.env.DISCORD_CLIENT_ID || config.clientId;

if (!botToken || !botClientId) {
  console.error('❌ Missing bot token or client ID.');
  process.exit(1);
}

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ],
});

client.commands = new Collection();

// --- DISCORD-PLAYER SETUP ---
const player = new Player(client, {
  ytdlOptions: {
    quality: 'highestaudio',
    highWaterMark: 1 << 25
  }
});

// Register extractors
await player.extractors.loadMulti(DefaultExtractors);
console.log('✅ Extractors registered successfully!');

// --- Player Events ---
player.events.on('playerStart', (queue, track) => {
  console.log(`▶️ Now playing: ${track.title} in ${queue.guild.id}`);
  // Don't send message here — the command already sends the embed
});

player.events.on('playerFinish', (queue, track) => {
  console.log(`⏹️ Finished: ${track.title}`);
});

player.events.on('emptyQueue', (queue) => {
  console.log(`🈳 Queue empty for ${queue.guild.id}`);
});

player.events.on('emptyChannel', (queue) => {
  console.log(`🚪 Voice channel empty, leaving ${queue.guild.name}`);
});

player.events.on('playerError', (queue, error, track) => {
  console.error(`❌ Player error: ${error.message}`);
  if (queue.metadata) {
    const interaction = queue.metadata;
    const channel = interaction.channel || interaction;
    if (channel.send) {
      channel.send(`⚠️ Error playing **${track?.title || 'unknown'}**: ${error.message}. Trying next song...`).catch(() => {});
    }
  }
});

player.events.on('error', (queue, error) => {
  console.error(`❌ Queue error: ${error.message}`);
});

player.events.on('playerStart', (queue, track) => {
  // Log streaming confirmation
  if (track) {
    console.log(`📡 Streaming: ${track.title} | Source: ${track.source || 'unknown'} | Duration: ${track.duration}`);
  }
});
// ----------------------

// Make player accessible from commands
client.player = player;

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
  console.log(`   GoldenEra Bot is Online! (v2.0 - Direct Streaming)`);
  console.log(`   Logged in as: ${client.user.tag}`);
  console.log(`   Serving: ${client.guilds.cache.size} servers`);
  console.log(`🎵 ════════════════════════════════════════════════ 🎵\n`);
  
  client.user.setActivity('Old Is Gold 🎶', { type: 'LISTENING' });
  await registerCommands();
});

// Helper: safely reply to an interaction
async function safeReply(interaction, content) {
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content, flags: 64 });
    } else {
      await interaction.reply({ content, flags: 64 });
    }
  } catch (e) {
    console.error('SafeReply failed:', e.message);
  }
}

// Handle slash commands
client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('Error executing command:', error);
      await safeReply(interaction, '❌ Command mein error aaya. Dobara try karo.');
    }
  }

  // Handle button interactions
  if (interaction.isButton()) {
    const queue = useQueue(interaction.guildId);

    if (!queue || !queue.isPlaying()) {
      return safeReply(interaction, '❌ Yahan koi gaana nahi chal raha.');
    }

    try {
      switch (interaction.customId) {
        case 'pause':
          if (!queue.node.isPaused()) {
            queue.node.pause();
            await interaction.reply({ content: '⏸️ Gaana roka gaya.', flags: 64 });
          } else {
            await interaction.reply({ content: '❌ Gaana pehle se hi ruka hua hai.', flags: 64 });
          }
          break;

        case 'resume':
          if (queue.node.isPaused()) {
            queue.node.resume();
            await interaction.reply({ content: '▶️ Gaana phir se chalu.', flags: 64 });
          } else {
            await interaction.reply({ content: '❌ Gaana pehle se hi chal raha hai.', flags: 64 });
          }
          break;

        case 'skip':
          queue.node.skip();
          await interaction.reply({ content: '⏭️ Agle gaane par…', flags: 64 });
          break;

        case 'loop':
          if (queue.repeatMode === 0) {
            queue.setRepeatMode(1); // repeat track
            await interaction.reply({ content: '🔁 Loop mode ON (Single Track)', flags: 64 });
          } else {
            queue.setRepeatMode(0); // off
            await interaction.reply({ content: '🔁 Loop mode OFF', flags: 64 });
          }
          break;

        case 'stop':
          queue.delete();
          await interaction.reply({ content: '⏹️ Music band ho gayi.', flags: 64 });
          break;

        default:
          await interaction.reply({ content: '❌ Unknown button.', flags: 64 });
      }
    } catch (error) {
      console.error('Error handling button:', error);
      await safeReply(interaction, '❌ Button mein error aaya. Dobara try karo.');
    }
  }
});

// Handle voice state updates (auto-leave when channel is empty)
client.on('voiceStateUpdate', (oldState, newState) => {
  if (oldState.channel && oldState.channel.members.size === 1 && oldState.channel.members.has(client.user.id)) {
    const queue = useQueue(oldState.guild.id);
    if (queue) {
      queue.delete();
      console.log(`🚪 Left empty voice channel in: ${oldState.guild.name}`);
    }
  }
});

client.on('error', error => console.error('Discord client error:', error));
process.on('unhandledRejection', error => console.error('Unhandled rejection:', error));

// Login
client.login(botToken).catch(err => {
  console.error('\n❌ Failed to login:', err);
  process.exit(1);
});
