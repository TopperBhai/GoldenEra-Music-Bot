# 🎵 GoldenEra - Quick Start (5 Minutes)

## What You Need

1. **Node.js** (Download from nodejs.org)
2. **Discord Account**
3. **5 minutes of your time**

---

## Quick Setup

### 1️⃣ Create Discord Bot (2 minutes)

1. Go to https://discord.com/developers/applications
2. Click "New Application" → Name it "GoldenEra"
3. Go to "Bot" → "Add Bot"
4. Enable these intents:
   - ✅ Message Content Intent
   - ✅ Server Members Intent
5. Copy your **TOKEN** (Reset Token → Copy)
6. Go to "OAuth2" → Copy your **CLIENT ID**

### 2️⃣ Configure Bot (1 minute)

Open `config.json` and paste your values:

```json
{
  "token": "paste_your_token_here",
  "clientId": "paste_your_client_id_here",
  "defaultVolume": 0.5,
  "eraStart": 1960,
  "eraEnd": 2000,
  "maxQueueSize": 100
}
```

### 3️⃣ Install & Run (2 minutes)

**On Windows:** Double-click `start.bat`

**Or manually:**
```bash
npm install
npm start
```

### 4️⃣ Invite Bot

1. Go to Discord Developer Portal
2. OAuth2 → URL Generator
3. Select: `bot` + `applications.commands`
4. Permissions: Connect, Speak, Send Messages, Embed Links
5. Copy URL → Open in browser → Add to your server

---

## First Use

1. Join a voice channel
2. Type `/help`
3. Type `/play kishore`
4. Enjoy! 🎵

---

## All Commands

```
🎤 Play Commands:
/play kishore    - Kishore Kumar classics
/play lata       - Lata Mangeshkar hits
/play 90s        - 90s love songs
/play old-hindi  - Classic Hindi
/play old-english - Old English

😊 Mood Commands:
/mood sad        - Sad songs
/mood romantic   - Love songs
/mood chill      - Chill vibes
/mood rain       - Rainy mood

✨ Special:
/surprise        - Random classic
/radio          - Non-stop mode
/nowplaying     - Song info

🎮 Controls:
/pause, /resume, /skip, /stop
```

---

## Troubleshooting

**Bot not working?**
1. Wait 1-2 minutes after starting
2. Check token in config.json
3. Restart the bot

**No audio?**
- Make sure you're in a voice channel
- Bot needs "Connect" and "Speak" permissions

**Need help?**
- See `SETUP_GUIDE.md` for detailed instructions
- See `DOCUMENTATION.md` for technical details

---

## That's It!

You now have the **world's most user-friendly Discord music bot** for old songs! ❤️

**Features:**
✅ No YouTube links needed
✅ Auto-joins voice channel
✅ Smart playlists
✅ Mood-based playback
✅ Button controls
✅ Nostalgic messages

---

Aankhen band karo… purane gaano ka jaadu shuru ✨
