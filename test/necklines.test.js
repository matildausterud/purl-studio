import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, necklineOptions, validateResult } from '../src/engine/calculate.js';
import { NECKLINES, necklineCompatibility } from '../src/engine/necklines.js';
import { SIZES } from '../src/engine/model.js';
import { makePattern, patternText } from '../src/engine/pattern.js';
import { sweaterSVG } from '../src/ui/preview.js';
import { necklineThumbnail } from '../src/ui/neckline-preview.js';

test('each neckline has a distinct default cast-on, drawing and instruction', () => {
  const expected = {crew:80, wideCrew:100, mock:76, turtle:72, boat:108, v:56};
  const drawings=[], thumbnails=[];
  for (const [neckline, castOn] of Object.entries(expected)) {
    const p=calculate({neckline});
    assert.equal(p.ok,true); assert.equal(p.castOn,castOn);
    assert.equal(p.design.neckband,NECKLINES[neckline].band);
    assert.ok(patternText(p).includes(NECKLINES[neckline].label));
    drawings.push(sweaterSVG(p.design,p.finished));
    thumbnails.push(necklineThumbnail(neckline));
  }
  assert.equal(new Set(drawings).size,6);
  assert.equal(new Set(thumbnails).size,6);
  assert.ok(drawings.every(s=>!s.includes('NaN')&&!s.includes('undefined')));
  assert.match(patternText(calculate({neckline:'turtle'})),/Fold it outward in half/);
  assert.match(patternText(calculate({neckline:'mock'})),/standing upright; do not fold/);
  assert.equal(calculate({neckline:'boat'}).shapingPairs,0);
});

test('2016 neckline/size/fit/sleeve/rib/gauge combinations conserve stitches through every row', () => {
  let count=0;
  for(const neckline of Object.keys(NECKLINES)) for(const size of Object.keys(SIZES))
  for(const fit of ['regular','oversized']) for(const sleeve of ['regular','wide'])
  for(const rib of ['1x1','2x2']) for(const [stitchGauge,rowGauge] of [[12,18],[16,24],[19,27],[20,28],[22.5,31.5],[28,38],[36,50]]) {
    const p=calculate({neckline,size,fit,sleeve,rib,stitchGauge,rowGauge}), n=p.neckline;
    assert.equal(p.ok,true,JSON.stringify(p.errors));
    let front=p.initial.front,back=p.initial.back,left=p.initial.sleeve,right=left;
    assert.equal(front+back+left+right+4,p.castOn);
    for(let row=1;row<=p.yokeRounds;row++) {
      if(n.isV && row<=n.flatRows && row%2===0) {
        assert.ok(!n.neckSchedule.includes(row));
        assert.ok(!p.bodySchedule.includes(row));
        assert.ok(!p.sleeveSchedule.includes(row));
      }
      if(p.bodySchedule.includes(row)){front+=2;back+=2;}
      if(p.sleeveSchedule.includes(row)){left+=2;right+=2;}
      if(n.neckSchedule.includes(row))front+=2;
      if(n.isV && row===n.flatRows)assert.equal(front,back,'front must catch up by the V join');
    }
    assert.equal(front,p.frontEnd);assert.equal(back,p.backEnd);
    assert.equal(front+back+left+right+4,p.yokeTotal);
    assert.equal(front+back+4+2*p.underarm,p.bodyStitches);
    assert.equal(left+p.underarm,p.upperArmStitches);
    assert.equal(right,left);
    assert.equal(left+p.underarm-2*p.decreaseSchedule.length,p.cuffStitches);
    assert.equal((n.neckbandStitches-n.bandSelvedges)%p.repeat,0);
    assert.equal(p.bodyStitches%p.repeat,0);assert.equal(p.cuffStitches%p.repeat,0);
    assert.ok(Math.abs(p.finished.bust-p.targets.bust)<=2/(stitchGauge/10)+1e-9);
    assert.ok(Math.abs(p.finished.bodyLength-56)<=.5/(rowGauge/10)+1e-9);
    assert.ok(Math.abs(p.finished.upperArm-p.targets.upperArm)<=p.repeat/2/(stitchGauge/10)+1e-9);
    if(n.isV){
      assert.equal(p.castOn+2*n.pickupEachSide,n.neckbandStitches);
      assert.ok(n.flatRows<=p.yokeRounds-2);
      assert.ok(Math.abs(p.finished.vDepth-p.design.vDepth)<=1/(rowGauge/10)+1e-9);
    }
    assert.deepEqual(validateResult(p),[]);
    assert.ok(makePattern(p).sections.length>=9);
    count++;
  }
  assert.equal(count,2016);
});

