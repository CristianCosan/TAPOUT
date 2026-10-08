// The one save of the current run (plan §10, D-004): an envelope with a checksum, three rotating
// backups, and a copy taken at each dawn. Loading tries the save, then each backup, then the dawn
// copy, and says plainly which one it used. A finished run deletes all of them.
//
// Storage is anything shaped like localStorage: the browser's own, or the desktop shell's files.

export const RUN_KEY = 'tapout.run';
const BACKUPS = ['tapout.run.bak1', 'tapout.run.bak2', 'tapout.run.bak3'] as const;
const DAWN_KEY = 'tapout.run.dawn';
const SCHEMA_VERSION = 2;

export type SaveSource = 'save' | 'backup1' | 'backup2' | 'backup3' | 'dawn';

interface Envelope<T> {
  format: 'tapout-save';
  schemaVersion: number;
  gameVersion: string;
  savedAt: string;
  day: number;
  checksum: string;
  body: T;
}

/** FNV-1a over the body's JSON: enough to catch a truncated or hand-edited file. */
export function checksum(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export class SaveStore<T> {
  private dawnDay: number | null = null;

  constructor(
    private readonly storage: Storage | null,
    private readonly gameVersion: string,
  ) {}

  /** Writes the run, rotating the previous save into the backups. */
  write(body: T, day: number, savedAt: string): void {
    if (!this.storage) return;
    const json = JSON.stringify(body);
    const envelope: Envelope<T> = { format: 'tapout-save', schemaVersion: SCHEMA_VERSION, gameVersion: this.gameVersion, savedAt, day, checksum: checksum(json), body };
    const text = JSON.stringify(envelope);
    const s = this.storage;
    const previous = s.getItem(RUN_KEY);
    // Only a save that still reads back makes it into the backups.
    if (previous && this.parse(previous)) {
      for (let i = BACKUPS.length - 1; i > 0; i--) {
        const older = s.getItem(BACKUPS[i - 1]!);
        if (older) s.setItem(BACKUPS[i]!, older);
      }
      s.setItem(BACKUPS[0], previous);
    }
    s.setItem(RUN_KEY, text);
    if (this.dawnDay !== day) {
      s.setItem(DAWN_KEY, text);
      this.dawnDay = day;
    }
  }

  /** The newest save that reads back intact, and where it came from. */
  read(accept: (body: T) => boolean = () => true): { body: T; source: SaveSource } | null {
    if (!this.storage) return null;
    const order: Array<[string, SaveSource]> = [
      [RUN_KEY, 'save'],
      [BACKUPS[0], 'backup1'],
      [BACKUPS[1], 'backup2'],
      [BACKUPS[2], 'backup3'],
      [DAWN_KEY, 'dawn'],
    ];
    for (const [key, source] of order) {
      const raw = this.storage.getItem(key);
      const envelope = raw ? this.parse(raw) : null;
      if (envelope && accept(envelope.body)) {
        this.dawnDay = envelope.day;
        return { body: envelope.body, source };
      }
    }
    return null;
  }

  clear(): void {
    if (!this.storage) return;
    for (const key of [RUN_KEY, ...BACKUPS, DAWN_KEY]) this.storage.removeItem(key);
    this.dawnDay = null;
  }

  private parse(raw: string): Envelope<T> | null {
    try {
      const envelope = JSON.parse(raw) as Envelope<T>;
      if (envelope.format !== 'tapout-save' || envelope.schemaVersion !== SCHEMA_VERSION) return null;
      if (checksum(JSON.stringify(envelope.body)) !== envelope.checksum) return null;
      return envelope;
    } catch {
      return null;
    }
  }
}

/** What the title screen says when a damaged save was replaced by an older copy. */
export const RESTORED_FROM: Record<Exclude<SaveSource, 'save'>, string> = {
  backup1: 'Your last save was damaged, so the game went back one step to the save before it.',
  backup2: 'Your last saves were damaged, so the game went back two steps.',
  backup3: 'Your last saves were damaged, so the game went back three steps.',
  dawn: 'Your recent saves were damaged, so the game went back to this morning.',
};
