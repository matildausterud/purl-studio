import test from 'node:test';
import assert from 'node:assert/strict';
import { MODELS, readDesign, selectModel, applyYarns, applyPattern, saveDesign, KEY } from '../src/journey/model.js';
import { defaultCombination } from '../src/yarn/state.js';
import { calculate } from '../src/engine/calculate.js';
import { validateColorwork } from '../src/colorwork/engine.js';
const storage=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};};
test('model → yarn → pattern preserves dimensions, gauge and metadata across reload',()=>{
 for(const model of MODELS){const s=storage(),d=readDesign(s);d.garment.size='L';d.garment.stitchGauge=22;d.garment.bodyLength=60;
 const selected=selectModel(d,model.id);assert.ok(calculate(selected.garment).ok,model.name);
 const yarn=applyYarns(selected,defaultCombination());assert.equal(yarn.garment.size,'L');assert.equal(yarn.garment.stitchGauge,22);assert.equal(yarn.garment.bodyLength,60);assert.equal(yarn.modelId,model.id);
 for(const mode of ['solid','stripes','custom']){const result=applyPattern(yarn,mode);saveDesign(s,result);assert.deepEqual(readDesign(s),result);assert.ok(validateColorwork(result.colorDesign,calculate(result.garment)).ok);}
 assert.equal(d.garment.neckline,'crew');assert.equal(d.yarnCombination,undefined);
 }
});
test('solid choice preserves a recoverable previous motif and yarn color changes retain zones',()=>{
 const d=readDesign(storage());d.colorDesign.zones=[{id:'old',placement:'body',type:'block',color:'#123456'}];
 const yarn=applyYarns(d,defaultCombination());assert.deepEqual(yarn.colorDesign.zones,d.colorDesign.zones);
 const plain=applyPattern(yarn,'solid');assert.equal(plain.colorDesign.zones.length,0);
 assert.deepEqual(applyPattern(plain,'custom').colorDesign.zones,d.colorDesign.zones);
 assert.equal(d.colorDesign.zones.length,1);
});
test('unreadable existing projects fail rather than silently replacing user work',()=>{
 const s=storage();s.setItem(KEY,'broken');assert.throws(()=>readDesign(s));assert.equal(s.getItem(KEY),'broken');
 assert.throws(()=>applyYarns(readDesign(storage()),{}));assert.throws(()=>selectModel(readDesign(storage()),'unknown'));
});
