import { CAMP } from './camp.layout.ts';
import { SHORE } from './shore.layout.ts';
import { WOODS } from './woods.layout.ts';
import type { LocationId, LocationLayout } from './layout.ts';

export * from './layout.ts';
export { CAMP, SHORE, WOODS };

export const LOCATIONS: Readonly<Record<LocationId, LocationLayout>> = { camp: CAMP, shore: SHORE, woods: WOODS };
