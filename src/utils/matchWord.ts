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
 * inconsistently — and speech-to-text on Hebrew *singing* adds its own
 * mistakes — so matching is deliberately forgiving. We compare consonant
 * "skeletons":
 *  - Niqqud is removed, final letters (ם ן ץ ף ך) become regular ones, and
 *    the vowel letters ו/י are dropped (except as the first letter), so
 *    "ליבי" and "לבי" look alike.
 *  - The silent letters א/ה/ע, and ט/ת, count as the same letter —
 *    "ההבה" or "אהבא" for אהבה. In short words the first letter must still
 *    match exactly, or אין/אני would count for עין and אור for עיר.
 *  - Up to three prefix letters (ו ה ב ל מ ש כ) may be stripped:
 *    "ובלב", "שהאהבה".
 *  - Possessive/plural suffixes may follow: "לבי", "אהבתך", "עינייך".
 *  - A final ה may turn into ת or disappear: "אהבתי", "אוהב" for אהבה.
 *  - A plural ים/ות ending is optional: "עיניי" for עיניים.
 *  - The word itself (not its derived forms) gets one mistake by length: a similar-sounding letter
 *    swapped (3 skeleton letters, not the first: "שמס" for שמש; 4+:
 *    "רקבת" for רכבת, "מוסיקה" for מוזיקה), a letter missing or extra (5+:
 *    "ירושאלים"), or any letter wrong (6+). Shorter words stay exact,
 *    otherwise everyday words sneak in (כבר for חבר, הרבה for אהבה).
 *  - A word the transcription split in two still counts: "אה בה".
 */
function hebrewMatch(transcript: string, target: string): boolean {
  const stems = hebrewStems(target);
  const primary = skeleton(letters(target)); // only the word itself gets a mistake
  const tokens = transcript.split(/[^א-ת֑-ׇ'"׳״]+/).filter(Boolean);
  const candidates = [...tokens, ...tokens.slice(1).map((t, i) => tokens[i] + t)];
  // Strip prefixes before dropping vowel letters, so "הים" keeps its י.
  const rests = candidates.flatMap((token) => prefixStrips(letters(token)).map(skeleton));
  return stems.some((stem) => {
    const long = stem.length >= 4;
    const s = sound(stem, long);
    return rests.some((rest) => stemMatches(sound(rest, long), s, stem === primary));
  });
}

/** Merges letters transcription mixes up; the first one only if `includeFirst`. */
function sound(sk: string, includeFirst: boolean): string {
  const merge = (x: string) => x.replace(/[הע]/g, 'א').replace(/ט/g, 'ת');
  return includeFirst ? merge(sk) : sk.charAt(0) + merge(sk.slice(1));
}

// Letters that sound close enough for a one-letter swap. Short words only
// get the closest pairs — wider groups let "זהו" count for זהב, "רכב" for
// רחוב and "פחות" for פחד.
const SIMILAR = ['זסצש', 'כק'];
const SIMILAR_LONG = ['זסצש', 'כקח', 'בופ', 'דת'];
function similar(a: string, b: string, long: boolean): boolean {
  return (long ? SIMILAR_LONG : SIMILAR).some((group) => group.includes(a) && group.includes(b));
}

function stemMatches(rest: string, stem: string, allowMistake: boolean): boolean {
  if (rest.startsWith(stem) && SUFFIXES.has(rest.slice(stem.length))) return true;
  if (!allowMistake) return false;
  if (stem.length === 3) {
    // Similar-sounding swap anywhere but the first letter.
    const cand = rest.slice(0, 3);
    return (
      rest.length >= 3 &&
      SUFFIXES.has(rest.slice(3)) &&
      cand[0] === stem[0] &&
      [1, 2].some((i) => cand.slice(0, i) + cand.slice(i + 1) === stem.slice(0, i) + stem.slice(i + 1) && similar(cand[i], stem[i], false))
    );
  }
  if (stem.length < 4) return false;
  const lengths = stem.length >= 5 ? [stem.length - 1, stem.length, stem.length + 1] : [stem.length];
  return lengths.some(
    (len) =>
      len <= rest.length && SUFFIXES.has(rest.slice(len)) && withinOneEdit(rest.slice(0, len), stem, stem.length >= 6),
  );
}

/** One substitution (similar-sounding unless `anySwap`), insertion or deletion. */
function withinOneEdit(a: string, b: string, anySwap: boolean): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length === b.length) {
    if (i === a.length) return true;
    return a.slice(i + 1) === b.slice(i + 1) && (anySwap || similar(a[i], b[i], true));
  }
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
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

// Suffix skeletons (ו/י already removed): my/your/his/her/our/their,
// plurals — with ה also in its merged (א) form, as the rest of the word.
const SUFFIXES = new Set(
  ['', 'כ', 'ה', 'נ', 'מ', 'כמ', 'כנ', 'המ', 'הנ', 'נו', 'ת', 'תכ', 'תה', 'תנ', 'תמ', 'תכמ', 'תהמ'].flatMap((x) => [
    x,
    x.replace(/ה/g, 'א'),
  ]),
);

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
