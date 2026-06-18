import { BaseExtractor, Track } from 'discord-player';
import CryptoJS from 'crypto-js';
import axios from 'axios';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// ─── Shared helper: decrypt + download a JioSaavn track to a temp file ────────
// Called from play.js BEFORE player.play() so the voice connection never waits.
export async function preloadJioSaavnTrack(trackId) {
  // 1. Fetch encrypted URL
  const detailUrl = `https://www.jiosaavn.com/api.php?__call=song.getDetails&cc=in&_marker=0%3F_marker%3D0&_format=json&pids=${trackId}`;
  const res = await fetch(detailUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' }
  });
  const data = await res.json();

  if (!data[trackId]?.encrypted_media_url) {
    throw new Error('JioSaavn did not return an encrypted media URL.');
  }

  // 2. Decrypt
  const enc = data[trackId].encrypted_media_url;
  const key = CryptoJS.enc.Utf8.parse('38346591');
  const dec = CryptoJS.DES.decrypt({ ciphertext: CryptoJS.enc.Base64.parse(enc) }, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
  let streamUrl = dec.toString(CryptoJS.enc.Utf8);

  // 3. Force 320kbps
  streamUrl = streamUrl.replace('_96.mp4', '_320.mp4').replace('_160.mp4', '_320.mp4');

  // 4. Download with Android UA (bypasses Akamai CDN blocks on datacenters)
  console.log(`📥 Pre-downloading JioSaavn track ${trackId}...`);
  const response = await axios.get(streamUrl, {
    responseType: 'arraybuffer',
    headers: { 'User-Agent': 'Dalvik/2.1.0 (Linux; U; Android 11; SM-G991B Build/RP1A.200720.012)' },
    timeout: 30000
  });

  const tmpPath = join(tmpdir(), `jiosaavn_${trackId}_${Date.now()}.mp4`);
  writeFileSync(tmpPath, Buffer.from(response.data));
  console.log(`✅ Pre-downloaded ${(response.data.byteLength / 1024 / 1024).toFixed(2)}MB → ${tmpPath}`);

  // 5. Cleanup after 10 minutes
  setTimeout(() => {
    try { if (existsSync(tmpPath)) { unlinkSync(tmpPath); console.log(`🧹 Cleaned up ${tmpPath}`); } } catch(e) {}
  }, 600000);

  return tmpPath;
}
// ─────────────────────────────────────────────────────────────────────────────

export class JioSaavnExtractor extends BaseExtractor {
  static identifier = 'JioSaavnExtractor';

  async activate() {
    this.protocols = ['jiosaavn', 'saavn'];
  }

  async validate(query, type) {
    if (type === 'arbitrary') return true;
    return type === 'AUTO' || !query.startsWith('http') || query.includes('jiosaavn.com') || query.includes('saavn.com');
  }

  async handle(query, context) {
    try {
      const searchUrl = `https://www.jiosaavn.com/api.php?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(query)}`;
      const res = await fetch(searchUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' }
      });
      const data = await res.json();

      if (!data.songs?.data?.length) return this.createResponse(null, []);

      const trackInfo = data.songs.data[0];
      const image = trackInfo.image.replace('50x50', '500x500');

      let author = 'Unknown Artist';
      if (trackInfo.more_info?.singers) author = trackInfo.more_info.singers;
      else if (trackInfo.description) author = trackInfo.description.split('·')[1]?.trim() || 'Unknown Artist';

      const track = new Track(this.context.player, {
        title: trackInfo.title,
        author,
        url: trackInfo.url,
        thumbnail: image,
        duration: '0:00',
        views: 0,
        requestedBy: context.requestedBy,
        source: 'arbitrary',
        raw: trackInfo
      });

      track.extractor = this;
      return this.createResponse(null, [track]);
    } catch (e) {
      console.error('JioSaavn Search Error:', e);
      return this.createResponse(null, []);
    }
  }

  async stream(info) {
    try {
      // If play.js pre-downloaded the file, return the path INSTANTLY (no blocking)
      if (info.raw?.localPath && existsSync(info.raw.localPath)) {
        console.log(`⚡ Using pre-downloaded file: ${info.raw.localPath}`);
        return info.raw.localPath;
      }

      // Fallback: download now (slower path — voice connection may time out)
      const trackId = info.raw?.id;
      if (!trackId) throw new Error('No JioSaavn ID found for stream request.');
      const tmpPath = await preloadJioSaavnTrack(trackId);
      return tmpPath;
    } catch (error) {
      console.error('🔥 JioSaavn stream error:', error.message);
      try {
        const queue = this.context.player.nodes.get(info.guildId);
        if (queue?.metadata?.channel) queue.metadata.channel.send(`⚠️ JioSaavn Stream Error: ${error.message}`);
      } catch(e) {}
      throw error;
    }
  }
}
