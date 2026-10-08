/** Gauge changes only the visual stitch proportions, never the underlying grid. */
export function swatchSVG(chart,{across=3,up=3,stitchGauge=20,rowGauge=28,direction='top-down',grid=false}={}) {
 const w=18,h=w*stitchGauge/rowGauge,tw=w*chart.width,th=h*chart.height;
 const tiles=chart.cells.flatMap((row,r)=>row.map((ink,c)=>{
   const x=(chart.width-1-c)*w,y=(direction==='top-down'?r:chart.height-1-r)*h,color=chart.palette[ink];
   return grid?`<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" stroke="#fff8" stroke-width=".5"/>`:`<g transform="translate(${x},${y+(direction==='top-down'?h:0)}) scale(1,${direction==='top-down'?-1:1})"><rect width="${w}" height="${h}" fill="${color}"/><path d="M2 1Q2 ${h*.55} 8 ${h-1}M16 1Q16 ${h*.55} 10 ${h-1}" fill="none" stroke="#000" stroke-opacity=".18" stroke-width="6" stroke-linecap="round"/><path d="M3 1Q3 ${h*.5} 8 ${h-2}M15 1Q15 ${h*.5} 10 ${h-2}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"/><path d="M4 1Q4 ${h*.5} 8 ${h-3}M14 1Q14 ${h*.5} 10 ${h-3}" fill="none" stroke="#fff" stroke-opacity=".22" stroke-width="1"/></g>`;
 })).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tw*across} ${th*up}" role="img" aria-label="${chart.width*across} stitch by ${chart.height*up} row knitted swatch"><defs><pattern id="swatch-tile" width="${tw}" height="${th}" patternUnits="userSpaceOnUse">${tiles}</pattern></defs><rect width="100%" height="100%" fill="url(#swatch-tile)"/></svg>`;
}
