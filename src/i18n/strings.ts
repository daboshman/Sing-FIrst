import { isolate } from '../utils/bidi';

export type UiLanguage = 'en' | 'he';

export type MicHelpKey = 'ios-chrome' | 'ios-safari' | 'ios-other' | 'android' | 'in-app' | 'desktop' | 'native';
type MicHelpText = { title: string; steps: string[]; tip?: string };

// Names, words and lyrics are wrapped with isolate() so they keep their own
// direction inside a sentence in the other language.
const en = {
  appName: '🎤 Sing First',

  // Setup / settings
  intro:
    'Put the device in the middle of the table. When a word appears, the first player to tap their button has 30 seconds to sing a song with that word.',
  ruleGood: '+1 sang the word',
  ruleBad: "−1 didn't",
  playersLabel: (n: number, max: number) => `PLAYERS (${n}/${max})`,
  noPlayersYet: 'Add at least one player to start.',
  playerNamePlaceholder: 'Player name',
  tableFull: 'Table is full!',
  addPlayer: '＋ Add',
  removePlayer: (name: string) => `Remove ${name}`,
  newPlayerName: 'New player name',
  wordsLabel: 'WORDS & SONGS',
  wordModes: { en: 'English', he: 'Hebrew · עברית', mix: 'Both' },
  uiLanguageLabel: 'APP LANGUAGE',
  uiLanguages: { en: 'English', he: 'עברית' },
  startGame: 'Start game 🎶',
  resetScores: 'Reset all scores to 0',

  // Game
  settingsButton: '⚙️ Settings & players',
  micOffBanner: '🎙️ The microphone is off. Tap here to see how to turn it on.',
  singAWord: 'Sing a song with the word',
  targetWord: (w: string) => `Target word: ${w}`,
  firstToTap: 'First to tap their button sings! 🎤',
  isSinging: (name: string) => `${isolate(name)} is singing…`,
  secondsLeft: (s: number) => `${s}s`,
  doneSinging: '⏹ Done singing',
  listeningTo: (name: string) => `Listening to ${isolate(name)}…`,
  heard: (text: string) => `Heard: “${isolate(text)}”`,
  skipWord: '⏭ Skip word',
  gotIt: (name: string) => `🎉 ${isolate(name)} got it! +1`,
  missedWord: (word: string, name: string) =>
    `😬 No “${isolate(word)}” there — ${isolate(name)} loses a point. Anyone else?`,
  heardNothing: (name: string) => `😬 I didn't hear any singing — ${isolate(name)} loses a point.`,
  recordingFailed: 'The recording failed — no points lost. Buzz again!',
  noPointsLost: 'No points lost.',
  micNeeded: 'The microphone is needed to play.',
  errors: {
    network: 'Network error — check your connection and try again.',
    rate: 'Slow down! Too many tries — wait a minute.',
    quota: "Today's free singing allowance is used up — come back tomorrow!",
    failed: 'Could not hear that recording. Try again!',
  },

  // Buzzer tile
  tap: 'TAP!',
  singingTapDone: 'Singing… tap when done',
  buzzIn: (name: string) => `${name} buzz in`,
  tapWhenDone: (name: string) => `${name}, tap when you're done singing`,
  points: (n: number) => `${n} points`,

  // Song card
  whichSong: '🎵 Which song was that…',
  songUnknown: "🎵 Couldn't recognize the song",
  thatWas: 'THAT WAS',
  lastSong: 'LAST SONG',
  findThisSong: 'FIND THIS SONG',
  appMissing: (app: string) => `No ${app} app found.`,
  openWebsite: (app: string) => `Open the ${app} website`,

  // Microphone help
  micNeedsAccess: 'Sing First needs the microphone to hear you sing.',
  tryAgain: 'Try again',
  openSettings: 'Open Settings',
  reloadPage: 'Reload page',
  close: 'Close',
  micHelp: {
    'ios-chrome': {
      title: 'Turn on the microphone for Chrome',
      steps: [
        'Open the Settings app on your iPhone or iPad.',
        'Scroll down and tap Chrome (on newer iOS: Apps → Chrome).',
        'Turn on Microphone.',
        'Come back here and tap “Try again”. When Chrome asks, tap Allow.',
      ],
      tip: 'Still no question popping up? Reload this page and tap “Try again”.',
    },
    'ios-safari': {
      title: 'Allow the microphone in Safari',
      steps: [
        'Tap the “aA” or page-menu button in the address bar.',
        'Tap Website Settings → Microphone → Allow.',
        'Come back and tap “Try again”.',
      ],
      tip: 'You can also go to Settings → Apps → Safari → Microphone → Allow.',
    },
    'ios-other': {
      title: 'Turn on the microphone for your browser',
      steps: [
        'Open the Settings app on your iPhone or iPad.',
        'Find your browser in the list (on newer iOS: Apps → your browser).',
        'Turn on Microphone, then come back and tap “Try again”.',
      ],
    },
    android: {
      title: 'Allow the microphone in Chrome',
      steps: [
        'Tap the icon to the left of the web address (🔒 or ⚙).',
        'Tap Permissions → Microphone → Allow.',
        'Come back and tap “Try again”.',
      ],
      tip: 'If it’s still blocked: Android Settings → Apps → Chrome → Permissions → Microphone → Allow.',
    },
    'in-app': {
      title: 'Open Sing First in your browser',
      steps: [
        'You’re inside another app’s browser (like WhatsApp or Instagram), which can’t use the microphone.',
        'Tap the ⋯ or share button and choose “Open in browser” (Safari or Chrome).',
      ],
    },
    desktop: {
      title: 'Allow the microphone',
      steps: [
        'Click the icon to the left of the web address (🔒 or ⚙).',
        'Set Microphone to Allow.',
        'Tap “Try again” (or reload the page).',
      ],
    },
    native: {
      title: 'Allow the microphone',
      steps: ['Open Settings → Sing First and turn on Microphone.', 'Come back and tap “Try again”.'],
    },
  } as Record<MicHelpKey, MicHelpText>,
};

