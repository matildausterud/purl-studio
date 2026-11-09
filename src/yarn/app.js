import { MODELS, readDesign, saveDesign, applyYarns, steps } from '../journey/model.js';
import { describeStrand } from './catalog.js';
import { defaultCombination, changeStrand, activeStrands } from './state.js';
import { readLibrary, writeLibrary, readDraft, DRAFT_KEY } from './storage.js';
import { renderSwatch } from './renderer.js';
import { esc, YarnStrandCard, KnittedSwatchPreview, CombinationSummary, SavedCombinations } from './components.js';

let state = defaultCombination(), saved = [], compare = [], zoom = 1, frame, libraryReadable = true;
let initialNotice = '';
try { state = readDraft(localStorage); } catch { initialNotice = 'Your previous draft could not be restored. You can still experiment here.'; }
try { saved = readLibrary(localStorage); } catch { libraryReadable = false; initialNotice = 'Browser storage is unavailable or saved data could not be read. Existing data is untouched; saving is paused.'; }
const root = document.querySelector('#app');
root.innerHTML = `<a class="skip" href="#workspace">Skip to yarn mixer</a><header class="site-header"><a class="wordmark" href="./" aria-label="Purl Studio home"><svg width="29" height="34" viewBox="0 0 29 34" fill="none" aria-hidden="true"><path d="M4 3v16c0 14 21 14 21 0V3M10 3v16c0 6 9 6 9 0V3" stroke="currentColor" stroke-width="1.5"/></svg><span>purl<span class="wordmark-light">studio</span></span></a><nav aria-label="Main navigation"><button data-action="studio" id="nav-studio" aria-current="page">Yarn Studio</button><button data-action="library" id="nav-library">My Combinations <span id="saved-count">${saved.length}</span></button></nav><span class="header-note">A SPACE TO MAKE SOMETHING YOURS</span></header><main id="workspace" tabindex="-1">${steps(1)}<p class="flow-model" id="flow-model"></p><section id="studio-view"><div class="intro"><div><span class="eyebrow">STEG 02 / HITTA DIN GARNKOMBINATION</span><h1>Vilka garner vill du <em>kombinera?</em></h1></div><p>En tråd, två trådar eller en mjuk mohairhalo.<br>Prova färgerna tillsammans innan du går vidare.</p></div><div class="mix-types" role="group" aria-label="Typ av garnkombination"><button data-mix="single">Enkel tråd</button><button data-mix="halo">Ull + mohair</button><button data-mix="double">Två släta trådar</button></div><div class="workspace"><aside class="yarn-panel" aria-label="Yarn selection"><div class="panel-heading"><h2>Choose your yarns</h2><span>01—02</span></div><div id="strands"></div><p class="catalog-note">An example yarn library<br><span>Brand and yarn names are references. Shade names, DEMO codes, colors and texture profiles are illustrative, not verified manufacturer data.</span></p></aside>${KnittedSwatchPreview()}<aside class="summary-panel" id="summary" aria-label="Combination details"></aside></div><div class="journey-actions"><a href="./journey.html">← Tillbaka till tröjmodell</a><button class="flow-primary" data-action="continue-pattern">Vidare till färgmönster →</button></div><section class="studio-foot"><span class="eyebrow">MADE FOR YOUR NEXT WHAT IF.</span><p>Start with a color. Follow your curiosity.</p><a href="./sweater.html">Sweater builder ↗</a><a href="./swatch.html">Pattern Studio ↗</a></section></section><section id="library-view" hidden><div class="intro"><div><span class="eyebrow">YOUR COLOR NOTEBOOK</span><h1>Worth <em>keeping.</em></h1></div><p>Your saved yarn mixes.<br>Pick up to three to compare side by side.</p></div><div id="comparison"></div><div id="saved-list"></div><p class="library-note">Stored only in this browser. Clearing browser data removes your collection.</p></section></main><div class="notice" id="notice" role="status" aria-live="polite" hidden></div><footer><span>PURL STUDIO</span><span>A little imagination, a lot of possibility.</span><span>YARN MIXER · NO. 01</span></footer>`;
function announce(message) { const el = document.querySelector('#notice'); el.textContent = message; el.hidden = false; }
function persistDraft() { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); const d=readDesign(localStorage); if(d.modelId)saveDesign(localStorage,applyYarns(d,state)); } catch { announce('This mix is visible, but browser storage could not save your draft.'); } }
function updatePreview() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => renderSwatch(document.querySelector('#swatch'), state, { zoom }));
  const active = activeStrands(state).map(describeStrand);
  document.querySelector('#swatch').setAttribute('aria-label', `Simulated stockinette: ${active.map(({yarn,color}) => `${yarn.name} in ${color.name}`).join(' held with ')}. ${Math.round(zoom*100)} percent zoom.`);
  document.querySelector('#texture-label').textContent = active.map(({yarn}) => yarn.texture === 'halo' ? 'Soft halo' : 'Smooth strand').join(' + ');
  document.querySelector('#zoom-value').value = `${Math.round(zoom*100)}%`;
  document.querySelector('[data-action="zoom-out"]').disabled = zoom <= 1;
  document.querySelector('[data-action="zoom-in"]').disabled = zoom >= 2.5;
}
function renderStudio() {
  const type=!state.secondEnabled?'single':state.strands.every(s=>describeStrand(s).yarn.texture==='smooth')?'double':state.strands[0]&&describeStrand(state.strands[0]).yarn.texture==='smooth'&&describeStrand(state.strands[1]).yarn.texture==='halo'?'halo':'';
  document.querySelectorAll('[data-mix]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mix===type)));
  try{const d=readDesign(localStorage);document.querySelector('#flow-model').textContent=d.modelId?'Din modell: '+(MODELS.find(m=>m.id===d.modelId)?.name||'Egen tröja'):'Välj först en tröjmodell via steg 01. Garnmixern går också att prova separat.';}catch{}
  document.querySelector('#strands').innerHTML = [0,1].map(i => YarnStrandCard(state,i)).join('');
  document.querySelector('#summary').innerHTML = CombinationSummary(state);
  updatePreview();
}
function renderLibrary() {
  document.querySelector('#saved-count').textContent = saved.length;
  document.querySelector('#saved-list').innerHTML = SavedCombinations(saved, compare);
  document.querySelectorAll('[data-saved-canvas]').forEach(canvas => renderSwatch(canvas, saved.find(s => s.id === canvas.dataset.savedCanvas), {thumbnail:true}));
  const selected = compare.map(id => saved.find(s => s.id === id)).filter(Boolean);
  document.querySelector('#comparison').innerHTML = selected.length ? `<section class="comparison"><div class="comparison-heading"><h2>Side by side</h2><button data-action="clear-compare">Clear comparison</button></div><div class="comparison-grid">${selected.map(s => `<article><canvas data-comparison="${esc(s.id)}" role="img" aria-label="${esc(s.name)} comparison preview"></canvas><h3>${esc(s.name)}</h3>${activeStrands(s).map(strand => {const {yarn,color}=describeStrand(strand);return `<p>${esc(yarn.brand)} · ${esc(yarn.name)}<br>${esc(color.name)} · ${color.code}</p>`;}).join('')}</article>`).join('')}</div></section>` : '';
  document.querySelectorAll('[data-comparison]').forEach(canvas => renderSwatch(canvas, saved.find(s => s.id === canvas.dataset.comparison), {thumbnail:true}));
}
function showView(library) {
  document.querySelector('#studio-view').hidden = library;
  document.querySelector('#library-view').hidden = !library;
  for (const [id, active] of [['nav-studio', !library], ['nav-library', library]]) {
    const el = document.getElementById(id); active ? el.setAttribute('aria-current','page') : el.removeAttribute('aria-current');
  }
  if (library) renderLibrary(); else updatePreview();
  document.getElementById(library ? 'nav-library' : 'nav-studio').focus();
}
root.addEventListener('input', event => {
  if (event.target.matches('[data-search]')) {
    const choices = event.target.closest('.choices'), term = event.target.value.toLocaleLowerCase().trim();
    let count = 0;
    choices.querySelectorAll('[data-pick]').forEach(button => { button.hidden = !button.textContent.toLocaleLowerCase().includes(term); if (!button.hidden) count++; });
    choices.querySelector('.empty-options').hidden = count > 0;
  }
  if (event.target.id === 'combination-name') { state = {...state, name:event.target.value}; persistDraft(); }
});
root.addEventListener('change', event => {
  if (event.target.id === 'second-enabled') {
    state = {...state, secondEnabled:event.target.checked}; renderStudio(); persistDraft();
    document.querySelector('#second-enabled').focus();
    announce(state.secondEnabled ? 'Second strand added.' : 'Single-strand preview. Your second yarn selection is kept.');
  }
  if (event.target.matches('[data-compare]')) {
    const id = event.target.dataset.compare;
    if (event.target.checked && compare.length === 3) { event.target.checked = false; announce('Choose up to three combinations to compare.'); return; }
    compare = event.target.checked ? [...compare,id] : compare.filter(x => x !== id);
    renderLibrary(); document.querySelector(`[data-compare="${CSS.escape(id)}"]`)?.focus();
  }
});
root.addEventListener('keydown', event => {
  if (event.key === 'Escape') { const chooser = event.target.closest('details'); if (chooser) {chooser.open=false;chooser.querySelector('summary').focus();} }
});
root.addEventListener('toggle', event => {
  if (event.target.matches('.chooser') && event.target.open) {
    root.querySelectorAll('.chooser').forEach(el => {if (el !== event.target) el.open=false;});
  }
}, true);
document.addEventListener('click', event => {root.querySelectorAll('.chooser[open]').forEach(el => {if (!el.contains(event.target)) el.open=false;});});
root.addEventListener('click', event => {
  const mix=event.target.closest('[data-mix]');
  if(mix){const type=mix.dataset.mix;state=structuredClone(state);state.secondEnabled=type!=='single';
    if(type!=='single'){
      const base=describeStrand(state.strands[0]);if(base.yarn.texture!=='smooth')state.strands[0].yarnId={'Isager':'isager-tvinni','Sandnes Garn':'sandnes-sunday','Knitting for Olive':'olive-merino'}[base.yarn.brand];
      const second=describeStrand(state.strands[1]);state.strands[1].yarnId=(type==='halo'?{'Isager':'isager-silk-mohair','Sandnes Garn':'sandnes-mohair','Knitting for Olive':'olive-mohair'}:{'Isager':'isager-tvinni','Sandnes Garn':'sandnes-sunday','Knitting for Olive':'olive-merino'})[second.yarn.brand];
    }renderStudio();persistDraft();document.querySelector(`[data-mix="${type}"]`).focus();announce('Garnkombinationen är uppdaterad.');return;}
  const choice = event.target.closest('[data-pick]');
  if (choice) {
    const {index,pick,value} = choice.dataset;
    state = changeStrand(state, Number(index), pick, value); renderStudio(); persistDraft();
    const focus = pick === 'color' ? `[data-pick="color"][data-index="${index}"][data-value="${value}"]` : `[data-chooser="${index}-${pick}"] summary`;
    document.querySelector(focus)?.focus();
    const {yarn,color} = describeStrand(state.strands[Number(index)]);
    announce(`Yarn ${Number(index)+1}: ${yarn.name}, ${color.name}. Preview updated.`);
    return;
  }
  const button = event.target.closest('[data-action]'); if (!button) return;
  const { action, id } = button.dataset;
  if(action==='continue-pattern'){
    try{const d=readDesign(localStorage);if(!d.modelId){announce('Välj en tröjmodell i steg 01 först. Din garnmix finns kvar.');return;}saveDesign(localStorage,applyYarns(d,state));localStorage.setItem(DRAFT_KEY,JSON.stringify(state));location.href='./journey.html?step=pattern';}catch{announce('Kunde inte spara garnvalet. Kontrollera att webbläsarens lagring är tillgänglig.');}return;
  }
  if (action === 'studio' || action === 'library') return showView(action === 'library');
  if (action.startsWith('zoom-')) { zoom = action === 'zoom-reset' ? 1 : Math.max(1, Math.min(2.5, zoom + (action === 'zoom-in' ? 0.25 : -0.25))); updatePreview(); return; }
  if (action === 'reset') { state=defaultCombination(); zoom=1;renderStudio();persistDraft();document.querySelector('[data-action="reset"]').focus();announce('Original yarn mix restored. Saved combinations are unchanged.'); }
  if (action === 'save') {
    if (!libraryReadable) return announce('Saving is paused because browser storage could not be read. Existing data has been left untouched.');
    const name = state.name.trim() || activeStrands(state).map(s => describeStrand(s).color.name).join(' & ');
    const item = {...structuredClone(state), name, id:crypto.randomUUID(), savedAt:new Date().toISOString()};
    try { const latest=readLibrary(localStorage), next=[item,...latest];writeLibrary(localStorage,next);saved=next;document.querySelector('#saved-count').textContent=saved.length;announce(`“${name}” saved. Find it in My Combinations.`); }
    catch { announce('Could not save this combination. Browser storage may be full or unavailable.'); }
  }
  if (action === 'open') { const item=saved.find(s => s.id === id);if(!item)return;state={version:1,name:item.name,secondEnabled:item.secondEnabled,strands:structuredClone(item.strands)};zoom=1;renderStudio();persistDraft();showView(false);announce(`Opened “${item.name}”. Saving creates a new combination.`); }
  if (action === 'delete') {
    try { const latest=readLibrary(localStorage), next=latest.filter(s => s.id !== id);writeLibrary(localStorage,next);saved=next;compare=compare.filter(x=>x!==id);renderLibrary();document.querySelector('[data-action="open"]')?.focus();announce('Combination deleted.'); }
    catch {announce('Could not delete this combination. Your saved data is unchanged.');}
  }
  if (action === 'clear-compare') {compare=[];renderLibrary();document.querySelector('[data-compare]')?.focus();}
});
window.addEventListener('storage', event => {
  if (event.key === 'purl-yarn-combinations-v1' || event.key === null) {
    try { saved=readLibrary(localStorage);libraryReadable=true;compare=compare.filter(id=>saved.some(s=>s.id===id));renderLibrary(); } catch {libraryReadable=false;announce('Saved combinations changed in another tab but could not be read.');}
  }
});
renderStudio(); if(initialNotice)announce(initialNotice);
