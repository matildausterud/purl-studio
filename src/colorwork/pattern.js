import { sectionPlan, zoneForSection, validateColorwork } from './engine.js';
import { colorName } from './model.js';
export function colorPattern(design,p) {
  const validation=validateColorwork(design,p);
  if(!validation.ok)throw new Error('Resolve colorwork before generating instructions.');
  const colors=design.palette.map(c=>c.hex);
  for(const hex of design.zones.flatMap(z=>[z.color,...(z.stripes||[]).map(s=>s.color)].filter(Boolean)))if(!colors.includes(hex))colors.push(hex);
  const name=hex=>colorName(colors.indexOf(hex));
  const sections=[{title:'Colors',text:colors.map((hex,i)=>`${colorName(i)} — ${design.palette[i]?.name||'Custom'} (${hex})`).join('\n')+'\n\nUse the color directions below alongside the shaping instructions. Color changes never replace an increase, decrease, pickup or rib stitch. Swatch the actual colorwork in the round to confirm the entered gauge. Yarn estimates are not split by color.'}];
  for(const s of sectionPlan(p)){
    const z=zoneForSection(design,s.placement);let text;
    if(!z||['solid','block'].includes(z.type))text=`Work all ${s.rows} ${s.placement==='yoke'&&p.neckline.isV?'rows / rounds':'rounds'} in ${name(z?.color||design.baseColor)}.`;
    if(z?.type==='stripes'){
      const cycle=z.stripes.reduce((a,b)=>a+b.rows,0),full=Math.floor(s.rows/cycle),tail=s.rows%cycle;
      let remaining=tail;const end=z.stripes.flatMap(stripe=>{const n=Math.min(remaining,stripe.rows);remaining-=n;return n?[`${n} in ${name(stripe.color)}`]:[];});
      text=`Starting at section row / round 1, work ${z.stripes.map(a=>`${a.rows} in ${name(a.color)}`).join(', ')}. Repeat this ${cycle}-row sequence ${full} complete time(s)${tail?`, then ${end.join(', ')}`:''}, for exactly ${s.rows} rows / rounds. Restart the sequence at row / round 1 of each section. Keep all shaping and rib texture as written.`;
    }
    if(z?.type==='chart'){
      const v=validation.zones.find(v=>v.id===z.id),c=z.chart;
      text=`Work rounds 1–${v.startRound-1} in ${name(design.baseColor)}. On rounds ${v.startRound}–${v.endRound}, work chart rows 1–${c.height} once, from bottom to top and right to left. There are ${v.stitchCount} stitches throughout this band. `;
      if(c.repeatHorizontal)text+=`Repeat the ${c.width}-stitch chart ${v.repeat.repeats} times around each round (${c.width} × ${v.repeat.repeats} = ${v.stitchCount}).`;
      else if(v.offset+c.width<=v.stitchCount)text+=`Each chart round: work ${v.offset} base-color stitches, then chart stitches 1–${c.width}, then ${v.stitchCount-v.offset-c.width} base-color stitches. The motif is centered on the front / outer sleeve.`;
      else {const split=v.stitchCount-v.offset;text+=`The motif straddles the beginning-of-round marker. On EACH chart round, use that same chart row throughout: first work chart stitches ${split+1}–${c.width}, then ${v.stitchCount-c.width} base-color stitches, then chart stitches 1–${split}. Only then advance the chart row. This centers the motif at the front.`;}
      text+=` After round ${v.endRound}, resume the base color through round ${s.rows}. ${s.placement==='sleeves'?'Work the same band on both sleeves. All scheduled decreases remain outside this chart band.':'Separation round 1 is in the base color.'} See the chart below.`;
    }
    if(s.placement==='yoke')text+=' Work any extra back-neck short rows and their resolution round in the base color; these do not advance the stripe sequence. For a V-neck, read the early stripe sequence as flat rows, then continue in rounds without restarting.';
    sections.push({title:`Color placement · ${s.label}`,text});
  }
  return {sections,colors};
}
export function chartText(z) {
  const c=z.chart;return `${z.placement.toUpperCase()} CHART — ${c.width} stitches × ${c.height} rows\nRead bottom to top; each row right to left. ${c.repeatHorizontal?'Vertical bars mark the horizontal repeat.':'Single motif.'}\n`+c.cells.map((row,r)=>`${String(r+1).padStart(2)} |${[...row].reverse().map(i=>String.fromCharCode(65+i)).join(' ')}|`).reverse().join('\n')+'\n'+c.palette.map((hex,i)=>`${String.fromCharCode(65+i)} = ${hex}`).join(' · ');
}
