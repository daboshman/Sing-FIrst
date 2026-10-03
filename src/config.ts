// Cloudflare Worker that runs Whisper and song identification on Workers AI
// (free plan) — see worker/. Override with EXPO_PUBLIC_WORKER_URL in .env to
// point at `wrangler dev`.
export const WORKER_URL = process.env.EXPO_PUBLIC_WORKER_URL || 'https://sing-first-transcribe.asherdiba.workers.dev';

export const TRANSCRIBE_URL = `${WORKER_URL}/transcribe`;
export const IDENTIFY_URL = `${WORKER_URL}/identify`;
