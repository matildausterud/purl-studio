import { NECKLINES } from '../engine/necklines.js';

/** Original fashion-flat thumbnails: presentation only, no stitch calculations. */
export function necklineThumbnail(key) {
  const wide = key === 'wideCrew' || key === 'boat';
  const left = wide ? 23 : 32, right = 100 - left;
  const curve = key === 'v' ? `L50 53L${right} 25`
    : `Q50 ${key === 'boat' ? 31 : key === 'wideCrew' ? 49 : 45} ${right} 25`;
  const collar = key === 'mock' || key === 'turtle';
  const height = key === 'turtle' ? 23 : 13;
  const collarShape = `M${left} 25V${25-height}Q50 ${29-height} ${right} ${25-height}V25Q50 38 ${left} 25Z`;
  return `<svg viewBox="0 0 100 76" aria-hidden="true" focusable="false"><path class="thumb-fabric" d="M${left} 25${curve}L82 34L96 60L80 67L70 49V73H30V49L20 67L4 60L18 34Z"/><path class="thumb-seam" d="M${left} 27L30 49M${right} 27L70 49"/>
    ${collar ? `<path class="thumb-collar" d="${collarShape}"/><path class="thumb-rib" d="M36 24V${27-height}M42 27V${29-height}M48 29V${30-height}M54 29V${30-height}M60 27V${29-height}M66 25V${27-height}"/>${key === 'turtle' ? '<path class="thumb-seam" d="M32 18Q50 25 68 18"/>' : ''}` : `<path class="thumb-edge" d="M${left} 25${curve}"/>`}
  </svg>`;
}

export function necklineGeometry(design, f, cx, top, scale) {
  const key = design.neckline;
  const halfWidth = (f.neckWidth ?? f.neck / 2) / 2 * scale;
  const depth = key === 'v' ? f.vDepth * scale : key === 'boat' ? 8 : key === 'wideCrew' ? 35 : 27;
  const edge = key === 'v' ? `L${cx} ${top+depth}L${cx+halfWidth} ${top}` : `Q${cx} ${top+depth} ${cx+halfWidth} ${top}`;
  const necklinePath = `M${cx-halfWidth} ${top}${edge}`;
  const standing = key === 'mock' || key === 'turtle';
  const collarHeight = standing ? f.neckband * scale / (key === 'turtle' ? 2 : 1) : 0;
  const collarPath = `M${cx-halfWidth} ${top+2}V${top-collarHeight}Q${cx} ${top-collarHeight+8} ${cx+halfWidth} ${top-collarHeight}V${top+2}Q${cx} ${top+23} ${cx-halfWidth} ${top+2}Z`;
  return { label: NECKLINES[key]?.label ?? 'Crew neck', halfWidth, edge, necklinePath, standing, collarPath, collarHeight };
}
