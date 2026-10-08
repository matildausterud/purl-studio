import { createChart } from './model.js';
export const MOTIFS = {diamonds:'Diamonds',chevron:'Chevron',stars:'Stars',checks:'Checks',scatter:'Speckles'};
/** Pure, seeded motif generation. All output is an editable stitch grid. */
export function generateMotif({width=12,height=12,style='diamonds',seed=1,density=45},palette) {
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||width>32||height>32||!Object.hasOwn(MOTIFS,style)||!Number.isInteger(seed)||!Number.isFinite(density)||density<10||density>80||palette.length<2)throw new RangeError('Choose a 2–32 stitch/row motif and at least two colors.');
 const c=createChart(palette,width,height);const variant=Math.abs(seed)%3;
 const hash=(x,y)=>{let n=Math.imul(x+1,374761393)^Math.imul(y+1,668265263)^Math.imul(seed,1274126177);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296;};
 c.cells=c.cells.map((row,y)=>row.map((_,x)=>{
   const dx=Math.abs((x+.5)/width*2-1),dy=Math.abs((y+.5)/height*2-1);let ink;
   if(style==='diamonds')ink=variant===0?Math.abs(dx+dy-.85)<.2:variant===1?dx+dy<.9:Math.abs(dx-dy)<.2;
   if(style==='chevron')ink=((y/height+dx*.5+variant*.16)%1)<density/100*.65;
   if(style==='stars')ink=(dx<.19||dy<.19||Math.abs(dx-dy)<.16)&&(dx+dy<1.2+variant*.15);
   if(style==='checks')ink=(Math.floor(x/(2+variant))+Math.floor(y/(2+variant)))%2===0;
   if(style==='scatter')ink=hash(Math.min(x,width-1-x),Math.min(y,height-1-y))<density/100;
   return ink?1:0;
 }));
 if(!c.cells.flat().includes(1))c.cells[0][0]=1;
 if(!c.cells.flat().includes(0))c.cells[height-1][width-1]=0;
 return c;
}
export function tileChart(chart,across=1,up=1) {
 if(![across,up].every(n=>Number.isInteger(n)&&n>=1&&n<=8)||chart.width*across>32||chart.height*up>32)throw new RangeError('The applied chart must fit within 32 × 32 cells.');
 return {...chart,width:chart.width*across,height:chart.height*up,cells:Array.from({length:chart.height*up},(_,r)=>Array.from({length:chart.width*across},(_,c)=>chart.cells[r%chart.height][c%chart.width]))};
}
