export type WordLanguage = 'en' | 'he';
export type WordMode = 'en' | 'he' | 'mix';

export type Word = {
  text: string;
  lang: WordLanguage;
};

// Words that show up in a huge number of songs, so every round is winnable.
const ENGLISH_WORDS = [
  'Love',
  'Heart',
  'Baby',
  'Fire',
  'Night',
  'Dance',
  'Girl',
  'Boy',
  'Rain',
  'Sun',
  'Dream',
  'Kiss',
  'Tonight',
  'Forever',
  'Home',
  'Light',
  'Time',
  'World',
  'Eyes',
  'Money',
  'Party',
  'Summer',
  'Sky',
  'Star',
  'Crazy',
  'Hold',
  'Feel',
  'Fly',
  'Run',
  'Gold',
];

// Common words in Israeli songs. Very short words that collide with other
// everyday words after prefix/suffix stripping (ים/ימים, אש/אישה) are avoided.
const HEBREW_WORDS = [
  'אהבה',
  'לב',
  'לילה',
  'שמש',
  'גלים',
  'חלום',
  'עיניים',
  'נשמה',
  'גשם',
  'בית',
  'אור',
  'זמן',
  'עולם',
  'ילדה',
  'נשיקה',
  'שמיים',
  'כוכב',
  'ירח',
  'רוח',
  'שיר',
  'יפה',
  'מלאך',
  'דרך',
  'בוקר',
  'שמחה',
  'שלום',
  'פרח',
  'דמעות',
  'ירושלים',
  'אמא',
];

export const WORDS: Record<WordLanguage, Word[]> = {
  en: ENGLISH_WORDS.map((text) => ({ text, lang: 'en' })),
  he: HEBREW_WORDS.map((text) => ({ text, lang: 'he' })),
};

export function pickRandomWord(mode: WordMode, exclude?: Word): Word {
  const all = mode === 'mix' ? [...WORDS.en, ...WORDS.he] : WORDS[mode];
  const pool = exclude ? all.filter((w) => w.text !== exclude.text) : all;
  return pool[Math.floor(Math.random() * pool.length)];
}
