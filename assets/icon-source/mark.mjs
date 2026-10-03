// Sing First icon: a stopwatch ring counting down around a microphone.
// All shapes use a 512×512 coordinate system centered on the ring.
export const COLORS = {
  bgTop: '#5B21B6',
  bgBottom: '#2B1055',
  timer: '#FFD23F',
  track: 'rgba(255,255,255,0.16)',
  micTop: '#FF7AB6',
  micBottom: '#FF2E86',
  metal: '#FFFFFF',
};

const CX = 256;
const CY = 282;
const R = 168;
const CIRC = 2 * Math.PI * R;

/**
 * The stopwatch + microphone artwork. `mono` draws a single-color silhouette;
 * `simple` drops fine details and thickens lines for tiny favicons.
 */
export function mark({ mono = false, simple = false } = {}) {
  const RING = simple ? 48 : 36;
  const STROKE = simple ? 26 : 18;
  const timer = mono ? '#fff' : COLORS.timer;
  const track = mono ? 'rgba(255,255,255,0.35)' : COLORS.track;
  const mic = mono ? '#fff' : 'url(#mic)';
  const metal = mono ? '#fff' : COLORS.metal;
  const grille = mono || simple ? 'none' : 'rgba(120,0,60,0.28)';
  return `
  <!-- crown + side button of the stopwatch -->
  <rect x="${CX - 34}" y="${CY - R - 92}" width="68" height="38" rx="14" fill="${timer}"/>
  <rect x="${CX - 12}" y="${CY - R - 60}" width="24" height="44" fill="${timer}"/>
  ${simple ? '' : `<rect x="${CX + 112}" y="${CY - R - 18}" width="52" height="30" rx="12" fill="${timer}"
        transform="rotate(45 ${CX + 138} ${CY - R - 3})"/>`}
  <!-- ring: faint track + 3/4 countdown arc starting at 12 o'clock -->
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${track}" stroke-width="${RING}"/>
  <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${timer}" stroke-width="${RING}"
          stroke-linecap="round" stroke-dasharray="${(CIRC * 0.75).toFixed(1)} ${CIRC.toFixed(1)}"
          transform="rotate(-90 ${CX} ${CY})"/>
  <!-- microphone -->
  <rect x="${CX - 54}" y="${CY - 118}" width="108" height="164" rx="54" fill="${mic}"/>
  <g stroke="${grille}" stroke-width="10" stroke-linecap="round">
    <line x1="${CX - 30}" y1="${CY - 70}" x2="${CX + 30}" y2="${CY - 70}"/>
    <line x1="${CX - 30}" y1="${CY - 42}" x2="${CX + 30}" y2="${CY - 42}"/>
    <line x1="${CX - 30}" y1="${CY - 14}" x2="${CX + 30}" y2="${CY - 14}"/>
  </g>
  <g fill="none" stroke="${metal}" stroke-width="${STROKE}" stroke-linecap="round">
    <path d="M ${CX - 82} ${CY - 6} a 82 82 0 0 0 164 0"/>
    <line x1="${CX}" y1="${CY + 76}" x2="${CX}" y2="${CY + 108}"/>
    <line x1="${CX - 40}" y1="${CY + 110}" x2="${CX + 40}" y2="${CY + 110}"/>
  </g>`;
}

const DEFS = `
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${COLORS.bgTop}"/><stop offset="1" stop-color="${COLORS.bgBottom}"/>
    </linearGradient>
    <linearGradient id="mic" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${COLORS.micTop}"/><stop offset="1" stop-color="${COLORS.micBottom}"/>
    </linearGradient>
  </defs>`;

/**
 * Full icon. `radius` rounds the background (0 for iOS, which masks it
 * itself). `scale` shrinks the artwork, e.g. for Android's safe zone.
 */
export function iconSvg({ background = true, artwork = true, radius = 0, scale = 0.9, mono = false, simple = false } = {}) {
  const offset = (512 - 512 * scale) / 2;
  // Nudge down a little so the crown + ring look optically centered.
  const t = `translate(${offset} ${offset + 10 * scale}) scale(${scale})`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${DEFS}
  ${background ? `<rect width="512" height="512" rx="${radius}" fill="url(#bg)"/>` : ''}
  ${artwork ? `<g transform="${t}">${mark({ mono, simple })}</g>` : ''}
</svg>`;
}
