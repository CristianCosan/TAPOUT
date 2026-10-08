// Location layouts (plan §4, §6.4): where every station sits on a 1920x1080 tableau. Art never
// encodes positions; these do. The grey-box scenes, the layout-guide PNGs the background prompts
// are written against, and later the painted plates all follow these numbers.
//
// Coordinates are stage pixels. The tableau is full bleed; the rails sit over its edges, so
// stations stay inside SAFE. y grows towards the viewer: a larger anchor y is closer and is
// drawn in front.

export type LocationId = 'camp' | 'shore' | 'woods';

export interface Point {
  x: number;
  y: number;
}

/** A station's own action, one v12 doesn't put on the action panel. */
export type SpecialAction =
  | 'sleep'
  | 'turnInEarly'
  | 'drink'
  | 'eatBerries'
  | 'eatCooked'
  | 'eatSmoked'
  | 'eatRation'
  | 'map';

export interface Station {
  id: string;
  label: string;
  /** One line under the name: what this is, in the player's words. */
  blurb: string;
  /** Ground contact point; depth sorts by its y. */
  anchor: Point;
  /** Clickable area, as a polygon. */
  hotspot: readonly Point[];
  /** Where Dan stands to work here (his feet). */
  stand: Point;
  /** v12 action-panel ids (`a-…`) offered here, in this order. */
  actions: readonly string[];
  special?: readonly SpecialAction[];
  /** Travel exits name the location they lead to. */
  exitTo?: LocationId;
  /** A v12 fishing or trapline spot this station stands for: actions there target it directly. */
  spot?: string;
  /** Only shown when the run has something here (a kill site, a spotted animal, winter ice). */
  when?: 'killSite' | 'hunt' | 'winter' | 'jay';
}

export interface LocationLayout {
  id: LocationId;
  label: string;
  /** Height of the horizon line: the painting's sky ends here. */
  horizonY: number;
  /** Optional band of water, top and bottom y (shore and camp show the lake). */
  water?: { top: number; bottom: number };
  stations: readonly Station[];
}

export const STAGE = { width: 1920, height: 1080 } as const;
/** Inside the top bar, bottom bar, body rail and stores rail. */
export const SAFE = { left: 180, top: 80, right: 1700, bottom: 1000 } as const;

/** A box standing on its anchor: width w, height h, base centre at (x, y). */
export function box(x: number, y: number, w: number, h: number): Point[] {
  return [
    { x: x - w / 2, y: y - h },
    { x: x + w / 2, y: y - h },
    { x: x + w / 2, y },
    { x: x - w / 2, y },
  ];
}

/** A flat patch on the ground (an ellipse-ish octagon), centred on (x, y). */
export function patch(x: number, y: number, w: number, h: number): Point[] {
  const rx = w / 2;
  const ry = h / 2;
  return Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
    return { x: Math.round(x + rx * Math.cos(a)), y: Math.round(y + ry * Math.sin(a)) };
  });
}

/** Station builder for the common case: a standing box with Dan to one side. */
export function station(
  id: string,
  label: string,
  blurb: string,
  x: number,
  y: number,
  w: number,
  h: number,
  actions: readonly string[],
  extra: Partial<Station> = {},
): Station {
  return {
    id,
    label,
    blurb,
    anchor: { x, y },
    hotspot: box(x, y, w, h),
    stand: { x: x + Math.round(w / 2) + 50, y: y + 10 },
    actions,
    ...extra,
  };
}

/** The anywhere actions v12 offers in every location; the "you" station carries them. */
export const PERSONAL_ACTIONS = ['a-rest', 'a-sitwatch', 'a-music', 'a-call', 'a-tinder', 'a-poultice'] as const;
/** Hunting actions follow the hunt wherever it is. */
export const HUNT_ACTIONS = ['a-follow', 'a-trail', 'a-invest', 'a-shot'] as const;
export const KILL_ACTIONS = ['a-carve', 'a-haul'] as const;
