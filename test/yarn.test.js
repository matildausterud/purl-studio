import test from 'node:test';
import assert from 'node:assert/strict';
import { CATALOG, getYarn, getColor } from '../src/yarn/catalog.js';
import { defaultCombination, changeStrand, validCombination, activeStrands } from '../src/yarn/state.js';
import { readLibrary, writeLibrary, readDraft, SAVED_KEY, DRAFT_KEY } from '../src/yarn/storage.js';
import { renderSwatch } from '../src/yarn/renderer.js';
import { SavedCombinations } from '../src/yarn/components.js';

function memoryStorage() { const data = new Map(); return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)}; }
test('all six demo yarns have valid shades and strand changes are independent', () => {
  assert.equal(CATALOG.length,6);
  for (const yarn of CATALOG) {
    assert.equal(yarn.demo,true);
    for (const c of yarn.colors) { assert.match(c.hex,/^#[\dA-F]{6}$/i); assert.match(c.code,/^DEMO-/); }
    const state=defaultCombination(), original=structuredClone(state);
    const brand=changeStrand(state,0,'brand',yarn.brand);
    const quality=changeStrand(brand,0,'yarn',yarn.id);
    const color=changeStrand(quality,0,'color',yarn.colors.at(-1).id);
    assert.ok(validCombination(color)); assert.equal(getYarn(color.strands[0].yarnId).id,yarn.id);
    assert.equal(getColor(color.strands[0]).id,yarn.colors.at(-1).id);
    assert.deepEqual(state,original); assert.deepEqual(color.strands[1],original.strands[1]);
  }
  assert.equal(activeStrands({...defaultCombination(),secondEnabled:false}).length,1);
});
test('brand and quality transitions reset colors and reject invalid selections', () => {
  const state=changeStrand(defaultCombination(),0,'color','demo-12');
  assert.equal(changeStrand(state,0,'brand','Sandnes Garn').strands[0].colorId,'demo-1');
  assert.equal(changeStrand(state,0,'yarn','isager-silk-mohair').strands[0].colorId,'demo-1');
  for (const [field,value] of [['brand','missing'],['yarn','olive-merino'],['color','missing']]) assert.deepEqual(changeStrand(state,0,field,value),state);
  assert.equal(validCombination({...state,strands:[null,null]}),false);
});
test('saved combinations and drafts round trip, and corrupt data is preserved', () => {
  const storage=memoryStorage(), state=defaultCombination(), saved=[{...state,id:'one',name:'Morning'}];
  writeLibrary(storage,saved); assert.deepEqual(readLibrary(storage),saved);
  storage.setItem(DRAFT_KEY,JSON.stringify(state)); assert.deepEqual(readDraft(storage),state);
  writeLibrary(storage,[]);assert.deepEqual(readLibrary(storage),[]);
  storage.setItem(SAVED_KEY,'broken');assert.throws(()=>readLibrary(storage));assert.equal(storage.getItem(SAVED_KEY),'broken');
  assert.throws(()=>writeLibrary({setItem(){throw new Error('QuotaExceededError');}},saved));
  storage.setItem(SAVED_KEY,JSON.stringify([saved[0],saved[0]]));assert.throws(()=>readLibrary(storage));
});
function recordingCanvas() {
  const commands=[];
  const ctx=new Proxy({}, {get:(target,key)=> (...args)=>commands.push([key,...args]),set:(target,key,value)=>{commands.push([key,value]);return true;}});
  return {commands,getContext:()=>ctx};
}
test('renderer is deterministic, keeps stitch geometry on recoloring and renders both strands', () => {
  const state=defaultCombination(), original=structuredClone(state), a=recordingCanvas(), b=recordingCanvas();
  renderSwatch(a,state);renderSwatch(b,state);assert.deepEqual(a.commands,b.commands);assert.deepEqual(state,original);
  const recolored=recordingCanvas();renderSwatch(recolored,changeStrand(state,0,'color','demo-6'));
  const geometry=c=>c.commands.filter(([name])=>['moveTo','bezierCurveTo','quadraticCurveTo'].includes(name));
  assert.deepEqual(geometry(a),geometry(recolored));assert.notDeepEqual(a.commands,recolored.commands);
  for(const strand of state.strands)assert.ok(a.commands.some(([key,value])=>key==='strokeStyle' && value===getColor(strand).hex));
  const single=recordingCanvas();renderSwatch(single,{...state,secondEnabled:false});assert.ok(single.commands.length<a.commands.length);
  const zoomed=recordingCanvas();renderSwatch(zoomed,state,{zoom:2});assert.deepEqual(geometry(a),geometry(zoomed));
});
test('saved names are escaped before insertion into the interface', () => {
  const html=SavedCombinations([{...defaultCombination(),id:'test',name:'<img src=x onerror=alert(1)>'}],[]);
  assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img'));
});
