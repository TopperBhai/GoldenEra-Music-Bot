import { BaseExtractor, Track } from 'discord-player';
import CryptoJS from 'crypto-js';
import { Readable } from 'stream';
import axios from 'axios';

export class JioSaavnExtractor extends BaseExtractor {
  static identifier = 'JioSaavnExtractor';

  async activate() {
    this.protocols = ['jiosaavn', 'saavn'];
  }

  async validate(query, type) {
    // Handle text searches natively to ensure we only get original Hindi tracks
    return type === 'AUTO' || !query.startsWith('http');
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
        duration: '0:00', // Duration fetched on stream resolution if needed
        views: 0,
        requestedBy: context.requestedBy,
        source: 'arbitrary', // using 'arbitrary' stops other Extractors from attempting to bridge it
        raw: trackInfo // Store the JioSaavn payload so we can grab the ID during streaming
      });

      // 5. CRITICAL FIX: Explicitly tell discord-player that this extractor handles this track's stream!
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

      // 4. Return a backward-compatible stream using axios for Render's older Node version
      const streamRes = await axios.get(streamUrl, { 
        responseType: 'stream',
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36' }
      });
      return streamRes.data;
    } catch (error) {
      console.error('🔥 CRITICAL ERROR IN JIOSAAVN STREAM:', error);
      throw error;
    }
  }
}
