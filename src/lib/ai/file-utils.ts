import { supabase, BUCKET_NAME } from '@/lib/supabase';
import type Anthropic from '@anthropic-ai/sdk';

interface FileRecord {
  fileName: string;
  storagePath: string;
}

function getMediaType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg': case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    default: return 'application/pdf';
  }
}

export interface RawFileDownload {
  fileName: string;
  storagePath: string;
  buffer: Buffer;
  mediaType: string;
}

export async function downloadFilesRaw(
  files: FileRecord[],
  maxFiles = 8
): Promise<RawFileDownload[]> {
  const filesToUse = files.slice(0, maxFiles);
  const downloads: RawFileDownload[] = [];

  for (const file of filesToUse) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(file.storagePath);

    if (error || !data) {
      console.error(`Erro ao baixar ${file.fileName}:`, error);
      continue;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const mediaType = getMediaType(file.storagePath);
    downloads.push({ fileName: file.fileName, storagePath: file.storagePath, buffer, mediaType });
  }

  return downloads;
}

export function buffersToContentBlocks(
  downloads: RawFileDownload[]
): Anthropic.Messages.ContentBlockParam[] {
  const blocks: Anthropic.Messages.ContentBlockParam[] = [];

  for (const dl of downloads) {
    const base64 = dl.buffer.toString('base64');

    if (dl.mediaType === 'application/pdf') {
      blocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64,
        },
      });
    } else {
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: dl.mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
          data: base64,
        },
      });
    }
  }

  return blocks;
}

export async function downloadFilesAsBase64(
  files: FileRecord[],
  maxFiles = 8
): Promise<Anthropic.Messages.ContentBlockParam[]> {
  const downloads = await downloadFilesRaw(files, maxFiles);
  return buffersToContentBlocks(downloads);
}
