import { validCombination, defaultCombination } from './state.js';
export const SAVED_KEY = 'purl-yarn-combinations-v1';
export const DRAFT_KEY = 'purl-yarn-draft-v1';
export function readLibrary(storage) {
  const raw = storage.getItem(SAVED_KEY);
  if (!raw) return [];
  const data = JSON.parse(raw);
  if (!Array.isArray(data) || data.some(c => !validCombination(c) || typeof c.id !== 'string')
    || new Set(data.map(c => c.id)).size !== data.length) throw new Error('Saved combinations could not be read. Existing data has been left untouched.');
  return data;
}
export function writeLibrary(storage, combinations) {
  // Write before updating UI state, so a quota error never looks like a successful save.
  storage.setItem(SAVED_KEY, JSON.stringify(combinations));
}
export function readDraft(storage) {
  const raw = storage.getItem(DRAFT_KEY);
  if (!raw) return defaultCombination();
  const value = JSON.parse(raw);
  if (!validCombination(value)) throw new Error('The previous draft could not be read.');
  return value;
}
