// Cloudflare Worker that runs Whisper on Workers AI (free plan) — see worker/.
// Override with EXPO_PUBLIC_TRANSCRIBE_URL in .env to point at `wrangler dev`.
export const TRANSCRIBE_URL =
  process.env.EXPO_PUBLIC_TRANSCRIBE_URL || 'https://sing-first-transcribe.asherdiba.workers.dev/transcribe';
