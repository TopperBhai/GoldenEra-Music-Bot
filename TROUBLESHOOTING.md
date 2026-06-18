# 🔧 Troubleshooting Checklist

## Before You Start Troubleshooting

✅ **Completed Initial Setup?**
- [ ] Node.js installed (v18+)
- [ ] npm install completed
- [ ] config.json configured with token & client ID
- [ ] Bot invited to server with correct permissions

---

## Problem: Bot Won't Start

### Symptoms
- Error when running `npm start`
- Bot doesn't appear online in Discord

### Solutions

**1. Check Node.js Version**
```bash
node --version
```
Must be v18 or higher. Update if needed.

**2. Install Dependencies**
```bash
npm install
```

**3. Check config.json**
- Make sure token is correct (no extra spaces)
- Make sure clientId is correct
- Token format: `MTIz...ABC` (long string)
- Client ID format: `123456789012345678` (numbers only)

**4. Check Token**
- Go to Discord Developer Portal
- Bot section → Reset Token
- Copy NEW token to config.json

**5. Check Intents**
- Go to Discord Developer Portal
- Bot section → Enable:
  - ✅ Message Content Intent
  - ✅ Server Members Intent

---

## Problem: Slash Commands Not Showing

### Symptoms
- Bot is online but `/play` doesn't appear
- "Command not found" error

### Solutions

**1. Wait 1-2 Minutes**
Slash commands take time to register globally.

**2. Check Console**
Look for: `✅ Slash commands registered successfully!`

**3. Restart Discord**
Close and reopen Discord app/browser.

**4. Re-invite Bot**
- Generate new invite URL with `applications.commands` scope
- Kick bot from server
- Re-invite using new URL

**5. Check Bot Permissions**
Bot needs "Use Application Commands" permission.

---

## Problem: No Audio Playing

### Symptoms
- Bot joins voice channel
- Shows "Now Playing" but no sound

### Solutions

**1. Check Voice Channel**
- Are YOU in a voice channel?
- Can you hear other bots/users?

**2. Check Bot Permissions**
Bot needs in voice channel:
- ✅ Connect
- ✅ Speak
- ✅ Use Voice Activity

**3. Install FFmpeg**
```bash
npm install ffmpeg-static
```

**4. Test Different Song**
Try: `/play lata` or `/surprise`

**5. Check Volume**
- Discord user settings
- Bot volume slider (right-click bot in voice)

**6. Restart Bot**
Stop and start the bot again.

---

## Problem: Bot Joins But Immediately Leaves

### Symptoms
- Bot joins voice channel
- Leaves after 1-2 seconds

### Solutions

**1. Check Auto-Leave Feature**
Bot leaves if channel is empty. Make sure YOU are in the channel.

**2. Check Connection**
Poor internet can cause disconnects.

**3. Check Logs**
Look for connection errors in console.

**4. Try Different Voice Channel**
Some channels may have permission issues.

---

## Problem: Queue Not Working

### Symptoms
- Songs don't play after current song ends
- Skip doesn't work

### Solutions

**1. Check Console for Errors**
Look for YouTube/streaming errors.

**2. Try Different Songs**
Some videos may be restricted.

**3. Restart Bot**
Queue state may be corrupted.

**4. Check Radio Mode**
If radio is ON, it auto-adds songs. Use `/stop` to reset.

---

## Problem: Buttons Not Working

### Symptoms
- Click buttons but nothing happens
- "Interaction failed" error

### Solutions

**1. Check Permissions**
Bot needs "Send Messages" and "Embed Links" permissions.

**2. Buttons Expire**
Buttons expire after ~15 minutes. Use slash commands instead.

**3. Check Bot Status**
Make sure bot is still in voice channel.

**4. Use Slash Commands**
Use `/pause`, `/resume`, `/skip` instead of buttons.

---

## Problem: "Thoda ruk jao" Error

### Symptoms
- Bot shows nostalgic error message
- Song doesn't play

### Solutions

**1. Check YouTube Access**
Make sure YouTube is accessible from your network.

**2. Try Different Search**
Some songs may not be available.

**3. Check play-dl**
```bash
npm update play-dl
```

**4. Check Logs**
Console will show actual error.

---

## Problem: High CPU/Memory Usage

### Symptoms
- Bot uses too much RAM
- Computer slows down

### Solutions

**1. Reduce Queue Size**
In config.json: `"maxQueueSize": 20`

**2. Stop Radio Mode**
Use `/stop` to clear queue.

**3. Restart Bot Regularly**
If running 24/7, restart daily.

**4. Use PM2 (Production)**
```bash
npm install -g pm2
pm2 start index.js --name goldenera --max-memory-restart 500M
```

---

## Problem: Bot Offline After Some Time

### Symptoms
- Bot works initially
- Goes offline after hours/days

### Solutions

**1. Check Internet**
Bot needs stable internet connection.

**2. Check Hosting**
If on VPS/Replit, check service status.

**3. Use Process Manager**
```bash
pm2 start index.js --name goldenera
pm2 save
pm2 startup
```

**4. Add Auto-Restart**
```bash
pm2 start index.js --name goldenera --restart-delay=3000
```

---

## Problem: Modern Songs Playing

### Symptoms
- Bot plays new songs instead of old songs

### Solutions

**1. This Shouldn't Happen**
Bot is hard-coded with old song playlists.

**2. Check Playlists**
Edit `data/playlists.js` to verify songs.

**3. Search Queries**
Some queries may return wrong results. Edit query:
```javascript
{ title: "Song", artist: "Artist", year: 1975, 
  query: "song name artist original 1975" }
```

---

## Problem: Permission Errors

### Symptoms
- "Missing Permissions" error
- "Cannot read properties of null"

### Solutions

**1. Check Role Position**
Bot's role must be ABOVE voice channel roles.

**2. Check Channel Permissions**
In channel settings → Permissions → Bot role:
- ✅ Connect
- ✅ Speak
- ✅ View Channel

**3. Re-invite Bot**
Use invite URL with all permissions checked.

---

## Still Having Issues?

### Debug Steps

**1. Enable Debug Logging**
Add to index.js:
```javascript
client.on('debug', console.log);
```

**2. Check All Logs**
Read entire console output carefully.

**3. Test Basic Discord.js**
Create simple bot that responds to ping.

**4. Check Dependencies**
```bash
npm list
```
All packages should show correct versions.

**5. Fresh Install**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Error Messages Explained

### "Cannot find module"
→ Run `npm install`

### "Invalid token"
→ Check token in config.json

### "Missing Access"
→ Check bot permissions

### "Connection timeout"
→ Check internet connection

### "FFmpeg not found"
→ Run `npm install ffmpeg-static`

### "Voice connection destroyed"
→ Bot lost connection, will auto-reconnect

---

## Prevention Tips

1. **Keep Dependencies Updated**
   ```bash
   npm update
   ```

2. **Use Stable Node Version**
   Use LTS version (v18 or v20)

3. **Monitor Logs**
   Check console regularly for warnings

4. **Backup config.json**
   Keep token safe in password manager

5. **Test in Private Server**
   Test new features before public use

---

## Getting Help

If nothing works:

1. Read SETUP_GUIDE.md completely
2. Read DOCUMENTATION.md for technical details
3. Check Discord.js documentation
4. Check play-dl documentation
5. Google the specific error message

---

## Common Error Codes

- **10004** - Unknown Guild (bot not in server)
- **10062** - Unknown Interaction (expired)
- **50001** - Missing Access
- **50013** - Missing Permissions
- **40001** - Unauthorized (wrong token)

---

**Remember:** Most issues are permission or configuration related!

Good luck! 🎵
