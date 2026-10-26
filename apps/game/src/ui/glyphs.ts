// The game's own icons (rc.3, D-083): Sir asked for no emojis anywhere. v12's words still carry
// its emojis, so every one that reaches the screen is swapped here for a small picture drawn in
// the same flat, earthy style as the resource icons, or dropped when it is only decoration.

const C = {
  ember: '#e58f3c', flame: '#ffd27a', bone: '#ece5d2', sage: '#8fa088', dim: '#66755f', water: '#5d9fc7', ice: '#bfe0f0',
  wood: '#8a6038', woodDark: '#5e4026', stone: '#a8a59c', stoneDark: '#77746c', moss: '#5a8a3a', blood: '#d6544e',
  tan: '#c08a54', night: '#8a9ac0', cloud: '#c9ccd0', cloudDark: '#8b9096', steel: '#c8ccd0', fur: '#7a5a40', berry: '#5a4a9a',
};

const flame = (x = 12, y = 13, s = 1) =>
  `<path transform="translate(${x} ${y}) scale(${s})" d="M0-10c3 4 7 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 4 3 4 0-4-1-6 0-9z" fill="${C.ember}"/><path transform="translate(${x} ${y}) scale(${s})" d="M0-3c1.5 2 3 3.5 3 5.5a3 3 0 0 1-6 0c0-1.5 1.5-3 3-5.5z" fill="${C.flame}"/>`;
const drop = (x: number, y: number, s: number, fill: string) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0-6c2 3 4 5 4 7.5a4 4 0 0 1-8 0C-4-1-2-3 0-6z" fill="${fill}"/>`;
const cloud = (fill: string, y = 0) => `<path d="M6 ${16 + y}a4 4 0 0 1 .6-8 5.5 5.5 0 0 1 10.6 1.4A3.4 3.4 0 0 1 18 ${16 + y}z" fill="${fill}"/>`;

