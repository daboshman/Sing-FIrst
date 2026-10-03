/**
 * Returns true if `target` was sung in `transcript`.
 *
 * Both strings are lowercased, then `.includes()` gives a quick pre-check.
 * A whole-word pass follows so "love" doesn't match "glove" and "fire"
 * doesn't match "firefly". Simple plurals and possessives still count
 * ("hearts", "baby's").
 */
export function transcriptContainsWord(transcript: string, target: string): boolean {
  const text = transcript.toLowerCase();
  const word = target.toLowerCase().trim();
  if (!word || !text.includes(word)) return false;

  const tokens = text
    .replace(/[’`]/g, "'")
    .split(/[^a-z0-9']+/)
    .map((t) => t.replace(/^'+|'+$/g, '').replace(/'s$/, ''));

  const accepted = new Set([word, `${word}s`, `${word}es`]);
  return tokens.some((t) => accepted.has(t));
}