test('V-neck fixture accounts for edge stitches, join, band selvedges and both sleeves', () => {
  const p=calculate({neckline:'v'}), n=p.neckline, text=patternText(p);
  assert.deepEqual(p.initial,{front:2,back:26,sleeve:12,raglan:4});
  assert.equal(p.castOn,56);assert.equal(n.neckAdded,24);
  assert.equal(n.flatRows,40);assert.equal(n.neckSchedule.length,12);
  assert.equal(p.yokeTotal,316);assert.equal(p.bodyStitches,212);
  assert.equal(n.neckbandStitches,120);assert.equal(n.pickupEachSide,32);
  assert.equal(n.neckbandStitches-2,118);
  assert.equal(p.shapingPairs,0);assert.equal(p.setupRounds,0);
  assert.match(text,/Do not restart the counter after joining/);
  assert.match(text,/join the two front edges into a round without casting on extra stitches/);
  assert.match(text,/Beginning at the V-point round marker/);
  assert.match(text,/Repeat this entire sleeve instruction for the second sleeve before working the neckline band/);
  assert.doesNotMatch(text,/All ribbed counts are divisible/);
  const corrupted={...p,neckline:{...n,neckAdded:26}};
  assert.ok(validateResult(corrupted).length>0);
  assert.throws(()=>makePattern(corrupted));
});

test('unsupported constructions and impossible necklines return visible reasons', () => {
  assert.equal(necklineCompatibility('raglan','v').compatible,true);
  assert.equal(necklineCompatibility('drop','v').compatible,false);
  assert.equal(calculate({neckline:'__proto__'}).ok,false);
  const unsupported=necklineOptions({construction:'drop'});
  assert.equal(unsupported.length,6);
  assert.ok(unsupported.every(n=>n.disabled && n.reason.includes('top-down raglan')));
  const p=calculate({neckline:'v',size:'XS',vDepth:22});
  assert.equal(p.ok,false);assert.ok(p.errors.some(e=>e.code==='vDepth'));
  const opts=necklineOptions({neckline:'v',size:'XS',vDepth:22});
  assert.equal(opts.find(n=>n.value==='v').disabled,true);
  assert.equal(opts.find(n=>n.value==='crew').disabled,false);
  assert.equal(necklineOptions({neckline:'crew',size:'XS',vDepth:22}).find(n=>n.value==='v').disabled,false,'switching back to V offers a fresh valid default depth');
  assert.equal(calculate({neckline:'turtle',neckband:3}).ok,false);
  assert.equal(calculate({neckline:'boat',neckband:8}).ok,false);
});

test('changing collar height preserves yoke counts, while V depth reschedules shaping', () => {
  const low=calculate({neckline:'turtle',neckband:12}),high=calculate({neckline:'turtle',neckband:24});
  assert.equal(low.castOn,high.castOn);assert.equal(low.bodyStitches,high.bodyStitches);
  assert.equal(low.neckbandRounds,34);
  assert.equal(high.neckbandRounds,67); // Each requested height rounds independently.
  const shallow=calculate({neckline:'v',vDepth:12}),deep=calculate({neckline:'v',vDepth:18});
  assert.equal(shallow.ok,true);assert.equal(deep.ok,true);
  assert.equal(shallow.castOn,deep.castOn);
  assert.equal(shallow.bodyStitches,deep.bodyStitches);
  assert.notDeepEqual(shallow.neckline.neckSchedule,deep.neckline.neckSchedule);
  assert.ok(deep.neckline.neckbandStitches>shallow.neckline.neckbandStitches);
});
