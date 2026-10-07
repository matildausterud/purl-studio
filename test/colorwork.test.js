import test from 'node:test';
import assert from 'node:assert/strict';
import { repeatCompatibility,nearbyCompatibleCounts,stripeSequence,validateColorwork,stableSleeveWindows,zoneForSection } from '../src/colorwork/engine.js';
import { createColorDesign,createChart,paintChart,resizeChart,recolorPalette,serializeColorDesign,parseColorDesign } from '../src/colorwork/model.js';
import { garmentSuggestions } from '../src/colorwork/adjustments.js';
import { colorPattern,chartText } from '../src/colorwork/pattern.js';
import { calculate } from '../src/engine/calculate.js';
import { DEFAULTS } from '../src/engine/model.js';
import { sweaterSVG } from '../src/ui/preview.js';
const chartDesign=(placement='body',width=4,height=6)=>{const d=createColorDesign();d.zones=[{id:'test',type:'chart',placement,chart:createChart(d.palette,width,height)}];return d;};
test('repeat compatibility, exact division and remainder are deterministic',()=>{
 assert.deepEqual(repeatCompatibility(216,18),{compatible:true,stitchCount:216,repeatWidth:18,repeats:12,remainder:0});
 assert.deepEqual(repeatCompatibility(220,18),{compatible:false,stitchCount:220,repeatWidth:18,repeats:12,remainder:4});
 for(const n of [0,-1,2.5,NaN])assert.throws(()=>repeatCompatibility(n,18));
 for(let n=1;n<400;n++)for(let w=1;w<=32;w++){const r=repeatCompatibility(n,w);assert.equal(r.repeats*w+r.remainder,n);assert.ok(r.remainder<w);}
});
test('nearby compatible counts convert with actual stitch gauge, without rounding centimeters',()=>{
 assert.deepEqual(nearbyCompatibleCounts(220,18,20),[{stitches:216,measurement:108},{stitches:234,measurement:117}]);
 assert.equal(nearbyCompatibleCounts(220,18,20.36)[0].measurement,2160/20.36);
 assert.deepEqual(nearbyCompatibleCounts(4,18,20),[{stitches:18,measurement:9}]);
 assert.throws(()=>nearbyCompatibleCounts(220,18,0));
});
test('stripe sequence uses ordered row widths and truncates only the final stripe',()=>{
 const stripes=[{color:'A',rows:3},{color:'B',rows:2},{color:'C',rows:1}];
 assert.deepEqual(stripeSequence(stripes,9),['A','A','A','B','B','C','A','A','A']);
 assert.deepEqual(stripeSequence([...stripes].reverse(),4),['C','B','B','A']);
 assert.deepEqual(stripeSequence(stripes,0),[]);assert.throws(()=>stripeSequence([{rows:0}],3));
});
test('structured color data survives persistence, flood fill, resizing and palette edits',()=>{
 let d=chartDesign();d.zones[0].chart=paintChart(d.zones[0].chart,0,0,1);
 const before=serializeColorDesign(d);const restored=parseColorDesign(before);assert.deepEqual(restored,d);
 const fill=paintChart(d.zones[0].chart,2,2,2,true);assert.equal(fill.cells[0][0],1);assert.equal(fill.cells[5][3],2);
 const resized=resizeChart(fill,6,8);assert.equal(resized.cells[0][0],1);assert.equal(resized.cells[7][5],0);
 d=recolorPalette(d,1,'#123456');assert.equal(d.zones[0].chart.palette[1],'#123456');assert.equal(d.zones[0].chart.cells[0][0],1);assert.equal(before,serializeColorDesign(restored));
 assert.throws(()=>parseColorDesign('{"version":999}'));assert.throws(()=>resizeChart(fill,0,6));
 const bad=JSON.parse(before);bad.zones[0].chart.cells[0][0]=50;assert.throws(()=>serializeColorDesign(bad));
});
test('body charts use the ledger; suggestions never mutate and must pass every dependent validation',()=>{
 const p=calculate(DEFAULTS),d=chartDesign('body',18,6),before=JSON.stringify(p);
 const v=validateColorwork(d,p);assert.equal(v.ok,false);assert.equal(v.zones[0].stitchCount,p.bodyStitches);assert.equal(v.zones[0].repeat.remainder,p.bodyStitches%18);
 const options=garmentSuggestions(p,d,'test');assert.equal(options.length,2);assert.ok(options.some(x=>x.allowed));assert.equal(JSON.stringify(p),before);
 for(const option of options.filter(x=>x.allowed)){const next=calculate({...p.design,...option.patch});assert.ok(next.ok);assert.equal(next.bodyStitches,option.stitches);assert.ok(validateColorwork(d,next).ok);assert.equal(next.finished.bust,option.measurement);}
 d.zones.push({id:'bad-yoke',type:'chart',placement:'yoke',chart:createChart(d.palette)});
 assert.ok(garmentSuggestions(p,d,'test').every(x=>!x.allowed));
});
test('sleeve chart windows exclude pickups and decreases, and oversized charts are blocked',()=>{
 const p=calculate(DEFAULTS),d=chartDesign('sleeves',2,2),v=validateColorwork(d,p);assert.ok(v.ok);
 const r=v.zones[0];assert.ok(r.startRound>=2);assert.ok(p.decreaseSchedule.every(n=>n<r.startRound||n>r.endRound));
 assert.equal(r.stitchCount,p.upperArmStitches-2*p.decreaseSchedule.filter(n=>n<r.startRound).length);
 for(const w of stableSleeveWindows(p))assert.ok(p.decreaseSchedule.every(n=>n<w.startRound||n>w.endRound));
 d.zones[0].chart=resizeChart(d.zones[0].chart,2,32);assert.equal(validateColorwork(d,p).ok,false);
 for(const placement of ['yoke','entire','hem','cuffs'])assert.equal(validateColorwork(chartDesign(placement),p).ok,false);
});
test('color output reflects stripe data, validated chart counts, legend, and zone priority',()=>{
 const p=calculate(DEFAULTS),d=chartDesign('body',4,6);assert.ok(validateColorwork(d,p).ok);
 d.zones.push({id:'all',placement:'entire',type:'stripes',stripes:[{color:d.baseColor,rows:6},{color:d.palette[1].hex,rows:4}]});
 assert.equal(zoneForSection(d,'body').id,'test');assert.equal(zoneForSection(d,'yoke').id,'all');
 const output=colorPattern(d,p);assert.ok(output.sections.some(s=>s.text.includes(`4 × ${p.bodyStitches/4} = ${p.bodyStitches}`)));assert.ok(output.sections.some(s=>s.text.includes('6 in Color A, 4 in Color B')));
 assert.match(chartText(d.zones[0]),/4 stitches × 6 rows/);
 assert.match(sweaterSVG(p.design,p.finished,false,d,p),/#315744/);
 d.zones[0].chart=resizeChart(d.zones[0].chart,18,6);assert.throws(()=>colorPattern(d,p));
});
test('single V-neck motif is split around the round marker without changing chart rows',()=>{
 const p=calculate({...DEFAULTS,neckline:'v'}),d=chartDesign('body',5,3);d.zones[0].chart.repeatHorizontal=false;
 assert.ok(p.ok);assert.ok(validateColorwork(d,p).ok);
 assert.ok(colorPattern(d,p).sections.some(s=>s.text.includes('Only then advance the chart row')));
});
test('duplicate palette HEX values retain distinct chart legend letters',()=>{
 const d=recolorPalette(createColorDesign(),0,'#f1ebdd'),p=calculate(DEFAULTS);
 const colors=colorPattern(d,p).sections[0].text;
 assert.match(colors,/Color A — Base/);assert.match(colors,/Color C — Cream/);
});
