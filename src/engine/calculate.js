import { DEFAULTS, LIMITS, OPTIONS, SIZES } from './model.js';
import { NECKLINES, necklineCompatibility, yokeSchedule } from './necklines.js';

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
  const profile = Object.hasOwn(NECKLINES, d.neckline) ? NECKLINES[d.neckline] : undefined;
  if (profile && !Object.hasOwn(input, 'neckband')) d.neckband = profile.band;
  const compatibility = necklineCompatibility(d.construction, d.neckline);
  if (!compatibility.compatible) errors.push(message('neckline', compatibility.reason));
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

  const isV = d.neckline === 'v';
  if (d.neckband < profile.bandRange[0] || d.neckband > profile.bandRange[1])
    errors.push(message('neckband', `${profile.label} needs a neckband height from ${profile.bandRange[0]} to ${profile.bandRange[1]} cm. Choose a different neckline for a taller or shorter collar.`));

  const chart = SIZES[d.size], s = d.stitchGauge / 10, r = d.rowGauge / 10;
  const repeat = d.rib === '2x2' ? 4 : 2;
  const ease = d.fit === 'oversized' ? 20 : 10;
  const targets = {
    bust: chart.bust + ease,
    upperArm: chart.arm + (d.sleeve === 'wide' ? 14 : 6) + (d.fit === 'oversized' ? 2 : 0),
    cuff: chart.wrist + (d.sleeve === 'wide' ? 10 : 4),
    neck: chart.neck + profile.neckOffset,
    yoke: d.yokeDepth ?? chart.yoke + (d.fit === 'oversized' ? 2 : 0),
  };
  // Multiples of four preserve two symmetric body panels and paired increases.
  const referenceNeckCount = nearest(targets.neck * s, 4);
  const fullFront = Math.min(nearest((referenceNeckCount - 4) * profile.frontShare, 2), (referenceNeckCount - 20) / 2);
  const front = isV ? 2 : fullFront, back = fullFront;
  const sleeve = (referenceNeckCount - 4 - 2 * fullFront) / 2;
  const neckAdded = fullFront - front;
  const castOn = referenceNeckCount - neckAdded;
  const underarm = Math.max(4, nearest(targets.bust * 0.055 * s, 4));
  const body = nearest(targets.bust * s, 4);
  const upperArm = nearest(targets.upperArm * s, repeat);
  const cuff = nearest(targets.cuff * s, repeat);
  // All four one-stitch raglan lines stay on the body: two per body panel.
  const bodyIncreases = (body - 2 * underarm - 2 * (fullFront + 2)) / 4;
  const sleeveIncreases = (upperArm - underarm - sleeve) / 2;
  const yokeRounds = Math.round(targets.yoke * r);
  const flatRows = isV ? 2 * Math.round(d.vDepth * r / 2) : 0;
  const shapingPairs = d.shortRows && profile.shortRows ? 3 : 0;
  const setupRounds = shapingPairs ? 1 : 0;
  const bodyTotal = Math.round(d.bodyLength * r) - yokeRounds - setupRounds;
  const hemRounds = Math.round(d.hem * r), cuffRounds = Math.round(d.cuff * r);
  const bodyPlain = bodyTotal - hemRounds;
  const sleeveTotal = Math.round(d.sleeveLength * r), sleevePlain = sleeveTotal - cuffRounds;
  const decreases = (upperArm - cuff) / 2;
  if (sleeve < 8 || fullFront < 8) errors.push(message('neck', 'This neckline leaves too few stitches at this gauge. Increase stitch gauge or choose a wider neckline.'));
  if (![bodyIncreases, sleeveIncreases].every(n => Number.isInteger(n) && n >= 0))
    errors.push(message('targets', 'The neck and underarm allocation exceed the body or sleeve target. Choose a different size or sleeve shape.'));
  if (isV && (flatRows > yokeRounds - 2 || neckAdded / 2 > flatRows / 2))
    errors.push(message('vDepth', 'V shaping must fit before the underarms, with enough right-side rows for the neck increases. Adjust V depth, yoke depth or gauge.'));
  const bodySchedule = yokeSchedule(bodyIncreases, yokeRounds, flatRows);
  const sleeveSchedule = yokeSchedule(sleeveIncreases, yokeRounds, flatRows);
  if (!bodySchedule || !sleeveSchedule)
    errors.push(message('yoke', `Too many increases for this yoke depth${isV ? ' with right-side-only flat shaping' : ''}. Increase yoke depth or row gauge, reduce stitch gauge${isV ? ', or choose a shallower V' : ''}.`));
  if (bodyPlain < 1) errors.push(message('bodyLength', 'Body length must leave room for the yoke, shaping resolution round, hem and at least one plain round. Increase body length or shorten the yoke/hem.'));
  if (decreases < 0 || !Number.isInteger(decreases) || decreases > sleevePlain - 1)
    errors.push(message('sleeveLength', 'The sleeve is too short for paired decreases and the cuff. Lengthen it, shorten the cuff, or choose regular sleeves.'));
  if (errors.length) return { ok: false, errors, warnings };
  const neckSchedule = isV ? schedule(neckAdded / 2, flatRows / 2).map(n => 2 * n - 1) : [];
  const vSideLength = isV ? Math.hypot(flatRows / r, neckAdded / (2 * s)) : 0;
  const neckOpening = isV ? castOn / s + 2 * vSideLength : referenceNeckCount / s;
  const neckbandStitches = isV ? nearest(neckOpening * s, repeat) + 2 : castOn;
  const decreaseSchedule = schedule(decreases, sleevePlain - 1).map(n => n + 1);
  if ([bodySchedule, sleeveSchedule].some(a => a.some((n, i) => i && n - a[i - 1] === 1)))
    warnings.push(message('frequency', 'This gauge requires some consecutive increase rounds. Follow the body and sleeve schedules separately; an every-other-round raglan would miss the targets.'));
  const finished = {
    bust: body / s, upperArm: upperArm / s, cuff: cuff / s, neck: neckOpening,
    neckWidth: referenceNeckCount / s / 2, vDepth: flatRows / r,
    ease: body / s - chart.bust, yoke: (yokeRounds + setupRounds) / r,
    bodyLength: (yokeRounds + setupRounds + bodyTotal) / r,
    backLength: (yokeRounds + setupRounds + bodyTotal + 2 * shapingPairs) / r,
    sleeveLength: sleeveTotal / r, neckband: Math.round(d.neckband * r) / r,
    hem: hemRounds / r, cuffLength: cuffRounds / r,
  };
  for (const key of ['bust', 'upperArm', 'cuff', ...(isV ? [] : ['neck'])]) {
    if (Math.abs(finished[key] - targets[key]) > 0.05)
      warnings.push(message(`rounding-${key}`, `${key}: ${targets[key].toFixed(1)} cm requested → ${finished[key].toFixed(1)} cm after symmetric shaping and rib-repeat rounding.`));
  }
  warnings.push(message('gauge', 'Measurements assume your washed stockinette gauge also applies to relaxed ribbing. Ribbing may contract; measure a rib swatch and check neck stretch over your head before continuing.'));
  if (isV) warnings.push(message('v-neck', 'V-neck is worked flat before joining, then finished with a picked-up crossover rib band. Swatch both flat and circular stockinette: their gauges must match. Short rows are replaced by V-edge shaping.'));
  if (isV && Math.abs(finished.vDepth - d.vDepth) > .05)
    warnings.push(message('rounding-vDepth', `V depth: ${d.vDepth.toFixed(1)} cm requested → ${finished.vDepth.toFixed(1)} cm so the flat section ends after a wrong-side row.`));
  if (d.neckline === 'boat') warnings.push(message('boat-neck', 'The boat neck uses a wide opening and no short-row back rise. Check shoulder coverage and the opening against a sweater you like.'));
  if (d.neckline === 'turtle' || d.neckline === 'mock') warnings.push(message('collar', 'Check that the collar swatch stretches comfortably over your head. The standing/folded collar height is additional to body length.'));
  const frontEnd = fullFront + 2 * bodyIncreases, sleeveEnd = sleeve + 2 * sleeveIncreases;
  const yokeTotal = castOn + neckAdded + bodyIncreases * 4 + sleeveIncreases * 4;
  const result = {
    ok: true, version: 2, design: d, chart, targets, finished, repeat, errors, warnings,
    neckline: { label: profile.label, isV, flatRows, neckAdded, neckSchedule, referenceNeckCount, neckbandStitches, bandSelvedges: isV ? 2 : 0, pickupEachSide: isV ? (neckbandStitches - castOn) / 2 : 0 },
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
  check(p.frontEnd + p.backEnd + p.sleeveEnd * 2 + 4 === p.yokeTotal, 'Yoke sections must conserve stitches.');
  check(p.yokeTotal === p.castOn + p.bodyIncreases * 4 + p.sleeveIncreases * 4 + p.neckline.neckAdded, 'Yoke total must include every raglan and neckline increase.');
  check(p.frontEnd === p.initial.front + 2 * p.bodyIncreases + p.neckline.neckAdded && p.backEnd === p.initial.back + 2 * p.bodyIncreases, 'Front and back shaping must reach the recorded endpoints.');
  check(p.frontEnd * 2 + 4 + 2 * p.underarm === p.bodyStitches, 'Body must include all raglan stitches and both underarms.');
  check(p.sleeveEnd + p.underarm === p.upperArmStitches, 'Each sleeve must include one picked-up underarm.');
  check(p.upperArmStitches - p.decreaseSchedule.length * 2 === p.cuffStitches, 'Sleeve decreases must end exactly at the cuff count.');
  check([p.neckline.neckbandStitches - p.neckline.bandSelvedges, p.bodyStitches, p.cuffStitches].every(n => n > 0 && n % p.repeat === 0), 'Every ribbed section must fit its repeat, excluding flat-band selvedges.');
  check(p.neckline.neckSchedule.length * 2 === p.neckline.neckAdded, 'V-edge increases must replace the missing front stitches exactly.');
  if (p.neckline.isV) {
    check(p.neckline.flatRows % 2 === 0 && p.neckline.flatRows <= p.yokeRounds - 2, 'V must join after a wrong-side row and before underarm separation.');
    check(p.neckline.neckSchedule.every((n, i, a) => n > 0 && n <= p.neckline.flatRows && n % 2 === 1 && (!i || n > a[i-1])), 'V-edge shaping requires unique right-side rows.');
    check([...p.bodySchedule, ...p.sleeveSchedule].every(n => n > p.neckline.flatRows || n % 2 === 1), 'Flat raglan increases must fall on right-side rows.');
    check(Number.isInteger(p.neckline.pickupEachSide) && p.neckline.pickupEachSide > 0 && p.castOn + 2 * p.neckline.pickupEachSide === p.neckline.neckbandStitches, 'Neckband pickup sections must add up exactly.');
  }
  for (const [list, count, max] of [[p.bodySchedule, p.bodyIncreases, p.yokeRounds], [p.sleeveSchedule, p.sleeveIncreases, p.yokeRounds], [p.decreaseSchedule, p.decreases, p.sleevePlain]]) {
    check(list.length === count && list.every((n, i) => Number.isInteger(n) && n >= 1 && n <= max && (!i || n > list[i - 1])), 'Shaping schedules must contain ordered unique in-range rounds.');
  }
  return e;
}

/** The UI and future clients share the same compatibility/feasibility decisions. */
export function necklineOptions(design) {
  return Object.entries(NECKLINES).map(([value, profile]) => {
    const compatibility = necklineCompatibility(design.construction ?? DEFAULTS.construction, value);
    const candidate = compatibility.compatible ? calculate({
      ...design, neckline: value, neckband: profile.band,
      vDepth: value === 'v' && design.neckline !== 'v' ? DEFAULTS.vDepth : design.vDepth ?? DEFAULTS.vDepth,
    }) : null;
    return {
      value, ...profile, disabled: !compatibility.compatible || !candidate?.ok,
      reason: compatibility.reason || candidate?.errors.map(e => e.text).join(' ') || '',
      castOn: candidate?.ok ? candidate.castOn : null,
    };
  });
}
