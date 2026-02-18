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
    default: return 'application/pdf';
  }
}

export async function downloadFilesAsBase64(
  files: FileRecord[],
  maxFiles = 8
): Promise<Anthropic.Messages.ContentBlockParam[]> {
  const filesToUse = files.slice(0, maxFiles);
  const fileContents: Anthropic.Messages.ContentBlockParam[] = [];

  for (const file of filesToUse) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .download(file.storagePath);

    if (error || !data) {
      console.error(`Erro ao baixar ${file.fileName}:`, error);
      continue;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mediaType = getMediaType(file.storagePath);

    if (mediaType === 'application/pdf') {
      fileContents.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64,
        },
      });
    } else {
      fileContents.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
          data: base64,
        },
      });
    }
  }

  return fileContents;
}
