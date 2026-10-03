import { Platform } from 'react-native';

import { TRANSCRIBE_URL } from '../config';

export class TranscriptionError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

const MIME_BY_EXT: Record<string, string> = {
  m4a: 'audio/m4a',
  mp4: 'audio/mp4',
  caf: 'audio/x-caf',
  wav: 'audio/wav',
  webm: 'audio/webm',
  ogg: 'audio/ogg',
  mp3: 'audio/mpeg',
};

function extFromMime(mime: string): string {
  if (mime.includes('webm')) return 'webm';
  if (mime.includes('ogg')) return 'ogg';
  if (mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')) return 'mp4';
  if (mime.includes('wav')) return 'wav';
  if (mime.includes('mpeg')) return 'mp3';
  return 'webm';
}

async function appendAudioFile(form: FormData, uri: string): Promise<void> {
  if (Platform.OS === 'web') {
    // On web the recorder gives us a blob: URL — turn it back into a Blob.
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, `recording.${extFromMime(blob.type)}`);
    return;
  }

  // On iOS/Android React Native's FormData streams the file straight from disk.
  const name = uri.split('/').pop() || 'recording.m4a';
  const ext = name.split('.').pop()?.toLowerCase() ?? 'm4a';
  form.append('file', {
    uri,
    name,
    type: MIME_BY_EXT[ext] ?? 'audio/m4a',
  } as unknown as Blob);
}

/**
 * Sends a local recording to the Sing First Worker (Whisper on Cloudflare
 * Workers AI) as multipart/form-data and returns the transcribed text.
 */
export async function transcribeAudio(uri: string): Promise<string> {
  const form = new FormData();
  await appendAudioFile(form, uri);

  let response: Response;
  try {
    // Don't set Content-Type — fetch adds the multipart boundary itself.
    response = await fetch(TRANSCRIBE_URL, { method: 'POST', body: form });
  } catch {
    throw new TranscriptionError('Network error — check your connection and try again.');
  }

  if (!response.ok) {
    let message = `Transcription failed (${response.status}).`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new TranscriptionError(message, response.status);
  }

  const data: { text?: string } = await response.json();
  return (data.text ?? '').trim();
}
