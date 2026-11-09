import {getYarn} from './catalog.js';
export const DRAFT_KEY='purl-workspace-draft-v1',SAVED_KEY='purl-workspace-saved-v1';
export const CONSTRUCTIONS=['raglan','set-in'],FITS=['classic','straight','oversized'],NECKS=['round','boat','turtle'],SLEEVES=['standard','short','long'],PATTERNS=['solid','stripes','checker','dots','diamonds'];
export const labels={raglan:'Raglan','set-in':'Set-in',classic:'Klassisk',straight:'Rak',oversized:'Oversized',round:'Rund',boat:'Båt',turtle:'Polokrage',standard:'Standard',short:'Kort',long:'Lång',solid:'Solid',stripes:'Stripes',checker:'Checker',dots:'Dots',diamonds:'Diamonds'};
export function createDesign(){return {version:1,id:null,name:'My first design',sweater:{construction:'raglan',fit:'classic',neckline:'round',sleeveLength:'standard'},pattern:{type:'checker',checker:{width:8,height:8},stripes:{direction:'horizontal',size:6},dots:{size:'medium',spacing:8},diamonds:{size:8},colors:[{id:'A',hex:'#E8AA86',yarnIds:[]},{id:'B',hex:'#A93226',yarnIds:[]}]},material:{strands:[{id:'strand-1',yarnId:'tvinni-27s'},{id:'strand-2',yarnId:'silk-mohair-32'}]},swatch:{size:10,showPattern:true,showStitches:false,showMeasurements:false,gauge:{stitches:19,rows:27,source:'estimated'}},view:'sweater'};}
export function validDesign(d){
 const s=d?.sweater,p=d?.pattern,w=d?.swatch;
 return d?.version===1&&typeof d.name==='string'&&d.name.length<=80&&(d.id===null||typeof d.id==='string')&&s&&CONSTRUCTIONS.includes(s.construction)&&FITS.includes(s.fit)&&NECKS.includes(s.neckline)&&SLEEVES.includes(s.sleeveLength)&&PATTERNS.includes(p?.type)
 &&[p.checker?.width,p.checker?.height,p.stripes?.size,p.diamonds?.size].every(n=>Number.isInteger(n)&&n>=2&&n<=16)
 &&['horizontal','vertical'].includes(p.stripes.direction)&&['small','medium','large'].includes(p.dots?.size)&&Number.isInteger(p.dots.spacing)&&p.dots.spacing>=4&&p.dots.spacing<=16
 &&Array.isArray(p.colors)&&p.colors.length===2&&p.colors.every(c=>/^#[a-f0-9]{6}$/i.test(c.hex)&&Array.isArray(c.yarnIds)&&c.yarnIds.every(id=>getYarn(id)))
 &&Array.isArray(d.material?.strands)&&d.material.strands.length>=1&&d.material.strands.length<=4&&d.material.strands.every(s=>typeof s.id==='string'&&getYarn(s.yarnId))&&new Set(d.material.strands.map(s=>s.id)).size===d.material.strands.length
 &&w&&[10,15].includes(w.size)&&['showPattern','showStitches','showMeasurements'].every(k=>typeof w[k]==='boolean')&&w.gauge?.stitches===19&&w.gauge?.rows===27&&w.gauge?.source==='estimated'&&['sweater','swatch'].includes(d.view);
}
export function readDraft(storage){const raw=storage.getItem(DRAFT_KEY);if(!raw)return createDesign();const value=JSON.parse(raw);if(!validDesign(value))throw new Error('Det sparade utkastet kan inte läsas. Originalet har lämnats orört.');return value;}
export function readSaved(storage){const data=JSON.parse(storage.getItem(SAVED_KEY)||'[]');if(!Array.isArray(data)||data.some(d=>!validDesign(d)||!d.id)||new Set(data.map(d=>d.id)).size!==data.length)throw new Error('Sparade designer kan inte läsas. Originalen har lämnats orörda.');return data;}
export function saveDraft(storage,d){if(!validDesign(d))throw new Error('Ogiltig design.');storage.setItem(DRAFT_KEY,JSON.stringify(d));}
export function saveDesign(storage,d,{copy=false,id=crypto.randomUUID()}={}){if(!validDesign(d))throw new Error('Ogiltig design.');const list=readSaved(storage),next={...structuredClone(d),id:copy||!d.id?id:d.id};const pos=list.findIndex(x=>x.id===next.id);if(pos<0)list.unshift(next);else list[pos]=next;storage.setItem(SAVED_KEY,JSON.stringify(list));return next;}
export function deleteDesign(storage,id){const next=readSaved(storage).filter(d=>d.id!==id);storage.setItem(SAVED_KEY,JSON.stringify(next));return next;}
export function setPattern(d,type){if(!PATTERNS.includes(type))return d;return {...d,pattern:{...d.pattern,type}};}
export function setYarn(d,index,yarnId){if(!getYarn(yarnId)||index<0||index>d.material.strands.length||index>=4)return d;const next=structuredClone(d);if(index===next.material.strands.length)next.material.strands.push({id:crypto.randomUUID(),yarnId});else next.material.strands[index].yarnId=yarnId;return next;}
// Intentional Phase 2 boundaries: display state never asserts knit instructions for Set-in.
export const rendererInput=d=>({garment:structuredClone(d.sweater),pattern:structuredClone(d.pattern),material:structuredClone(d.material),gauge:structuredClone(d.swatch.gauge)});
