// Small manufacturer-verified catalog; image rights are kept separate from product facts.
// Checked 2026-11-09. Display HEX values are illustrative, never official shade measurements.
const source='https://isagerstrik.dk/en/product/';
const shadeHex={'27s':'#dfa482','32':'#a83a2d','O':'#e7dfcc','4':'#706456','16':'#9b8366','30':'#a99d93','100':'#342f2b','101':'#ede7dd','27':'#d3a187','2':'#b9aa96'};
export const QUALITIES=[
 {id:'tvinni',manufacturer:'Isager',name:'Tvinni',material:'100% ull',thickness:'Fingering · 2-trådigt',meterage:'255 m / 50 g',source:source+'tvinni/',colors:['27s','32','O','4','16','30','100','101']},
 {id:'silk-mohair',manufacturer:'Isager',name:'Silk Mohair',material:'75% mohair, 25% silke',thickness:'Fingering · tunn följetråd',meterage:'212 m / 25 g',source:source+'silk-mohair/',colors:['32','27','O','4','16','30','100','101']},
];
export const YARNS=QUALITIES.flatMap(q=>q.colors.map(code=>({id:`${q.id}-${code}`,qualityId:q.id,manufacturer:q.manufacturer,quality:q.name,code,officialColorName:null,material:q.material,thickness:q.thickness,meterage:q.meterage,displayColor:shadeHex[code],source:q.source,verifiedAt:'2026-11-09',authenticImage:null,imageSource:null,imageLicense:'Ingen återanvändningslicens verifierad. Produktfoto saknas.',referenceTexture:q.id==='tvinni'&&code==='27s'?'peach':q.id==='silk-mohair'&&code==='32'?'red':null})));
export const getYarn=id=>YARNS.find(y=>y.id===id);
export function filterYarns({search='',quality='all',color='all',sort='brand'}={}){
 const result=YARNS.filter(y=>(quality==='all'||y.qualityId===quality)&&(`${y.manufacturer} ${y.quality} ${y.code} ${y.material}`.toLowerCase().includes(search.toLowerCase().trim()))&&(color==='all'||(color==='reference'?Boolean(y.referenceTexture):!y.referenceTexture)));
 return result.sort((a,b)=>sort==='color'?a.displayColor.localeCompare(b.displayColor):`${a.quality} ${a.code}`.localeCompare(`${b.quality} ${b.code}`,undefined,{numeric:true}));
}
