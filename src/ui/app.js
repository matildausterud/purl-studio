import { DEFAULTS, SIZES } from '../engine/model.js';
import { calculate } from '../engine/calculate.js';
import { makePattern, patternText } from '../engine/pattern.js';
import { sweaterSVG } from './preview.js';

let design = { ...DEFAULTS }, step = 0, page = 'design';
let result = calculate(design);
const app = document.querySelector('#app');
const escape = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = n => Number(n).toFixed(1);
const steps = ['Shape & fit', 'Lengths & details', 'Yarn & gauge'];
const choices = (field, items) => `<div class="choices ${field === 'size' ? 'sizes' : ''}">${items.map(([value, label, note, icon]) => `<button type="button" class="choice ${design[field] === value ? 'selected' : ''}" data-field="${field}" data-value="${value}" aria-pressed="${design[field] === value}">${icon ? `<span class="choice-icon">${icon}</span>` : ''}<strong>${label}</strong>${note ? `<small>${note}</small>` : ''}</button>`).join('')}</div>`;
const icon = wide => `<svg viewBox="0 0 100 72" aria-hidden="true"><path d="M37 9Q50 20 63 9L77 17L94 50L80 58L${wide ? '72' : '68'} 35V66H${wide ? '28' : '32'}V35L20 58L6 50L23 17Z"/><path d="M37 13L32 35M63 13L68 35M34 59H66"/></svg>`;
const range = (key, label, min, max, hint = '') => `<div class="field"><label for="${key}">${label}<span><output id="${key}-value">${design[key]}</output> cm</span></label><input id="${key}" data-input="${key}" type="range" min="${min}" max="${max}" step="0.5" value="${design[key]}">${hint ? `<small>${hint}</small>` : ''}</div>`;
const number = (key, label, min, max, unit, optional = false) => `<label class="number">${label}<span><input data-input="${key}" id="${key}" type="number" min="${min}" max="${max}" step="0.1" value="${design[key] ?? ''}" ${optional ? 'placeholder="Auto"' : 'required'}>${unit}</span></label>`;

