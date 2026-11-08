import { DEFAULTS } from '../engine/model.js';
import { createColorDesign, parseColorDesign, recolorPalette } from '../colorwork/model.js';
import { activeStrands, validCombination } from '../yarn/state.js';
import { describeStrand } from '../yarn/catalog.js';
export const KEY='purl-studio-design-v1';
export const MODELS=[
 {id:'classic',name:'Klassisk raglan',note:'Rund hals · normal passform',patch:{construction:'raglan',neckline:'crew',neckband:3,fit:'regular',sleeve:'regular'}},
 {id:'relaxed',name:'Ledig & rymlig',note:'Vid rund hals · oversized',patch:{construction:'raglan',neckline:'wideCrew',neckband:2,fit:'oversized',sleeve:'wide'}},
 {id:'vneck',name:'V-ringad',note:'V-ringning · normal passform',patch:{construction:'raglan',neckline:'v',neckband:2,vDepth:14,fit:'regular',sleeve:'regular'}},
 {id:'turtle',name:'Mjuk polotröja',note:'Vikbar polokrage · normal passform',patch:{construction:'raglan',neckline:'turtle',neckband:18,fit:'regular',sleeve:'regular'}},
];
export function readDesign(storage){
 const raw=storage.getItem(KEY);if(!raw)return {garment:{...DEFAULTS},colorDesign:createColorDesign(DEFAULTS.color)};
 const d=JSON.parse(raw);return {...d,garment:{...DEFAULTS,...d.garment},colorDesign:parseColorDesign(JSON.stringify(d.colorDesign))};
}
export function selectModel(d,id){const m=MODELS.find(m=>m.id===id);if(!m)throw new Error('Välj en tröjmodell.');return {...d,modelId:id,garment:{...d.garment,...m.patch,bustTarget:null,upperArmTarget:null}};}
export function applyYarns(d,mix){
 if(!validCombination(mix))throw new Error('Välj en giltig garnkombination.');
 const strands=activeStrands(mix).map(describeStrand),base=strands[0].color.hex;
 return {...d,yarnCombination:structuredClone(mix),garment:{...d.garment,color:base,yarn:strands.map(({yarn,color})=>`${yarn.brand} ${yarn.name} · ${color.name} (${color.code})`).join(' + ')+' · demonstrationsdata'},colorDesign:recolorPalette(d.colorDesign,0,base)};
}
export function applyPattern(d,kind){
 if(!['solid','stripes','custom'].includes(kind))throw new Error('Välj ett mönsteralternativ.');
 const next=structuredClone(d);next.patternChoice=kind;
 if(kind==='custom'){
  if(next.patternBackup){next.colorDesign=recolorPalette(next.patternBackup,0,d.colorDesign.baseColor);delete next.patternBackup;}
  return next;
 }
 if(!next.patternBackup&&next.colorDesign.zones.length)next.patternBackup=structuredClone(next.colorDesign);
 next.colorDesign={...next.colorDesign,zones:[]};
 if(kind==='stripes')next.colorDesign.zones=[{id:'journey-stripes',placement:'entire',type:'stripes',stripes:[{color:next.colorDesign.baseColor,rows:6},{color:next.colorDesign.palette[2].hex,rows:4}]}];
 return next;
}
export const saveDesign=(storage,d)=>storage.setItem(KEY,JSON.stringify(d));
export function steps(current){return `<nav class="journey-steps" aria-label="Designsteg">${[['./','Tröjmodell'],['./yarn.html','Garnkombination'],['./?step=pattern','Färgmönster']].map(([href,label],i)=>`<a href="${href}" ${current===i?'aria-current="step"':''}><span>0${i+1}</span>${label}</a>`).join('')}</nav>`;}
