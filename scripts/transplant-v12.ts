// How packages/core/src/v12 was produced: v12's script, split by its own section headers into
// modules, with exports and imports added and Math.random routed to the seeded stream. Kept as a
// record. Do not re-run it over the repository: the port is maintained by hand from here on.
// Run (into a scratch copy): npx tsx scripts/transplant-v12.ts <repo-root>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const repo = process.argv[2]!;
const html = readFileSync(join(repo, 'legacy/tap-out-v12.html'), 'utf8');
const scriptStart = html.indexOf('<script>') + '<script>'.length;
const scriptEnd = html.lastIndexOf('</script>');
const script = html.slice(scriptStart, scriptEnd);
const lineOffset = html.slice(0, scriptStart).split('\n').length - 1; // script line 1 = file line lineOffset+1

const sf = ts.createSourceFile('v12.js', script, ts.ScriptTarget.ES2022, true, ts.ScriptKind.JS);

// ---- sections
const SECTION_FILES: Array<[RegExp, string]> = [
  [/helpers & data/i, 'helpers'],
  [/RUN_SCALE/i, 'tuning'],
  [/TUNING OBJECT/i, 'tuning'],
  [/^audio/i, 'APP'],
  [/run recorder/i, 'recorder'],
  [/kit-draft/i, 'setup'],
  [/food storage/i, 'food'],
  [/worry ledger/i, 'worry'],
  [/person layer/i, 'person'],
  [/medical arcs/i, 'medical'],
  [/time, cost & injury/i, 'cost'],
  [/resolve - the will/i, 'resolve'],
  [/the director/i, 'director'],
  [/personal threads/i, 'threads'],
  [/travel & signs/i, 'travel'],
  [/actions: woods/i, 'woods'],
  [/actions: shore/i, 'shore'],
  [/actions: camp/i, 'camp'],
  [/night \/ new day/i, 'night'],
  [/interior/i, 'interior'],
  [/modals & endings/i, 'endings'],
  [/^render/i, 'APP'],
  [/^scene/i, 'APP'],
  [/temperament tags/i, 'tags'],
  [/modifier row/i, 'modifiers'],
  [/morale zero/i, 'breakdown'],
  [/card engine/i, 'cards'],
  [/break sequence/i, 'breakSequence'],
  [/ending sequences/i, 'endingSequences'],
];

// Names that are presentation, whatever section they sit in.
// Defined locally in panel.ts (the read-only action panel), never imported.
const PANEL_LOCALS = new Set(['$', 'setBtn', 'setBar', 'updateAmbient', 'renderModifierRow', 'renderScene', 'render']);

const APP_NAMES = new Set([
  '$', 'renderKitGrid', 'toggleDraftPick', 'startGame', 'restartRun', 'exportRunReport',
  'showModal', 'ensureModalHasExit', 'hideModal', 'typewriterInto', 'skipTypewriter', 'revealParagraphs',
  'TYPEWRITER_TIMERS', 'toastRefusal', 'renderModifierRow', 'toggleEndStats', 'downloadCard', 'copySummary',
]);

const lines = script.split('\n');
const headers: Array<{ line: number; file: string; title: string }> = [];
lines.forEach((text, i) => {
  const m = /^\/\/ ={5,}\s*(.*?)\s*={5,}\s*$/.exec(text);
  if (m) {
    const title = m[1]!;
    const file = SECTION_FILES.find(([re]) => re.test(title))?.[1];
    if (!file) throw new Error('unmapped section ' + title);
    headers.push({ line: i, file, title });
  }
});
function sectionFor(pos: number) {
  const line = sf.getLineAndCharacterOfPosition(pos).line;
  let found = headers[0]!;
  for (const h of headers) if (h.line <= line) found = h;
  return found;
}

interface Stmt { node: ts.Statement; names: string[]; file: string; text: string; exportAt: number; from: number; startLine: number; endLine: number; }
const stmts: Stmt[] = [];
// Each statement owns the text from the line after the previous statement ended, up to the end
// of its own last line, so a trailing same-line comment stays with the code it annotates.
const nodes = [...sf.statements];
const segStart = (i: number) => {
  if (i === 0) return 0;
  const prevEnd = nodes[i - 1]!.getEnd();
  const nl = script.indexOf('\n', prevEnd);
  const candidate = nl < 0 ? prevEnd : nl + 1;
  return Math.min(candidate, nodes[i]!.getStart(sf));
};
nodes.forEach((node, i) => {
  const names: string[] = [];
  if (ts.isFunctionDeclaration(node) && node.name) names.push(node.name.text);
  else if (ts.isVariableStatement(node)) for (const d of node.declarationList.declarations) if (ts.isIdentifier(d.name)) names.push(d.name.text);
  const from = segStart(i);
  const to = i + 1 < nodes.length ? segStart(i + 1) : script.length;
  const sec = sectionFor(node.getStart(sf));
  let file = sec.file;
  if (names.some((n) => APP_NAMES.has(n))) file = 'APP';
  if (names.includes('S') || names.includes('SETTINGS')) file = 'state';
  const text = script.slice(from, to);
  stmts.push({ node, names, file, text, from, exportAt: node.getStart(sf) - from,
    startLine: sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1 + lineOffset,
    endLine: sf.getLineAndCharacterOfPosition(node.getEnd()).line + 1 + lineOffset });
});

