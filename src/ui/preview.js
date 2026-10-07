import { colorOverlay } from './color-preview.js';
import { zoneForSection } from '../colorwork/engine.js';
import { necklineGeometry } from './neckline-preview.js';
/** SVG is a presentation-only projection of finished measurements, never stitch math. */
export function sweaterSVG(design, measurements, compact = false, colorDesign = null, ledger = null) {
  design = { ...design, ...Object.fromEntries(['bodyLength','sleeveLength','neckband','hem','cuff'].map(key => [key, Number.isFinite(design[key]) ? design[key] : {bodyLength:56,sleeveLength:44,neckband:3,hem:5,cuff:5}[key]])) };
  const f = measurements ?? { bust: 106, bodyLength: design.bodyLength, sleeveLength: design.sleeveLength, upperArm: design.sleeve === 'wide' ? 46 : 38, cuff: design.sleeve === 'wide' ? 28 : 22, yoke: 24, neck: 40, neckband: design.neckband, hem: design.hem, cuffLength: design.cuff };
  const scale = 3.3, cx = 300, top = 88, half = f.bust / 4 * scale;
  const ng = necklineGeometry(design, f, cx, top, scale);
  const neck = ng.halfWidth, armY = top + f.yoke * scale, bottom = top + f.bodyLength * scale;
  const shoulderX = half * 0.9, armWidth = f.upperArm / 2 * scale;
  const drop = f.sleeveLength * scale * 0.82, reach = f.sleeveLength * scale * 0.55;
  const cuffX = cx + half + reach, cuffY = armY + drop, cuffW = f.cuff / 2 * scale;
  const shape = `M ${cx-neck} ${top} ${ng.edge} L ${cx+shoulderX} ${top+18} L ${cuffX+armWidth/3} ${cuffY-cuffW/2} L ${cuffX-armWidth/3} ${cuffY+cuffW/2} L ${cx+half} ${armY} L ${cx+half} ${bottom} Q ${cx} ${bottom+5} ${cx-half} ${bottom} L ${cx-half} ${armY} L ${2*cx-cuffX+armWidth/3} ${cuffY+cuffW/2} L ${2*cx-cuffX-armWidth/3} ${cuffY-cuffW/2} L ${cx-shoulderX} ${top+18} Z`;
  const height = Math.max(410, bottom + 72, cuffY + 70);
  const id = compact ? 'mini' : 'main';
  const collarZone = colorDesign ? zoneForSection(colorDesign,'neckband') : null;
  const collarColor = collarZone?.color || collarZone?.stripes?.[0]?.color || colorDesign?.baseColor || design.color;
  const overlay = colorOverlay(colorDesign,ledger,{cx,half,top,armY,bottom,shoulderX,cuffX,cuffY,cuffW,armWidth,scale});
  const stripeHeight=scale*10/design.rowGauge;
  let stripeY=0;
  const collarStripes=collarZone?.type==='stripes' ? `<pattern id="collar-color-${id}" width="600" height="${collarZone.stripes.reduce((n,s)=>n+s.rows,0)*stripeHeight}" patternUnits="userSpaceOnUse" y="${top-(ng.collarHeight||0)}">${collarZone.stripes.map(s=>{const y=stripeY;stripeY+=s.rows*stripeHeight;return `<rect x="0" y="${y}" width="600" height="${s.rows*stripeHeight}" fill="${s.color}"/>`;}).join('')}</pattern>` : '';
  const collarPaint=collarStripes?`url(#collar-color-${id})`:collarColor;
  return `<svg viewBox="0 0 600 ${height}" role="img" aria-label="${ng.label}, ${design.fit} raglan sweater, ${f.bust.toFixed(1)} centimetre bust, ${f.bodyLength.toFixed(1)} centimetre body length" xmlns="http://www.w3.org/2000/svg">
    <defs>${collarStripes}<pattern id="stitch-${id}" width="7" height="9" patternUnits="userSpaceOnUse"><path d="M1 1l2.5 5L6 1" fill="none" stroke="#fff" stroke-opacity=".17" stroke-width=".8"/></pattern><pattern id="rib-${id}" width="${design.rib === '2x2' ? 8 : 5}" height="5" patternUnits="userSpaceOnUse"><path d="M1 0v5M3 0v5" stroke="#233c31" stroke-opacity=".25" stroke-width="1"/></pattern><clipPath id="sweater-${id}"><path d="${shape}"/></clipPath></defs>
    <g stroke="#667367" stroke-width="1.1" stroke-linejoin="round"><path d="${shape}" fill="${design.color}"/><g clip-path="url(#sweater-${id})">${overlay}</g><path d="${shape}" fill="url(#stitch-${id})" stroke="none"/>
    <g clip-path="url(#sweater-${id})"><rect x="${cx-half-1}" y="${bottom-f.hem*scale}" width="${2*half+2}" height="${f.hem*scale+8}" fill="url(#rib-${id})"/>${ng.standing ? '' : `<path d="${ng.necklinePath}" stroke="${collarPaint}" stroke-width="${f.neckband*scale*2+2}" fill="none"/><path d="${ng.necklinePath}" stroke="#405c49" stroke-opacity=".4" stroke-width="${Math.max(4,f.neckband*scale*2)}" stroke-dasharray="1 3" fill="none"/>`}
    <path d="M${cuffX+armWidth/3} ${cuffY-cuffW/2}L${cuffX-armWidth/3} ${cuffY+cuffW/2}M${2*cx-cuffX-armWidth/3} ${cuffY-cuffW/2}L${2*cx-cuffX+armWidth/3} ${cuffY+cuffW/2}" stroke="#405c49" stroke-opacity=".25" stroke-width="${f.cuffLength*scale*2}" stroke-dasharray="2 3"/></g>
    <path d="M${cx-neck-4} ${top+11}L${cx-half} ${armY}M${cx+neck+4} ${top+11}L${cx+half} ${armY}" fill="none" stroke="#4e6856" stroke-opacity=".65" stroke-dasharray="2 3"/>
    <path d="M${cx-half} ${bottom-f.hem*scale}H${cx+half}" stroke-opacity=".3"/>${ng.standing ? `<path d="${ng.collarPath}" fill="${collarPaint}"/><path d="${ng.collarPath}" fill="url(#rib-${id})"/>${design.neckline === 'turtle' ? `<path d="M${cx-neck} ${top-ng.collarHeight*.45}Q${cx} ${top-ng.collarHeight*.45+10} ${cx+neck} ${top-ng.collarHeight*.45}" fill="none" stroke-opacity=".5"/>` : ''}` : ''}</g>
    ${compact ? '' : `<g fill="#687266" font-family="Arial,sans-serif" font-size="10" letter-spacing="1"><path d="M${cx-half} ${bottom+25}v10m0-5h${half*2}m0-5v10" fill="none" stroke="#8f978a"/><text x="300" y="${bottom+49}" text-anchor="middle">${(f.bust/2).toFixed(1)} CM · FLAT WIDTH</text><text x="300" y="37" text-anchor="middle">FRONT VIEW / TOP-DOWN RAGLAN</text></g>`}
  </svg>`;
}
