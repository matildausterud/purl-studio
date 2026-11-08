import { CATALOG, getYarn, getColor } from './catalog.js';
export function defaultCombination() {
  return { version: 1, name: '', secondEnabled: true, strands: [
    { yarnId: 'isager-tvinni', colorId: 'demo-2' },
    { yarnId: 'isager-silk-mohair', colorId: 'demo-1' },
  ] };
}
export function validCombination(value) {
  return value?.version === 1 && typeof value.name === 'string' && value.name.length <= 60
    && typeof value.secondEnabled === 'boolean' && Array.isArray(value.strands) && value.strands.length === 2
    && value.strands.every(s => s && getYarn(s.yarnId) && getColor(s));
}
export function changeStrand(state, index, field, value) {
  if (![0, 1].includes(index)) return state;
  const next = structuredClone(state), strand = next.strands[index];
  if (field === 'brand') {
    const yarn = CATALOG.find(y => y.brand === value);
    if (!yarn) return state;
    strand.yarnId = yarn.id; strand.colorId = yarn.colors[0].id;
  } else if (field === 'yarn') {
    const yarn = getYarn(value);
    if (!yarn || yarn.brand !== getYarn(strand.yarnId).brand) return state;
    strand.yarnId = yarn.id; strand.colorId = yarn.colors[0].id;
  } else if (field === 'color') {
    if (!getYarn(strand.yarnId).colors.some(c => c.id === value)) return state;
    strand.colorId = value;
  } else return state;
  return next;
}
export const activeStrands = state => state.strands.slice(0, state.secondEnabled ? 2 : 1);
