import { Platform } from 'react-native';

import { TRANSCRIBE_URL } from '../config';
import type { WordLanguage } from '../data/words';

export type TranscriptionErrorKind = 'network' | 'rate' | 'quota' | 'failed';

/** `kind` lets the UI show the message in the player's language. */
export class TranscriptionError extends Error {
  constructor(public readonly kind: TranscriptionErrorKind) {
    super(kind);
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
 * `language` tells Whisper which language to expect (the target word's);
 * `hint` is the target word, which helps it spell Hebrew singing correctly.
 */
export async function transcribeAudio(uri: string, language: WordLanguage, hint?: string): Promise<string> {
  const form = new FormData();
  await appendAudioFile(form, uri);
  form.append('language', language);
  if (hint) form.append('hint', hint);

  let response: Response;
  try {
    // Don't set Content-Type — fetch adds the multipart boundary itself.
    response = await fetch(TRANSCRIBE_URL, { method: 'POST', body: form });
  } catch {
    throw new TranscriptionError('network');
  }

  if (!response.ok) {
    throw new TranscriptionError(response.status === 429 ? 'rate' : response.status === 503 ? 'quota' : 'failed');
  }

  const data: { text?: string } = await response.json();
  return (data.text ?? '').trim();
}
