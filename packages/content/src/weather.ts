// How the top bar names v12's weather. v12's 'cold' weather drains warmth like a cold snap but
// does not lower the thermometer, so on a mild day "Cold snap" next to 20 °C read wrong. Above
// this temperature it is named for the chill in the air instead. Presentation only.

export const WEATHER_TEXT = {
  coldSnap: 'Cold snap',
  /** At or below this many °C it is a cold snap. */
  coldSnapAtOrBelow: 5,
  rawChill: 'Raw chill',
} as const;
