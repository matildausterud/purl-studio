// Product names identify examples. All shades, codes and texture settings are demo data.
const shades = [
  ['Oat milk', '#D6CBB8'], ['Sage leaf', '#83917C'], ['Moss', '#4F624D'],
  ['Rose clay', '#BB8C87'], ['Ochre', '#B8904E'], ['Ink blue', '#495C73'],
  ['Soft chalk', '#EEE7DB'], ['Aubergine', '#745668'], ['Terracotta', '#AC6952'],
  ['Charcoal', '#454640'], ['Mist blue', '#A4B9BE'], ['Cocoa', '#827064'],
];
function yarn(id, brand, name, material, texture, offset = 0) {
  return { id, brand, name, material, texture, demo: true,
    characteristics: { fuzz: texture === 'halo' ? 0.85 : 0.12, thickness: texture === 'halo' ? 0.52 : 1 },
    colors: shades.map(([name, hex], index) => ({ id: `demo-${index + 1}`, name, hex,
      code: `DEMO-${String(index + 1 + offset).padStart(2, '0')}` })) };
}
export const CATALOG = [
  yarn('isager-tvinni', 'Isager', 'Tvinni', 'Wool · demo profile', 'smooth'),
  yarn('isager-silk-mohair', 'Isager', 'Silk Mohair', 'Mohair + silk · demo profile', 'halo', 20),
  yarn('sandnes-sunday', 'Sandnes Garn', 'Sunday', 'Merino wool · demo profile', 'smooth'),
  yarn('sandnes-mohair', 'Sandnes Garn', 'Tynn Silk Mohair', 'Mohair + silk + wool · demo profile', 'halo', 20),
  yarn('olive-merino', 'Knitting for Olive', 'Merino', 'Merino wool · demo profile', 'smooth'),
  yarn('olive-mohair', 'Knitting for Olive', 'Soft Silk Mohair', 'Mohair + silk · demo profile', 'halo', 20),
];
export const BRANDS = [...new Set(CATALOG.map(y => y.brand))];
export const getYarn = id => CATALOG.find(y => y.id === id);
export const getColor = strand => getYarn(strand.yarnId)?.colors.find(c => c.id === strand.colorId);
export function describeStrand(strand) {
  const yarn = getYarn(strand.yarnId), color = getColor(strand);
  return { yarn, color };
}
