// Errors the game could not handle go to the desktop shell's crash.log (plan M22). In a browser
// there is no log; they stay in the console.

type Desktop = { logError?: (text: string) => boolean; store?: { openFolder?: () => boolean } };
const desktop = () => (window as { tapoutDesktop?: Desktop }).tapoutDesktop;

let sent = 0;

/** Writes an error to crash.log; returns whether it was written. At most 50 per session. */
export function logError(where: string, error: unknown): boolean {
  const text = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(where, error);
  if (sent >= 50) return false;
  sent += 1;
  return desktop()?.logError?.(`${where}: ${text}`) ?? false;
}

export function canOpenSaveFolder(): boolean {
  return !!desktop()?.store?.openFolder;
}

export function openSaveFolder(): void {
  desktop()?.store?.openFolder?.();
}

/** Catches errors outside React (timers, the 3D loop, audio callbacks). */
export function installCrashLog(): void {
  window.addEventListener('error', (e) => logError('window', e.error ?? e.message));
  window.addEventListener('unhandledrejection', (e) => logError('promise', e.reason));
}
