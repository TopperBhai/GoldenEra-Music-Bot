# 🎵 GoldenEra Bot - Technical Documentation

## Architecture Overview

### Core Components

1. **index.js** - Main bot file
   - Discord client initialization
   - Command registration
   - Event handling
   - Button interaction handling
   - Auto-leave functionality

2. **utils/musicPlayer.js** - Music player system
   - Queue management
   - Voice connection handling
   - Audio streaming
   - Playback controls
   - Radio mode

3. **data/playlists.js** - Song database
   - Pre-curated playlists
   - Song metadata (title, artist, year)
   - Search queries for YouTube
   - Random song selection
   - Nostalgic messages

4. **commands/** - Slash command handlers
   - play.js - Category-based playback
   - mood.js - Mood-based playback
   - surprise.js - Random song
   - radio.js - Non-stop mode
   - nowplaying.js - Current song info
   - pause.js, resume.js, skip.js, stop.js - Controls
   - help.js - Command documentation

---

## Features

### 🎯 Core Features

1. **Zero-Friction UX**
   - No YouTube URLs required
   - Automatic voice channel joining
   - Automatic leaving when channel empty
   - Smart playlist selection

2. **Smart Playlists**
   - Kishore Kumar Classics
   - Lata Mangeshkar Hits
   - 90s Bollywood Love
   - Classic Hindi Songs
   - Old English Classics

3. **Mood-Based Playback**
   - Sad - Emotional classics
   - Romantic - Love songs
   - Chill - Relaxing vibes
   - Rain - Rainy night mood

4. **Interactive Controls**
   - Button-based controls (Pause, Resume, Skip, Loop, Stop)
   - Real-time status updates
   - Queue management
   - Loop mode

5. **Radio Mode**
   - Non-stop playback
   - Auto-queue refill
   - Continuous music

6. **Nostalgic Experience**
   - Emotional messages for each song
   - Era information (1960s-2000s)
   - Artist details
   - Beautiful embeds

---

## Command Reference

### Play Commands

#### `/play <category>`
Plays songs from a specific category.

**Categories:**
- `kishore` - Kishore Kumar classics
- `lata` - Lata Mangeshkar hits
- `90s` - 90s Bollywood love songs
- `old-hindi` - Classic Hindi songs
- `old-english` - Old English classics

**Example:**
```
/play kishore
```

**Behavior:**
1. Checks if user is in voice channel
2. Connects to voice channel
3. Picks random song from category
4. Adds to queue
5. Plays if queue is empty
6. Shows song embed with buttons

---

### Mood Commands

#### `/mood <feeling>`
Plays songs based on your current mood.

**Moods:**
- `sad` - Emotional old songs
- `romantic` - Romantic classics
- `chill` - Relaxing songs
- `rain` - Rainy night mood

**Example:**
```
/mood romantic
```

**Behavior:**
- Similar to `/play` but uses mood-based playlists
- Shows mood-specific message
- Creates nostalgic atmosphere

---

### Special Commands

#### `/surprise`
Plays a random legendary old song from all playlists.

**Example:**
```
/surprise
```

**Behavior:**
- Picks from entire song database
- Creates surprise element
- Great for discovery

---

#### `/radio`
Starts non-stop old songs until manually stopped.

**Example:**
```
/radio
```

**Behavior:**
- Enables radio mode
- Adds 5 songs to queue initially
- Auto-refills queue when empty
- Continues until `/stop` is used

---

#### `/nowplaying`
Shows current song details.

**Example:**
```
/nowplaying
```

**Shows:**
- Song title
- Artist name
- Year
- Queue length
- Playback status (Playing/Paused)

---

### Control Commands

#### `/pause`
Pauses the current song.

#### `/resume`
Resumes the paused song.

#### `/skip`
Skips to the next song in queue.

#### `/stop`
Stops playback and clears the entire queue.

---

## Button Controls

Every song embed includes 5 buttons:

1. **⏸️ Pause** - Pause current song
2. **▶️ Resume** - Resume playback
3. **⏭️ Skip** - Skip to next song
4. **🔁 Loop** - Toggle loop mode
5. **⏹️ Stop** - Stop and clear queue

**Note:** Buttons are clickable by anyone in the server.

---

## Music Player System

### Queue Management

The bot uses a sophisticated queue system:

```javascript
class MusicPlayer {
  - queue: Array of songs
  - currentSong: Currently playing song
  - connection: Voice connection
  - player: Audio player
  - isPlaying: Boolean
  - isPaused: Boolean
  - loopMode: Boolean
  - radioMode: Boolean
}
```

### Playback Flow

1. User executes play command
2. Bot joins voice channel
3. Song added to queue
4. If not playing, start playback
5. Stream audio from YouTube
6. When song ends:
   - If loop mode: replay current
   - If radio mode & queue empty: add more songs
   - Else: play next in queue

### Auto-Leave Feature

Bot automatically leaves when:
- Voice channel becomes empty
- Only bot remains in channel
- Connection is lost

---

## Song Database Structure

Each song has:
```javascript
{
  title: "Song Name",
  artist: "Artist Name",
  year: 1975,
  query: "search query for youtube"
}
```

**Current Database:**
- ~100 curated classic songs
- Organized by artist/category
- Pre-tested search queries
- Optimized for accurate results

---

## Error Handling

### User-Friendly Errors

Instead of technical errors, users see:
- ❌ "Pehle voice channel mein aao…"
- 🎵 "Thoda ruk jao… yaadon ka record load ho raha hai"
- ❌ "Abhi koi gaana nahi chal raha hai"

### System Error Handling

- Stream failures: Auto-skip to next song
- Connection drops: Auto-reconnect attempt
- Invalid commands: Graceful error messages
- Permission issues: Clear guidance

---

## Performance Optimization

1. **Lazy Loading**
   - Commands loaded on startup
   - Playlists cached in memory

2. **Memory Management**
   - Queue size limits
   - Auto-cleanup on stop
   - Connection recycling

3. **Streaming**
   - Uses play-dl for efficient streaming
   - FFmpeg for audio processing
   - Volume normalization

---

## Customization Guide

### Adding New Songs

Edit `data/playlists.js`:

```javascript
kishore: [
  ...existing songs,
  { 
    title: "New Song", 
    artist: "Kishore Kumar", 
    year: 1980, 
    query: "new song kishore kumar original" 
  }
]
```

### Adding New Playlists

1. Add playlist in `data/playlists.js`
2. Add choice in command file
3. Restart bot

### Changing Messages

Edit `nostalgicMessages` array in `data/playlists.js`:

```javascript
export const nostalgicMessages = [
  "Your custom message here ✨",
  // ... more messages
];
```

---

## Security Best Practices

1. **Never commit config.json**
   - Use .gitignore
   - Keep token secret

2. **Use environment variables in production**
   ```javascript
   const token = process.env.DISCORD_TOKEN || config.token;
   ```

3. **Validate user permissions**
   - Check voice channel membership
   - Validate command inputs

4. **Rate limiting**
   - Discord.js handles this automatically
   - Avoid spam in button handlers

---

## Deployment Options

### Local Development
```bash
npm start
```

### Production with PM2
```bash
npm install -g pm2
pm2 start index.js --name goldenera
pm2 save
pm2 startup
```

### Docker (Optional)
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
CMD ["node", "index.js"]
```

---

## Monitoring & Logs

### Console Logs

Bot logs:
- Startup status
- Command execution
- Voice state changes
- Error messages

### Adding Custom Logging

```javascript
import fs from 'fs';

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync('bot.log', logMessage);
  console.log(logMessage);
}
```

---

## API Rate Limits

### Discord API
- 50 requests per second per bot
- Handled automatically by discord.js

### YouTube (via play-dl)
- No official limit
- Avoid excessive searches
- Cache results when possible

---

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Wait for slash commands to register (1-2 min)
   - Check bot permissions
   - Verify bot is online

2. **No audio**
   - Check FFmpeg installation
   - Verify voice permissions
   - Check bot's voice connection

3. **Queue not working**
   - Check console for errors
   - Verify YouTube access
   - Test with different songs

4. **Memory issues**
   - Reduce max queue size
   - Clear queue regularly
   - Restart bot periodically

---

## Future Enhancements

Potential features to add:

1. **Admin Commands**
   - Set era range (e.g., only 1970s-1980s)
   - Language preferences
   - Volume control

2. **User Features**
   - Favorites system
   - Request history
   - Personal playlists

3. **Advanced Controls**
   - Seek forward/backward
   - Shuffle mode
   - Repeat queue

4. **Statistics**
   - Most played songs
   - Usage analytics
   - Top users

---

## Contributing

To contribute:
1. Fork the repository
2. Create feature branch
3. Add songs or features
4. Test thoroughly
5. Submit pull request

---

## License

MIT License - Free to use and modify

---

## Credits

Built with:
- Discord.js v14
- @discordjs/voice
- play-dl
- FFmpeg

---

## Support

For issues or questions:
1. Check SETUP_GUIDE.md
2. Review this documentation
3. Check console logs
4. Test with simple commands

---

**Made with ❤️ for nostalgia**

Aankhen band karo… purane gaano ka jaadu shuru ✨
