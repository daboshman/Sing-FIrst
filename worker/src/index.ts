/**
 * Sing First Worker — runs entirely on Cloudflare's free plan.
 *
 * POST /transcribe  multipart/form-data with a `file` field (the recording)
 *                   and an optional `language` ("en" default, or "he").
 *                   Runs Whisper on Workers AI and returns `{ text }`.
 * POST /identify    JSON `{ text }` (the sung lyrics). Asks an LLM which song
 *                   it is, double-checks against LRCLIB lyrics, and returns
 *                   `{ song: { title, artist } | null }`.
 *
 * When the daily Workers AI allocation is used up, requests fail until it
 * resets — nothing is billed.
 */

const WHISPER_MODEL = '@cf/openai/whisper-large-v3-turbo';
const SONG_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_BYTES = 3 * 1024 * 1024; // 30s clips are well under 1 MB
const MAX_LYRICS_CHARS = 600;
const LANGUAGES = new Set(['en', 'he']);

// Production site, Firebase preview channels, and local dev servers.
const ALLOWED_ORIGIN =
  /^(https:\/\/sing-first-game(--[a-z0-9-]+)?\.(web\.app|firebaseapp\.com)|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;

type Cors = Record<string, string>;

function corsHeaders(origin: string | null): Cors {
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, cors: Cors): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function isQuotaError(message: string): boolean {
  // Workers AI returns an error once the free daily allocation is used up.
  return /neuron|quota|4006/i.test(message);
}

export default {
  async fetch(request, env): Promise<Response> {
    const origin = request.headers.get('Origin');
    // Native apps send no Origin header; browsers must come from our site.
    const originOk = origin === null || ALLOWED_ORIGIN.test(origin);
    const cors = originOk ? corsHeaders(origin) : {};

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: originOk ? 204 : 403, headers: cors });
    }

    const { pathname } = new URL(request.url);
    const handler = pathname === '/transcribe' ? transcribe : pathname === '/identify' ? identify : null;
    if (!handler) return json({ error: 'Not found' }, 404, cors);
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);
    if (!originOk) return json({ error: 'Origin not allowed' }, 403, cors);

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const { success } = await env.LIMITER.limit({ key: ip });
    if (!success) return json({ error: 'Slow down! Too many tries — wait a minute.' }, 429, cors);

    return handler(request, env, cors);
  },
} satisfies ExportedHandler<Env>;

async function transcribe(request: Request, env: Env, cors: Cors): Promise<Response> {
  const declared = Number(request.headers.get('Content-Length') ?? 0);
  if (declared > MAX_BYTES) return json({ error: 'Recording is too long.' }, 413, cors);

  let file: File;
  let language = 'en';
  try {
    const form = await request.formData();
    const entry = form.get('file');
    if (!entry || typeof entry === 'string') throw new Error('missing file');
    file = entry;
    const lang = form.get('language');
    if (typeof lang === 'string' && LANGUAGES.has(lang)) language = lang;
  } catch {
    return json({ error: 'Expected multipart/form-data with a "file" field.' }, 400, cors);
  }

  if (file.size === 0) return json({ error: 'Recording is empty.' }, 400, cors);
  if (file.size > MAX_BYTES) return json({ error: 'Recording is too long.' }, 413, cors);

  try {
    const audio = toBase64(new Uint8Array(await file.arrayBuffer()));
    const result = await env.AI.run(WHISPER_MODEL, {
      audio,
      task: 'transcribe',
      language,
      condition_on_previous_text: false,
    });
    return json({ text: (result.text ?? '').trim() }, 200, cors);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('Transcription failed:', message);
    const quota = isQuotaError(message);
    return json(
      {
        error: quota
          ? "Today's free singing allowance is used up — come back tomorrow!"
          : 'Could not transcribe that recording. Try again!',
      },
      quota ? 503 : 502,
      cors,
    );
  }
}

type Song = { title: string; artist: string };

const SONG_PROMPT = `You identify songs from sung lyrics. The lyrics come from speech recognition and may contain mistakes. Reply with ONLY a JSON object: {"title": string, "artist": string, "confidence": "high"|"medium"|"low"}. If the lyrics don't clearly come from a real, well-known song, reply {"title": null, "artist": null, "confidence": "low"}. Never invent songs.`;

async function identify(request: Request, env: Env, cors: Cors): Promise<Response> {
  let text: string;
  try {
    const body: { text?: unknown } = await request.json();
    if (typeof body.text !== 'string') throw new Error('missing text');
    text = body.text.trim().slice(0, MAX_LYRICS_CHARS);
  } catch {
    return json({ error: 'Expected JSON with a "text" field.' }, 400, cors);
  }
  if (text.split(/\s+/).length < 3) return json({ song: null }, 200, cors);

  let guess: { title?: unknown; artist?: unknown; confidence?: unknown };
  try {
    const result = (await env.AI.run(SONG_MODEL, {
      messages: [
        { role: 'system', content: SONG_PROMPT },
        { role: 'user', content: `Lyrics: ${JSON.stringify(text)}` },
      ],
      max_tokens: 120,
      temperature: 0,
    })) as { response?: unknown };
    const raw = typeof result.response === 'string' ? result.response : JSON.stringify(result.response ?? '');
    guess = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
  } catch (e) {
    console.error('Song identification failed:', e instanceof Error ? e.message : String(e));
    return json({ song: null }, 200, cors);
  }

  if (typeof guess.title !== 'string' || typeof guess.artist !== 'string' || guess.confidence === 'low') {
    return json({ song: null }, 200, cors);
  }
  const song: Song = { title: guess.title.slice(0, 120), artist: guess.artist.slice(0, 120) };

  // Guard against made-up answers: if LRCLIB knows the song, the sung words
  // should actually appear in its lyrics.
  const lyrics = await fetchLyrics(song);
  if (lyrics !== null && lyricsOverlap(text, lyrics) < 0.5) {
    console.log('Rejected guess with low lyric overlap:', song);
    return json({ song: null }, 200, cors);
  }
  if (lyrics === null && guess.confidence !== 'high') return json({ song: null }, 200, cors);

  return json({ song }, 200, cors);
}

/** Plain lyrics from LRCLIB (free, no key), or null if unknown/unreachable. */
async function fetchLyrics({ title, artist }: Song): Promise<string | null> {
  const url = new URL('https://lrclib.net/api/search');
  url.searchParams.set('track_name', title);
  url.searchParams.set('artist_name', artist);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'SingFirst/1.0 (https://github.com/daboshman/Sing-FIrst)' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const results: { plainLyrics?: string | null }[] = await res.json();
    return results.find((r) => r.plainLyrics)?.plainLyrics ?? null;
  } catch {
    return null;
  }
}

/** Share of distinct sung words (3+ letters) that appear in the lyrics. */
function lyricsOverlap(sung: string, lyrics: string): number {
  const words = (s: string) => s.toLowerCase().replace(/[’']/g, '').match(/[a-z]{3,}/g) ?? [];
  const sungWords = new Set(words(sung));
  if (sungWords.size === 0) return 0;
  const lyricWords = new Set(words(lyrics));
  let hits = 0;
  for (const w of sungWords) if (lyricWords.has(w)) hits++;
  return hits / sungWords.size;
}
