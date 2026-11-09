let assetCounter=0;
const ROOT='./src/workspace/assets/';
export const ASSETS={
 checkerSweater:{file:'workspace',width:1940,height:1282,crop:[798,221,900,851]},
 yarnPeach:{file:'workspace',width:1940,height:1282,crop:[93,864,130,114]},
 yarnRed:{file:'workspace',width:1940,height:1282,crop:[93,1004,130,115]},
 checker:{file:'swatches',width:3040,height:2118,crop:[514,201,535,565]},
 dots:{file:'swatches',width:3040,height:2118,crop:[2035,201,548,565]},
 stripes:{file:'swatches',width:3040,height:2118,crop:[514,1288,535,545]},
 solid:{file:'swatches',width:3040,height:2118,crop:[2035,1288,548,545]},
};
// Assets are user-approved visual references. Cropping is done by the SVG viewport;
// original images are kept intact, not flattened into interface screenshots.
for(const construction of ['raglan','set-in'])for(const [col,neckline] of ['round','boat','turtle'].entries())for(const [row,sleeve] of ['standard','short'].entries()){
 const isSet=construction==='set-in';
 ASSETS[`${construction}-classic-${neckline}-${sleeve}`]={file:isSet?'setin':'raglan',width:isSet?4000:3960,height:isSet?1788:1770,crop:isSet?[[[405,218,330,460],[1788,218,330,460],[3095,218,330,460]],[[400,1100,325,450],[1780,1094,330,450],[3088,1094,330,450]]][row][col]:[[[401,209,325,449],[1729,185,325,455],[3070,185,325,455]],[[393,1079,325,450],[1729,1079,325,450],[3070,1095,325,450]]][row][col]};
}
export function assetSVG(asset,label,extra=''){
 const a=typeof asset==='string'?ASSETS[asset]:asset;if(!a)return '';
 const [x,y,w,h]=a.crop;const clip=`asset-clip-${++assetCounter}`;
 return `<svg class="photo-asset ${extra}" viewBox="${x} ${y} ${w} ${h}" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid meet"><defs><clipPath id="${clip}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image clip-path="url(#${clip})" href="${ROOT}${a.file}.png" x="0" y="0" width="${a.width}" height="${a.height}"/></svg>`;
}
export function sweaterAsset(s){const exact=`${s.construction}-${s.fit}-${s.neckline}-${s.sleeveLength}`;const fallback=`${s.construction}-classic-${s.neckline}-${s.sleeveLength==='short'?'short':'standard'}`;return {key:ASSETS[exact]?exact:fallback,exact:Boolean(ASSETS[exact])};}
export function approvedChecker(d){const s=d.sweater,p=d.pattern;return s.construction==='raglan'&&s.fit==='classic'&&s.neckline==='round'&&s.sleeveLength==='standard'&&p.type==='checker'&&p.checker.width===8&&p.checker.height===8&&referenceColors(p);}
export const referenceColors=p=>p.colors[0].hex.toLowerCase()==='#e8aa86'&&p.colors[1].hex.toLowerCase()==='#a93226';
export function approvedSwatch(d){const p=d.pattern;return referenceColors(p)&&(p.type==='solid'||p.type==='checker'&&p.checker.width===8&&p.checker.height===8||p.type==='dots'&&p.dots.size==='medium'&&p.dots.spacing===8||p.type==='stripes'&&p.stripes.size===6&&p.stripes.direction==='horizontal');}
export function detailAsset(s,kind,value){return {file:'raglan',width:3960,height:1770,crop:kind==='neck'?[770+(['round','boat','turtle'].indexOf(value)*105),382,76,62]:[770+(['standard','short','long'].indexOf(value)*105),540,76,64]};}
