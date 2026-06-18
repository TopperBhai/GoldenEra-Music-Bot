import { BaseExtractor, Track } from 'discord-player';
import CryptoJS from 'crypto-js';
import axios from 'axios';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export class JioSaavnExtractor extends BaseExtractor {
  static identifier = 'JioSaavnExtractor';

  async activate() {
    this.protocols = ['jiosaavn', 'saavn'];
  }

  async validate(query, type) {
    // Accept text searches, JioSaavn URLs, and arbitrary source tracks (for stream resolution)
    if (type === 'arbitrary') return true;
    return type === 'AUTO' || !query.startsWith('http') || query.includes('jiosaavn.com') || query.includes('saavn.com');
  }

  async handle(query, context) {
    try {
      // 1. Hit the official JioSaavn search API using a browser User-Agent
      const searchUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(query)}`;
      const res = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' }
      });
      const data = await res.json();
      
      if (!data.songs || !data.songs.data || data.songs.data.length === 0) {
        return this.createResponse(null, []);
      }

      // 2. We take the top result which will always be the original studio track
      const trackInfo = data.songs.data[0];
      
      // 3. Upgrade thumbnail resolution
      const image = trackInfo.image.replace('50x50', '500x500');
      
      // Extract singer for proper metadata
      let author = 'Unknown Artist';
      if (trackInfo.more_info?.singers) {
        author = trackInfo.more_info.singers;
      } else if (trackInfo.description) {
        author = trackInfo.description.split('·')[1]?.trim() || 'Unknown Artist';
      }

      // 4. Wrap it in a discord-player Track object
      const track = new Track(this.context.player, {
        title: trackInfo.title,
        author: author,
        url: trackInfo.url,
        thumbnail: image,
        duration: '0:00',
        views: 0,
        requestedBy: context.requestedBy,
        source: 'arbitrary',
        raw: trackInfo
      });

      // 5. Explicitly bind this extractor so discord-player routes stream() back to us
      track.extractor = this;

      return this.createResponse(null, [track]);
    } catch (e) {
      console.error('JioSaavn Search Error:', e);
      return this.createResponse(null, []);
    }
  }

  async stream(info) {
    try {
      const trackId = info.raw.id;
      if (!trackId) throw new Error('No JioSaavn ID found for stream request.');

      // 1. Fetch encrypted URL using the song details API
      const detailUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0%3F_marker%3D0&_format=json&pids=${trackId}`;
      const res = await fetch(detailUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' }
      });
      const data = await res.json();
      
      if (!data[trackId] || !data[trackId].encrypted_media_url) {
        throw new Error('JioSaavn did not return an encrypted media URL.');
      }

      // 2. Decrypt the raw MP4 stream URL using JioSaavn's static DES-ECB key
      const enc = data[trackId].encrypted_media_url;
      const key = CryptoJS.enc.Utf8.parse('38346591');
      const dec = CryptoJS.DES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(enc) }, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
      let streamUrl = dec.toString(CryptoJS.enc.Utf8);

      // 3. Force 320kbps premium quality 
      streamUrl = streamUrl.replace('_96.mp4', '_320.mp4').replace('_160.mp4', '_320.mp4');

      // 4. Download the COMPLETE MP4 file to a local temp file using Android app spoofing.
      //    WHY: discord-player's internal FFmpeg uses default headers (blocked by Akamai on datacenters).
      //    Piping through Node.js streams fails because FFmpeg can't seek the MP4 MOOV atom.
      //    By downloading first and giving FFmpeg a local file path, it can seek freely and parse perfectly.
      console.log(`📥 Downloading JioSaavn track ${trackId} to temp file...`);
      
      const response = await axios.get(streamUrl, {
        responseType: 'arraybuffer',
        headers: { 'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; SM-G991B Build/RP1A.200720.012)' },
        timeout: 30000 // 30 second timeout
      });

      const tmpPath = join(tmpdir(), `jiosaavn_${trackId}_${Date.now()}.mp4`);
      writeFileSync(tmpPath, Buffer.from(response.data));
      
      console.log(`✅ Downloaded ${(response.data.byteLength / 1024 / 1024).toFixed(2)}MB to ${tmpPath}`);

      // 5. Schedule cleanup after 10 minutes (song will be done by then)
      setTimeout(() => {
        try { 
          if (existsSync(tmpPath)) {
            unlinkSync(tmpPath);
            console.log(`🧹 Cleaned up temp file: ${tmpPath}`);
          }
        } catch(e) {}
      }, 600000);

      // 6. Return the LOCAL file path. discord-player's FFmpeg can seek local files perfectly,
      //    resolving both the Akamai block AND the MP4 MOOV atom seeking issue.
      return tmpPath;
    } catch (error) {
      console.error('🔥 CRITICAL ERROR IN JIOSAAVN STREAM:', error.message);
      try {
        const queue = this.context.player.nodes.get(info.guildId);
        if (queue && queue.metadata && queue.metadata.channel) {
           queue.metadata.channel.send(`⚠️ JioSaavn Stream Error: ${error.message}`);
        }
      } catch(e) {}
      throw error;
    }
  }
}
