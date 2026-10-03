export type Player = {
  id: string;
  name: string;
  score: number;
  color: string;
};

export const MAX_PLAYERS = 8;

// Saturated colors that keep white text readable.
export const PLAYER_COLORS = [
  '#FF4F9A',
  '#1FA2FF',
  '#FF7A1A',
  '#18B87A',
  '#9B5CFF',
  '#D99A00',
  '#E5484D',
  '#0FB5AE',
] as const;

export function createPlayer(name: string, existing: Player[]): Player {
  const color =
    PLAYER_COLORS.find((c) => !existing.some((p) => p.color === c)) ??
    PLAYER_COLORS[existing.length % PLAYER_COLORS.length];
  return {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    score: 0,
    color,
  };
}
