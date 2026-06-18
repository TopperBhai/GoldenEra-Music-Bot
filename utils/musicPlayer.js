import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
  NoSubscriberBehavior
} from '@discordjs/voice';
import { spawn } from 'child_process';
import youtubeDlExec from 'youtube-dl-exec';
import yts from 'yt-search';
import { getRandomMessage, getAllSongs } from '../data/playlists.js';

const queues = new Map();
const radioMode = new Map();

export class MusicPlayer {
  constructor(guildId) {
    this.guildId = guildId;
    this.queue = [];
    this.currentSong = null;
    this.connection = null;
    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play
      }
    });
    this.isPlaying = false;
    this.isPaused = false;
    this.loopMode = false;
    this.radioMode = false;
    
    this.player.on(AudioPlayerStatus.Idle, () => {
      if (this.loopMode && this.currentSong) {
        this.playSong(this.currentSong);
      } else {
        this.playNext();
      }
    });

    this.player.on('error', error => {
      console.error(`Player error in guild ${guildId}:`, error);
      this.playNext();
    });
  }

  async connect(channel) {
    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true
    });

    try {
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30000);
    } catch (error) {
      console.error('Failed to join voice channel:', error);
      this.connection.destroy();
      throw error;
    }

    this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(this.connection, VoiceConnectionStatus.Signalling, 5000),
          entersState(this.connection, VoiceConnectionStatus.Connecting, 5000)
        ]);
      } catch (error) {
        this.connection.destroy();
        queues.delete(this.guildId);
      }
    });

    this.connection.subscribe(this.player);
  }

  async addToQueue(song) {
    this.queue.push(song);
    
    if (!this.isPlaying) {
      await this.playNext();
    }
  }

  async addAndPlay(song) {
    // If nothing is playing, play immediately
    if (!this.isPlaying) {
      return await this.playSong(song);
    } else {
      // Add to queue
      this.queue.push(song);
      return null;
    }
  }

  async playSong(song) {
    try {
      this.currentSong = song;
      this.isPlaying = true;
      this.isPaused = false;

      console.log(`🔍 Searching for: ${song.query}`);

      // Search for the song on YouTube using yt-search
      const searchResults = await yts(song.query);
      
      if (!searchResults || !searchResults.videos || searchResults.videos.length === 0) {
        console.error(`❌ No results found for: ${song.query}`);
        this.playNext();
        return null;
      }

      const video = searchResults.videos[0];
      console.log(`✅ Found: ${video.title}`);
      console.log(`🎵 Video URL: ${video.url}`);

      // Use youtube-dl-exec to get audio stream URL
      const info = await youtubeDlExec(video.url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        youtubeSkipDashManifest: true,
        format: 'bestaudio[ext=webm]/bestaudio/best'
      });

      // Get the audio URL from the info
      const audioUrl = info.url || info.requested_formats?.[0]?.url;
      
      if (!audioUrl) {
        console.error('❌ Could not get audio URL from video');
        this.playNext();
        return null;
      }

      console.log(`🎧 Streaming audio from extracted URL`);

      // Create audio resource from URL using ffmpeg via spawn
      const ffmpegProcess = spawn('ffmpeg', [
        '-reconnect', '1',
        '-reconnect_streamed', '1',
        '-reconnect_delay_max', '5',
        '-i', audioUrl,
        '-analyzeduration', '0',
        '-loglevel', '0',
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2',
        'pipe:1'
      ], {
        stdio: ['ignore', 'pipe', 'ignore']
      });

      ffmpegProcess.on('error', (error) => {
        console.error('FFmpeg process error:', error);
      });

      const resource = createAudioResource(ffmpegProcess.stdout, {
        inputType: StreamType.Raw,
        inlineVolume: true
      });

      resource.volume.setVolume(0.5);
      this.player.play(resource);

      console.log(`🎶 Now playing: ${song.title}`);

      return {
        title: song.title,
        artist: song.artist,
        year: song.year,
        url: video.url,
        thumbnail: video.thumbnail || null,
        message: getRandomMessage()
      };

    } catch (error) {
      console.error('Error playing song:', error);
      this.playNext();
      return null;
    }
  }

  async playNext() {
    if (this.queue.length === 0) {
      if (this.radioMode) {
        // Auto-add more songs in radio mode
        const allSongs = getAllSongs();
        const randomSong = allSongs[Math.floor(Math.random() * allSongs.length)];
        console.log('📻 Radio mode: Auto-adding new song to queue');
        return await this.playSong(randomSong);
      }
      this.isPlaying = false;
      this.currentSong = null;
      return null;
    }

    const nextSong = this.queue.shift();
    return await this.playSong(nextSong);
  }

  pause() {
    if (this.isPlaying && !this.isPaused) {
      this.player.pause();
      this.isPaused = true;
      return true;
    }
    return false;
  }

  resume() {
    if (this.isPaused) {
      this.player.unpause();
      this.isPaused = false;
      return true;
    }
    return false;
  }

  skip() {
    if (this.loopMode) {
      this.loopMode = false;
    }
    this.player.stop();
    return true;
  }

  stop() {
    this.queue = [];
    this.currentSong = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.radioMode = false;
    this.loopMode = false;
    this.player.stop();
    
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
    
    queues.delete(this.guildId);
  }

  toggleLoop() {
    this.loopMode = !this.loopMode;
    return this.loopMode;
  }

  setRadioMode(enabled) {
    this.radioMode = enabled;
    radioMode.set(this.guildId, enabled);
  }

  getQueue() {
    return this.queue;
  }

  getCurrentSong() {
    return this.currentSong;
  }
}

export function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, new MusicPlayer(guildId));
  }
  return queues.get(guildId);
}

export function isInRadioMode(guildId) {
  return radioMode.get(guildId) || false;
}
