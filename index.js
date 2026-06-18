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
app.listen(port, () => console.log(`🌍 Dummy web server listening on port ${port} (for Render)`));
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
  defaultSearchEngine: "youtube",
  send: (guildId, payload) => {
    const guild = client.guilds.cache.get(guildId);
    if (guild) guild.shard.send(payload);
  }
}, new Connectors.DiscordJS(client), Nodes);

client.manager.shoukaku.on('ready', (name) => console.log(`🎵 Lavalink Node: ${name} is ready!`));
client.manager.shoukaku.on('error', (name, error) => console.error(`❌ Lavalink Node: ${name} threw an error:`, error));
client.manager.shoukaku.on('close', (name, code, reason) => console.warn(`⚠️ Lavalink Node: ${name} closed with code ${code}. Reason: ${reason}`));
client.manager.shoukaku.on('disconnect', (name, players, moved) => console.warn(`⚠️ Lavalink Node: ${name} disconnected. Moved: ${moved}`));

client.manager.on('playerStart', (player, track) => console.log(`▶️ Started playing: ${track.title} in ${player.guildId}`));
client.manager.on('playerEnd', (player, track) => console.log(`⏹️ Finished playing: ${track.title}`));
client.manager.on('playerEmpty', player => {
  console.log(`🈳 Queue empty for ${player.guildId}.`);
  player.destroy();
});
client.manager.on('playerClosed', (player, data) => console.warn(`⚠️ Player closed:`, data));
client.manager.on('playerStuck', (player, data) => console.error(`❌ Player stuck:`, data));
client.manager.on('playerException', (player, data) => console.error(`❌ Player exception:`, data));
client.manager.on('playerUpdate', (player, data) => {
  // Only log if something is actually playing and we get position updates
  if (data && data.state && data.state.position && data.state.position > 1000 && data.state.position < 6000) {
    console.log(`📡 Player is actively streaming data (Pos: ${data.state.position}ms)`);
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
        content: 'Thoda ruk jao… connection establish ho raha hai 🎵',
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
    const player = client.manager.players.get(interaction.guildId);

    if (!player) {
      return interaction.reply({ content: '❌ Yahan koi gaana nahi chal raha.', ephemeral: true });
    }

    try {
      switch (interaction.customId) {
        case 'pause':
          if (!player.paused) {
            player.pause(true);
            await interaction.reply({ content: '⏸️ Gaana roka gaya.', ephemeral: true });
          } else {
            await interaction.reply({ content: '❌ Gaana pehle se hi ruka hua hai.', ephemeral: true });
          }
          break;

        case 'resume':
          if (player.paused) {
            player.pause(false);
            await interaction.reply({ content: '▶️ Gaana phir se chalu.', ephemeral: true });
          } else {
            await interaction.reply({ content: '❌ Gaana pehle se hi chal raha hai.', ephemeral: true });
          }
          break;

        case 'skip':
          player.skip();
          await interaction.reply({ content: '⏭️ Agle gaane par…', ephemeral: true });
          break;

        case 'loop':
          if (player.loop === 'none') {
            player.setLoop('track');
            await interaction.reply({ content: '🔁 Loop mode ON (Single Track)', ephemeral: true });
          } else {
            player.setLoop('none');
            await interaction.reply({ content: '🔁 Loop mode OFF', ephemeral: true });
          }
          break;

        case 'stop':
          player.queue.clear();
          player.stop();
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
  if (oldState.channel && oldState.channel.members.size === 1 && oldState.channel.members.has(client.user.id)) {
    const player = client.manager.players.get(oldState.guild.id);
    if (player) {
      player.destroy();
      console.log(`🚪 Left empty voice channel in: ${oldState.guild.name}`);
    }
  }
});

client.on('error', error => console.error('Discord client error:', error));
process.on('unhandledRejection', error => console.error('Unhandled promise rejection:', error));

// Login
client.login(botToken).catch(err => {
  console.error('\n❌ Failed to login:', err);
  console.log('\n💡 Make sure you have:\n   1. Added your bot token to Render Environment Variables (DISCORD_TOKEN)\n   2. Or added it in config.json locally');
  process.exit(1);
});
