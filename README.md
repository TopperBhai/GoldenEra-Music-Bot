# 🎶 GoldenEra - Old Is Gold Music Bot

The world's most user-friendly Discord music bot for classic songs.

## 🌟 Features

- **Zero friction**: No URLs, no complex commands
- **Smart playlists**: Kishore Kumar, Lata Mangeshkar, R.D. Burman, and more
- **Mood-based playback**: Sad, romantic, chill, rainy night
- **Auto voice management**: Joins and leaves automatically
- **Button controls**: Pause, resume, skip, loop, like
- **Nostalgic experience**: Emotional messages for every song
- **Classic songs only**: 1960s-2000s Hindi, 1960s-1990s English

## 🚀 Setup

1. Install Node.js (v18 or higher)

2. Install dependencies:
```bash
npm install
```

3. Create a Discord bot:
   - Go to https://discord.com/developers/applications
   - Create a new application
   - Go to "Bot" section and create a bot
   - Enable "Message Content Intent" and "Server Members Intent"
   - Copy the token

4. Configure the bot:
   - Edit `config.json` and add your bot token and client ID

5. Invite the bot to your server:
   - Go to OAuth2 > URL Generator
   - Select scopes: `bot`, `applications.commands`
   - Select permissions: `Connect`, `Speak`, `Send Messages`, `Embed Links`
   - Copy the URL and invite the bot

6. Start the bot:
```bash
npm start
```

## 🎵 Commands

### Play Commands
- `/play kishore` - Play Kishore Kumar classics
- `/play lata` - Play Lata Mangeshkar hits
- `/play 90s` - Play 90s Bollywood love songs
- `/play old-hindi` - Play classic Hindi songs
- `/play old-english` - Play old English classics

### Mood Commands
- `/mood sad` - Play emotional old songs
- `/mood romantic` - Play romantic classics
- `/mood chill` - Play relaxing old songs
- `/mood rain` - Play rainy night classics

### Special Commands
- `/surprise` - Play a legendary random old song
- `/radio` - Nonstop old songs until stopped
- `/nowplaying` - Show current song details

### Control Commands
- `/pause` - Pause the current song
- `/resume` - Resume playback
- `/skip` - Skip to next song
- `/stop` - Stop playback and clear queue

### Help
- `/help` - Show all commands and usage

## 🛠️ Tech Stack

- Discord.js v14
- @discordjs/voice for audio streaming
- play-dl for YouTube audio
- FFmpeg for audio processing

## 📝 Notes

- The bot only plays classic songs (no modern music)
- Auto joins your voice channel when you use a play command
- Auto leaves when the voice channel is empty
- Default volume is set to ear-safe levels

## ❤️ Made with love for nostalgia

Aankhen band karo… purane gaano ka jaadu shuru.