// Non-declaration statements (window._draftPicked = ..., window.onerror block, final renderKitGrid()) -> app.
for (const s of stmts) {
  const code = s.text.replace(/^(\s*\/\/.*\n)*/, '').trimStart();
  if (s.names.length === 0 && (code.startsWith('window.') || code.startsWith('if (typeof window') || code.startsWith('renderKitGrid()'))) s.file = 'APP';
  if (s.names.includes('roundDisplay')) s.file = 'helpers';
  if (['gate', 'durTxt', 'comfortLvl', 'render'].some((n) => s.names.includes(n))) s.file = 'panel';
}

const defFile = new Map<string, string>();
for (const s of stmts) for (const n of s.names) defFile.set(n, s.file);

// identifiers used per statement (free references, roughly: every Identifier that names a top-level def)
function usedNames(node: ts.Node): Set<string> {
  const out = new Set<string>();
  const visit = (n: ts.Node) => {
    if (ts.isIdentifier(n) && defFile.has(n.text)) {
      const p = n.parent;
      const isProp = p && ts.isPropertyAccessExpression(p) && p.name === n;
      const isKey = p && (ts.isPropertyAssignment(p) && p.name === n);
      if (!isProp && !isKey) out.add(n.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return out;
}

const appRefs = new Map<string, Set<string>>();
const byFile = new Map<string, Stmt[]>();
for (const s of stmts) {
  if (!byFile.has(s.file)) byFile.set(s.file, []);
  byFile.get(s.file)!.push(s);
}

// Text transforms on core statements.
function transform(s: Stmt): string {
  // Insertions, as [offset within the segment, text]: `export`, `: any` on top-level data
  // tables (v12 extends some after creation), and `?` on top-level function parameters
  // (v12 relies on JavaScript's optional arguments).
  const edits: Array<[number, string]> = [];
  if (s.names.length) edits.push([s.exportAt, 'export ']);
  const node = s.node;
  if (ts.isVariableStatement(node)) {
    for (const d of node.declarationList.declarations) {
      if (!d.type && d.initializer && (ts.isObjectLiteralExpression(d.initializer) || ts.isArrayLiteralExpression(d.initializer))) {
        edits.push([d.name.getEnd() - s.from, ': any']);
      }
    }
  }
  if (ts.isFunctionDeclaration(node)) {
    for (const p of node.parameters) {
      if (!p.initializer && !p.questionToken && !p.dotDotDotToken && ts.isIdentifier(p.name)) edits.push([p.name.getEnd() - s.from, '?']);
    }
  }
  let t = s.text;
  for (const [at, ins] of edits.sort((a, b) => b[0] - a[0])) t = t.slice(0, at) + ins + t.slice(at);
  t = t.replace(/Math\.random\(\)/g, 'rand()');
  // v12 reassigns S once, in newGame(); module bindings can only be reassigned by their owner.
  if (s.names.includes('newGame')) {
    t = t.replace(/^  S = \{$/m, '  setS({');
    t = t.replace(/^  \};\n  S\.maxEnergy/m, '  });\n  S.maxEnergy');
  }
  t = t.replace('const m = {id,label,desc,cls};', 'const m: any = {id,label,desc,cls};');
  if (s.names.includes('maybeShotIntrospection')) {
    // v12 stringifies the callback into the button (its only caller passes () => { fireShot(); }).
    // Compiled code stringifies differently, so the port names the call directly.
    t = t.replace('onclick="hideModal(); (${onProceed.toString()})()"', 'onclick="hideModal(); fireShot()"');
  }
  if (s.names.includes('render')) {
    // The panel pass is read-only: the two rules render() applies live in ui.ts's render().
    t = t.replace('export function render(){', 'function panelPass(){');
    t = t.replace(/^  checkSmokingDone\(\);\n  enforceMoraleCeiling\(\);\n/m, '');
    t = t.replace(/^  document\.querySelectorAll\('#actions \[data-loc\]'\)\.forEach\(el => \{\n[\s\S]*?^  \}\);\n/m, '');
  }
  return t;
}

// The v12 action buttons, read from the page markup: id, where they show, what they call.
const buttonRe = /<button class="act([^"]*)" id="(a-[A-Za-z]+)" data-loc="(\w+)" onclick="([^"]+)"><span class="n"[^>]*>([^<]+)<\/span>/g;
const BUTTONS: Array<{ id: string; loc: string; onclick: string; label: string; hidden: boolean }> = [];
for (const m of html.matchAll(buttonRe)) BUTTONS.push({ id: m[2]!, loc: m[3]!, onclick: m[4]!, label: m[5]!.replace(/&amp;/g, '&'), hidden: m[1]!.includes('hidden') });
function panelHeader() {
  return `
// ---- The action panel: v12's render() run against a recording page instead of a real one.
// What it records is exactly what v12 showed the player: which actions exist here, which are
// enabled, and the cost/requirement line under each.

export interface PanelButton { id: string; loc: string; onclick: string; label: string; hidden: boolean }
export const BUTTONS: readonly PanelButton[] = ${JSON.stringify(BUTTONS, null, 2)};

export interface PanelEntry { id: string; label: string; onclick: string; loc: string; visible: boolean; enabled: boolean; detail: string }

let recording: Map<string, any> | null = null;
function $(id) {
  if (!recording.has(id)) {
    const classes = new Set<string>();
    const initial = BUTTONS.find((b) => b.id === id);
    if (initial && initial.hidden) classes.add('hidden');
    recording.set(id, {
      id, textContent: '', innerHTML: '', disabled: false, style: {}, classes,
      classList: {
        add: (...n: string[]) => n.forEach((x) => classes.add(x)),
        remove: (...n: string[]) => n.forEach((x) => classes.delete(x)),
        toggle: (n: string, force?: boolean) => { const on = force ?? !classes.has(n); if (on) classes.add(n); else classes.delete(n); return on; },
        contains: (n: string) => classes.has(n),
      },
      setAttribute: () => {},
    });
  }
  return recording.get(id);
}
function setBtn(id, enabled, sub){ const b = $(id); if(!b) return; b.disabled = !enabled; const s = $(id + '-sub'); if (s) s.textContent = sub; }
function setBar(_id?, _val?) {}
function updateAmbient() {}
function renderModifierRow() {}
function renderScene() {}

/** What v12 would show in its action list right now. Reads state; never changes it. */
export function actionPanel(): PanelEntry[] {
  recording = new Map();
  try {
    panelPass();
    return BUTTONS.map((b) => {
      const el = $(b.id);
      const name = recording.get(b.id + '-name');
      return {
        id: b.id,
        label: name && name.textContent ? name.textContent : b.label,
        onclick: b.onclick,
        loc: b.loc,
        visible: !el.classes.has('hidden') && (b.loc === 'all' || b.loc === S.loc),
        enabled: !el.disabled && !S.over,
        detail: recording.get(b.id + '-sub')?.textContent ?? '',
      };
    });
  } finally {
    recording = null;
  }
}

`;
}
const panelFooter = '';

const outDir = join(repo, 'packages/core/src/v12');
mkdirSync(outDir, { recursive: true });
const report: string[] = [];
const hookNames = new Set<string>();

for (const [file, list] of byFile) {
  if (file === 'APP') continue;
  const imports = new Map<string, Set<string>>();
  let usesRand = false;
  for (const s of list) {
    if (/Math\.random\(\)/.test(s.text)) usesRand = true;
    for (const name of usedNames(s.node)) {
      if (s.names.includes(name)) continue;
      const from = defFile.get(name)!;
      if (from === file) continue;
      if (file === 'panel' && PANEL_LOCALS.has(name)) continue;
      if (from === 'APP') { hookNames.add(name); if (!appRefs.has(name)) appRefs.set(name, new Set()); appRefs.get(name)!.add(file); }
      const target = from === 'APP' || name === 'render' ? 'ui' : from;
      if (name === 'render') hookNames.add(name);
      if (!imports.has(target)) imports.set(target, new Set());
      imports.get(target)!.add(name);
    }
  }
  const first = list[0]!.startLine, last = list.at(-1)!.endLine;
  const head = [
    `// Ported from legacy/tap-out-v12.html (lines ${first}-${last}). The code is v12's own,`,
    `// moved verbatim apart from: exports, imports, Math.random -> rand(), and presentation`,
    `// calls routed through ./ui.ts. Parity with the original is enforced by tests.`,
    '',
  ];
  if (usesRand) head.push(`import { rand } from './runtime.ts';`);
  if (file === 'setup') imports.get('state')?.add('setS');
  for (const [target, names] of [...imports.entries()].sort()) head.push(`import { ${[...names].sort().join(', ')} } from './${target}.ts';`);
  let body = list.map(transform).join('');
  if (file === 'panel') body = panelHeader() + body + panelFooter;
  writeFileSync(join(outDir, `${file}.ts`), head.join('\n') + '\n' + body.trimStart() + '\n');
  report.push(`${file}: ${list.length} statements, lines ${first}-${last}`);
}

// app-only statements, for reference
const appList = byFile.get('APP') ?? [];
report.push('', 'APP statements:', ...appList.map((s) => `  ${s.names.join(',') || '(stmt)'} @${s.startLine}`));
report.push('', 'core -> app references (become ui hooks):', ...[...appRefs.entries()].map(([n, fs]) => `  ${n} <- ${[...fs].join(',')}`));
writeFileSync(join(repo, '..', 'transplant-report.txt'), report.join('\n'));
console.log(report.join('\n'));
