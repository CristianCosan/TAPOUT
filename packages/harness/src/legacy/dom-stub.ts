// A DOM stub just rich enough to let the untouched v12 file run in Node.
//
// v12 is one HTML file whose script both holds the simulation and paints the
// page. Nothing here tries to be a browser: every element accepts whatever the
// game sets on it and remembers the handful of things the game reads back
// (`value`, `innerHTML`, `textContent`, classes). That is enough, because v12
// reads game state from `S`, never from the page.

export interface StubElement {
  id: string;
  value: string;
  innerHTML: string;
  textContent: string;
  readonly classList: {
    add: (...names: string[]) => void;
    remove: (...names: string[]) => void;
    toggle: (name: string, force?: boolean) => void;
    contains: (name: string) => boolean;
  };
  readonly style: Record<string, string>;
  readonly dataset: Record<string, string>;
  readonly children: StubElement[];
  readonly classes: Set<string>;
  [key: string]: unknown;
}

export interface DomStub {
  window: Record<string, unknown>;
  document: Record<string, unknown>;
  element: (id: string) => StubElement;
  /** Set the value an input-like element reports, e.g. the kit draft or the name field. */
  setValue: (id: string, value: string) => void;
}

function createElement(id: string): StubElement {
  const classes = new Set<string>();
  const element = {
    id,
    value: '',
    innerHTML: '',
    textContent: '',
    classes,
    children: [] as StubElement[],
    style: {} as Record<string, string>,
    dataset: {} as Record<string, string>,
    classList: {
      add: (...names: string[]) => names.forEach((name) => classes.add(name)),
      remove: (...names: string[]) => names.forEach((name) => classes.delete(name)),
      toggle: (name: string, force?: boolean) => {
        const on = force ?? !classes.has(name);
        if (on) classes.add(name);
        else classes.delete(name);
      },
      contains: (name: string) => classes.has(name),
    },
    appendChild: (child: StubElement) => {
      element.children.push(child);
      return child;
    },
    removeChild: (child: StubElement) => child,
    insertBefore: (child: StubElement) => child,
    setAttribute: (name: string, value: string) => {
      element[name] = value;
    },
    getAttribute: (name: string) => (element[name] as string | undefined) ?? null,
    removeAttribute: (name: string) => {
      delete element[name];
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    focus: () => {},
    blur: () => {},
    click: () => {},
    scrollIntoView: () => {},
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 }),
    querySelector: () => null,
    querySelectorAll: () => [] as StubElement[],
    closest: () => null,
    get parentNode() {
      return null;
    },
    get firstChild() {
      return element.children[0] ?? null;
    },
    get lastChild() {
      return element.children[element.children.length - 1] ?? null;
    },
    get offsetWidth() {
      return 0;
    },
    get offsetHeight() {
      return 0;
    },
    get scrollHeight() {
      return 0;
    },
    scrollTop: 0,
  } as unknown as StubElement;
  return element;
}

export function createDomStub(): DomStub {
  const elements = new Map<string, StubElement>();
  const element = (id: string): StubElement => {
    let found = elements.get(id);
    if (!found) {
      found = createElement(id);
      elements.set(id, found);
    }
    return found;
  };

  const body = element('body');
  const document = {
    body,
    documentElement: element('html'),
    head: element('head'),
    getElementById: (id: string) => element(id),
    querySelector: () => null,
    querySelectorAll: () => [] as StubElement[],
    createElement: (tag: string) => createElement(`<${tag}>`),
    createTextNode: (text: string) => ({ textContent: text }),
    createDocumentFragment: () => createElement('#fragment'),
    addEventListener: () => {},
    removeEventListener: () => {},
    get hidden() {
      return false;
    },
    visibilityState: 'visible',
  } as Record<string, unknown>;

  // Timers are never advanced: v12 uses them only for crackle, chirps and the
  // typewriter, none of which touch simulation state.
  const window = {
    document,
    innerWidth: 1920,
    innerHeight: 1080,
    devicePixelRatio: 1,
    navigator: { userAgent: 'node', vibrate: () => {} },
    location: { href: 'file:///tap-out-v12.html', reload: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }),
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => {},
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    // No AudioContext: v12's audioInit() gives up quietly when it is absent.
    AudioContext: undefined,
    webkitAudioContext: undefined,
    localStorage: undefined,
    alert: () => {},
    confirm: () => true,
    scrollTo: () => {},
  } as Record<string, unknown>;

  return {
    window,
    document,
    element,
    setValue: (id, value) => {
      element(id).value = value;
    },
  };
}
