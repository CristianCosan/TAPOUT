// Words for the settings screen (plan §5, §7.2) and the credits.

export const SOUND_SETTINGS = {
  title: 'Sound',
  channels: [
    { id: 'master', label: 'Master', hint: 'Everything' },
    { id: 'ambience', label: 'Ambience', hint: 'Wind, rain, water, fire, birds' },
    { id: 'effects', label: 'Effects', hint: 'Chopping, building, fishing, eating' },
    { id: 'music', label: 'Music', hint: 'Quiet background and big moments' },
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
  keys: 'Keys',
  keyList: [
    ['Click', 'Look around (the mouse stays captured); click a lit thing to use it'],
    ['W A S D', 'Walk · Shift to run'],
    ['Tab', 'Things only you need: rest, sit and watch, tinder'],
    ['M', 'Map'],
    ['J', 'Journal'],
    ['Esc', 'Free the mouse, close what is open'],
    ['F11', 'Full screen'],
  ],
  close: 'Done',
} as const;

export const CREDITS_TEXT = {
  title: 'Credits',
  lines: [
    'TAP / OUT is built on the v12 prototype, its rules kept and proven by tests.',
    'Every model, sound and piece of music is made in code. No image, sound or music files.',
  ],
  libraries: [
    ['three.js', '3D rendering', 'MIT'],
    ['React', 'Screens and panels', 'MIT'],
    ['Phaser', 'Layout guides', 'MIT'],
    ['Electron', 'The Windows app', 'MIT'],
  ],
  people: 'Design and direction: Sir. Built with Claude.',
  close: 'Back',
} as const;
