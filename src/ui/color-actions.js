import { createChart, resizeChart, paintChart, recolorPalette, HEX } from '../colorwork/model.js';
import { garmentSuggestions } from '../colorwork/adjustments.js';
export function colorAction(event,d,p,state) {
 const el=event.target.closest('button,input,select');if(!el||el.disabled)return null;
 const z=d.zones.find(z=>z.placement===state.placement),a=el.dataset;
 let changed=false,patch=null,download=false;
 const input=event.type==='change'||event.type==='input';
 if(input){
   if(a.palette!==undefined||a.hex!==undefined){if(!HEX.test(el.value)){el.setAttribute('aria-invalid','true');return null;} d=recolorPalette(d,Number(a.palette??a.hex),el.value.toLowerCase());changed=true;}
   if(event.type==='change'&&z){
     if(a.stripeColor!==undefined){z.stripes[Number(a.stripeColor)].color=el.value;changed=true;}
     if(a.stripeRows!==undefined){const n=Number(el.value);if(Number.isInteger(n)&&n>=1&&n<=64)z.stripes[Number(a.stripeRows)].rows=n;changed=true;}
     if(a.chartSize!==undefined){const n=Number(el.value);if(Number.isInteger(n)&&n>=1&&n<=32)z.chart=resizeChart(z.chart,a.chartSize==='width'?n:z.chart.width,a.chartSize==='height'?n:z.chart.height);changed=true;}
     if(a.repeat!==undefined){z.chart.repeatHorizontal=el.checked;changed=true;}
   }
 } else if(event.type==='click'){
   if(a.zone){state.placement=a.zone;changed=true;}
   if(a.patternType&&z?.type!==a.patternType){const next={id:`zone-${state.placement}`,placement:state.placement,type:a.patternType};if(['solid','block'].includes(next.type))next.color=d.baseColor;if(next.type==='stripes')next.stripes=[{color:d.baseColor,rows:6},{color:d.palette[1]?.hex||d.baseColor,rows:4}];if(next.type==='chart')next.chart=createChart(d.palette,4,state.placement==='sleeves'?2:6);d.zones=d.zones.filter(z=>z.placement!==state.placement).concat(next);changed=true;}
   if(a.zoneColor!==undefined&&z){z.color=d.palette[Number(a.zoneColor)].hex;changed=true;}
   if(a.ink!==undefined){state.ink=Number(a.ink);changed=true;}
   if(a.tool){state.tool=a.tool;changed=true;}
   if(a.pixel&&z?.chart){const [r,c]=a.pixel.split(',').map(Number);const painted=paintChart(z.chart,r,c,state.tool==='erase'?0:state.ink,state.tool==='fill');changed=painted!==z.chart;z.chart=painted;}
   for(const [key,delta] of [['stripeUp',-1],['stripeDown',1]])if(a[key]!==undefined&&z){const i=Number(a[key]);[z.stripes[i],z.stripes[i+delta]]=[z.stripes[i+delta],z.stripes[i]];changed=true;}
   if(a.stripeDelete!==undefined&&z){z.stripes.splice(Number(a.stripeDelete),1);changed=true;}
   if(a.applyAdjustment!==undefined&&z){const option=garmentSuggestions(p,d,z.id)[Number(a.applyAdjustment)];if(option?.allowed){patch=option.patch;changed=true;}}
   const action=a.colorAction;
   if(action==='add-color'&&d.palette.length<12){d.palette.push({name:`Custom ${d.palette.length-3}`,hex:'#aabbd1'});d.zones.forEach(z=>{if(z.chart)z.chart.palette.push('#aabbd1');});changed=true;}
   if(action==='add-stripe'&&z?.stripes.length<8){z.stripes.push({color:d.palette[z.stripes.length%d.palette.length].hex,rows:4});changed=true;}
   if(action==='clear-chart'&&z?.chart){z.chart={...createChart(d.palette,z.chart.width,z.chart.height),repeatHorizontal:z.chart.repeatHorizontal};changed=true;}
   if(action==='remove-zone'){d.zones=d.zones.filter(z=>z.placement!==state.placement);changed=true;}
   if(action==='reset-fit'){patch={bustTarget:null,upperArmTarget:null};changed=true;}
   if(action==='download-design'){download=true;changed=true;}
 }
 return changed?{design:d,patch,download}:null;
}