function controls() {
  if (step === 0) return `<div class="section-heading"><span class="eyebrow">01 / THE SILHOUETTE</span><h2>Make it yours.</h2><p>A familiar shape, made for the way you like to wear it.</p></div>
    <div class="control-group"><h3>Construction</h3><div class="construction"><div class="construction-icon">${icon(false)}</div><div><strong>Seamless raglan</strong><small>Top down · one continuous piece</small></div><span class="tick">✓</span></div><p class="quiet">More constructions are on the drawing board.</p></div>
    <div class="control-group"><h3>Your size</h3>${choices('size', Object.keys(SIZES).map(s => [s,s]))}<p class="body-note">Body bust <strong>${SIZES[design.size].bust} cm</strong> · upper arm <strong>${SIZES[design.size].arm} cm</strong><br>House size chart; choose by body measurements.</p></div>
    <div class="control-group"><h3>Room to move</h3>${choices('fit', [['regular','Regular','+10 cm target ease',icon(false)],['oversized','Oversized','+20 cm target ease',icon(true)]])}</div>
    <div class="control-group"><h3>Neckline</h3><div class="neck-card"><svg viewBox="0 0 90 38" aria-hidden="true"><path d="M8 31L29 10Q45 34 61 10L82 31M29 10Q45 23 61 10"/></svg><div><strong>Classic crew</strong><small>Softly rounded, with a ribbed edge</small></div><span class="tick">✓</span></div></div>`;
  if (step === 1) return `<div class="section-heading"><span class="eyebrow">02 / THE FINISHING TOUCHES</span><h2>Find your proportions.</h2><p>Watch your sweater change as you refine each detail.</p></div>
    ${range('bodyLength','Body length',35,85,'Front length below the neckband, including the hem.')}
    ${range('sleeveLength','Sleeve length',15,65,'Measured from the underarm, including the cuff.')}
    <div class="control-group"><h3>Sleeve shape</h3>${choices('sleeve',[['regular','Regular','A gentle taper',icon(false)],['wide','Wide','Roomier arm & cuff',icon(true)]])}</div>
    <div class="control-group"><h3>Rib texture</h3>${choices('rib',[['1x1','1 × 1 rib','Fine, alternating columns','<span class="rib-sample fine"></span>'],['2x2','2 × 2 rib','Bold, paired columns','<span class="rib-sample bold"></span>']])}</div>
    <details><summary>Advanced finishing</summary>${range('neckband','Neckband height',1,8)}${range('hem','Hem height',1,12)}${range('cuff','Cuff height',1,12)}<label class="checkbox"><input type="checkbox" data-input="shortRows" ${design.shortRows ? 'checked' : ''}> Raise the back with German short rows</label><p class="quiet">Adds six local rows across the back for a more comfortable neckline.</p>${number('yokeDepth','Yoke depth override',16,40,'cm',true)}<p class="quiet">Leave empty to use the size-and-fit default. Measured below the neckband, before the short-row resolution round.</p></details>`;
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
  return `<div class="metric"><span>Finished bust</span><strong>${fmt(f.bust)} <small>cm</small></strong><em>+${fmt(f.ease)} cm actual ease</em></div><div class="metric"><span>Front length</span><strong>${fmt(f.bodyLength)} <small>cm</small></strong><em>below neckband</em></div><div class="metric"><span>Upper arm</span><strong>${fmt(f.upperArm)} <small>cm</small></strong><em>circumference</em></div><div class="metric"><span>Sleeve length</span><strong>${fmt(f.sleeveLength)} <small>cm</small></strong><em>from underarm</em></div>`;
}
function notices() {
  const errors = result.errors.map(w => `<p class="error">${escape(w.text)}</p>`).join('');
  return `${errors}${result.ok ? `<details class="notices"><summary>${result.warnings.length} calculation & fit notes</summary>${result.warnings.map(w => `<p>${escape(w.text)}</p>`).join('')}<p>Counts are validated mathematically. The pattern has not been physically test-knitted.</p></details>` : ''}`;
}
function preview() {
  return `<section class="preview-panel" aria-label="Live sweater preview"><div class="preview-top"><span class="eyebrow">YOUR DESIGN / 001</span><span class="live"><i></i> Live preview</span></div><div class="drawing" id="drawing">${sweaterSVG(design,result.ok ? result.finished : null)}</div><div class="colour-row"><span>Visualise your yarn</span><div class="swatches">${[['#9faaa0','Sage'],['#d8c5ab','Oat'],['#ba7968','Clay'],['#6e7f97','Slate'],['#525951','Forest']].map(([c,n]) => `<button class="swatch ${design.color===c?'active':''}" style="--swatch:${c}" data-field="color" data-value="${c}" aria-label="${n} yarn colour" aria-pressed="${design.color===c}"></button>`).join('')}</div></div><p class="preview-caption">A parametric fashion flat · colour is illustrative</p><div class="measurements" id="measurements" aria-live="polite">${measurements()}</div></section>`;
}
function render() {
  result = calculate(design);
  app.innerHTML = `<header class="site-header"><a class="brand" href="./" aria-label="Purl Studio home"><span class="brand-mark">∪</span>purl<span>studio</span></a><span class="header-note">A little thought. A lot of stitches.</span><span class="edition">THE RAGLAN EDITION <span>01</span></span></header>
    ${page === 'pattern' && result.ok ? patternPage() : `<main id="design"><div class="intro"><div><span class="eyebrow">MADE BY YOU, FOR YOU</span><h1>A sweater, <i>your way.</i></h1></div><p>Choose the shape. Find the fit.<br>We’ll take care of the stitch counts.</p></div><div class="workspace"><section class="design-panel"><nav class="steps" aria-label="Design steps">${steps.map((s,i)=>`<button data-step="${i}" ${i===step?'aria-current="step"':''}><span>${i+1}</span>${s}</button>`).join('')}</nav><div class="controls">${controls()}</div><div id="notices" role="status">${notices()}</div><div class="step-footer">${step ? '<button class="text-button" data-action="back">← Back</button>' : '<span class="quiet">Designed slowly. Calculated precisely.</span>'}<button class="primary" data-action="${step < 2 ? 'next' : 'generate'}" ${step===2&&!result.ok?'disabled':''}>${step<2?'Next: '+steps[step+1]:'Create my pattern'} <span>↗</span></button></div></section>${preview()}</div><footer class="page-footer"><span>FROM THE FIRST CAST-ON TO THE LAST END WOVEN IN.</span><span>No account. No guesswork in your stitch counts.</span></footer></main>`}`;
}
function patternPage() {
  const p = makePattern(result), f = result.finished;
  return `<main class="pattern-page" id="design"><div class="pattern-actions"><button class="text-button" data-action="edit">← Back to my design</button><div><button class="secondary" data-action="download">Download pattern</button><button class="primary" data-action="print">Print / save PDF ↗</button></div></div><div class="pattern-title"><span class="eyebrow">PURL STUDIO · YOUR PERSONAL PATTERN</span><h1>${p.title}</h1><p>${design.fit} fit · ${design.rib} rib · ${design.sleeve} sleeves · seamless, top down</p></div><div class="pattern-summary"><div>${sweaterSVG(design,f,true)}</div><div><h2>Made to your measurements.</h2><div class="measurements">${measurements()}</div><p>Back length: ${fmt(f.backLength)} cm · cuff: ${fmt(f.cuff)} cm<br>Neck circumference: ${fmt(f.neck)} cm · neckband: ${fmt(f.neckband)} cm</p><p>Gauge: ${design.stitchGauge} stitches × ${design.rowGauge} rounds / 10 cm<br>Needles: ${design.needle} mm · yarn: ${escape(design.yarn)}</p></div></div><div class="pattern-notes">${result.warnings.map(w=>`<p>${escape(w.text)}</p>`).join('')}</div><div class="pattern-sections">${p.sections.map(s=>`<section><h2>${s.title}</h2>${s.text.split('\n\n').map(t=>`<p>${escape(t)}</p>`).join('')}</section>`).join('')}</div><footer class="page-footer">Purl Studio · calculation engine v${result.version} · keep this pattern with your swatch.</footer></main>`;
}
function updateLive() {
  result = calculate(design);
  document.querySelector('#drawing').innerHTML = result.ok ? sweaterSVG(design,result.finished) : '<p class="invalid-preview">Preview paused until the settings are valid.</p>';
  document.querySelector('#measurements').innerHTML = measurements();
  document.querySelector('#notices').innerHTML = notices();
  const generate = document.querySelector('[data-action="generate"]');
  if (generate) generate.disabled = !result.ok;
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
  if (!button) return;
  if (button.dataset.field) { design[button.dataset.field] = button.dataset.value; render(); }
  if (button.dataset.step !== undefined) { step = Number(button.dataset.step); render(); }
  const action = button.dataset.action;
  if (action === 'next' || action === 'back') { step += action === 'next' ? 1 : -1; render(); document.querySelector('.section-heading h2').setAttribute('tabindex','-1'); document.querySelector('.section-heading h2').focus({preventScroll:true}); }
  if (action === 'generate' && result.ok) { page = 'pattern'; render(); window.scrollTo(0,0); }
  if (action === 'edit') { page = 'design'; render(); }
  if (action === 'print') window.print();
  if (action === 'download' && result.ok) {
    const url = URL.createObjectURL(new Blob([patternText(result)], {type:'text/plain;charset=utf-8'}));
    const a = document.createElement('a'); a.href=url; a.download=`purl-studio-${design.size.toLowerCase()}-raglan.txt`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
});
render();
