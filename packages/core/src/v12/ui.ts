// Presentation calls the v12 simulation makes. The core never paints anything itself: each call
// is forwarded to whatever presenter the app installs, and does nothing when none is installed
// (headless tests, the balance harness).
//
// `$` keeps v12's contract that an element lookup always succeeds: with no presenter it returns
// a throwaway element, so v12 code that writes into the page behaves the same everywhere.

import { checkSmokingDone } from './person.ts';
import { enforceMoraleCeiling } from './worry.ts';

export interface Presenter {
  render?: () => void;
  showModal?: (html: string) => void;
  hideModal?: () => void;
  typewriterInto?: (elementId: string, text: string, speed?: number) => void;
  revealParagraphs?: (containerId: string, stagger?: number) => void;
  toastRefusal?: (reason: string) => void;
  element?: (id: string) => any;
  sound?: (name: string) => void;
}

let presenter: Presenter = {};

export function setPresenter(next: Presenter): void {
  presenter = next;
}

function sinkElement(id: string): any {
  const classes = new Set<string>();
  return {
    id,
    value: '',
    innerHTML: '',
    textContent: '',
    className: '',
    style: {},
    disabled: false,
    classList: {
      add: (...names: string[]) => names.forEach((n) => classes.add(n)),
      remove: (...names: string[]) => names.forEach((n) => classes.delete(n)),
      toggle: (name: string, force?: boolean) => {
        const on = force ?? !classes.has(name);
        if (on) classes.add(name);
        else classes.delete(name);
        return on;
      },
      contains: (name: string) => classes.has(name),
    },
    setAttribute: () => {},
    appendChild: (child: unknown) => child,
    querySelectorAll: () => [],
  };
}

export function $(id: string): any {
  return presenter.element?.(id) ?? sinkElement(id);
}

/**
 * v12's render() is not only paint: before drawing it finishes any smoking session whose time has
 * come and enforces the morale ceiling. Those two rules stay here so the simulation does not
 * depend on anything being drawn.
 */
export function render(): void {
  checkSmokingDone();
  enforceMoraleCeiling();
  presenter.render?.();
}

export function showModal(html: string): void {
  presenter.showModal?.(html);
}

export function hideModal(): void {
  presenter.hideModal?.();
}

export function typewriterInto(elementId: string, text: string, speed?: number): void {
  presenter.typewriterInto?.(elementId, text, speed);
}

export function revealParagraphs(containerId: string, stagger?: number): void {
  presenter.revealParagraphs?.(containerId, stagger);
}

export function toastRefusal(reason: string): void {
  presenter.toastRefusal?.(reason);
}

const sound = (name: string) => () => presenter.sound?.(name);
export const sfxMooseCall = sound('mooseCall');
export const sfxFireLight = sound('fireLight');
export const sfxCooking = sound('cooking');
export const sfxBuild = sound('build');
export const sfxEat = sound('eat');
export const sfxDrink = sound('drink');
export const sfxFinalTwo = sound('finalTwo');
