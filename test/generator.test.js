import test from 'node:test';
import assert from 'node:assert/strict';
import {generateMotif,MOTIFS,tileChart} from '../src/colorwork/generator.js';
import {createColorDesign,validateColorData} from '../src/colorwork/model.js';
import {swatchSVG} from '../src/ui/swatch-preview.js';
const palette=createColorDesign().palette;
test('every generator returns deterministic editable two-color charts within the schema',()=>{
 for(const style of Object.keys(MOTIFS))for(const [width,height] of [[2,2],[7,9],[12,12],[32,32]]){
 const c=generateMotif({style,width,height,seed:17},palette);
 assert.deepEqual(c,generateMotif({style,width,height,seed:17},palette));
 assert.equal(c.cells.length,height);assert.ok(c.cells.every(r=>r.length===width));
 assert.deepEqual([...new Set(c.cells.flat())].sort(),[0,1]);
 assert.deepEqual(validateColorData({...createColorDesign(),zones:[{id:'generated',placement:'body',type:'chart',chart:c}]}),[]);
 }
 assert.throws(()=>generateMotif({width:33},palette));
 assert.throws(()=>generateMotif({style:'unknown'},palette));
});
test('tiling retains exact cells and prevents silent truncation',()=>{
 const c=generateMotif({width:5,height:7,seed:9},palette),snapshot=JSON.stringify(c);
 const tiled=tileChart(c,3,2);assert.equal(tiled.width,15);assert.equal(tiled.height,14);
 for(let r=0;r<14;r++)for(let x=0;x<15;x++)assert.equal(tiled.cells[r][x],c.cells[r%7][x%5]);
 assert.equal(JSON.stringify(c),snapshot);assert.throws(()=>tileChart(c,8,1));
});
test('swatch rendering uses gauge and repeat counts without mutating chart data',()=>{
 const c=generateMotif({width:6,height:6},palette),snapshot=JSON.stringify(c);
 const svg=swatchSVG(c,{across:3,up:2,stitchGauge:20,rowGauge:28});
 assert.match(svg,/18 stitch by 12 row/);assert.notEqual(svg,swatchSVG(c,{rowGauge:40}));
 assert.notEqual(swatchSVG(c,{direction:'top-down'}),swatchSVG(c,{direction:'bottom-up'}));
 assert.equal(JSON.stringify(c),snapshot);
});
