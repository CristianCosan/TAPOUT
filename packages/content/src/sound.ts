// Words for the sound settings panel (plan §7.2: four volumes, Master scales the rest).

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
