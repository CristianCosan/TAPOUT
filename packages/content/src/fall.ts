// rc.6 (Sir): the short scene when you go through the ice or off a wet rock. Words only; the rule
// that decides it is in core (ice.ts).

export const FALL_SCENE = {
  ice: { title: 'Through the ice', line: 'A crack like a rifle shot, and then the lake.', after: 'Get to a fire. Get the wet clothes off.' },
  rocks: { title: 'Into the lake', line: 'The rock goes out from under you.', after: 'Get to a fire before the cold gets into you.' },
} as const;
