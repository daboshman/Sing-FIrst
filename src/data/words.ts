import { Platform } from 'react-native';

export type WordLanguage = 'en' | 'he';
export type WordMode = 'en' | 'he' | 'mix';

export type Word = {
  text: string;
  lang: WordLanguage;
};

// Words that show up in a huge number of songs, so every round is winnable.
// Avoided: words hidden inside other common words, which the forgiving
// matcher would accept by mistake — e.g. Sing (kissing, using), King
// (making), Lose (close), Wind (window), Car (care), Sea (season),
// Body (everybody).
const ENGLISH_WORDS = [
  'Love', 'Heart', 'Baby', 'Fire', 'Night', 'Dance', 'Girl', 'Boy', 'Rain', 'Sun',
  'Dream', 'Kiss', 'Tonight', 'Forever', 'Home', 'Light', 'Time', 'World', 'Eyes', 'Money',
  'Party', 'Summer', 'Sky', 'Star', 'Crazy', 'Hold', 'Feel', 'Fly', 'Run', 'Gold',
  'Angel', 'Blue', 'Candy', 'Break', 'Bright', 'Burn', 'Cold', 'Cry', 'Dark', 'Day',
  'Diamond', 'Drive', 'Fall', 'Free', 'Friend', 'Ghost', 'Goodbye', 'Happy', 'Heaven', 'Hello',
  'High', 'Honey', 'Hurt', 'Lady', 'Life', 'Little', 'Lonely', 'Alone', 'Magic', 'Mama',
  'Moon', 'Morning', 'Mountain', 'Never', 'Ocean', 'Paradise', 'Perfect', 'Queen', 'Radio', 'Remember',
  'River', 'Rock', 'Rose', 'Sad', 'Shine', 'Sleep', 'Smile', 'Song', 'Soul', 'Stay',
  'Story', 'Street', 'Sugar', 'Sweet', 'Tears', 'Together', 'Touch', 'Train', 'True', 'Wait',
  'Walk', 'Water', 'Wild', 'Wish', 'Woman', 'Young', 'Yesterday', 'Beautiful', 'City', 'Music',
  'Shadow', 'Thunder', 'Snow', 'Hands', 'Lucky', 'Freedom', 'Island',
];

// Common words in Israeli songs. Avoided: very short words that collide with
// everyday words after prefix/suffix stripping — ים/ימים, אש/אישה, חיים/חם,
// קיץ/קצת, שנה/שנינו, סוף/כסף, מים, קול/קל — and verbs that double as nouns (מדבר).
const HEBREW_WORDS = [
  'אהבה', 'לב', 'לילה', 'שמש', 'גלים', 'חלום', 'עיניים', 'נשמה', 'גשם', 'בית',
  'אור', 'זמן', 'עולם', 'ילדה', 'נשיקה', 'שמיים', 'כוכב', 'ירח', 'רוח', 'שיר',
  'יפה', 'מלאך', 'דרך', 'בוקר', 'שמחה', 'שלום', 'פרח', 'דמעות', 'ירושלים', 'אמא',
  'געגועים', 'חבר', 'ארץ', 'תקווה', 'שמלה', 'מלכה', 'נסיכה', 'מנגינה', 'ריקוד', 'גיטרה',
  'רחוב', 'עיר', 'ערב', 'חורף', 'אביב', 'ציפור', 'שקט', 'תפילה', 'מזל', 'כסף',
  'דבש', 'זהב', 'אדמה', 'נהר', 'הר', 'עננים', 'אבא', 'חתונה', 'מסיבה', 'כאב',
  'פחד', 'סליחה', 'תודה', 'שבת', 'רגע', 'נצח', 'מחר', 'אתמול', 'לבד', 'חושך',
  'כחול', 'ורד', 'שדה', 'חלון', 'דלת', 'רכבת', 'טלפון', 'מוזיקה', 'צחוק',
];

export const WORDS: Record<WordLanguage, Word[]> = {
  en: ENGLISH_WORDS.map((text) => ({ text, lang: 'en' })),
  he: HEBREW_WORDS.map((text) => ({ text, lang: 'he' })),
};

function wordsFor(mode: WordMode): Word[] {
  return mode === 'mix' ? [...WORDS.en, ...WORDS.he] : WORDS[mode];
}

// Words are dealt like a shuffled deck: no word repeats until every word in
// the mode has been played, and when the deck is reshuffled the most recently
// played words go to the bottom so they don't come straight back. Decks are
// remembered on the device (web) so a reload doesn't start over.
const STORAGE_KEY = 'singfirst.decks';
const RECENT_COUNT = 25;
type DeckState = { decks: Partial<Record<WordMode, string[]>>; recent: string[] };
let state: DeckState = loadState();

function loadState(): DeckState {
  const empty: DeckState = { decks: {}, recent: [] };
  if (Platform.OS !== 'web') return empty;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return { decks: saved.decks ?? {}, recent: Array.isArray(saved.recent) ? saved.recent : [] };
  } catch {
    return empty;
  }
}

function saveState() {
  if (Platform.OS !== 'web') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable — the deck just won't survive a reload.
  }
}

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickRandomWord(mode: WordMode): Word {
  const all = wordsFor(mode);
  const byText = new Map(all.map((w) => [w.text, w]));
  // Drop anything no longer in the list (e.g. after the list was updated).
  let deck = (state.decks[mode] ?? []).filter((t) => byText.has(t));

  if (deck.length === 0) {
    // Words are drawn from the end, so recent ones go first in the array.
    const recent = new Set(state.recent);
    const texts = all.map((w) => w.text);
    deck = [...shuffled(texts.filter((t) => recent.has(t))), ...shuffled(texts.filter((t) => !recent.has(t)))];
  }

  const text = deck.pop()!;
  state = {
    decks: { ...state.decks, [mode]: deck },
    recent: [text, ...state.recent.filter((t) => t !== text)].slice(0, RECENT_COUNT),
  };
  saveState();
  return byText.get(text)!;
}
