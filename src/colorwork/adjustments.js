import { calculate } from '../engine/calculate.js';
import { nearbyCompatibleCounts, validateColorwork } from './engine.js';

/** Suggestions are proposals only. UI must explicitly apply the returned patch. */
export function garmentSuggestions(p,design,zoneId) {
  const zone=design.zones.find(z=>z.id===zoneId), report=validateColorwork(design,p).zones.find(z=>z.id===zoneId);
  if(!p.ok||zone?.type!=='chart'||!zone.chart.repeatHorizontal||!report?.stitchCount||report.repeat.compatible)return [];
  return nearbyCompatibleCounts(report.stitchCount,zone.chart.width,p.design.stitchGauge).map(option=>{
    const body=zone.placement==='body', delta=option.stitches-report.stitchCount;
    const target=body?option.measurement:(p.upperArmStitches+delta)*10/p.design.stitchGauge;
    const patch=body?{bustTarget:target}:{upperArmTarget:target};
    const candidate=calculate({...p.design,...patch});
    const check=candidate.ok?validateColorwork(design,candidate):null;
    const updated=check?.zones.find(z=>z.id===zoneId);
    const exact=body?candidate.bodyStitches===option.stitches:updated?.stitchCount===option.stitches;
    const allowed=!!candidate.ok&&!!check?.ok&&exact;
    return {...option,patch,allowed,garmentMeasurement:target,measureLabel:body?'Finished bust':'Upper arm',
      ease:body?target-p.chart.bust:null,
      reason:allowed?'All garment and colorwork checks pass.':candidate.ok?(check?.errors.join(' ')||'Raglan or rib constraints round this suggestion to another stitch count.') : candidate.errors.map(e=>e.text).join(' '),
    };
  });
}
