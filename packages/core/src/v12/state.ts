// The two mutable globals of v12. `S` is the whole run; SETTINGS holds the two setup toggles.
// v12 reassigns S in newGame(); an ES module binding can only be reassigned by its own
// module, so that one assignment goes through setS().

// ============================== helpers & data ==============================
export let SETTINGS: any = {showRivalNews:true, runRecorder:false};

// ============================== v12 kit-draft: the draft screen ==============================
export let S: any = null;

export function setS(next: any): void {
  S = next;
}

export function setSettings(next: any): void {
  SETTINGS = next;
}
