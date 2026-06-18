import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import 'dotenv/config';
import { Client, Collection, GatewayIntentBits, REST, Routes } from 'discord.js';
import { readdirSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Connectors } from 'shoukaku';
import { Kazagumo } from 'kazagumo';
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
  console.error('❌ Missing bot token or client ID in config.json or environment variables.');
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

// Command collection
client.commands = new Collection();

// --- LAVALINK SETUP ---
const Nodes = [
  {
    name: 'Jirayu Node Secure',
    url: 'lavalink.jirayu.net:443',
    auth: 'youshallnotpass',
    secure: true
  },
  {
    name: 'Jirayu Node',
    url: 'lavalink.jirayu.net:13592',
    auth: 'youshallnotpass',
    secure: false
  }
];

client.manager = new Kazagumo({
  defaultSearchEngine: "youtube_music",
  send: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  }
}, new Connectors.DiscordJS(client), Nodes);

// --- Lavalink Node Events ---
client.manager.shoukaku.on('ready', (name) => console.log(`🎵 Lavalink Node: ${name} is ready!`));
client.manager.shoukaku.on('error', (name, error) => console.error(`❌ Lavalink Node: ${name} error:`, error.message || error));
client.manager.shoukaku.on('close', (name, code, reason) => console.warn(`⚠️ Lavalink Node: ${name} closed (code ${code})`));
client.manager.shoukaku.on('disconnect', (name, players, moved) => console.warn(`⚠️ Lavalink Node: ${name} disconnected. Moved: ${moved}`));

// --- Kazagumo Player Events ---
client.manager.on('playerStart', (player, track) => {
  console.log(`▶️ Started playing: ${track.title} in ${player.guildId}`);
});

client.manager.on('playerEnd', (player, track) => {
  console.log(`⏹️ Finished: ${track.title}`);
});

client.manager.on('playerEmpty', player => {
  console.log(`🈳 Queue empty for ${player.guildId}. Player stays in VC.`);
});

client.manager.on('playerClosed', (player, data) => {
  console.warn(`⚠️ Player closed:`, data.reason || data.code || 'unknown');
});

client.manager.on('playerStuck', (player, data) => {
  console.error(`❌ Player stuck! Auto-skipping...`);
  try { player.skip(); } catch(e) { console.error('Skip after stuck failed:', e.message); }
});

client.manager.on('playerException', (player, data) => {
  const msg = data?.exception?.message || 'Unknown error';
  console.error(`❌ Player exception: ${msg}`);
  
  // Notify the text channel about the error
  try {
    const guild = client.guilds.cache.get(player.guildId);
    if (guild && player.textId) {
      const channel = guild.channels.cache.get(player.textId);
      if (channel) {
        channel.send(`⚠️ Track failed: ${msg}. Skipping to next song...`).catch(() => {});
      }
    }
    player.skip();
  } catch(e) { 
    console.error('Skip after exception failed:', e.message); 
  }
});

client.manager.on('playerUpdate', (player, data) => {
  if (data?.state?.position && data.state.position > 1000 && data.state.position < 6000) {
    console.log(`📡 Streaming (Pos: ${data.state.position}ms)`);
  }
});
// ----------------------

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
  console.log(`   GoldenEra Bot is Online!`);
  console.log(`   Logged in as: ${client.user.tag}`);
  console.log(`   Serving: ${client.guilds.cache.size} servers`);
  console.log(`🎵 ════════════════════════════════════════════════ 🎵\n`);
  
  client.user.setActivity('Old Is Gold 🎶', { type: 'LISTENING' });
  await registerCommands();
});

// Helper: safely reply to an interaction (handles already-replied edge cases)
async function safeReply(interaction, content) {
  try {
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content, ephemeral: true });
    } else {
      await interaction.reply({ content, ephemeral: true });
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
      await safeReply(interaction, 'Thoda ruk jao… connection establish ho raha hai 🎵');
    }
  }

  // Handle button interactions
  if (interaction.isButton()) {
    const player = client.manager.players.get(interaction.guildId);

    if (!player) {
      return safeReply(interaction, '❌ Yahan koi gaana nahi chal raha.');
    }

    try {
      switch (interaction.customId) {
        case 'pause':
          if (!player.paused) {
            player.pause(true);
            await interaction.reply({ content: '⏸️ Gaana roka gaya.', flags: 64 });
          } else {
            await interaction.reply({ content: '❌ Gaana pehle se hi ruka hua hai.', flags: 64 });
          }
          break;

        case 'resume':
          if (player.paused) {
            player.pause(false);
            await interaction.reply({ content: '▶️ Gaana phir se chalu.', flags: 64 });
          } else {
            await interaction.reply({ content: '❌ Gaana pehle se hi chal raha hai.', flags: 64 });
          }
          break;

        case 'skip':
          player.skip();
          await interaction.reply({ content: '⏭️ Agle gaane par…', flags: 64 });
          break;

        case 'loop':
          if (player.loop === 'none') {
            player.setLoop('track');
            await interaction.reply({ content: '🔁 Loop mode ON (Single Track)', flags: 64 });
          } else {
            player.setLoop('none');
            await interaction.reply({ content: '🔁 Loop mode OFF', flags: 64 });
          }
          break;

        case 'stop':
          try {
            player.queue.clear();
            player.destroy();
          } catch(e) {
            console.error('Destroy failed, trying skip:', e.message);
            try { player.skip(); } catch(e2) {}
          }
          await interaction.reply({ content: '⏹️ Music band ho gayi.', flags: 64 });
          break;

        default:
          await interaction.reply({ content: '❌ Unknown button.', flags: 64 });
      }
    } catch (error) {
      console.error('Error handling button:', error);
      await safeReply(interaction, '❌ Kuch galat ho gaya. Dobara try karo.');
    }
  }
});

// Handle voice state updates (auto-leave when channel is empty)
client.on('voiceStateUpdate', (oldState, newState) => {
  if (oldState.channel && oldState.channel.members.size === 1 && oldState.channel.members.has(client.user.id)) {
    const player = client.manager.players.get(oldState.guild.id);
    if (player) {
      player.destroy();
      console.log(`🚪 Left empty voice channel in: ${oldState.guild.name}`);
    }
  }
});

client.on('error', error => console.error('Discord client error:', error));
process.on('unhandledRejection', error => console.error('Unhandled rejection:', error));

// Login
client.login(botToken).catch(err => {
  console.error('\n❌ Failed to login:', err);
  console.log('\n💡 Make sure you have:\n   1. Added your bot token to Render Environment Variables (DISCORD_TOKEN)\n   2. Or added it in config.json locally');
  process.exit(1);
});
