import { DEFAULTS, LIMITS, OPTIONS, SIZES } from './model.js';

const nearest = (n, repeat) => Math.round(n / repeat) * repeat;
const message = (code, text) => ({ code, text });
/** Spread n shaping rounds across available rounds. At most one event per round. */
export function schedule(n, rounds, preferAlternate = false) {
  if (!Number.isInteger(n) || !Number.isInteger(rounds) || n < 0 || n > rounds)
    throw new RangeError('Shaping events must fit within the available rounds.');
  if (!n) return [];
  if (preferAlternate && n <= Math.floor(rounds / 2)) {
    const slots = Math.floor(rounds / 2);
    return Array.from({ length: n }, (_, i) => 2 * Math.floor(i * slots / n) + 1);
  }
  return Array.from({ length: n }, (_, i) => Math.floor(i * rounds / n) + 1);
}

/** Pure, deterministic calculation; invalid inputs never yield a printable pattern. */
export function calculate(input = {}) {
  const d = { ...DEFAULTS, ...input };
  const errors = [], warnings = [];
  for (const [key, values] of Object.entries(OPTIONS)) {
    if (!values.includes(d[key])) errors.push(message(key, `Choose a supported ${key}.`));
  }
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    if ((key === 'yokeDepth' || key === 'swatchWeight') && d[key] === null) continue;
    if (typeof d[key] !== 'number' || !Number.isFinite(d[key]) || d[key] < min || d[key] > max)
      errors.push(message(key, `${key}: enter a number from ${min} to ${max}.`));
  }
  if (typeof d.shortRows !== 'boolean') errors.push(message('shortRows', 'Short-row shaping must be on or off.'));
  if (typeof d.yarn !== 'string' || d.yarn.length > 120) errors.push(message('yarn', 'Yarn name must contain at most 120 characters.'));
  if (typeof d.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(d.color)) errors.push(message('color', 'Choose a valid yarn colour.'));
  if (errors.length) return { ok: false, errors, warnings };

  const chart = SIZES[d.size], s = d.stitchGauge / 10, r = d.rowGauge / 10;
  const repeat = d.rib === '2x2' ? 4 : 2;
  const ease = d.fit === 'oversized' ? 20 : 10;
  const targets = {
    bust: chart.bust + ease,
    upperArm: chart.arm + (d.sleeve === 'wide' ? 14 : 6) + (d.fit === 'oversized' ? 2 : 0),
    cuff: chart.wrist + (d.sleeve === 'wide' ? 10 : 4),
    neck: chart.neck,
    yoke: d.yokeDepth ?? chart.yoke + (d.fit === 'oversized' ? 2 : 0),
  };
  // Multiples of four preserve two symmetric body panels and paired increases.
  const castOn = nearest(targets.neck * s, 4);
  const front = Math.min(nearest((castOn - 4) * 0.35, 2), (castOn - 20) / 2), back = front;
  const sleeve = (castOn - 4 - front - back) / 2;
  const underarm = Math.max(4, nearest(targets.bust * 0.055 * s, 4));
  const body = nearest(targets.bust * s, 4);
  const upperArm = nearest(targets.upperArm * s, repeat);
  const cuff = nearest(targets.cuff * s, repeat);
  // All four one-stitch raglan lines stay on the body: two per body panel.
  const bodyIncreases = (body - 2 * underarm - 2 * (front + 2)) / 4;
  const sleeveIncreases = (upperArm - underarm - sleeve) / 2;
  const yokeRounds = Math.round(targets.yoke * r);
  const shapingPairs = d.shortRows ? 3 : 0;
  const setupRounds = d.shortRows ? 1 : 0;
  const bodyTotal = Math.round(d.bodyLength * r) - yokeRounds - setupRounds;
  const hemRounds = Math.round(d.hem * r), cuffRounds = Math.round(d.cuff * r);
  const bodyPlain = bodyTotal - hemRounds;
  const sleeveTotal = Math.round(d.sleeveLength * r), sleevePlain = sleeveTotal - cuffRounds;
  const decreases = (upperArm - cuff) / 2;
  if (sleeve < 8 || front < 8) errors.push(message('neck', 'This neck gauge leaves too few stitches for the supported neckline shaping. Increase stitch gauge.'));
  if (![bodyIncreases, sleeveIncreases].every(n => Number.isInteger(n) && n >= 0))
    errors.push(message('targets', 'The neck and underarm allocation exceed the body or sleeve target. Choose a different size or sleeve shape.'));
  if (Math.max(bodyIncreases, sleeveIncreases) > yokeRounds - 1)
    errors.push(message('yoke', 'Too many increases for this yoke depth. Increase yoke depth or row gauge, or reduce stitch gauge.'));
  if (bodyPlain < 1) errors.push(message('bodyLength', 'Body length must leave room for the yoke, shaping resolution round, hem and at least one plain round. Increase body length or shorten the yoke/hem.'));
  if (decreases < 0 || !Number.isInteger(decreases) || decreases > sleevePlain - 1)
    errors.push(message('sleeveLength', 'The sleeve is too short for paired decreases and the cuff. Lengthen it, shorten the cuff, or choose regular sleeves.'));
  if (errors.length) return { ok: false, errors, warnings };
  const bodySchedule = schedule(bodyIncreases, yokeRounds - 1, true);
  const sleeveSchedule = schedule(sleeveIncreases, yokeRounds - 1, true);
  const decreaseSchedule = schedule(decreases, sleevePlain - 1).map(n => n + 1);
  if ([bodySchedule, sleeveSchedule].some(a => a.some((n, i) => i && n - a[i - 1] === 1)))
    warnings.push(message('frequency', 'This gauge requires some consecutive increase rounds. Follow the body and sleeve schedules separately; an every-other-round raglan would miss the targets.'));
  const finished = {
    bust: body / s, upperArm: upperArm / s, cuff: cuff / s, neck: castOn / s,
    ease: body / s - chart.bust, yoke: (yokeRounds + setupRounds) / r,
    bodyLength: (yokeRounds + setupRounds + bodyTotal) / r,
    backLength: (yokeRounds + setupRounds + bodyTotal + 2 * shapingPairs) / r,
    sleeveLength: sleeveTotal / r, neckband: Math.round(d.neckband * r) / r,
    hem: hemRounds / r, cuffLength: cuffRounds / r,
  };
  for (const key of ['bust', 'upperArm', 'cuff', 'neck']) {
    if (Math.abs(finished[key] - targets[key]) > 0.05)
      warnings.push(message(`rounding-${key}`, `${key}: ${targets[key].toFixed(1)} cm requested → ${finished[key].toFixed(1)} cm after symmetric shaping and rib-repeat rounding.`));
  }
  warnings.push(message('gauge', 'Measurements assume your washed stockinette gauge also applies to relaxed ribbing. Ribbing may contract; measure a rib swatch and check neck stretch over your head before continuing.'));
  const frontEnd = front + 2 * bodyIncreases, sleeveEnd = sleeve + 2 * sleeveIncreases;
  const yokeTotal = castOn + bodyIncreases * 4 + sleeveIncreases * 4;
  const result = {
    ok: true, version: 1, design: d, chart, targets, finished, repeat, errors, warnings,
    castOn, initial: { front, back, sleeve, raglan: 4 }, underarm,
    bodyStitches: body, upperArmStitches: upperArm, cuffStitches: cuff,
    bodyIncreases, sleeveIncreases, bodySchedule, sleeveSchedule, decreaseSchedule,
    yokeRounds, yokeTotal, frontEnd, backEnd: frontEnd, sleeveEnd,
    neckbandRounds: Math.round(d.neckband * r), shapingPairs, setupRounds,
    bodyPlain, bodyTotal, hemRounds, sleevePlain, sleeveTotal, cuffRounds, decreases,
  };
  const invariantErrors = validateResult(result);
  if (invariantErrors.length) return { ok: false, errors: invariantErrors.map(t => message('invariant', t)), warnings };
  // Area estimate only; swatch mass is required, never infer yarn use from gauge alone.
  const area = (finished.neck + finished.bust + 2 * finished.upperArm) / 2 * finished.yoke
    + finished.bust * bodyTotal / r + (finished.upperArm + finished.cuff) * finished.sleeveLength
    + finished.neck * finished.neckband;
  result.yarnEstimate = d.swatchWeight === null ? null : {
    grams: Math.ceil(area / 100 * d.swatchWeight * 1.15),
    balls: Math.ceil(area / 100 * d.swatchWeight * 1.15 / d.gramsPerBall),
  };
  if (result.yarnEstimate) result.yarnEstimate.meters = result.yarnEstimate.balls * d.metersPerBall;
  return result;
}

