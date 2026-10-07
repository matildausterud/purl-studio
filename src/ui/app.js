import { createColorDesign, recolorPalette, serializeColorDesign, parseColorDesign } from '../colorwork/model.js';
import { validateColorwork } from '../colorwork/engine.js';
import { colorPattern, chartText } from '../colorwork/pattern.js';
import { studio, chartGrid } from './color-studio.js';
import { colorAction } from './color-actions.js';
import { DEFAULTS, SIZES } from '../engine/model.js';
import { calculate, necklineOptions } from '../engine/calculate.js';
import { NECKLINES } from '../engine/necklines.js';
import { necklineThumbnail } from './neckline-preview.js';
import { makePattern, patternText } from '../engine/pattern.js';
import { sweaterSVG } from './preview.js';

let design = { ...DEFAULTS }, step = 0, page = 'design';
let colorDesign = createColorDesign(design.color);
const studioState = {placement:'body',ink:1,tool:'draw',saveStatus:'Your design is saved in this browser.'};
try { const saved=JSON.parse(localStorage.getItem('purl-studio-design-v1')); if(saved){const candidate={...DEFAULTS,...saved.garment};const colors=parseColorDesign(JSON.stringify(saved.colorDesign));if(calculate(candidate).ok){design=candidate;colorDesign=colors;}} } catch {studioState.saveStatus='A saved design could not be restored. Starting with defaults.';}
let result = calculate(design), colorResult = validateColorwork(colorDesign,result);
function persist() {try{localStorage.setItem('purl-studio-design-v1',JSON.stringify({garment:design,colorDesign:JSON.parse(serializeColorDesign(colorDesign))}));studioState.saveStatus='Saved in this browser · download your design to keep a copy.';}catch{studioState.saveStatus='Browser saving is unavailable. Download your design to keep a copy.';}}
function downloadFile(text,name,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

const app = document.querySelector('#app');
const escape = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toFixed(1);
const steps = ['Shape & fit', 'Details', 'Yarn & gauge', 'Color & Pattern'];
const choices = (field, items) => `<div class="choices ${field === 'size' ? 'sizes' : ''}">${items.map(([value, label, note, icon]) => `<button type="button" class="choice ${design[field] === value ? 'selected' : ''}" data-field="${field}" data-value="${value}" aria-pressed="${design[field] === value}">${icon ? `<span class="choice-icon">${icon}</span>` : ''}<strong>${label}</strong>${note ? `<small>${note}</small>` : ''}</button>`).join('')}</div>`;
const icon = wide => `<svg viewBox="0 0 100 72" aria-hidden="true"><path d="M37 9Q50 20 63 9L77 17L94 50L80 58L${wide ? '72' : '68'} 35V66H${wide ? '28' : '32'}V35L20 58L6 50L23 17Z"/><path d="M37 13L32 35M63 13L68 35M34 59H66"/></svg>`;
const range = (key, label, min, max, hint = '') => `<div class="field"><label for="${key}">${label}<span><output id="${key}-value">${design[key]}</output> cm</span></label><input id="${key}" data-input="${key}" type="range" min="${min}" max="${max}" step="0.5" value="${design[key]}">${hint ? `<small>${hint}</small>` : ''}</div>`;
const number = (key, label, min, max, unit, optional = false) => `<label class="number">${label}<span><input data-input="${key}" id="${key}" type="number" min="${min}" max="${max}" step="0.1" value="${design[key] ?? ''}" ${optional ? 'placeholder="Auto"' : 'required'}>${unit}</span></label>`;

function necklineCards() {
  return necklineOptions(design).map(option => `<div class="neckline-option"><button type="button" class="choice neckline-choice ${design.neckline === option.value ? 'selected' : ''}" data-field="neckline" data-value="${option.value}" aria-label="${option.label}" aria-pressed="${design.neckline === option.value}" aria-describedby="neck-note-${option.value}" ${option.disabled ? 'disabled' : ''}>
    ${necklineThumbnail(option.value)}<strong>${option.label}</strong><small>${option.note}</small><span class="neck-count">${option.disabled ? 'Unavailable with these settings' : `${option.castOn} cast-on stitches`}</span></button>
    <p id="neck-note-${option.value}" class="neck-option-note ${option.disabled ? 'unavailable' : 'sr-only'}">${escape(option.reason || `${option.label}: ${option.note}. Compatible with top-down raglan.`)}</p></div>`).join('');
}

function necklineLedger() {
  if (!result.ok) return '<p class="quiet">Resolve the calculation notes below to generate this neckline.</p>';
  const n = result.neckline;
  return `<div><span>Yoke cast-on</span><strong>${result.castOn} <small>stitches</small></strong></div><div><span>${n.isV ? 'Picked-up band' : 'Collar / edge'}</span><strong>${n.isV ? n.neckbandStitches : result.neckbandRounds} <small>${n.isV ? 'stitches' : 'rounds'}</small></strong></div><p>${n.isV ? `Flat for ${n.flatRows} rows · join on row ${n.flatRows + 1} · V depth ${fmt(result.finished.vDepth)} cm. Band includes two selvedge stitches.` : `${fmt(result.finished.neck)} cm nominal opening · ${fmt(result.finished.neckband)} cm knitted collar height${design.neckline === 'turtle' ? `, ${fmt(result.finished.neckband/2)} cm folded` : ''}.`}</p>`;
}

function necklineControls() {
  const profile = NECKLINES[design.neckline];
  return `<div class="control-group"><h3>Neckline</h3><p class="quiet">Choose your shape. Each neckline has its own cast-on, shaping and finishing instructions.</p></div>
    <div class="neckline-grid" id="neckline-options" role="group" aria-label="Choose your neckline">${necklineCards()}</div>
    <div class="neckline-ledger" id="neckline-ledger" aria-live="polite">${necklineLedger()}</div>
    ${range('neckband', design.neckline === 'turtle' ? 'Collar height before folding' : 'Neckband height', ...profile.bandRange, design.neckline === 'v' ? 'A flat ribbed band with overlapping ends at the V point, picked up after the sleeves.' : design.neckline === 'turtle' ? 'Knitted at full height, then folded in half when worn.' : 'Knitted first; this height is additional to the body length.')}
    ${design.neckline === 'v' ? range('vDepth','V depth',8,22,'From the back-neck base to the V point. Must leave room to join before the underarms.') : ''}
    <details><summary>Neckline shaping & compatibility</summary><label class="checkbox"><input type="checkbox" data-input="shortRows" ${profile.shortRows && design.shortRows ? 'checked' : ''} ${!profile.shortRows ? 'disabled' : ''}> Raise the back with German short rows</label><p class="quiet">${profile.shortRows ? 'Adds six local rows across the back.' : design.neckline === 'v' ? 'V-neck uses front-edge shaping instead. German short rows are not combined with this construction.' : 'Boat neck keeps a shallow, symmetric opening. Back-rise short rows are disabled for this shape.'}</p><p class="quiet">All six necklines support top-down raglan. Choices that cannot meet your gauge, yoke depth or shaping constraints are disabled with the reason shown. Future constructions use the same compatibility rules.</p></details>`;
}

function controls() {
  if(step===3)return studio(colorDesign,result,colorResult,studioState);
  if (step === 0) return `<div class="section-heading"><span class="eyebrow">01 / THE SILHOUETTE</span><h2>Make it yours.</h2><p>A familiar shape, made for the way you like to wear it.</p></div>
    <div class="control-group"><h3>Construction</h3><div class="construction"><div class="construction-icon">${icon(false)}</div><div><strong>Seamless raglan</strong><small>Top down · one continuous piece</small></div><span class="tick">✓</span></div><p class="quiet">More constructions are on the drawing board.</p></div>
    <div class="control-group"><h3>Your size</h3>${choices('size', Object.keys(SIZES).map(s => [s,s]))}<p class="body-note">Body bust <strong>${SIZES[design.size].bust} cm</strong> · upper arm <strong>${SIZES[design.size].arm} cm</strong><br>House size chart; choose by body measurements.</p></div>
    <div class="control-group"><h3>Room to move</h3>${choices('fit', [['regular','Regular','+10 cm target ease',icon(false)],['oversized','Oversized','+20 cm target ease',icon(true)]])}</div>
`;
  if (step === 1) return `<div class="section-heading"><span class="eyebrow">02 / THE FINISHING TOUCHES</span><h2>Find your proportions.</h2><p>Watch your sweater change as you refine each detail.</p></div>
    ${necklineControls()}
    ${range('bodyLength','Body length',35,85,design.neckline === 'v' ? 'From the back-neck base/shoulder datum, including the hem; not from the V point.' : 'Front length below the neckband, including the hem.')}
    ${range('sleeveLength','Sleeve length',15,65,'Measured from the underarm, including the cuff.')}
    <div class="control-group"><h3>Sleeve shape</h3>${choices('sleeve',[['regular','Regular','A gentle taper',icon(false)],['wide','Wide','Roomier arm & cuff',icon(true)]])}</div>
    <div class="control-group"><h3>Rib texture</h3>${choices('rib',[['1x1','1 × 1 rib','Fine, alternating columns','<span class="rib-sample fine"></span>'],['2x2','2 × 2 rib','Bold, paired columns','<span class="rib-sample bold"></span>']])}</div>
    <details><summary>Advanced finishing</summary>${range('hem','Hem height',1,12)}${range('cuff','Cuff height',1,12)}${number('yokeDepth','Yoke depth override',16,40,'cm',true)}<p class="quiet">Leave empty to use the size-and-fit default. Measured below the neckband, before the short-row resolution round.</p></details>`;
  return `<div class="section-heading"><span class="eyebrow">03 / THE FABRIC</span><h2>Start with your swatch.</h2><p>Your actual washed gauge makes this pattern your own.</p></div>
    <label class="text-field">Yarn name<input data-input="yarn" value="${escape(design.yarn)}" maxlength="120" placeholder="Your yarn or blend"></label>
    <div class="swatch-tip"><span>↗</span><p>Knit, wash and dry a generous swatch in the round. Measure the central <strong>10 × 10 cm</strong> without stretching.</p></div>
    <div class="number-grid">${number('stitchGauge','Stitches / 10 cm',10,36,'sts')}${number('rowGauge','Rounds / 10 cm',14,50,'rnds')}</div>
    ${number('needle','Needle size',2,12,'mm')}
    <p class="quiet">Needle size is recorded in your pattern. Stitch and row gauge determine the calculations.</p>
    <details><summary>Estimate yarn quantity</summary><p class="quiet">Optional: weigh a dry 10 × 10 cm square of your fabric. We use its mass and the garment area, plus 15%. This is a rough budget, not a guarantee.</p>${number('swatchWeight','10 × 10 cm swatch weight',0.1,30,'g',true)}<div class="number-grid">${number('metersPerBall','Meterage per ball',20,1200,'m')}${number('gramsPerBall','Weight per ball',10,500,'g')}</div></details>`;
}

function measurements() {
  if (!result.ok) return '<p class="invalid-preview">Adjust the highlighted settings to calculate finished measurements.</p>';
  const f = result.finished;
  return `<div class="metric"><span>Finished bust</span><strong>${fmt(f.bust)} <small>cm</small></strong><em>+${fmt(f.ease)} cm actual ease</em></div><div class="metric"><span>Front length</span><strong>${fmt(f.bodyLength)} <small>cm</small></strong><em>${design.neckline === 'v' ? 'from back-neck base' : 'below neckband'}</em></div><div class="metric"><span>Upper arm</span><strong>${fmt(f.upperArm)} <small>cm</small></strong><em>circumference</em></div><div class="metric"><span>Sleeve length</span><strong>${fmt(f.sleeveLength)} <small>cm</small></strong><em>from underarm</em></div>`;
}
function notices() {
  const errors = result.errors.map(w => `<p class="error">${escape(w.text)}</p>`).join('');
  return `${errors}${colorResult.errors.map(e=>`<p class="error">${escape(e)}</p>`).join('')}${colorResult.warnings.map(e=>`<p class="quiet">${escape(e)}</p>`).join('')}${result.ok ? `<details class="notices"><summary>${result.warnings.length} calculation & fit notes</summary>${result.warnings.map(w => `<p>${escape(w.text)}</p>`).join('')}<p>Counts are validated mathematically. The pattern has not been physically test-knitted.</p></details>` : ''}`;
}
function preview() {
  return `<section class="preview-panel" aria-label="Live sweater preview"><div class="preview-top"><span class="eyebrow">YOUR DESIGN / 001</span><span class="live"><i></i> Live preview</span></div><div class="drawing" id="drawing">${result.ok ? sweaterSVG(design,result.finished,false,colorDesign,result) : '<p class="invalid-preview">Preview paused until the settings are valid.</p>'}</div><div class="colour-row"><span>Base color</span><div class="swatches">${[['#9faaa0','Sage'],['#d8c5ab','Oat'],['#ba7968','Clay'],['#6e7f97','Slate'],['#525951','Forest']].map(([c,n]) => `<button class="swatch ${design.color===c?'active':''}" style="--swatch:${c}" data-field="color" data-value="${c}" aria-label="${n} base color" aria-pressed="${design.color===c}"></button>`).join('')}</div></div><p class="preview-caption">Parametric color placement · chart grid is the knitting reference</p><div class="measurements" id="measurements" aria-live="polite">${measurements()}</div></section>`;
}
function render() {
  design.color=colorDesign.baseColor;
  result = calculate(design); colorResult=validateColorwork(colorDesign,result); persist();
  app.innerHTML = `<header class="site-header"><a class="brand" href="./" aria-label="Purl Studio home"><span class="brand-mark">∪</span>purl<span>studio</span></a><span class="header-note">A little thought. A lot of stitches.</span><span class="edition">THE RAGLAN EDITION <span>01</span></span></header>
    ${page === 'pattern' && result.ok && colorResult.ok ? patternPage() : `<main id="design"><div class="intro"><div><span class="eyebrow">MADE BY YOU, FOR YOU</span><h1>A sweater, <i>your way.</i></h1></div><p>Choose the shape. Find the fit.<br>We’ll take care of the stitch counts.</p></div><div class="workspace ${step===3?'color-workspace':''}"><section class="design-panel"><nav class="steps" aria-label="Design steps">${steps.map((s,i)=>`<button data-step="${i}" ${i===step?'aria-current="step"':''}><span>${i+1}</span>${s}</button>`).join('')}</nav><div class="controls">${controls()}</div><div id="notices" role="status">${notices()}</div><div class="step-footer">${step ? '<button class="text-button" data-action="back">← Back</button>' : '<span class="quiet">Designed slowly. Calculated precisely.</span>'}<button class="primary" data-action="${step < steps.length - 1 ? 'next' : 'generate'}" ${step===steps.length-1&&(!result.ok||!colorResult.ok)?'disabled':''}>${step<steps.length-1?'Next: '+steps[step+1]:'Create my pattern'} <span>↗</span></button></div></section>${preview()}</div><footer class="page-footer"><span>FROM THE FIRST CAST-ON TO THE LAST END WOVEN IN.</span><span>No account. No guesswork in your stitch counts.</span></footer></main>`}`;
}
function patternPage() {
  const p = makePattern(result), f = result.finished;
  p.sections = [...colorPattern(colorDesign,result).sections,...p.sections];
  return `<main class="pattern-page" id="design"><div class="pattern-actions"><button class="text-button" data-action="edit">← Back to my design</button><div><button class="secondary" data-action="download">Download pattern</button><button class="primary" data-action="print">Print / save PDF ↗</button></div></div><div class="pattern-title"><span class="eyebrow">PURL STUDIO · YOUR PERSONAL PATTERN</span><h1>${p.title}</h1><p>${NECKLINES[design.neckline].label} · ${design.fit} fit · ${design.rib} rib · ${design.sleeve} sleeves · seamless, top down</p></div><div class="pattern-summary"><div>${sweaterSVG(design,f,true,colorDesign,result)}</div><div><h2>Made to your measurements.</h2><div class="measurements">${measurements()}</div><p>Back length: ${fmt(f.backLength)} cm · cuff: ${fmt(f.cuff)} cm<br>${design.neckline === 'v' ? 'Estimated opening edge' : 'Neck circumference'}: ${fmt(f.neck)} cm · neckband: ${fmt(f.neckband)} cm${design.neckline === 'v' ? `<br>V depth: ${fmt(f.vDepth)} cm · cast on ${result.castOn} stitches, band picked up later` : `<br>Cast on ${result.castOn} stitches · ${result.neckbandRounds} collar rounds`}</p><p>Gauge: ${design.stitchGauge} stitches × ${design.rowGauge} rounds / 10 cm<br>Needles: ${design.needle} mm · yarn: ${escape(design.yarn)}</p></div></div><div class="pattern-notes">${colorResult.warnings.map(w=>`<p>${escape(w)}</p>`).join('')}${result.warnings.map(w=>`<p>${escape(w.text)}</p>`).join('')}</div><div class="pattern-sections">${p.sections.map(s=>`<section><h2>${s.title}</h2>${s.text.split('\n\n').map(t=>`<p>${escape(t)}</p>`).join('')}</section>`).join('')}</div>${colorDesign.zones.filter(z=>z.type==='chart').map(z=>`<section class="printed-chart"><h2>${escape(z.placement)} colorwork chart</h2>${chartGrid(z.chart)}<div class="chart-legend">${z.chart.palette.map((hex,i)=>`<span><i style="background:${hex}"></i>${String.fromCharCode(65+i)} · ${hex}</span>`).join('')}</div></section>`).join('')}<footer class="page-footer">Purl Studio · calculation engine v${result.version} · keep this pattern with your swatch.</footer></main>`;
}
function updateLive() {
  design.color=colorDesign.baseColor;
  result = calculate(design); colorResult=validateColorwork(colorDesign,result); persist();
  document.querySelector('#drawing').innerHTML = result.ok ? sweaterSVG(design,result.finished,false,colorDesign,result) : '<p class="invalid-preview">Preview paused until the settings are valid.</p>';
  document.querySelector('#measurements').innerHTML = measurements();
  document.querySelector('#notices').innerHTML = notices();
  const neckGrid = document.querySelector('#neckline-options');
  if (neckGrid) neckGrid.innerHTML = necklineCards();
  const ledger = document.querySelector('#neckline-ledger');
  if (ledger) ledger.innerHTML = necklineLedger();
  const generate = document.querySelector('[data-action="generate"]');
  if (generate) generate.disabled = !result.ok || !colorResult.ok;
  document.querySelectorAll('[data-input]').forEach(el => {
    const error = result.errors.some(e=>e.code===el.dataset.input);
    el.setAttribute('aria-invalid', String(error));
  });
}
app.addEventListener('input', event => {
  const el = event.target, key = el.dataset.input;
  if (!key) return;
  design[key] = el.type === 'checkbox' ? el.checked : key === 'yarn' ? el.value : el.value === '' ? (['yokeDepth','swatchWeight'].includes(key) ? null : NaN) : Number(el.value);
  const output = document.getElementById(`${key}-value`);
  if (output) output.textContent = el.value;
  updateLive();
});
app.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.field) {
    const changed = design[button.dataset.field] !== button.dataset.value;
    design[button.dataset.field] = button.dataset.value;
    if(button.dataset.field==='color')colorDesign=recolorPalette(colorDesign,0,button.dataset.value);
    if(changed&&['size','fit','sleeve'].includes(button.dataset.field)){design.bustTarget=null;design.upperArmTarget=null;}
    if (button.dataset.field === 'neckline' && changed) {
      design.neckband = NECKLINES[design.neckline].band;
      if (design.neckline === 'v') design.vDepth = DEFAULTS.vDepth;
    }
    render();
    document.querySelector(`[data-field="${button.dataset.field}"][data-value="${button.dataset.value}"]`)?.focus({preventScroll:true});
  }
  if (button.dataset.step !== undefined) { step = Number(button.dataset.step); render(); }
  const action = button.dataset.action;
  if (action === 'next' || action === 'back') { step += action === 'next' ? 1 : -1; render(); document.querySelector('.section-heading h2').setAttribute('tabindex','-1'); document.querySelector('.section-heading h2').focus({preventScroll:true}); }
  if (action === 'generate' && result.ok && colorResult.ok) { page = 'pattern'; render(); window.scrollTo(0,0); }
  if (action === 'edit') { page = 'design'; render(); }
  if (action === 'print') window.print();
  if (action === 'download' && result.ok) {
    if(colorResult.ok)downloadFile(colorPattern(colorDesign,result).sections.map(s=>s.title+'\n'+s.text).join('\n\n')+'\n\n'+patternText(result)+'\n\n'+colorDesign.zones.filter(z=>z.type==='chart').map(chartText).join('\n\n'),`purl-studio-${design.size.toLowerCase()}-${design.neckline}-raglan.txt`);
  }
});

for(const type of ['click','change','input'])app.addEventListener(type,event=>{
 const update=colorAction(event,colorDesign,result,studioState);if(!update)return;
 colorDesign=update.design;if(update.patch)design={...design,...update.patch};
 if(update.download)downloadFile(JSON.stringify({version:1,garment:design,colorDesign},null,2),'purl-studio-design.json','application/json');
 if(type==='input'){updateLive();return;}
 const pixel=event.target.dataset.pixel;
 render();if(pixel)document.querySelector(`[data-pixel="${pixel}"]`)?.focus({preventScroll:true});
});
app.addEventListener('pointerover',event=>{if(event.buttons===1&&event.target.dataset.pixel&&studioState.tool!=='fill')event.target.click();});
render();
