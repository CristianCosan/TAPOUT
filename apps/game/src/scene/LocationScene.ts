// The location tableau (plan §4, §6.3), grey-box edition: every station drawn as a placeholder
// shape at its layout position, hoverable and clickable, with Dan standing where he last worked.
// Painted plates and cutouts replace the shapes later; the positions never move.

import Phaser from 'phaser';
import { SAFE, STAGE, type LocationLayout, type Point, type Station } from '@tapout/content';

export interface SceneInput {
  layout: LocationLayout;
  /** Station ids to leave out (a kill site that isn't there, summer ice, an absent jay). */
  hidden: ReadonlySet<string>;
  /** Stations with nothing you can do right now are drawn dimmer. */
  idle: ReadonlySet<string>;
  /** Where Dan stands. */
  standAt: string;
  selected: string | null;
  /** 0 = noon, 1 = deepest night. */
  dark: number;
  labels: boolean;
  debug: boolean;
}

export interface SceneEvents {
  select: (stationId: string) => void;
}

// Placeholder colours by kind of thing, so the grey box still reads at a glance.
const FILL: Record<string, number> = {
  shelter: 0x6b5a45, fire: 0x8a4a2a, rack: 0x6e5238, cache: 0x5d4a38, post: 0x7a6650, camera: 0x3d4448,
  comforts: 0x75604a, stump: 0x6a553f, woodpile: 0x7b5a3a, water: 0x4d6b78, food: 0x7a3f3a, stock: 0x6c6a62,
  pack: 0x56603f, killsite: 0x6b2f2a, jay: 0x6f7a80, raven: 0x2d2f33, you: 0x2f6b4f,
  point: 0x4d6b78, inlet: 0x4d6b78, bar: 0x4d6b78, channel: 0x4d6b78, duck: 0x55707c, icecache: 0x9fb8c4,
  net: 0x6d6a55, edge: 0x5e7d88, rocks: 0x77746c, clay: 0x8a7d6a,
  ridge: 0x5f6b55, timber: 0x3f5236, birch: 0xb8b2a2, animal: 0x6b4f3a, trailhead: 0x6e5a42,
  deadfall: 0x6a5338, moss: 0x4f6b3c, berries: 0x5b3f5a, tracks: 0x5a4a3a,
};
const EXIT_FILL = 0xd9c9a3;

export class LocationScene extends Phaser.Scene {
  private input0: SceneInput | null = null;
  private events0: SceneEvents | null = null;
  private layer!: Phaser.GameObjects.Container;
  private hoverId: string | null = null;
  private tooltip!: Phaser.GameObjects.Text;
  /** Per station: the hover outline and the hover-only label. */
  private hoverParts = new Map<string, Phaser.GameObjects.GameObject[]>();

  constructor() {
    super('location');
  }

  create(): void {
    this.layer = this.add.container(0, 0);
    this.tooltip = this.add
      .text(0, 0, '', { fontFamily: 'Georgia, serif', fontSize: '19px', fontStyle: 'italic', color: '#d8d0bc', backgroundColor: '#1b1a17cc', padding: { x: 10, y: 5 } })
      .setDepth(10_000)
      .setVisible(false);
    this.draw();
  }

  configure(input: SceneInput, events: SceneEvents): void {
    this.input0 = input;
    this.events0 = events;
    if (this.layer) this.draw();
  }

  /**
   * Phaser hears the mouse on the whole window, so a click on a panel above the canvas would
   * also select whatever station lies underneath it. Only the canvas itself counts.
   */
  private onCanvas(pointer: Phaser.Input.Pointer): boolean {
    return pointer.event?.target === this.game.canvas;
  }

  private draw(): void {
    const input = this.input0;
    if (!input) return;
    this.layer.removeAll(true);
    this.hoverParts.clear();
    const { layout } = input;

    // Sky, far shore or treeline, water, ground: the layer stack's back half, as flat bands.
    const sky = this.add.graphics();
    const night = input.dark;
    sky.fillGradientStyle(mix(0x9fb3bf, 0x0e1420, night), mix(0x9fb3bf, 0x0e1420, night), mix(0xd6d2c4, 0x1d2430, night), mix(0xd6d2c4, 0x1d2430, night), 1);
    sky.fillRect(0, 0, STAGE.width, layout.horizonY);
    this.layer.add(sky);
    const far = this.add.graphics();
    far.fillStyle(mix(0x4a5a4c, 0x10161a, night), 1);
    far.fillRect(0, layout.horizonY - 40, STAGE.width, 40);
    this.layer.add(far);
    if (layout.water) {
      const water = this.add.graphics();
      water.fillGradientStyle(mix(0x6f8a96, 0x121b24, night), mix(0x6f8a96, 0x121b24, night), mix(0x4f6a76, 0x0c131a, night), mix(0x4f6a76, 0x0c131a, night), 1);
      water.fillRect(0, layout.water.top, STAGE.width, layout.water.bottom - layout.water.top);
      this.layer.add(water);
    }
    const groundTop = layout.water?.bottom ?? layout.horizonY;
    const ground = this.add.graphics();
    ground.fillGradientStyle(mix(0x6d6a52, 0x16181a, night), mix(0x6d6a52, 0x16181a, night), mix(0x4e4b3a, 0x0f1012, night), mix(0x4e4b3a, 0x0f1012, night), 1);
    ground.fillRect(0, groundTop, STAGE.width, STAGE.height - groundTop);
    this.layer.add(ground);

    const visible = layout.stations.filter((s) => !input.hidden.has(s.id) && s.id !== 'you');
    for (const station of [...visible].sort((a, b) => a.anchor.y - b.anchor.y)) this.drawStation(station, input);
    // Test hook: where each clickable thing is on the stage, for the browser play-through robot.
    (globalThis as { __tapoutStations?: unknown }).__tapoutStations = visible.map((s) => ({
      id: s.id,
      x: s.hotspot.reduce((sum, p) => sum + p.x, 0) / s.hotspot.length,
      y: s.hotspot.reduce((sum, p) => sum + p.y, 0) / s.hotspot.length,
    }));
    this.drawDan(input);
    if (input.debug) this.drawDebug(input);
    if (this.hoverId) this.hoverParts.get(this.hoverId)?.forEach((p) => (p as Phaser.GameObjects.Graphics).setVisible(true));
  }

