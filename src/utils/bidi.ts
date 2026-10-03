/**
 * Wraps text in Unicode "first strong isolate" marks so a Hebrew name or
 * lyric inside an English sentence keeps its own direction without flipping
 * the whole sentence (e.g. "🎉 דנה got it! +1").
 */
export function isolate(text: string): string {
  return `⁨${text}⁩`;
}
