/** Construction capabilities and neckline geometry live outside the visual layer. */
export const NECKLINES = Object.freeze({
  crew: { label: 'Crew neck', note: 'Classic, softly rounded', neckOffset: 0, frontShare: .35, band: 3, bandRange: [1, 6], shortRows: true, constructions: ['raglan'] },
  wideCrew: { label: 'Wide crew neck', note: 'An open, relaxed curve', neckOffset: 10, frontShare: .38, band: 2, bandRange: [1, 4], shortRows: true, constructions: ['raglan'] },
  mock: { label: 'Mock neck', note: 'A short standing collar', neckOffset: -2, frontShare: .35, band: 6, bandRange: [4, 9], shortRows: true, constructions: ['raglan'] },
  turtle: { label: 'Turtleneck', note: 'A tall, fold-over collar', neckOffset: -4, frontShare: .35, band: 18, bandRange: [12, 26], shortRows: true, constructions: ['raglan'] },
  boat: { label: 'Boat neck', note: 'Wide and shallow', neckOffset: 14, frontShare: .42, band: 2, bandRange: [1, 3], shortRows: false, constructions: ['raglan'] },
  v: { label: 'V-neck', note: 'A shaped V with a crossover band', neckOffset: 0, frontShare: .35, band: 2, bandRange: [1, 3], shortRows: false, constructions: ['raglan'] },
});

export function necklineCompatibility(construction, neckline) {
  const profile = Object.hasOwn(NECKLINES, neckline) ? NECKLINES[neckline] : undefined;
  if (!profile) return { compatible: false, reason: 'This neckline is not supported.' };
  if (!profile.constructions.includes(construction)) return {
    compatible: false, reason: `${profile.label} is currently validated only for top-down raglan. Choose raglan to use it.`,
  };
  return { compatible: true, reason: '' };
}

/** Flat yokes increase on right-side rows only; circular yokes can use any round. */
export function yokeSchedule(events, totalRows, flatRows = 0) {
  const available = Array.from({ length: totalRows - 1 }, (_, i) => i + 1)
    .filter(n => n > flatRows || n % 2 === 1);
  const alternate = available.filter(n => n % 2 === 1);
  const slots = alternate.length >= events ? alternate : available;
  if (!Number.isInteger(events) || events < 0 || events > slots.length) return null;
  return Array.from({ length: events }, (_, i) => slots[Math.floor(i * slots.length / events)]);
}
