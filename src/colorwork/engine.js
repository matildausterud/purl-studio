import { PLACEMENTS, chartLimitation, validateColorData } from './model.js';

export function repeatCompatibility(stitchCount, repeatWidth) {
  if(![stitchCount,repeatWidth].every(n=>Number.isInteger(n)&&n>0))throw new RangeError('Stitch count and repeat width must be positive whole numbers.');
  const repeats=Math.floor(stitchCount/repeatWidth),remainder=stitchCount%repeatWidth;
  return {compatible:remainder===0,stitchCount,repeatWidth,repeats,remainder};
}
export function nearbyCompatibleCounts(stitchCount,width,stitchesPer10cm) {
  repeatCompatibility(stitchCount,width);
  if(!Number.isFinite(stitchesPer10cm)||stitchesPer10cm<=0)throw new RangeError('Gauge must be positive.');
  const below=Math.floor((stitchCount-1)/width)*width,above=Math.ceil((stitchCount+1)/width)*width;
  return [below,above].filter(n=>n>0).map(stitches=>({stitches,measurement:stitches*10/stitchesPer10cm}));
}
export function stripeSequence(stripes, rows) {
  if(!Number.isInteger(rows)||rows<0||rows>5000||!stripes.length||stripes.some(s=>!Number.isInteger(s.rows)||s.rows<1||s.rows>64))throw new RangeError('Invalid stripe sequence.');
  const cycle=stripes.flatMap(s=>Array(s.rows).fill(s.color));
  return Array.from({length:rows},(_,i)=>cycle[i%cycle.length]);
}

export function stableSleeveWindows(p) {
  let count=p.upperArmStitches, start=2;const windows=[];
  for(const round of p.decreaseSchedule){
    if(round>start)windows.push({startRound:start,endRound:round-1,stitchCount:count});
    count-=2;start=round+1;
  }
  if(start<=p.sleevePlain)windows.push({startRound:start,endRound:p.sleevePlain,stitchCount:count});
  return windows;
}

export function sectionPlan(p) {
  return [
    {placement:'neckband',label:'Neckband / collar',rows:p.neckbandRounds,stitches:p.neckline.neckbandStitches},
    {placement:'yoke',label:'Yoke',rows:p.yokeRounds,stitches:null},
    {placement:'body',label:'Body stockinette',rows:p.bodyPlain,stitches:p.bodyStitches},
    {placement:'hem',label:'Hem ribbing',rows:p.hemRounds,stitches:p.bodyStitches},
    {placement:'sleeves',label:'Each sleeve',rows:p.sleevePlain,stitches:null},
    {placement:'cuffs',label:'Each cuff',rows:p.cuffRounds,stitches:p.cuffStitches},
  ];
}
export function zoneForSection(design,placement) {
  return design.zones.find(z=>z.placement===placement)||design.zones.find(z=>z.placement==='entire')||null;
}

/** Read-only adapter of the knitting ledger; it cannot alter garment geometry. */
export function validateColorwork(design,p) {
  const errors=validateColorData(design),warnings=[],zones=[];
  if(errors.length)return {ok:false,errors,warnings,zones};
  if(!p?.ok)return {ok:false,errors:['Resolve the sweater calculations before validating colorwork.'],warnings,zones};
  for(const z of design.zones){
    const result={id:z.id,placement:z.placement,type:z.type,ok:true,errors:[]};
    if(z.type==='chart'){
      const c=z.chart,limited=chartLimitation(z.placement);
      if(limited)result.errors.push(limited);
      else {
        let window;
        if(z.placement==='body')window={startRound:2,endRound:p.bodyPlain,stitchCount:p.bodyStitches};
        else {
          const candidates=stableSleeveWindows(p).filter(w=>w.endRound-w.startRound+1>=c.height);
          window=candidates.find(w=>c.repeatHorizontal?w.stitchCount%c.width===0:w.stitchCount>=c.width)||candidates[0];
          if(!window){const max=Math.max(0,...stableSleeveWindows(p).map(w=>w.endRound-w.startRound+1));result.errors.push(`No straight sleeve section has ${c.height} uninterrupted rounds. The longest has ${max}. Reduce chart height; decreases will not be moved automatically.`);}
        }
        if(window){
          Object.assign(result,window,{endRound:window.startRound+c.height-1,availableRows:window.endRound-window.startRound+1});
          if(result.endRound>window.endRound)result.errors.push(`This chart needs ${c.height} rows; only ${result.availableRows} stockinette rounds are available before the ribbing.`);
          result.repeat=repeatCompatibility(window.stitchCount,c.width);
          if(c.repeatHorizontal&&!result.repeat.compatible)result.errors.push(`${window.stitchCount} stitches ÷ ${c.width}-stitch repeat = ${result.repeat.repeats} repeats + ${result.repeat.remainder} stitches. The chart is not stretched or cropped.`);
          if(!c.repeatHorizontal&&c.width>window.stitchCount)result.errors.push(`The ${c.width}-stitch motif is wider than the ${window.stitchCount}-stitch section.`);
          const centre = z.placement==='body'&&p.neckline.isV ? 0 : Math.floor(window.stitchCount/2);
          result.offset=c.repeatHorizontal?0:(centre-Math.floor(c.width/2)+window.stitchCount)%window.stitchCount;
        }
      }
      if(new Set(c.cells.flat()).size>1)warnings.push(`${PLACEMENTS[z.placement].label}: swatch stranded fabric separately and manage floats; colorwork can change gauge and yarn use.`);
    }
    result.ok=!result.errors.length;
    errors.push(...result.errors.map(t=>`${PLACEMENTS[z.placement].label}: ${t}`));zones.push(result);
  }
  return {ok:!errors.length,errors,warnings,zones};
}
