// Words for the settings screen (plan §5, §7.2) and the credits.

export const SOUND_SETTINGS = {
  title: 'Sound',
  channels: [
    { id: 'master', label: 'Master', hint: 'Everything' },
    { id: 'ambience', label: 'Ambience', hint: 'Wind, rain, water, fire, birds' },
    { id: 'effects', label: 'Effects', hint: 'Chopping, building, fishing, eating' },
    { id: 'music', label: 'Music', hint: 'Quiet background and big moments' },
    { id: 'voice', label: 'Voice', hint: 'Dan thinking out loud' },
  ],
  close: 'Done',
} as const;

export const SETTINGS_TEXT = {
  title: 'Settings',
  sound: 'Sound',
  controls: 'Mouse and movement',
  sensitivity: { label: 'Mouse speed', hint: 'How far the view turns when you move the mouse' },
  invertY: { label: 'Invert up and down', hint: 'Mouse forward looks down' },
  headBob: { label: 'Head bob', hint: 'The view rocks a little as you walk' },
  game: 'Game',
  rivalNews: { label: 'Rival names on the radio', hint: 'Off: the radio only says someone left, not who or why' },
  display: 'Display',
  fullscreen: { label: 'Full screen', hint: 'F11 also switches it' },
  reduceFlashing: { label: 'Reduce flashing', hint: 'Lightning in storms lights the sky only softly' },
  lowGraphics: { label: 'Lighter graphics', hint: 'For slower computers: lower resolution and simpler shadows' },
  keys: 'Keys',
  keyList: [
    ['Click', 'Look around (the mouse stays captured); click a lit thing to use it'],
    ['W A S D', 'Walk · Shift to run'],
    ['R', 'Sit down and rest, wherever you are'],
    ['Tab', 'Things only you need: rest, sit and watch, tinder'],
    ['M', 'Map'],
    ['J', 'Journal'],
    ['Esc', 'Free the mouse, close what is open'],
    ['F11', 'Full screen'],
    ['F8', 'Write a playtest note'],
  ],
  close: 'Done',
} as const;

export const CREDITS_TEXT = {
  title: 'Credits',
  lines: [
    'TAP / OUT is built on the v12 prototype, its rules kept and proven by tests.',
    'Every model, sound and piece of music is made in code. No image, sound or music files.',
    'Dan\'s voice is recorded with the free Kokoro voice model (Apache-2.0).',
  ],
  libraries: [
    ['three.js', '3D rendering', 'MIT'],
    ['React', 'Screens and panels', 'MIT'],
    ['Phaser', 'Layout guides', 'MIT'],
    ['Electron', 'The Windows app', 'MIT'],
    ['Kokoro-82M', 'Dan\'s voice', 'Apache-2.0'],
  ],
  people: 'Design and direction: Sir. Built with Claude.',
  close: 'Back',
  licences: 'Open-source licences',
  licencesMissing: 'The licence list could not be opened.',
} as const;

/**
 * Tips for a first run: plain facts about how the game works, each shown once, dismissible,
 * never a recommendation and never a consequence (CLAUDE.md, the agenda rule).
 */
export const TIPS = [
  { id: 'body', when: 'start', title: 'Your body', text: 'The bars on the left fall as the hours pass and as you work. Food, water and warmth are the ones that can end a run.' },
  { id: 'look', when: 'start', title: 'Looking and using', text: 'Things you can use light up when you look at them. Click one to see what you can do there, what it costs and how long it takes.' },
  { id: 'time', when: 'firstAction', title: 'Time', text: 'Every action takes time and energy; the clock is at the top. Walking around inside a place costs nothing.' },
  { id: 'travel', when: 'away', title: 'Other places', text: 'The signposts take you between Camp, the Shore and the Woods. The walk costs time, and your pack carries one kind of load back.' },
  { id: 'dusk', when: 'dusk', title: 'Night', text: 'You sleep at the shelter. Before you lie down, the night preview shows the weather, the fire and how cold it will get.' },
  { id: 'resolve', when: 'wavering', title: 'Resolve', text: 'Resolve is your will to stay. Hard days wear it down, steady ones and small comforts build it back. You can see it with Tab.' },
  { id: 'winter', when: 'winter', title: 'Winter', text: 'The lake is freezing over. Open-water lines and the net are done for the season; you can cut through the ice to fish.' },
] as const;

export const TIPS_TEXT = {
  dismiss: 'Got it · Enter',
  setting: { label: 'Tips for a first run', hint: 'Short notes on how things work, each shown once' },
} as const;

/** Offered once if the picture stutters on this computer (plan M22). Turning it down is the player's call. */
export const SLOW_TEXT = {
  title: 'Running slowly',
  text: 'The picture is stuttering on this computer. Lighter graphics lowers the resolution, the shadows and the rain and snow. You can change it back in Settings.',
  yes: 'Use lighter graphics',
  no: 'Keep it as it is',
} as const;

/** How slow counts as stuttering: average frames per second over the first seconds of play. */
export const SLOW_CHECK = { fps: 28, seconds: 12 } as const;

/** The screen shown if the game itself breaks (plan M22). Calm, and says the run is safe. */
export const CRASH_TEXT = {
  title: 'Something broke',
  body: 'The game hit an error it could not recover from. Your run is saved up to your last action, so nothing is lost.',
  logged: 'The details were written to crash.log in your save folder.',
  restart: 'Restart the game',
  folder: 'Open the save folder',
} as const;
