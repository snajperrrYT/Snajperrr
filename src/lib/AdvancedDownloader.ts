import { Innertube, UniversalCache } from 'youtubei.js';
import fs from 'fs';
import path from 'path';
import EventEmitter from 'events';

export interface DownloadOptions {
  url: string;
  outputPath: string;
  format: 'audio' | 'video' | 'both';
  quality?: 'best' | 'lowest';
}

export class AdvancedDownloader extends EventEmitter {
  private yt: Innertube | null = null;

  constructor() {
    super();
  }

  public async initialize() {
    if (!this.yt) {
      this.yt = await Innertube.create({ cache: new UniversalCache(false), generate_session_locally: true });
    }
  }

  public async download(options: DownloadOptions): Promise<string> {
    await this.initialize();
    if (!this.yt) throw new Error('Innertube not initialized');

    this.emit('start', options.url);

    try {
      const info = await this.yt.getBasicInfo(options.url);
      const title = info.basic_info.title?.replace(/[^a-zA-Z0-9 ]/g, '') || 'download';
      
      let finalPath = '';
      
      const ensureDir = (p: string) => {
        if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
      };
      
      ensureDir(options.outputPath);

      if (options.format === 'audio') {
        finalPath = path.join(options.outputPath, `${title}.m4a`);
        await this.downloadStream(options.url, finalPath, { type: 'audio', quality: options.quality || 'best' });
      } else if (options.format === 'video') {
        finalPath = path.join(options.outputPath, `${title}.mp4`);
        await this.downloadStream(options.url, finalPath, { type: 'video+audio', quality: options.quality || 'best' });
      } else {
        // Both - download separately
        const audioPath = path.join(options.outputPath, `${title}.m4a`);
        const videoPath = path.join(options.outputPath, `${title}_video.mp4`);
        await this.downloadStream(options.url, audioPath, { type: 'audio', quality: options.quality || 'best' });
        await this.downloadStream(options.url, videoPath, { type: 'video', quality: options.quality || 'best' });
        finalPath = options.outputPath;
      }

      this.emit('finish', finalPath);
      return finalPath;
    } catch (error: any) {
      this.emit('error', error);
      throw error;
    }
  }

  private async downloadStream(url: string, dest: string, opts: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
         const stream = await this.yt!.download(url, {
           type: opts.type, 
           quality: opts.quality, 
           format: 'mp4' 
         });
         
         const file = fs.createWriteStream(dest);
         let downloadedBytes = 0;

         const reader = stream.getReader();

         const pump = async () => {
           const { done, value } = await reader.read();
           if (done) {
             file.end();
           } else {
             downloadedBytes += value.length;
             this.emit('progress', downloadedBytes);
             file.write(Buffer.from(value), async (err) => {
               if (err) return reject(err);
               await pump();
             });
           }
         };
         
         file.on('finish', () => resolve());
         file.on('error', (err) => reject(err));
         
         await pump();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export const globalDownloader = new AdvancedDownloader();
