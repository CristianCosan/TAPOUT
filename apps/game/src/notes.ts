// Turns the playtest notes into plain text for pasting into a chat.

import { PLAYTEST_TEXT as T } from '@tapout/content';
import type { PlaytestNote } from './session.ts';

export function notesText(notes: readonly PlaytestNote[]): string {
  const version = notes.at(-1)?.version ?? '';
  const lines = notes.map((n, i) => {
    const where = n.run ? `${T.where(n.run)} (${T.body(n.run.body, n.run.shelter, n.run.rivals)})` : T.menu;
    return `${i + 1}. ${n.text}\n   ${where}${n.version !== version ? ` [build ${n.version}]` : ''}`;
  });
  return [T.header(notes.length, version), '', ...lines].join('\n');
}