  private drawStation(station: Station, input: SceneInput): void {
    const exit = !!station.exitTo;
    const g = this.add.graphics().setDepth(station.anchor.y);
    const selected = input.selected === station.id;
    const idle = input.idle.has(station.id);
    const fill = exit ? EXIT_FILL : (FILL[station.id] ?? 0x6a6a5a);
    g.fillStyle(mix(fill, 0x0b0d10, input.dark * 0.6), exit ? 0.35 : idle ? 0.55 : 0.92);
    g.fillPoints(station.hotspot as unknown as Phaser.Math.Vector2[], true);
    if (selected) {
      g.lineStyle(5, 0xf2c46b, 1);
      g.strokePoints(station.hotspot as unknown as Phaser.Math.Vector2[], true);
    }
    const outline = this.add.graphics().setDepth(station.anchor.y + 0.5).setVisible(false);
    outline.lineStyle(3, 0xf2ead8, 1);
    outline.strokePoints(station.hotspot as unknown as Phaser.Math.Vector2[], true);
    this.layer.add(outline);
    const parts: Phaser.GameObjects.GameObject[] = [outline];
    this.hoverParts.set(station.id, parts);
    const poly = new Phaser.Geom.Polygon(station.hotspot as unknown as Phaser.Math.Vector2[]);
    g.setInteractive(poly, Phaser.Geom.Polygon.Contains);
    if (g.input) g.input.cursor = 'pointer';
    g.on('pointerover', (p: Phaser.Input.Pointer) => this.onCanvas(p) && this.hover(station.id));
    g.on('pointerout', () => this.hover(null));
    g.on('pointerdown', (p: Phaser.Input.Pointer) => this.onCanvas(p) && this.events0?.select(station.id));
    this.layer.add(g);

    {
      const top = Math.min(...station.hotspot.map((p) => p.y));
      const label = this.add
        .text(station.anchor.x, top - 8, exit ? `→ ${station.label}` : station.label, {
          fontFamily: 'Georgia, serif',
          fontSize: exit ? '22px' : '20px',
          color: '#f2ead8',
          backgroundColor: '#1b1a17aa',
          padding: { x: 8, y: 3 },
        })
        .setOrigin(0.5, 1)
        .setDepth(9_000);
      this.layer.add(label);
      if (!(input.labels || exit)) {
        label.setVisible(false);
        parts.push(label);
      }
    }
  }

