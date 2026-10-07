import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, validateResult } from '../src/engine/calculate.js';
import { DEFAULTS, SIZES } from '../src/engine/model.js';
import { makePattern, patternText } from '../src/engine/pattern.js';

test('default pattern has a hand-checked stitch ledger', () => {
  const p = calculate();
  assert.equal(p.ok,true);
  assert.equal(p.castOn,80);
  assert.deepEqual(p.initial,{front:26,back:26,sleeve:12,raglan:4});
  assert.equal(p.bodyStitches,212);
  assert.equal(p.underarm,12);
  assert.equal(p.bodyIncreases,33);
  assert.equal(p.sleeveIncreases,26);
  assert.equal(p.yokeTotal,316);
  assert.equal(p.sleeveEnd,64);
  assert.equal(p.upperArmStitches,76);
  assert.equal(p.cuffStitches,44);
  assert.equal(p.decreases,16);
});

test('size, fit, sleeve and rib matrix conserves every stitch and reaches targets', () => {
  let cases = 0;
  for (const size of Object.keys(SIZES)) for (const fit of ['regular','oversized'])
  for (const sleeve of ['regular','wide']) for (const rib of ['1x1','2x2'])
  for (const [stitchGauge,rowGauge] of [[12,18],[16,24],[19,27],[20,28],[22.5,31.5],[28,38],[36,50]]) {
    const p = calculate({size,fit,sleeve,rib,stitchGauge,rowGauge});
    assert.equal(p.ok,true,JSON.stringify({size,fit,sleeve,rib,stitchGauge,errors:p.errors}));
    assert.deepEqual(validateResult(p),[]);
    // Simulate all yoke rounds rather than repeat the final formulas alone.
    let front=p.initial.front,back=p.initial.back,left=p.initial.sleeve,right=left;
    for(let round=1;round<=p.yokeRounds;round++){
      if(p.bodySchedule.includes(round)){front+=2;back+=2;}
      if(p.sleeveSchedule.includes(round)){left+=2;right+=2;}
    }
    assert.equal(front+back+4+2*p.underarm,p.bodyStitches);
    assert.equal(left+p.underarm,p.upperArmStitches);
    assert.equal(right,left);
    let sleeveCount=left+p.underarm;
    for(let round=1;round<=p.sleevePlain;round++) if(p.decreaseSchedule.includes(round)) sleeveCount-=2;
    assert.equal(sleeveCount,p.cuffStitches);
    assert.ok(p.decreaseSchedule.every(n=>n>1)); // Pickup round has no decrease.
    for(const n of [p.castOn,p.bodyStitches,p.cuffStitches]) assert.equal(n%p.repeat,0);
    const s=stitchGauge/10,r=rowGauge/10;
    assert.ok(Math.abs(p.finished.bust-p.targets.bust)<=2/s+1e-9);
    assert.ok(Math.abs(p.finished.upperArm-p.targets.upperArm)<=p.repeat/2/s+1e-9);
    assert.ok(Math.abs(p.finished.cuff-p.targets.cuff)<=p.repeat/2/s+1e-9);
    assert.ok(Math.abs(p.finished.bodyLength-DEFAULTS.bodyLength)<=0.5/r+1e-9);
    assert.ok(Math.abs(p.finished.sleeveLength-DEFAULTS.sleeveLength)<=0.5/r+1e-9);
    assert.equal(p.bodyPlain+p.hemRounds,p.bodyTotal);
    assert.equal(p.sleevePlain+p.cuffRounds,p.sleeveTotal);
    cases++;
  }
  assert.equal(cases,336);
});

test('invalid numeric inputs and unsupported modules never generate patterns', () => {
  for (const input of [{stitchGauge:0},{rowGauge:NaN},{needle:Infinity},{bodyLength:''},{size:'3XL'},{rib:'3x3'},{construction:'drop'},{neckline:'square'},{shortRows:'yes'},{color:'" onload="alert(1)'},{swatchWeight:-1}]) {
    const p=calculate(input); assert.equal(p.ok,false,JSON.stringify(input)); assert.throws(()=>makePattern(p));
  }
});
test('structurally impossible lengths and yoke schedules are blocked', () => {
  for(const input of [{size:'XXL',yokeDepth:40,bodyLength:35},{sleeveLength:15,cuff:12,sleeve:'wide',stitchGauge:36,rowGauge:14},{size:'XXL',stitchGauge:36,rowGauge:14,yokeDepth:16}]) assert.equal(calculate(input).ok,false);
});
test('short rows change only back rise and one front resolution round',()=>{
  const yes=calculate(),no=calculate({shortRows:false});
  assert.equal(yes.bodyStitches,no.bodyStitches);
  assert.equal(yes.finished.bodyLength,no.finished.bodyLength);
  assert.ok(Math.abs(yes.finished.backLength-yes.finished.bodyLength-6/2.8)<1e-10);
  assert.equal(no.finished.backLength,no.finished.bodyLength);
  assert.equal(yes.bodyTotal+1,no.bodyTotal);
});
test('deterministic, immutable input; pattern uses the validated ledger',()=>{
  const input=Object.freeze({...DEFAULTS});
  assert.deepEqual(calculate(input),calculate(input));
  const p=calculate(input),text=patternText(p);
  assert.ok(text.includes(`cast on ${p.castOn} stitches`));
  assert.ok(text.includes(`exactly ${p.cuffStitches} stitches`));
  assert.ok(text.includes(`${p.bodyStitches} body stitches`));
  assert.throws(()=>makePattern({...p,cuffStitches:99}));
});
test('rounding and dense shaping are disclosed; material estimates require a swatch',()=>{
  assert.equal(calculate().yarnEstimate,null);
  const p=calculate({stitchGauge:19,rowGauge:27});
  assert.ok(p.warnings.some(w=>w.code.startsWith('rounding-')));
  assert.ok(calculate({size:'XXL',rowGauge:24}).warnings.some(w=>w.code==='frequency'));
  const estimate=calculate({swatchWeight:5}).yarnEstimate;
  assert.ok(estimate.grams>0 && estimate.balls>0);
  assert.equal(estimate.meters,estimate.balls*200);
});
