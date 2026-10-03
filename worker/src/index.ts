/**
 * Sing First transcription Worker.
 *
 * POST /transcribe with multipart/form-data containing a `file` field (the
 * recording). Runs Whisper on Workers AI and returns `{ text }`.
 *
 * Runs entirely on Cloudflare's free plan: when the daily Workers AI
 * allocation is used up, requests fail until it resets — nothing is billed.
 */

const MODEL = '@cf/openai/whisper-large-v3-turbo';
const MAX_BYTES = 3 * 1024 * 1024; // ~10s clips are well under 500 KB

// Production site, Firebase preview channels, and local dev servers.
const ALLOWED_ORIGIN =
  /^(https:\/\/sing-first-game(--[a-z0-9-]+)?\.(web\.app|firebaseapp\.com)|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/;

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}

function json(body: unknown, status: number, cors: Record<string, string>): Response {
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
    if (pathname !== '/transcribe') return json({ error: 'Not found' }, 404, cors);
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, cors);
    if (!originOk) return json({ error: 'Origin not allowed' }, 403, cors);

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const { success } = await env.LIMITER.limit({ key: ip });
    if (!success) return json({ error: 'Slow down! Too many tries — wait a minute.' }, 429, cors);

    const declared = Number(request.headers.get('Content-Length') ?? 0);
    if (declared > MAX_BYTES) return json({ error: 'Recording is too long.' }, 413, cors);

    let file: File;
    try {
      const form = await request.formData();
      const entry = form.get('file');
      if (!entry || typeof entry === 'string') throw new Error('missing file');
      file = entry;
    } catch {
      return json({ error: 'Expected multipart/form-data with a "file" field.' }, 400, cors);
    }

    if (file.size === 0) return json({ error: 'Recording is empty.' }, 400, cors);
    if (file.size > MAX_BYTES) return json({ error: 'Recording is too long.' }, 413, cors);

    try {
      const audio = toBase64(new Uint8Array(await file.arrayBuffer()));
      const result = await env.AI.run(MODEL, {
        audio,
        task: 'transcribe',
        language: 'en',
        condition_on_previous_text: false,
      });
      return json({ text: (result.text ?? '').trim() }, 200, cors);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('Transcription failed:', message);
      // Workers AI returns an error once the free daily allocation is used up.
      const quota = /neuron|quota|limit|4006/i.test(message);
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
  },
} satisfies ExportedHandler<Env>;
