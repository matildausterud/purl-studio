import { stripeSequence, zoneForSection, validateColorwork } from '../colorwork/engine.js';
/** Projection only: section row/stitch counts come from the validated knitting ledger. */
export function colorOverlay(d,p,g) {
 if(!d||!p?.ok)return '';
 const {cx,half,top,armY,bottom,shoulderX,cuffX,cuffY,cuffW,armWidth,scale}=g;
 const v=validateColorwork(d,p),base=d.baseColor;
 const lerp=(a,b,t)=>a.map((x,i)=>x+(b[i]-x)*t);
 const poly=(a,b,c,e,color)=>`<path d="M${a}L${b}L${c}L${e}Z" fill="${color}" stroke="none"/>`;
 const rectangle=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
 function paint(placement,quad,rows,stitches,centre){
   const z=zoneForSection(d,placement),[a,b,c,e]=quad;
   const band=(r1,r2,color,x1=0,x2=1)=>{const l=lerp(a,e,r1),r=lerp(b,c,r1),l2=lerp(a,e,r2),r2p=lerp(b,c,r2);return poly(lerp(l,r,x1),lerp(l,r,x2),lerp(l2,r2p,x2),lerp(l2,r2p,x1),color);};
   let svg=band(0,1,z&&['solid','block'].includes(z.type)?z.color:base);
   if(z?.type==='stripes')svg+=stripeSequence(z.stripes,rows).map((color,i)=>band(i/rows,(i+1)/rows,color)).join('');
   if(z?.type==='chart'){
     const info=v.zones.find(x=>x.id===z.id),chart=z.chart;
     if(!info?.stitchCount)return svg;
     const visible=info.stitchCount/2,start=centre==='front'&&p.neckline.isV?-visible/2:info.stitchCount/2-visible/2;
     for(let row=0;row<chart.height;row++)for(let j=0;j<Math.ceil(visible);j++){
       const stitch=((Math.floor(start+j)%info.stitchCount)+info.stitchCount)%info.stitchCount;
       const col=chart.repeatHorizontal?stitch%chart.width:(stitch-info.offset+info.stitchCount)%info.stitchCount;
       if(col>=chart.width)continue;
       svg+=band((info.startRound-1+row)/rows,(info.startRound+row)/rows,chart.palette[chart.cells[row][col]],j/visible,Math.min(1,(j+1)/visible));
     }
   }
   return svg;
 }
 let svg=paint('yoke',rectangle(0,top,600,armY-top),p.yokeRounds,null);
 svg+=paint('body',rectangle(cx-half,armY,half*2,bottom-p.finished.hem*scale-armY),p.bodyPlain,p.bodyStitches,'front');
 svg+=paint('hem',rectangle(cx-half,bottom-p.finished.hem*scale,half*2,p.finished.hem*scale+6),p.hemRounds,p.bodyStitches);
 const outside=[cuffX+armWidth/3,cuffY-cuffW/2],inside=[cuffX-armWidth/3,cuffY+cuffW/2];
 const startOuter=lerp([cx+shoulderX,top+18],outside,.28),startInner=[cx+half,armY];
 const fraction=p.sleevePlain/p.sleeveTotal,endOuter=lerp(startOuter,outside,fraction),endInner=lerp(startInner,inside,fraction);
 for(const mirror of [false,true]){
   const q=points=>points.map(([x,y])=>[mirror?2*cx-x:x,y]);
   svg+=paint('sleeves',q([startInner,startOuter,endOuter,endInner]),p.sleevePlain,p.upperArmStitches,'sleeve');
   svg+=paint('cuffs',q([endInner,endOuter,outside,inside]),p.cuffRounds,p.cuffStitches);
 }
 return svg;
}