export type Strings = typeof en;

// Hebrew uses gender-neutral phrasing ("נקודה ל־דנה") since names can be anyone.
const he: Strings = {
  appName: '🎤 Sing First',

  intro:
    'שימו את המכשיר במרכז השולחן. כשמופיעה מילה, מי שלוחץ ראשון על הכפתור שלו מקבל 30 שניות לשיר שיר עם המילה הזו.',
  ruleGood: `${isolate('+1')} שרתם את המילה`,
  ruleBad: `${isolate('−1')} לא`,
  playersLabel: (n, max) => `שחקנים (${n}/${max})`,
  noPlayersYet: 'הוסיפו לפחות שחקן אחד כדי להתחיל.',
  playerNamePlaceholder: 'שם השחקן',
  tableFull: 'השולחן מלא!',
  addPlayer: '＋ הוספה',
  removePlayer: (name) => `הסרת ${name}`,
  newPlayerName: 'שם שחקן חדש',
  wordsLabel: 'מילים ושירים',
  wordModes: { en: 'אנגלית', he: 'עברית', mix: 'שתיהן' },
  uiLanguageLabel: 'שפת האפליקציה',
  uiLanguages: { en: 'English', he: 'עברית' },
  startGame: 'מתחילים 🎶',
  resetScores: 'איפוס הניקוד של כולם',

  settingsButton: '⚙️ הגדרות ושחקנים',
  micOffBanner: '🎙️ המיקרופון כבוי. הקישו כאן כדי לראות איך להפעיל אותו.',
  singAWord: 'שירו שיר עם המילה',
  targetWord: (w) => `מילת המטרה: ${w}`,
  firstToTap: 'מי שלוחץ ראשון – שר! 🎤',
  isSinging: (name) => `${isolate(name)} על המיקרופון…`,
  secondsLeft: (s) => `${s} שנ׳`,
  doneSinging: '⏹ סיימתי לשיר',
  listeningTo: (name) => `מקשיבים ל־${isolate(name)}…`,
  heard: (text) => `שמעתי: “${isolate(text)}”`,
  skipWord: '⏭ דלגו על המילה',
  gotIt: (name) => `🎉 בול! נקודה ל־${isolate(name)}`,
  missedWord: (word, name) => `😬 לא שמעתי “${isolate(word)}” – נקודה פחות ל־${isolate(name)}. מישהו אחר?`,
  heardNothing: (name) => `😬 לא שמעתי שירה – נקודה פחות ל־${isolate(name)}.`,
  recordingFailed: 'ההקלטה נכשלה – אף אחד לא מאבד נקודה. לחצו שוב!',
  noPointsLost: 'אף אחד לא מאבד נקודה.',
  micNeeded: 'צריך את המיקרופון כדי לשחק.',
  errors: {
    network: 'בעיית רשת – בדקו את החיבור ונסו שוב.',
    rate: 'לאט לאט! יותר מדי ניסיונות – חכו דקה.',
    quota: 'מכסת השירה החינמית להיום נגמרה – נתראה מחר!',
    failed: 'לא הצלחתי לשמוע את ההקלטה. נסו שוב!',
  },

  tap: 'לחצו!',
  singingTapDone: 'על המיקרופון… לחצו בסיום',
  buzzIn: (name) => `${name} – לחיצה`,
  tapWhenDone: (name) => `${name}, לחצו כשסיימתם לשיר`,
  points: (n) => `${n} נקודות`,

  whichSong: '🎵 איזה שיר זה היה…',
  songUnknown: '🎵 לא זיהיתי את השיר',
  thatWas: 'זה היה',
  lastSong: 'השיר הקודם',
  findThisSong: 'חפשו את השיר',
  appMissing: (app) => `אפליקציית ${app} לא נמצאה.`,
  openWebsite: (app) => `פתיחת האתר של ${app}`,

  micNeedsAccess: 'Sing First צריך את המיקרופון כדי לשמוע אתכם שרים.',
  tryAgain: 'לנסות שוב',
  openSettings: 'פתיחת ההגדרות',
  reloadPage: 'רענון הדף',
  close: 'סגירה',
  micHelp: {
    'ios-chrome': {
      title: 'הפעלת המיקרופון ב־Chrome',
      steps: [
        'פתחו את אפליקציית ההגדרות באייפון או באייפד.',
        'גללו למטה והקישו על Chrome (בגרסאות חדשות: אפליקציות ← Chrome).',
        'הפעילו את המיקרופון.',
        'חזרו לכאן והקישו על „לנסות שוב”. כש־Chrome שואל, הקישו על „אישור”.',
      ],
      tip: 'עדיין לא מופיעה שאלה? רעננו את הדף והקישו על „לנסות שוב”.',
    },
    'ios-safari': {
      title: 'אישור המיקרופון ב־Safari',
      steps: [
        'הקישו על כפתור „aA” (או תפריט הדף) בשורת הכתובת.',
        'הקישו על הגדרות אתר ← מיקרופון ← אישור.',
        'חזרו והקישו על „לנסות שוב”.',
      ],
      tip: 'אפשר גם: הגדרות ← אפליקציות ← Safari ← מיקרופון ← אישור.',
    },
    'ios-other': {
      title: 'הפעלת המיקרופון בדפדפן',
      steps: [
        'פתחו את אפליקציית ההגדרות באייפון או באייפד.',
        'מצאו את הדפדפן ברשימה (בגרסאות חדשות: אפליקציות ← הדפדפן).',
        'הפעילו את המיקרופון, חזרו והקישו על „לנסות שוב”.',
      ],
    },
    android: {
      title: 'אישור המיקרופון ב־Chrome',
      steps: [
        'הקישו על הסמל שמשמאל לכתובת האתר (🔒 או ⚙).',
        'הקישו על הרשאות ← מיקרופון ← אישור.',
        'חזרו והקישו על „לנסות שוב”.',
      ],
      tip: 'אם עדיין חסום: הגדרות אנדרואיד ← אפליקציות ← Chrome ← הרשאות ← מיקרופון ← אישור.',
    },
    'in-app': {
      title: 'פתחו את Sing First בדפדפן',
      steps: [
        'אתם בתוך דפדפן של אפליקציה אחרת (כמו וואטסאפ או אינסטגרם), שלא יכול להשתמש במיקרופון.',
        'הקישו על ⋯ או על כפתור השיתוף ובחרו „פתיחה בדפדפן” (Safari או Chrome).',
      ],
    },
    desktop: {
      title: 'אישור המיקרופון',
      steps: [
        'לחצו על הסמל שמשמאל לכתובת האתר (🔒 או ⚙).',
        'הגדירו את המיקרופון ל„אישור”.',
        'הקישו על „לנסות שוב” (או רעננו את הדף).',
      ],
    },
    native: {
      title: 'אישור המיקרופון',
      steps: ['פתחו את ההגדרות ← Sing First והפעילו את המיקרופון.', 'חזרו והקישו על „לנסות שוב”.'],
    },
  },
};

export const STRINGS: Record<UiLanguage, Strings> = { en, he };
