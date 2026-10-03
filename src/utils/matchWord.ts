/**
 * Returns true if `target` was sung in `transcript`.
 *
 * Both strings are lowercased, then `.includes()` gives a quick pre-check.
 * Matching is per word and deliberately forgiving, because songs love
 * compounds and inflections:
 *  - Common inflections count: "loving" for Love, "babies" for Baby.
 *  - Words of 4+ letters match anywhere inside a sung word:
 *    "summertime" → Summer, "midnight" → Night, "sweetheart" → Heart.
 *  - Short words (Sun, Sky, Run…) must start or end a sung word
 *    ("sunshine", "butterfly", "cowboy"), so "Run" doesn't match "brunch".
 */
export function transcriptContainsWord(transcript: string, target: string): boolean {
  const text = transcript.toLowerCase();
  const word = target.toLowerCase().trim();
  if (!word) return false;

  const variants = wordVariants(word);
  if (!variants.some((v) => text.includes(v))) return false;

  const tokens = text
    .replace(/[’`]/g, "'")
    .split(/[^a-z0-9']+/)
    .map((t) => t.replace(/^'+|'+$/g, ''))
    .filter(Boolean);

  const isShort = word.length <= 3;
  return tokens.some((token) =>
    variants.some((v) => (isShort ? token.startsWith(v) || token.endsWith(v) : token.includes(v))),
  );
}

function wordVariants(word: string): string[] {
  const variants = [word];
  if (word.endsWith('e')) variants.push(`${word.slice(0, -1)}ing`); // dance → dancing
  if (word.endsWith('y')) variants.push(`${word.slice(0, -1)}ies`, `${word.slice(0, -1)}ied`); // baby → babies
  return variants;
}
