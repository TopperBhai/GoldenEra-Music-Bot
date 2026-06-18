import { BaseExtractor } from 'discord-player';
import youtubedl from 'youtube-dl-exec';

export class YtDlpExtractor extends BaseExtractor {
  static identifier = 'YtDlpExtractor';

  async validate() {
    return false; // We don't use this for searching, only for streaming
  }

  async handle() {
    return this.createResponse(null, []);
  }

  async stream(info) {
    try {
      console.log(`[YtDlpExtractor] Extracting stream for: ${info.url}`);
      const output = await youtubedl(info.url, {
        dumpSingleJson: true,
        noWarnings: true,
        noCallHome: true,
        noCheckCertificate: true,
        youtubeSkipDashManifest: true,
        format: 'bestaudio',
      });
      console.log(`[YtDlpExtractor] Successfully extracted stream!`);
      return output.url; // Return the raw googlevideo string URL
    } catch (e) {
      console.log(`[YtDlpExtractor] Error:`, e.message);
      throw e;
    }
  }
}
