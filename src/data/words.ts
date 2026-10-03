// Words that show up in a huge number of songs, so every round is winnable.
export const SONG_WORDS = [
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
] as const;

export function pickRandomWord(exclude?: string): string {
  const pool = exclude ? SONG_WORDS.filter((w) => w !== exclude) : SONG_WORDS;
  return pool[Math.floor(Math.random() * pool.length)];
}