/** Each picture is the inside of a 24 by 24 SVG. */
export const GLYPHS = {
  energy: `<path d="M13.5 2 5 13.5h6l-1.5 8.5L19 10h-6z" fill="${C.ember}" stroke="#7a4410" stroke-width="0.8" stroke-linejoin="round"/>`,
  rest: `<path d="M3 19h18" stroke="${C.wood}" stroke-width="2.4" stroke-linecap="round"/><rect x="4" y="15" width="16" height="4" rx="2" fill="${C.wood}"/><circle cx="9" cy="6.5" r="2.4" fill="${C.bone}"/><path d="M9 9.5c-3 0-4 3-4 5.5h9c0-2.5-1-5.5-5-5.5z" fill="${C.sage}"/><path d="M15 6c1.2-1.4 3-1.6 4.4-.8M15.6 8.6c.9-.8 2.1-.9 3-.4" stroke="${C.dim}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  sleep: `<path d="M15.5 3.5a8.5 8.5 0 1 0 5 13.6A7 7 0 0 1 15.5 3.5z" fill="${C.night}"/><circle cx="17.5" cy="7" r="0.9" fill="${C.bone}"/><circle cx="20" cy="11" r="0.6" fill="${C.bone}"/>`,
  fire: `${flame()}<path d="M4 21l16-3M4 18l16 3" stroke="${C.wood}" stroke-width="2.2" stroke-linecap="round"/>`,
  ember: `<path d="M4 20l16-3M4 17l16 3" stroke="${C.woodDark}" stroke-width="2.2" stroke-linecap="round"/><circle cx="10" cy="17.5" r="1.3" fill="${C.ember}"/><circle cx="14" cy="18.5" r="1" fill="${C.ember}"/><path d="M11 13c0-2 2-2 2-4M14 12c0-1.5 1.5-1.5 1.5-3" stroke="${C.cloudDark}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  wet: `${drop(9, 11, 1.1, C.water)}${drop(16, 15, 0.9, C.water)}${drop(12, 19, 0.6, C.ice)}`,
  dry: `<circle cx="12" cy="12" r="4.4" fill="${C.ember}"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" stroke="${C.ember}" stroke-width="1.6" stroke-linecap="round"/>`,
  clear: `<circle cx="12" cy="12" r="4.6" fill="${C.flame}"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2 2M16.7 16.7l2 2M5.3 18.7l2-2M16.7 7.3l2-2" stroke="${C.flame}" stroke-width="1.6" stroke-linecap="round"/>`,
  cloud: `<circle cx="8" cy="9" r="3" fill="${C.flame}"/>${cloud(C.cloud, 2)}`,
  overcast: `${cloud(C.cloudDark, -2)}${cloud(C.cloud, 3)}`,
  rain: `${cloud(C.cloud, -3)}<path d="M8 16l-1 3M12 16l-1 3M16 16l-1 3" stroke="${C.water}" stroke-width="1.6" stroke-linecap="round"/>`,
  snow: `${cloud(C.cloud, -3)}<g fill="${C.ice}"><circle cx="8" cy="17.5" r="1.2"/><circle cx="12" cy="19.5" r="1.2"/><circle cx="16" cy="17.5" r="1.2"/></g>`,
  storm: `${cloud(C.cloudDark, -3)}<path d="M12.5 13 9.5 18h3l-1.5 4 4.5-6h-3l1.5-3z" fill="${C.flame}"/>`,
  fog: `<path d="M4 8h16M2 12h14M6 16h16M4 20h12" stroke="${C.cloud}" stroke-width="1.8" stroke-linecap="round"/>`,
  wind: `<path d="M3 9h11a3 3 0 1 0-3-3M3 14h15a3 3 0 1 1-3 3M3 19h7" stroke="${C.cloud}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`,
  cold: `<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" stroke="${C.ice}" stroke-width="1.7" stroke-linecap="round"/><path d="M10 4.5l2 2 2-2M10 19.5l2-2 2 2" stroke="${C.ice}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`,
  temp: `<rect x="10" y="3" width="4" height="13" rx="2" fill="none" stroke="${C.bone}" stroke-width="1.4"/><circle cx="12" cy="18" r="3.3" fill="${C.blood}"/><rect x="11.2" y="9" width="1.6" height="8" fill="${C.blood}"/>`,
  weight: `<path d="M5 9h14l2 11H3z" fill="${C.stoneDark}"/><circle cx="12" cy="6" r="2.4" fill="none" stroke="${C.stoneDark}" stroke-width="1.8"/><path d="M8.5 14h7" stroke="${C.bone}" stroke-width="1.4" stroke-linecap="round"/>`,
  shelter: `<path d="M2 20 12 5l10 15z" fill="${C.moss}"/><path d="M12 5v15M8 20l4-6 4 6z" fill="${C.woodDark}"/><path d="M2 20h20" stroke="${C.wood}" stroke-width="1.6" stroke-linecap="round"/>`,
  injury: `<rect x="3" y="9" width="18" height="6" rx="3" fill="${C.tan}" transform="rotate(-35 12 12)"/><rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="${C.bone}" transform="rotate(-35 12 12)"/>`,
  health: `<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="${C.blood}"/>`,
  morale: `<circle cx="12" cy="12" r="8" fill="none" stroke="${C.flame}" stroke-width="1.6"/><path d="M8.5 13.5a4 4 0 0 0 7 0" stroke="${C.flame}" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="9" cy="10" r="1" fill="${C.flame}"/><circle cx="15" cy="10" r="1" fill="${C.flame}"/>`,
  low: `<circle cx="12" cy="12" r="8" fill="none" stroke="${C.sage}" stroke-width="1.6"/><path d="M8.5 16a4 4 0 0 1 7 0" stroke="${C.sage}" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="9" cy="10" r="1" fill="${C.sage}"/><circle cx="15" cy="10" r="1" fill="${C.sage}"/>`,
  thought: `<path d="M5 13a5 5 0 0 1 4-8 5 5 0 0 1 9 2 4 4 0 0 1-1 8H8a3 3 0 0 1-3-2z" fill="${C.bone}" opacity="0.85"/><circle cx="7" cy="19" r="1.5" fill="${C.bone}" opacity="0.85"/><circle cx="4.5" cy="21.5" r="0.9" fill="${C.bone}" opacity="0.85"/>`,
  food: `<path d="M3 12h18a9 7 0 0 1-18 0z" fill="${C.stoneDark}"/><ellipse cx="12" cy="12" rx="9" ry="2" fill="#c08a4a"/><path d="M9 9c0-2 2-2 2-4M14 9c0-2 2-2 2-4" stroke="${C.cloud}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  water: drop(12, 13, 1.6, C.water),
  boil: `<path d="M4 11h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" fill="${C.stoneDark}"/><path d="M2 11h20" stroke="${C.stone}" stroke-width="1.6" stroke-linecap="round"/><path d="M8 8c0-2 2-2 2-4M12 8c0-2 2-2 2-4M16 8c0-2 2-2 2-4" stroke="${C.cloud}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  berries: `<circle cx="9" cy="15" r="3.6" fill="${C.berry}"/><circle cx="15" cy="15.5" r="3.4" fill="#4a3a8a"/><circle cx="12" cy="10.5" r="3.2" fill="#3e3078"/><path d="M12 7c2-3 5-3 7-2-2 2-4 3-7 2z" fill="${C.moss}"/>`,
  meat: `<path d="M5 13c0-5 4-8 9-7s6 6 3 9-6 4-9 3-3-2-3-5z" fill="#b8473c"/><path d="M8 12c1-2 3-3 5-3" stroke="#e8a090" stroke-width="1.5" fill="none" stroke-linecap="round"/><rect x="15" y="15" width="6" height="2.4" rx="1.2" fill="#efe3c8" transform="rotate(40 18 16)"/>`,
  smoked: `<rect x="4" y="8" width="16" height="5" rx="2" fill="#6a3a24" transform="rotate(-8 12 10)"/><rect x="5" y="14" width="15" height="5" rx="2" fill="#7a4428" transform="rotate(6 12 16)"/><path d="M8 6c0-2 2-2 2-4M14 6c0-2 2-2 2-4" stroke="${C.cloudDark}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`,
  rations: `<rect x="6" y="5" width="12" height="15" rx="2" fill="${C.steel}"/><rect x="6" y="9" width="12" height="7" fill="${C.ember}"/><path d="M6 7h12M6 18h12" stroke="${C.stoneDark}" stroke-width="1"/>`,
  wood: `<rect x="3" y="12" width="17" height="6" rx="3" fill="#7a5532"/><rect x="5" y="6" width="17" height="6" rx="3" fill="${C.wood}"/><circle cx="6" cy="15" r="3" fill="#d9b483" stroke="#7a5532"/><circle cx="8" cy="9" r="3" fill="#e2bf8e" stroke="${C.wood}"/>`,
  rocks: `<path d="M2 19l3-7 5-2 4 3 1 6z" fill="#8c8a84"/><path d="M11 19l2-6 5-3 4 4v5z" fill="${C.stone}"/><path d="M5 12l5-2 1 3-6 1z" fill="#b8b5ac"/>`,
  moss: `<ellipse cx="12" cy="17" rx="9" ry="4" fill="#3f6a2c"/><circle cx="8" cy="14" r="3.5" fill="${C.moss}"/><circle cx="13" cy="12.5" r="4" fill="#6a9a42"/><circle cx="17" cy="15" r="3" fill="#4f7d34"/>`,
  clay: `<path d="M4 18c0-6 3-10 8-10s8 4 8 10z" fill="#9a8a7a"/><path d="M7 15c1-3 3-4 5-4" stroke="#c4b4a2" stroke-width="1.5" fill="none" stroke-linecap="round"/><rect x="3" y="18" width="18" height="2.5" rx="1.2" fill="#7a6a5c"/>`,
  tinder: `<path d="M4 19c4-2 6-8 7-14M8 20c3-3 5-8 5-13M12 20c2-3 3-7 6-11M15 20c2-2 4-4 6-6" stroke="#c9b27a" stroke-width="1.6" fill="none" stroke-linecap="round"/><ellipse cx="12" cy="19.5" rx="8" ry="2" fill="#a88e58"/>`,
  axe: `<path d="M6 21 17 6" stroke="${C.wood}" stroke-width="2.2" stroke-linecap="round"/><path d="M14 3c3 0 6 2 7 5l-4 3-4-4z" fill="${C.steel}"/>`,
  saw: `<path d="M3 14h15l3-3H6z" fill="${C.steel}"/><path d="M4 14l1 2 1-2 1 2 1-2 1 2 1-2 1 2 1-2 1 2 1-2 1 2 1-2" stroke="${C.stoneDark}" stroke-width="0.9" fill="none"/><rect x="17" y="9" width="5" height="6" rx="2" fill="${C.wood}"/>`,
  knife: `<path d="M3 15c6-1 11-5 14-10l2 2c-2 4-6 8-12 10z" fill="${C.steel}"/><rect x="16" y="14" width="6" height="3" rx="1.4" fill="${C.wood}" transform="rotate(-45 19 15.5)"/>`,
  shovel: `<path d="M8 16 19 5" stroke="${C.wood}" stroke-width="2" stroke-linecap="round"/><path d="M17 3l4 4M18 2.5l3.5 3.5" stroke="${C.wood}" stroke-width="1.6" stroke-linecap="round"/><path d="M3 21l1-6 5-3 3 3-3 5z" fill="${C.steel}"/>`,
  build: `<path d="M5 20 14 11" stroke="${C.wood}" stroke-width="2.4" stroke-linecap="round"/><path d="M11 6l4-3 6 6-3 4z" fill="${C.stoneDark}"/>`,
  dig: `<path d="M3 20h18" stroke="${C.woodDark}" stroke-width="2" stroke-linecap="round"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6z" fill="#6a4e34"/><path d="M14 13 20 3" stroke="${C.wood}" stroke-width="1.8" stroke-linecap="round"/><path d="M11 15l2-4 3 2-2 3z" fill="${C.steel}"/>`,
  firepit: `${flame(12, 12, 0.8)}<ellipse cx="12" cy="18" rx="9" ry="3" fill="none" stroke="${C.stone}" stroke-width="2.4" stroke-dasharray="3 1.4"/>`,
  rack: `<path d="M4 21 8 4M20 21 16 4M5 9h14M6 14h12" stroke="${C.wood}" stroke-width="1.8" stroke-linecap="round"/><rect x="8" y="9.5" width="3" height="4" rx="1" fill="#7a4428"/><rect x="13" y="9.5" width="3" height="4" rx="1" fill="#7a4428"/>`,
  cache: `<rect x="5" y="9" width="14" height="10" rx="1" fill="${C.wood}"/><path d="M4 9l8-5 8 5z" fill="${C.woodDark}"/><path d="M5 14h14" stroke="${C.woodDark}" stroke-width="1"/><path d="M7 19v3M17 19v3" stroke="${C.woodDark}" stroke-width="1.8"/>`,
  insulate: `<path d="M2 20 12 5l10 15z" fill="${C.woodDark}"/>${''}<circle cx="9" cy="15" r="2.4" fill="${C.moss}"/><circle cx="13" cy="13" r="2.4" fill="#6a9a42"/><circle cx="15" cy="17" r="2.2" fill="${C.moss}"/>`,
  comfort: `<path d="M6 11h12v4H6zM7 15v6M17 15v6M6 11V5" stroke="${C.wood}" stroke-width="2" stroke-linecap="round" fill="none"/>`,
  snare: `<path d="M12 3v6" stroke="${C.wood}" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="15" r="5.5" fill="none" stroke="${C.steel}" stroke-width="1.6"/><path d="M12 9v1" stroke="${C.steel}" stroke-width="1.6"/>`,
  line: `<path d="M4 3c4 2 8 6 9 11" stroke="${C.wood}" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M13 14v4a2 2 0 0 0 4 0" stroke="${C.steel}" stroke-width="1.4" fill="none" stroke-linecap="round"/><path d="M3 20c3-1.5 6-1.5 9 0s6 1.5 9 0" stroke="${C.water}" stroke-width="1.4" fill="none"/>`,
  net: `<path d="M4 4h16v16H4z" fill="none" stroke="${C.bone}" stroke-width="1.1"/><path d="M4 9.3h16M4 14.6h16M9.3 4v16M14.6 4v16" stroke="${C.bone}" stroke-width="1"/><g fill="${C.ember}"><circle cx="4" cy="4" r="1.3"/><circle cx="20" cy="4" r="1.3"/></g>`,
  fish: `<path d="M3 12c3-4 9-5 13-1-4 4-10 3-13 1z" fill="${C.water}"/><path d="M16 11l5-3v8z" fill="${C.water}"/><circle cx="7" cy="11" r="0.9" fill="#0a1a24"/>`,
  bow: `<path d="M7 3c8 3 8 15 0 18" stroke="${C.wood}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M7 3v18" stroke="${C.bone}" stroke-width="0.9"/><path d="M4 12h16" stroke="#b08858" stroke-width="1.4"/><path d="M20 12l-3-2v4z" fill="${C.steel}"/>`,
  tracks: `<g fill="${C.sage}"><ellipse cx="8" cy="16" rx="2.4" ry="3"/><circle cx="5.2" cy="11.8" r="1.1"/><circle cx="8" cy="10.8" r="1.1"/><circle cx="10.8" cy="11.8" r="1.1"/><ellipse cx="16" cy="9" rx="2.2" ry="2.7"/><circle cx="13.5" cy="5.2" r="1"/><circle cx="16" cy="4.3" r="1"/><circle cx="18.5" cy="5.2" r="1"/></g>`,
  look: `<path d="M2 12s4-6.5 10-6.5S22 12 22 12s-4 6.5-10 6.5S2 12 2 12z" fill="none" stroke="${C.bone}" stroke-width="1.5"/><circle cx="12" cy="12" r="3.2" fill="${C.sage}"/><circle cx="12" cy="12" r="1.3" fill="#0b100c"/>`,
  scout: `<rect x="3" y="9" width="7" height="9" rx="3" fill="${C.stoneDark}"/><rect x="14" y="9" width="7" height="9" rx="3" fill="${C.stoneDark}"/><rect x="9" y="11" width="6" height="3" fill="${C.stoneDark}"/><circle cx="6.5" cy="15" r="2" fill="${C.water}"/><circle cx="17.5" cy="15" r="2" fill="${C.water}"/>`,
  blood: drop(12, 13, 1.4, C.blood),
  animal: `<path d="M5 15c0-4 3-7 7-7s7 3 7 7-3 5-7 5-7-1-7-5z" fill="${C.fur}"/><circle cx="7" cy="8" r="2.2" fill="${C.fur}"/><circle cx="17" cy="8" r="2.2" fill="${C.fur}"/><circle cx="10" cy="14" r="0.9" fill="#1a1006"/><circle cx="14" cy="14" r="0.9" fill="#1a1006"/><ellipse cx="12" cy="17" rx="1.6" ry="1" fill="#1a1006"/>`,
  wolf: `<path d="M4 4l4 5h8l4-5-1 9-3 5-4 2-4-2-3-5z" fill="${C.stoneDark}"/><path d="M10 16h4l-2 2z" fill="#1a1a1a"/><circle cx="9.5" cy="12" r="0.9" fill="${C.flame}"/><circle cx="14.5" cy="12" r="0.9" fill="${C.flame}"/>`,
  bird: `<path d="M3 13c3-3 6-4 9-3 2-3 5-4 8-3-2 1-3 2-3 4 0 4-4 7-9 7-2 0-4-1-5-3z" fill="${C.stoneDark}"/><circle cx="16" cy="9.5" r="0.8" fill="${C.bone}"/><path d="M20 8l2-.5-2 1.5z" fill="${C.ember}"/>`,
  med: `<rect x="3" y="7" width="18" height="13" rx="2" fill="${C.bone}"/><path d="M9 7V5h6v2" stroke="${C.bone}" stroke-width="1.6" fill="none"/><path d="M12 10v7M8.5 13.5h7" stroke="${C.blood}" stroke-width="2.4" stroke-linecap="round"/>`,
  phone: `<rect x="7" y="5" width="10" height="16" rx="2" fill="#e0b020"/><rect x="9" y="8" width="6" height="5" rx="0.6" fill="#24343e"/><path d="M15 5V2" stroke="#1a1a1a" stroke-width="1.6" stroke-linecap="round"/><circle cx="12" cy="17" r="1.5" fill="${C.blood}"/>`,
  radio: `<rect x="3" y="8" width="18" height="12" rx="2" fill="${C.stoneDark}"/><circle cx="8.5" cy="14" r="3.2" fill="${C.cloudDark}"/><path d="M14 12h5M14 15h5" stroke="${C.bone}" stroke-width="1.2"/><path d="M6 8l10-5" stroke="${C.steel}" stroke-width="1.2" stroke-linecap="round"/>`,
  camera: `<rect x="2" y="7" width="14" height="11" rx="2" fill="${C.stoneDark}"/><path d="M16 10.5l6-3v10l-6-3z" fill="${C.stoneDark}"/><circle cx="6" cy="10" r="1.3" fill="${C.blood}"/>`,
  letter: `<rect x="3" y="6" width="18" height="13" rx="1.5" fill="${C.bone}"/><path d="M3.5 7l8.5 6.5L20.5 7" stroke="${C.stoneDark}" stroke-width="1.3" fill="none"/>`,
  home: `<path d="M3 12 12 4l9 8" stroke="${C.ember}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 11v9h12v-9" fill="${C.wood}"/><rect x="10.5" y="14" width="3" height="6" fill="${C.flame}"/>`,
  map: `<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="#c4b48a"/><path d="M9 4v14M15 6v14" stroke="#8a7a5a" stroke-width="1"/><path d="M5 14c2-1 3-4 6-3s4 3 7 1" stroke="${C.blood}" stroke-width="1.2" stroke-dasharray="1.6 1.2" fill="none"/>`,
  walk: `<circle cx="13" cy="4.5" r="2.2" fill="${C.bone}"/><path d="M12 8l-3 5 3 1 1 7M12 8l3 5 3 1M9 13l-3 7" stroke="${C.bone}" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  time: `<circle cx="12" cy="12" r="8.5" fill="none" stroke="${C.bone}" stroke-width="1.6"/><path d="M12 7v5l3.5 2" stroke="${C.bone}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`,
  wait: `<path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" stroke="${C.tan}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
  people: `<circle cx="8" cy="8" r="3" fill="${C.sage}"/><circle cx="16.5" cy="9" r="2.6" fill="${C.dim}"/><path d="M2 20c0-4 3-7 6-7s6 3 6 7z" fill="${C.sage}"/><path d="M12 20c0-3.5 2-6 4.5-6S21 16.5 21 20z" fill="${C.dim}"/>`,
  warning: `<path d="M12 3 22 20H2z" fill="${C.ember}"/><path d="M12 9v5" stroke="#1a1006" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1.2" fill="#1a1006"/>`,
  star: `<path d="M12 3l2.4 6 6.4.4-5 4 1.7 6.3L12 16.2 6.5 19.7 8.2 13.4l-5-4 6.4-.4z" fill="${C.flame}"/>`,
  music: `<path d="M9 17V5l10-2v12" stroke="${C.bone}" stroke-width="1.6" fill="none"/><ellipse cx="7" cy="17" rx="2.6" ry="2" fill="${C.bone}"/><ellipse cx="17" cy="15" rx="2.6" ry="2" fill="${C.bone}"/>`,
  ice: `<path d="M4 9l8-5 8 5v8l-8 4-8-4z" fill="${C.ice}" opacity="0.9"/><path d="M4 9l8 4 8-4M12 13v8" stroke="#fff" stroke-width="1" fill="none"/>`,
  wash: `<ellipse cx="12" cy="15" rx="7" ry="4.5" fill="${C.bone}"/><circle cx="8" cy="8" r="2" fill="none" stroke="${C.water}" stroke-width="1.2"/><circle cx="14" cy="6" r="1.4" fill="none" stroke="${C.water}" stroke-width="1.2"/>`,
  pack: `<rect x="5" y="7" width="14" height="14" rx="3" fill="${C.moss}"/><path d="M9 7V5a3 3 0 0 1 6 0v2" stroke="${C.moss}" stroke-width="1.8" fill="none"/><rect x="8" y="12" width="8" height="5" rx="1" fill="#3f6a2c"/>`,
  sick: `<circle cx="12" cy="12" r="8" fill="#9ab070"/><path d="M8 15c1.5-1.5 6.5-1.5 8 0" stroke="#3f5a2c" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M8 9.5l2 1M16 9.5l-2 1" stroke="#3f5a2c" stroke-width="1.5" stroke-linecap="round"/>`,
  bag: `<rect x="3" y="8" width="18" height="9" rx="4.5" fill="#3a5a7a"/><path d="M8 8v9M13 8v9" stroke="#2a4058" stroke-width="1"/><rect x="17" y="9" width="3" height="7" rx="1.5" fill="#2a4058"/>`,
  mace: `<rect x="8" y="8" width="8" height="13" rx="2" fill="${C.blood}"/><rect x="9.5" y="4" width="5" height="4" rx="1" fill="${C.stoneDark}"/><path d="M14.5 5h3" stroke="${C.stoneDark}" stroke-width="1.6"/><rect x="9" y="12" width="6" height="4" fill="${C.flame}"/>`,
  salt: `<path d="M7 9h10l-1 11H8z" fill="${C.bone}"/><path d="M7 9c0-3 2-5 5-5s5 2 5 5z" fill="${C.steel}"/><circle cx="10" cy="6.5" r="0.6" fill="${C.stoneDark}"/><circle cx="12" cy="5.5" r="0.6" fill="${C.stoneDark}"/><circle cx="14" cy="6.5" r="0.6" fill="${C.stoneDark}"/>`,
  tarp: `<path d="M2 18 12 6l10 12z" fill="#3a6a8a"/><path d="M12 6v12M2 18h20" stroke="#2a4a62" stroke-width="1.2"/><path d="M2 18l-1 3M22 18l1 3" stroke="${C.wood}" stroke-width="1.2"/>`,
  tooth: `<path d="M6 4c2-1 4 0 6 0s4-1 6 0c2 2 1 6 0 8l-1 8c-1 1-2 0-2-1l-1-5h-4l-1 5c0 1-1 2-2 1l-1-8c-1-2-2-6 0-8z" fill="${C.bone}"/>`,
} as const;