  /** Dan as a placeholder figure: feet at the stand point, 260px tall (≈178cm at mid-ground). */
  private drawDan(input: SceneInput): void {
    const at = input.layout.stations.find((s) => s.id === input.standAt) ?? input.layout.stations.find((s) => s.id === 'you')!;
    const feet = at.id === 'you' ? { x: 1000, y: 960 } : at.stand;
    const scale = 0.7 + 0.3 * ((feet.y - input.layout.horizonY) / (STAGE.height - input.layout.horizonY));
    const h = 260 * scale;
    const w = 70 * scale;
    const body: Point[] = [
      { x: feet.x - w / 2, y: feet.y - h * 0.82 },
      { x: feet.x + w / 2, y: feet.y - h * 0.82 },
      { x: feet.x + w / 2, y: feet.y },
      { x: feet.x - w / 2, y: feet.y },
    ];
    const g = this.add.graphics().setDepth(feet.y + 1);
    g.fillStyle(0x3d4a2f, 1);
    g.fillPoints(body as unknown as Phaser.Math.Vector2[], true);
    g.fillStyle(0xc9a27e, 1);
    g.fillCircle(feet.x, feet.y - h * 0.9, h * 0.09);
    g.fillStyle(0x2a211b, 1);
    g.fillCircle(feet.x, feet.y - h * 0.86, h * 0.07);
    if (input.selected === 'you') {
      g.lineStyle(3, 0xf2c46b, 1);
      g.strokePoints(body as unknown as Phaser.Math.Vector2[], true);
    }
    const outline = this.add.graphics().setDepth(feet.y + 1.5).setVisible(false);
    outline.lineStyle(3, 0xf2ead8, 1);
    outline.strokePoints(body as unknown as Phaser.Math.Vector2[], true);
    this.layer.add(outline);
    this.hoverParts.set('you', [outline]);
    (globalThis as { __tapoutStations?: { id: string; x: number; y: number }[] }).__tapoutStations?.push({ id: 'you', x: feet.x, y: feet.y - h / 2 });
    const hit = new Phaser.Geom.Rectangle(feet.x - w / 2 - 10, feet.y - h - 10, w + 20, h + 20);
    g.setInteractive(hit, Phaser.Geom.Rectangle.Contains);
    if (g.input) g.input.cursor = 'pointer';
    g.on('pointerover', (p: Phaser.Input.Pointer) => this.onCanvas(p) && this.hover('you'));
    g.on('pointerout', () => this.hover(null));
    g.on('pointerdown', (p: Phaser.Input.Pointer) => this.onCanvas(p) && this.events0?.select('you'));
    this.layer.add(g);
    if (input.labels) {
      this.layer.add(
        this.add
          .text(feet.x, feet.y - h - 14, 'You', { fontFamily: 'Georgia, serif', fontSize: '20px', color: '#f2ead8', backgroundColor: '#1b1a17aa', padding: { x: 8, y: 3 } })
          .setOrigin(0.5, 1)
          .setDepth(9_000),
      );
    }
  }

  /** Layout guide: horizon, safe area, hotspots, anchors, Dan's stand points, ids. */
  private drawDebug(input: SceneInput): void {
    const g = this.add.graphics().setDepth(9_500);
    g.lineStyle(2, 0x33ccff, 1);
    g.lineBetween(0, input.layout.horizonY, STAGE.width, input.layout.horizonY);
    g.lineStyle(2, 0xffcc33, 0.9);
    g.strokeRect(SAFE.left, SAFE.top, SAFE.right - SAFE.left, SAFE.bottom - SAFE.top);
    for (let y = input.layout.horizonY; y < STAGE.height; y += 100) {
      g.lineStyle(1, 0xffffff, 0.12);
      g.lineBetween(0, y, STAGE.width, y);
    }
    for (const s of input.layout.stations) {
      if (s.id === 'you') continue;
      g.lineStyle(2, s.exitTo ? 0xd9c9a3 : s.when ? 0xff66cc : 0x66ff99, 1);
      g.strokePoints(s.hotspot as unknown as Phaser.Math.Vector2[], true);
      g.lineStyle(2, 0xff3333, 1);
      g.lineBetween(s.anchor.x - 10, s.anchor.y, s.anchor.x + 10, s.anchor.y);
      g.lineBetween(s.anchor.x, s.anchor.y - 10, s.anchor.x, s.anchor.y + 10);
      g.fillStyle(0x33ccff, 1);
      g.fillCircle(s.stand.x, s.stand.y, 6);
      this.layer.add(
        this.add
          .text(s.anchor.x, s.anchor.y + 6, `${s.id}${s.when ? ` (${s.when})` : ''}`, { fontFamily: 'monospace', fontSize: '15px', color: '#ffffff', backgroundColor: '#000000aa' })
          .setOrigin(0.5, 0)
          .setDepth(9_600),
      );
    }
    this.layer.add(g);
  }

  private hover(id: string | null): void {
    if (this.hoverId === id) return;
    if (this.hoverId) this.hoverParts.get(this.hoverId)?.forEach((p) => (p as Phaser.GameObjects.Graphics).setVisible(false));
    this.hoverId = id;
    if (id) this.hoverParts.get(id)?.forEach((p) => (p as Phaser.GameObjects.Graphics).setVisible(true));
    const station = id ? this.input0?.layout.stations.find((s) => s.id === id) : null;
    if (station && !station.exitTo) {
      const top = Math.min(...station.hotspot.map((p) => p.y));
      this.tooltip
        // The name is already on the hover label; the tooltip adds the line about it, just above.
        .setText(station.blurb)
        .setOrigin(0.5, 1)
        .setPosition(Math.min(STAGE.width - 400, Math.max(400, station.anchor.x)), Math.max(110, top - 46))
        .setVisible(id !== 'you');
    } else this.tooltip.setVisible(false);
  }
}

function mix(a: number, b: number, t: number): number {
  const ca = Phaser.Display.Color.IntegerToColor(a);
  const cb = Phaser.Display.Color.IntegerToColor(b);
  const c = Phaser.Display.Color.Interpolate.ColorWithColor(ca, cb, 100, Math.round(Math.max(0, Math.min(1, t)) * 100));
  return Phaser.Display.Color.GetColor(c.r, c.g, c.b);
}
