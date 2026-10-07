import { NECKLINES } from './necklines.js';
/** Dimensions in cm. These are an explicit house size chart, not a universal standard. */
export const SIZES = Object.freeze({
  XS: { bust: 80, arm: 27, wrist: 16, neck: 38, yoke: 21 },
  S: { bust: 88, arm: 29, wrist: 17, neck: 39, yoke: 22 },
  M: { bust: 96, arm: 32, wrist: 18, neck: 40, yoke: 24 },
  L: { bust: 104, arm: 35, wrist: 19, neck: 41, yoke: 25 },
  XL: { bust: 116, arm: 39, wrist: 20, neck: 42, yoke: 27 },
  XXL: { bust: 128, arm: 43, wrist: 21, neck: 44, yoke: 29 },
});
export const DEFAULTS = Object.freeze({
  construction: 'raglan', neckline: 'crew', size: 'M', fit: 'regular',
  rib: '1x1', sleeve: 'regular', bodyLength: 56, sleeveLength: 44,
  stitchGauge: 20, rowGauge: 28, needle: 4, neckband: 3, hem: 5, cuff: 5,
  yokeDepth: null, vDepth: 14, shortRows: true, yarn: 'My favourite wool', color: '#9faaa0',
  swatchWeight: null, metersPerBall: 200, gramsPerBall: 50,
});
export const OPTIONS = Object.freeze({
  construction: ['raglan'], neckline: Object.keys(NECKLINES), size: Object.keys(SIZES),
  fit: ['regular', 'oversized'], rib: ['1x1', '2x2'], sleeve: ['regular', 'wide'],
});
export const LIMITS = Object.freeze({
  bodyLength: [35, 85], sleeveLength: [15, 65], stitchGauge: [10, 36],
  rowGauge: [14, 50], needle: [2, 12], neckband: [1, 26], hem: [1, 12], vDepth: [8, 22],
  cuff: [1, 12], yokeDepth: [16, 40], swatchWeight: [0.1, 30],
  metersPerBall: [20, 1200], gramsPerBall: [10, 500],
});
