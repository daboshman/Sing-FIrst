const HEBREW = /[֐-׿]/;

/**
 * Returns true if `target` was sung in `transcript`. English and Hebrew
 * targets each get their own forgiving rules (see below).
 */
export function transcriptContainsWord(transcript: string, target: string): boolean {
  const word = target.trim();
  if (!word) return false;
  return HEBREW.test(word) ? hebrewMatch(transcript, word) : englishMatch(transcript, word);
}

/**
 * English: both strings are lowercased, then `.includes()` gives a quick
 * pre-check. Matching is per word and deliberately forgiving, because songs
 * love compounds and inflections:
 *  - Common inflections count: "loving" for Love, "babies" for Baby.
 *  - Words of 4+ letters match anywhere inside a sung word:
 *    "summertime" → Summer, "midnight" → Night, "sweetheart" → Heart.
 *  - Short words (Sun, Sky, Run…) must start or end a sung word
 *    ("sunshine", "butterfly", "cowboy"), so "Run" doesn't match "brunch".
 */
function englishMatch(transcript: string, target: string): boolean {
  const text = transcript.toLowerCase();
  const word = target.toLowerCase();

  const variants = englishVariants(word);
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

function englishVariants(word: string): string[] {
  const variants = [word];
  if (word.endsWith('e')) variants.push(`${word.slice(0, -1)}ing`); // dance → dancing
  if (word.endsWith('y')) variants.push(`${word.slice(0, -1)}ies`, `${word.slice(0, -1)}ied`); // baby → babies
  return variants;
}

/**
 * Hebrew glues prefixes and suffixes onto words and spells vowels
 * inconsistently, so we compare consonant "skeletons":
 *  - Niqqud is removed, final letters (ם ן ץ ף ך) become regular ones, and
 *    the vowel letters ו/י are dropped (except as the first letter), so
 *    "ליבי" and "לבי" look alike.
 *  - Up to three prefix letters (ו ה ב ל מ ש כ) may be stripped:
 *    "ובלב", "שהאהבה".
 *  - Possessive/plural suffixes may follow: "לבי", "אהבתך", "עינייך".
 *  - A final ה may turn into ת or disappear: "אהבתי", "אוהב" for אהבה.
 *  - A plural ים/ות ending is optional: "עיניי" for עיניים.
 */
function hebrewMatch(transcript: string, target: string): boolean {
  const stems = hebrewStems(target);
  return transcript
    .split(/[^א-ת֑-ׇ'"׳״]+/)
    .filter(Boolean)
    .some((token) =>
      // Strip prefixes before dropping vowel letters, so "הים" keeps its י.
      prefixStrips(letters(token))
        .map(skeleton)
        .some((rest) => stems.some((stem) => rest.startsWith(stem) && SUFFIXES.has(rest.slice(stem.length)))),
    );
}

const FINAL_TO_REGULAR: Record<string, string> = { 'ם': 'מ', 'ן': 'נ', 'ץ': 'צ', 'ף': 'פ', 'ך': 'כ' };

/** Plain consonant letters: no niqqud/geresh, final forms made regular. */
function letters(word: string): string {
  return word.replace(/[֑-ׇ'"׳״]/g, '').replace(/[םןץףך]/g, (c) => FINAL_TO_REGULAR[c]);
}

/** Drops the vowel letters ו/י, keeping a word-initial one (ים, ילדה). */
function skeleton(plain: string): string {
  return plain.charAt(0) + plain.slice(1).replace(/[וי]/g, '');
}

function prefixStrips(plain: string): string[] {
  const out = [plain];
  let rest = plain;
  for (let i = 0; i < 3 && rest.length > 2 && 'והבלמשכ'.includes(rest[0]); i++) {
    rest = rest.slice(1);
    out.push(rest);
  }
  return out;
}

// Suffix skeletons (ו/י already removed): my/your/his/her/our/their, plurals.
const SUFFIXES = new Set(['', 'כ', 'ה', 'נ', 'מ', 'כמ', 'כנ', 'המ', 'הנ', 'נו', 'ת', 'תכ', 'תה', 'תנ', 'תמ', 'תכמ', 'תהמ']);

// Irregular forms the rules below can't derive.
const EXTRA_FORMS: Record<string, string[]> = {
  'עיניים': ['עין'], // עיני, עינייך, עינו
};

function hebrewStems(target: string): string[] {
  const plain = letters(target);
  const sk = skeleton(plain);
  const stems = new Set([sk]);
  if (sk.endsWith('ה') && sk.length > 2) {
    stems.add(sk.slice(0, -1)); // אהבה → אהב (אוהב, אוהבת)
    stems.add(`${sk.slice(0, -1)}ת`); // אהבה → אהבת (אהבתי)
  }
  // Plural endings ים / ות are optional (their ו/י are already gone).
  if (/(ימ|ות)$/.test(plain) && sk.length > 3) stems.add(sk.slice(0, -1));
  for (const form of EXTRA_FORMS[target] ?? []) stems.add(skeleton(letters(form)));
  return [...stems].filter((s) => s.length >= 2);
}
