// rc.4: a flat picture of each build as it stands, for the main-build card (Sir: the current state
// shown big and in focus). Drawn in code in the game's colours, one per tier.

const SKY = '#1b2a22';
const GROUND = '#3b3122';
const BOUGH = '#4f6b3a';
const WOOD = '#8a6a44';
const DARK = '#5b4630';
const TARP = '#3f6f7a';
const EARTH = '#5a4a36';
const STONE = '#7c7a70';
const CLAY = '#a0643c';

const pic = (body: string) =>
  `<svg viewBox="0 0 220 120" preserveAspectRatio="xMidYMid slice"><rect width="220" height="120" fill="${SKY}"/><rect y="92" width="220" height="28" fill="${GROUND}"/>${body}</svg>`;
const logs = (x: number, y: number, w: number, n: number) =>
  Array.from({ length: n }, (_, i) => `<rect x="${x}" y="${y - i * 10}" width="${w}" height="10" rx="5" fill="${i % 2 ? DARK : WOOD}"/>`).join('');
const stones = (cx: number, n: number, r: number) =>
  Array.from({ length: n }, (_, i) => `<ellipse cx="${cx - (n - 1) * r + i * r * 2}" cy="90" rx="${r}" ry="${r * 0.7}" fill="${STONE}"/>`).join('');
const nothing = (what: string) => pic(`<text x="110" y="70" text-anchor="middle" fill="#66755f" font-size="13" font-family="Georgia">${what}</text>`);

const TENT = `<line x1="70" y1="92" x2="70" y2="58" stroke="${WOOD}" stroke-width="4"/><line x1="150" y1="92" x2="150" y2="58" stroke="${WOOD}" stroke-width="4"/><polygon points="50,92 110,58 170,92" fill="${TARP}"/>`;

export const BUILD_PICS: Record<string, string[]> = {
  shelter: [
    pic(TENT),
    pic(`<line x1="60" y1="92" x2="60" y2="40" stroke="${WOOD}" stroke-width="6"/><line x1="160" y1="92" x2="160" y2="40" stroke="${WOOD}" stroke-width="6"/><line x1="50" y1="42" x2="170" y2="42" stroke="${WOOD}" stroke-width="6"/><polygon points="52,42 168,42 190,92 30,92" fill="${BOUGH}"/>`),
    pic(`<polygon points="40,92 110,28 180,92" fill="${BOUGH}"/><polygon points="90,92 110,62 130,92" fill="#111"/><line x1="40" y1="92" x2="112" y2="26" stroke="${WOOD}" stroke-width="5"/><line x1="180" y1="92" x2="108" y2="26" stroke="${WOOD}" stroke-width="5"/>`),
    pic(`${logs(45, 82, 130, 5)}<polygon points="35,42 110,14 185,42" fill="${DARK}"/><rect x="98" y="62" width="24" height="30" fill="#111"/>`),
  ],
  dugout: [
    pic(TENT),
    pic(`<rect x="50" y="88" width="120" height="12" fill="#21190f"/><ellipse cx="34" cy="92" rx="22" ry="12" fill="${EARTH}"/><ellipse cx="190" cy="92" rx="20" ry="10" fill="${EARTH}"/><line x1="58" y1="92" x2="58" y2="70" stroke="${WOOD}" stroke-width="3"/><line x1="162" y1="92" x2="162" y2="70" stroke="${WOOD}" stroke-width="3"/><rect x="52" y="68" width="116" height="4" fill="${TARP}"/>`),
    pic(`<rect x="50" y="88" width="120" height="12" fill="#21190f"/>${logs(50, 82, 120, 3)}<rect x="52" y="60" width="116" height="4" fill="${TARP}"/>`),
    pic(`<path d="M30 92 Q110 22 190 92 Z" fill="${EARTH}"/><path d="M40 92 Q110 34 180 92" fill="none" stroke="${BOUGH}" stroke-width="6"/><rect x="98" y="66" width="24" height="26" fill="#111"/>`),
  ],
  firepit: [
    pic(`<path d="M96 92 l8 -14 l6 14 M108 92 l6 -18 l8 18" stroke="${WOOD}" stroke-width="4" fill="none"/><path d="M104 84 q6 -18 10 -30 q6 14 2 30" fill="#e58f3c" opacity=".8"/>`),
    pic(`${stones(110, 6, 9)}<path d="M104 84 q6 -18 10 -30 q6 14 2 30" fill="#e58f3c"/>`),
    pic(`<ellipse cx="110" cy="92" rx="62" ry="10" fill="${CLAY}"/>${stones(110, 6, 9)}<path d="M100 84 q8 -26 14 -40 q8 20 2 40" fill="#e58f3c"/>`),
  ],
  rack: [
    nothing('no rack yet'),
    pic(`<line x1="70" y1="92" x2="110" y2="30" stroke="${WOOD}" stroke-width="5"/><line x1="150" y1="92" x2="110" y2="30" stroke="${WOOD}" stroke-width="5"/><line x1="110" y1="92" x2="110" y2="30" stroke="${DARK}" stroke-width="5"/><line x1="80" y1="60" x2="140" y2="60" stroke="${WOOD}" stroke-width="3"/><line x1="86" y1="72" x2="134" y2="72" stroke="${WOOD}" stroke-width="3"/>`),
    pic(`${stones(110, 5, 10)}<line x1="70" y1="86" x2="110" y2="34" stroke="${WOOD}" stroke-width="5"/><line x1="150" y1="86" x2="110" y2="34" stroke="${WOOD}" stroke-width="5"/><polygon points="60,40 110,18 160,40" fill="${DARK}"/><line x1="80" y1="60" x2="140" y2="60" stroke="${WOOD}" stroke-width="3"/>`),
  ],
  cache: [
    nothing('no cache yet'),
    pic(`${logs(70, 82, 80, 3)}<rect x="66" y="56" width="88" height="8" fill="${STONE}"/>`),
    pic(`${logs(70, 82, 80, 3)}<rect x="70" y="62" width="80" height="30" fill="${CLAY}" opacity=".55"/><rect x="66" y="56" width="88" height="8" fill="${STONE}"/>`),
    pic(`<line x1="78" y1="92" x2="78" y2="50" stroke="${WOOD}" stroke-width="6"/><line x1="142" y1="92" x2="142" y2="50" stroke="${WOOD}" stroke-width="6"/><rect x="62" y="44" width="96" height="6" fill="${DARK}"/>${logs(72, 34, 76, 2)}<rect x="68" y="16" width="84" height="6" fill="${STONE}"/>`),
  ],
};
