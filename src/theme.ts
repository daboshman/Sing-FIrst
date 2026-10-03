import { useWindowDimensions } from 'react-native';

export const colors = {
  background: '#2B1055',
  backgroundAccent: '#3D1A78',
  card: '#FFD23F',
  cardText: '#2B1055',
  text: '#FFFFFF',
  textMuted: '#C9B8F0',
  record: '#FF4F9A',
  recording: '#FF2E2E',
  success: '#2EE59D',
  failure: '#FF8A3D',
  surface: 'rgba(255,255,255,0.12)',
  surfaceBorder: 'rgba(255,255,255,0.22)',
  buttonSecondary: '#7B5CFF',
} as const;

/**
 * Scale factor relative to a ~390pt-wide phone, clamped so tablets get
 * bigger type and touch targets without things becoming cartoonish.
 */
export function useScale() {
  const { width, height } = useWindowDimensions();
  const shortSide = Math.min(width, height);
  const scale = Math.max(0.85, Math.min(shortSide / 390, 1.8));
  const isTablet = shortSide >= 600;
  return { scale, isTablet, width, height };
}
