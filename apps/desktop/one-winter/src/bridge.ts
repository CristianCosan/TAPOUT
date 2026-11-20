// The rules for One Winter (D-135): Sir's whole game, v12 and every change he made since, exactly as
// the core runs it. Bundled into ../rules.js by build-rules.mjs; game.html reads window.TAPOUT and
// only draws what the run says. Nothing here decides anything.

import { Session } from '../../../game/src/session.ts';
import {
  BUTTONS,
  KIT_POOL,
  WEATHER,
  SHELTERS,
  CLOTHES,
  duskHour,
  dawnHour,
  hh,
  ambientTempC,
  iceCm,
  waterCap,
  fireCap,
  campLeft,
  upgradePath,
  jobPlan,
  rationsLeft,
  wearing,
} from '@tapout/core';
import { CAST, P1, GAME_VERSION, BUILD_TASKS, UPGRADE_TEXT, BUILD_STATIONS, WEATHER_TEXT } from '@tapout/content';

function storage(): Storage | null {
  try {
    const s = window.localStorage;
    s.setItem('ow.t', '1');
    s.removeItem('ow.t');
    return s;
  } catch {
    return null;
  }
}

(window as unknown as { TAPOUT: unknown }).TAPOUT = {
  session: new Session(storage()),
  BUTTONS,
  KIT_POOL,
  WEATHER,
  SHELTERS,
  CLOTHES,
  duskHour,
  dawnHour,
  hh,
  ambientTempC,
  iceCm,
  waterCap,
  fireCap,
  campLeft,
  upgradePath,
  jobPlan,
  rationsLeft,
  wearing,
  BUILD_TASKS,
  UPGRADE_TEXT,
  BUILD_STATIONS,
  WEATHER_TEXT,
  CAST,
  P1,
  GAME_VERSION,
};