/** Independent conservation checks, also usable by future construction adapters. */
export function validateResult(p) {
  const e = [], check = (condition, text) => { if (!condition) e.push(text); };
  check(p.castOn === p.initial.front + p.initial.back + 2 * p.initial.sleeve + 4, 'Neck distribution must conserve cast-on stitches.');
  check(p.frontEnd * 2 + p.sleeveEnd * 2 + 4 === p.yokeTotal, 'Yoke sections must conserve stitches.');
  check(p.frontEnd * 2 + 4 + 2 * p.underarm === p.bodyStitches, 'Body must include all raglan stitches and both underarms.');
  check(p.sleeveEnd + p.underarm === p.upperArmStitches, 'Each sleeve must include one picked-up underarm.');
  check(p.upperArmStitches - p.decreaseSchedule.length * 2 === p.cuffStitches, 'Sleeve decreases must end exactly at the cuff count.');
  check([p.castOn, p.bodyStitches, p.cuffStitches].every(n => n > 0 && n % p.repeat === 0), 'Every ribbed circumference must fit the rib repeat.');
  for (const [list, count, max] of [[p.bodySchedule, p.bodyIncreases, p.yokeRounds], [p.sleeveSchedule, p.sleeveIncreases, p.yokeRounds], [p.decreaseSchedule, p.decreases, p.sleevePlain]]) {
    check(list.length === count && list.every((n, i) => Number.isInteger(n) && n >= 1 && n <= max && (!i || n > list[i - 1])), 'Shaping schedules must contain ordered unique in-range rounds.');
  }
  return e;
}