export type GlyphId = keyof typeof GLYPHS;

/** v12's emojis, by meaning. Anything not listed here is decoration and is dropped. */
const EMOJI: Record<string, GlyphId> = {
  '⚡': 'energy', '🔋': 'energy', '🧘': 'rest', '😪': 'rest', '🌙': 'sleep', '💤': 'sleep', '😴': 'sleep', '🛌': 'comfort', '🛏': 'bag',
  '🔥': 'fire', '🎇': 'fire', '♨️': 'boil', '💧': 'water', '🪣': 'water', '🏞': 'water', '🏺': 'water', '💦': 'wet', '🌊': 'wet',
  '☀️': 'clear', '🌅': 'clear', '🌄': 'clear', '☁️': 'overcast', '🌧': 'rain', '🌨': 'snow', '❄️': 'cold', '🥶': 'cold', '🧊': 'ice',
  '⛈': 'storm', '🌫': 'fog', '🌬': 'wind', '🌡': 'temp', '🥵': 'temp', '⚖️': 'weight',
  '🏕': 'shelter', '⛺': 'tarp', '🏗': 'build', '🛠': 'build', '🔧': 'build', '⛏': 'dig', '⛰': 'firepit', '🗃': 'cache', '📦': 'cache', '🧶': 'insulate', '🪑': 'comfort',
  '🩹': 'injury', '🤕': 'injury', '🦴': 'injury', '🩸': 'blood', '🩺': 'med', '🤢': 'sick', '🤧': 'sick', '🦷': 'tooth',
  '🍲': 'food', '🥫': 'rations', '🧂': 'salt', '🫐': 'berries', '🍇': 'berries', '🧺': 'berries', '🥩': 'meat', '🥓': 'smoked', '🐟': 'fish',
  '🪵': 'wood', '🪨': 'rocks', '🌿': 'moss', '🧱': 'clay', '🟫': 'clay', '🌾': 'tinder', '🪓': 'axe', '🪚': 'saw', '🔪': 'knife',
  '🪤': 'snare', '➰': 'snare', '🎣': 'line', '🎏': 'line', '🕸': 'net', '🏹': 'bow', '🐾': 'tracks', '👀': 'look', '👁': 'look', '🔎': 'look', '🔭': 'scout', '👂': 'look',
  '🐻': 'animal', '🦡': 'animal', '🦊': 'animal', '🦝': 'animal', '🐿': 'animal', '🦌': 'animal', '🫎': 'animal', '🐺': 'wolf',
  '🐦': 'bird', '🐦‍⬛': 'bird', '🦆': 'bird', '📣': 'bird',
  '📞': 'phone', '📻': 'radio', '🎥': 'camera', '✉️': 'letter', '🏠': 'home', '🗺': 'map', '📍': 'map', '🚶': 'walk', '🥾': 'walk', '🚚': 'pack', '🎒': 'pack',
  '🕒': 'time', '⏳': 'wait', '👥': 'people', '⚠️': 'warning', '🚫': 'warning', '✨': 'star', '🌠': 'star', '🍀': 'star',
  '🎶': 'music', '🪈': 'music', '💭': 'thought', '🗣': 'thought', '😞': 'low', '😔': 'low', '😖': 'low', '😩': 'low', '😨': 'low', '💔': 'low', '💪': 'morale', '🤝': 'morale',
  '🧼': 'wash', '🧴': 'mace', '🌑': 'sleep',
};

/** Every emoji v12 can show (and a few more), with any variation selector or joiner. */
const EMOJI_RE = /(?:\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*)️?\s?/gu;

/** One icon as SVG markup. */
export function glyphSvg(id: GlyphId, cls = 'glyph'): string {
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${GLYPHS[id]}</svg>`;
}

/** The glyph an emoji stands for, or null when it is only decoration. */
export function glyphFor(emoji: string): GlyphId | null {
  const e = emoji.trim();
  return EMOJI[e] ?? EMOJI[e.replace(/️/g, '')] ?? EMOJI[e + '️'] ?? null;
}

/** HTML with each emoji swapped for the game's own icon, and decorative ones dropped. */
export function glyphHtml(html: string): string {
  return html.replace(EMOJI_RE, (m) => {
    const id = glyphFor(m);
    return id ? glyphSvg(id) + (m.endsWith(' ') ? ' ' : '') : '';
  });
}

/** Plain text with the emojis taken out (for places that cannot hold a picture, like a tooltip). */
export function noEmoji(text: string): string {
  return text.replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim();
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Plain text, escaped, with its emojis as icons. */
export function glyphText(text: string): string {
  return glyphHtml(escape(text));
}
