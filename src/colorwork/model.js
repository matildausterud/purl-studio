export const COLOR_VERSION = 1;
export const PLACEMENTS = Object.freeze({
  entire: { label: 'Entire sweater', note: 'Default for every section; local zones override it.' },
  yoke: { label: 'Yoke', note: 'The shaped yoke, below the collar and above the underarms.' },
  body: { label: 'Body', note: 'Stockinette below the underarms, before the hem.' },
  hem: { label: 'Lower body / hem', note: 'The ribbed hem at the bottom of the body.' },
  sleeves: { label: 'Sleeves', note: 'Both sleeves, from underarm to cuff.' },
  cuffs: { label: 'Cuffs', note: 'The ribbed cuff on each sleeve.' },
});
export const TYPES = ['solid', 'block', 'stripes', 'chart'];
export const HEX = /^#[0-9a-f]{6}$/i;
export const colorName = index => `Color ${String.fromCharCode(65 + index)}`;

export function createColorDesign(baseColor = '#9faaa0') {
  return { version: COLOR_VERSION, baseColor, palette: [
    { name: 'Base', hex: baseColor }, { name: 'Forest', hex: '#315744' },
    { name: 'Cream', hex: '#f1ebdd' }, { name: 'Clay', hex: '#b87663' },
  ], zones: [] };
}

export function createChart(palette, width = 4, height = 6) {
  return { width, height, palette: palette.map(c => c.hex), cells: Array.from({ length: height }, () => Array(width).fill(0)), repeatHorizontal: true };
}

/** Cells are indexed [row from bottom][stitch from right], both zero-based. */
export function resizeChart(chart, width, height) {
  if (![width, height].every(n => Number.isInteger(n) && n >= 1 && n <= 32)) throw new RangeError('Charts support 1–32 stitches and rows.');
  return { ...chart, width, height, cells: Array.from({length:height},(_,r)=>Array.from({length:width},(_,c)=>chart.cells[r]?.[c] ?? 0)) };
}

/** Four-neighbour fill; editor operation only. Never touches garment counts. */
export function paintChart(chart, row, column, color, fill = false) {
  if (!Number.isInteger(row) || !Number.isInteger(column) || row < 0 || row >= chart.height || column < 0 || column >= chart.width || !Number.isInteger(color) || color < 0 || color >= chart.palette.length) return chart;
  const cells = chart.cells.map(r => [...r]), original = cells[row][column];
  if (original === color) return chart;
  const todo = [[row,column]];
  while(todo.length) {
    const [r,c]=todo.pop();
    if(r<0||r>=chart.height||c<0||c>=chart.width||cells[r][c]!==original)continue;
    cells[r][c]=color;
    if(fill)todo.push([r-1,c],[r+1,c],[r,c-1],[r,c+1]);
  }
  return {...chart,cells};
}

/** Palette edits preserve numeric cell references and recolour all matching uses. */
export function recolorPalette(design, index, hex) {
  if(!HEX.test(hex) || !design.palette[index]) return design;
  const old=design.palette[index].hex;
  return {...design, baseColor:index===0?hex:design.baseColor,
    palette:design.palette.map((c,i)=>i===index?{...c,hex}:c),
    zones:design.zones.map(z=>({...z,
      ...(z.color===old?{color:hex}:{}),
      ...(z.stripes?{stripes:z.stripes.map(s=>s.color===old?{...s,color:hex}:s)}:{}),
      ...(z.chart?{chart:{...z.chart,palette:z.chart.palette.map((c,i)=>i===index?hex:c)}}:{}),
    })),
  };
}

export function chartLimitation(placement) {
  if(placement==='body'||placement==='sleeves')return '';
  if(placement==='yoke'||placement==='entire')return 'Repeating stitch charts across raglan increases are not yet supported because the number of stitches changes throughout the yoke. Use stripes or color blocks here.';
  return 'Stitch charts currently use stockinette only. Ribbed hems and cuffs support solid colors, color blocks and stripes.';
}

export function validateColorData(d) {
  const errors=[], add=t=>errors.push(t);
  if(!d||d.version!==COLOR_VERSION||!HEX.test(d.baseColor)) return ['Invalid color design version or base color.'];
  if(!Array.isArray(d.palette)||d.palette.length<1||d.palette.length>12||d.palette.some(c=>!c||!HEX.test(c.hex)||typeof c.name!=='string'||c.name.length>40))return ['Use 1–12 named colors with six-digit HEX values.'];
  if(d.palette[0].hex.toLowerCase()!==d.baseColor.toLowerCase())add('The first palette color must match the base color.');
  if(!Array.isArray(d.zones)||d.zones.length>6)return ['Use at most six garment zones.'];
  const ids=new Set(), placements=new Set();
  for(const z of d.zones){
    if(!z||typeof z.id!=='string'||!/^[a-z0-9-]{1,60}$/i.test(z.id)||ids.has(z.id)||!Object.hasOwn(PLACEMENTS,z.placement)||placements.has(z.placement)||!TYPES.includes(z.type)){add('Each zone needs a unique ID, unique supported placement and a supported pattern type.');continue;}
    ids.add(z.id);placements.add(z.placement);
    if(['solid','block'].includes(z.type)&&!HEX.test(z.color))add('Choose a valid zone color.');
    if(z.type==='stripes'&&(!Array.isArray(z.stripes)||!z.stripes.length||z.stripes.length>8||z.stripes.some(s=>!HEX.test(s?.color)||!Number.isInteger(s.rows)||s.rows<1||s.rows>64)))add('Stripes need 1–8 colors, each 1–64 whole rows wide.');
    if(z.type==='chart'){
      const c=z.chart;
      if(!c||![c.width,c.height].every(n=>Number.isInteger(n)&&n>=1&&n<=32)||!Array.isArray(c.palette)||c.palette.length!==d.palette.length||c.palette.some((hex,i)=>hex!==d.palette[i].hex)||typeof c.repeatHorizontal!=='boolean'||!Array.isArray(c.cells)||c.cells.length!==c.height||c.cells.some(row=>!Array.isArray(row)||row.length!==c.width||row.some(n=>!Number.isInteger(n)||n<0||n>=c.palette.length)))add('The chart must be a complete 1–32 stitch × 1–32 row grid with valid palette references.');
    }
  }
  return errors;
}

export function serializeColorDesign(design) {
  const errors=validateColorData(design);if(errors.length)throw new Error(errors.join(' '));
  return JSON.stringify(design);
}
export function parseColorDesign(text) {
  if(typeof text!=='string'||text.length>200000)throw new Error('Color design is too large.');
  const d=JSON.parse(text);const errors=validateColorData(d);if(errors.length)throw new Error(errors.join(' '));
  return d;
}

/** Tile the existing motif along one axis; retain palette and repeat settings. */
export function duplicateChart(chart, axis) {
  if (!['width', 'height'].includes(axis)) throw new RangeError('Choose width or height.');
  const width = chart.width * (axis === 'width' ? 2 : 1);
  const height = chart.height * (axis === 'height' ? 2 : 1);
  if (width > 32 || height > 32) throw new RangeError('Duplicating would exceed the 32 × 32 chart limit.');
  return {...chart, width, height, cells: Array.from({length:height}, (_,r) =>
    Array.from({length:width}, (_,c) => chart.cells[r % chart.height][c % chart.width]))};
}
