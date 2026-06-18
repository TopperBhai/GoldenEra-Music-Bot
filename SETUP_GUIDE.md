# 🎵 GoldenEra Bot - Complete Setup Guide

## Prerequisites

Before you begin, make sure you have:
- **Node.js v18 or higher** installed
- A **Discord account**
- Basic understanding of Discord

---

## Step 1: Create a Discord Bot

1. Go to https://discord.com/developers/applications
2. Click **"New Application"**
3. Name it **"GoldenEra"** (or any name you like)
4. Click **Create**

### Configure Bot Settings

1. Go to the **"Bot"** section in the left sidebar
2. Click **"Add Bot"** → Confirm
3. Under **"Privileged Gateway Intents"**, enable:
   - ✅ **Message Content Intent**
   - ✅ **Server Members Intent**
4. Under **"TOKEN"**, click **"Reset Token"** and copy it
   - ⚠️ **Keep this token secret!** Never share it publicly

### Get Your Client ID

1. Go to **"OAuth2"** → **"General"**
2. Copy the **"CLIENT ID"**

---

## Step 2: Configure the Bot

1. Open `config.json` in the project folder
2. Replace the values:

```json
{
  "token": "YOUR_BOT_TOKEN_HERE",     ← Paste your bot token
  "clientId": "YOUR_CLIENT_ID_HERE",  ← Paste your client ID
  "defaultVolume": 0.5,
  "eraStart": 1960,
  "eraEnd": 2000,
  "maxQueueSize": 100
}
```

---

## Step 3: Install Dependencies

Open terminal in the project folder and run:

```bash
npm install
```

This will install:
- discord.js (Discord API)
- @discordjs/voice (Voice support)
- play-dl (YouTube audio)
- FFmpeg (Audio processing)

---

## Step 4: Invite Bot to Your Server

1. Go to **"OAuth2"** → **"URL Generator"**
2. Under **"SCOPES"**, select:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Under **"BOT PERMISSIONS"**, select:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Connect
   - ✅ Speak
   - ✅ Use Voice Activity
4. Copy the **Generated URL** at the bottom
5. Open the URL in your browser
6. Select your server and click **"Authorize"**

---

## Step 5: Start the Bot

```bash
npm start
```

You should see:
```
🎵 ════════════════════════════════════════════════ 🎵
   GoldenEra Bot is Online!
   Logged in as: GoldenEra#1234
   Serving: 1 servers
🎵 ════════════════════════════════════════════════ 🎵

✅ Slash commands registered successfully!
```

---

## Step 6: Test the Bot

1. Join a voice channel in your Discord server
2. Type `/help` to see all commands
3. Type `/play kishore` to play Kishore Kumar songs
4. Use buttons to control playback!

---

## Troubleshooting

### "Cannot find module 'discord.js'"
Run: `npm install`

### "Invalid token"
- Check if you copied the token correctly in `config.json`
- Make sure there are no extra spaces
- Try resetting the token in Discord Developer Portal

### "Missing Permissions"
- Make sure you enabled the bot permissions when inviting
- Check if bot has "Connect" and "Speak" permissions in voice channels

### "No audio playing"
- Make sure FFmpeg is installed
- Check if you're in a voice channel
- Try running: `npm install ffmpeg-static`

### Bot not responding to commands
- Wait 1-2 minutes after starting the bot (commands need to register)
- Try restarting the bot
- Make sure bot is online (green dot in Discord)

---

## Commands Quick Reference

### Play Commands
- `/play kishore` - Kishore Kumar classics
- `/play lata` - Lata Mangeshkar hits
- `/play 90s` - 90s love songs
- `/play old-hindi` - Classic Hindi
- `/play old-english` - Old English

### Mood Commands
- `/mood sad` - Sad songs
- `/mood romantic` - Love songs
- `/mood chill` - Chill vibes
- `/mood rain` - Rainy night

### Special
- `/surprise` - Random classic
- `/radio` - Non-stop mode
- `/nowplaying` - Current song

### Controls
- `/pause` - Pause
- `/resume` - Resume
- `/skip` - Skip
- `/stop` - Stop & clear

---

## Advanced: Run Bot 24/7

### Option 1: Use a VPS (Recommended)
1. Get a VPS (DigitalOcean, AWS, Heroku)
2. Install Node.js on the VPS
3. Upload your bot files
4. Run: `npm install`
5. Use PM2 to keep bot running:
   ```bash
   npm install -g pm2
   pm2 start index.js --name goldenera
   pm2 save
   pm2 startup
   ```

### Option 2: Use Replit
1. Create account on replit.com
2. Import from GitHub
3. Add secrets (token, clientId)
4. Click "Run"
5. Use UptimeRobot to keep it alive

### Option 3: Use Railway.app
1. Create account on railway.app
2. New Project → Deploy from GitHub
3. Add environment variables
4. Deploy!

---

## Support

If you face any issues:
1. Check if all dependencies are installed
2. Verify token and client ID
3. Check bot permissions
4. Restart the bot

---

## Made with ❤️ for nostalgia

Aankhen band karo… purane gaano ka jaadu shuru ✨
