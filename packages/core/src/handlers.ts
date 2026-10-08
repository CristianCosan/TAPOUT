// v12 wires its modal buttons with inline handlers such as
// `hideModal(); resolveCardChoice('heyBear',1)`. These are always plain call sequences with
// literal arguments, so they can be parsed and replayed against the port.

export interface HandlerCall {
  fn: string;
  args: Array<string | number | boolean | null>;
}

/** Parses a handler string; returns null for anything that is not a plain call sequence. */
export function parseHandler(source: string): HandlerCall[] | null {
  const calls: HandlerCall[] = [];
  let i = 0;
  const skipSpace = () => {
    while (i < source.length && /[\s;]/.test(source[i]!)) i += 1;
  };
  const readLiteral = (): string | number | boolean | null | undefined => {
    const ch = source[i];
    if (ch === "'" || ch === '"') {
      const quote = ch;
      i += 1;
      let out = '';
      while (i < source.length && source[i] !== quote) {
        if (source[i] === '\\') {
          out += source[i + 1] ?? '';
          i += 2;
        } else {
          out += source[i];
          i += 1;
        }
      }
      i += 1;
      return out;
    }
    const m = /^(-?\d+(?:\.\d+)?|true|false|null)/.exec(source.slice(i));
    if (!m) return undefined;
    i += m[0].length;
    if (m[0] === 'true') return true;
    if (m[0] === 'false') return false;
    if (m[0] === 'null') return null;
    return Number(m[0]);
  };

  skipSpace();
  while (i < source.length) {
    const name = /^[A-Za-z_$][\w$]*/.exec(source.slice(i));
    if (!name) return null;
    i += name[0].length;
    if (source[i] !== '(') return null;
    i += 1;
    const args: HandlerCall['args'] = [];
    skipSpace();
    while (source[i] !== ')') {
      const value = readLiteral();
      if (value === undefined) return null;
      args.push(value);
      while (source[i] === ' ') i += 1;
      if (source[i] === ',') i += 1;
      while (source[i] === ' ') i += 1;
      if (i >= source.length) return null;
    }
    i += 1;
    calls.push({ fn: name[0], args });
    skipSpace();
  }
  return calls;
}

export interface ModalButton {
  label: string;
  onclick: string;
  disabled: boolean;
}

/** The buttons of a v12 modal, in order, decoded from its HTML. */
export function modalButtons(html: string): ModalButton[] {
  const out: ModalButton[] = [];
  const re = /<button([^>]*)>([\s\S]*?)<\/button>/g;
  for (const m of html.matchAll(re)) {
    const attrs = m[1] ?? '';
    const onclick = /onclick="([^"]*)"/.exec(attrs)?.[1];
    if (!onclick) continue;
    out.push({
      label: (m[2] ?? '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim(),
      onclick: onclick.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&'),
      disabled: /\bdisabled\b/.test(attrs),
    });
  }
  return out;
}
