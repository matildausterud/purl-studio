import {createDesign,readDraft,readSaved,saveDraft,saveDesign,deleteDesign,setYarn,setPattern,labels,validDesign} from './state.js';
import {Header,Workspace,SavedDesigns,SweaterCustomizationModal,YarnLibrary,PatternSelector,PatternSettings,SwatchSettings,SweaterPreview,SwatchPreview,esc,icon} from './components.js';
const app=document.querySelector('#app'),modalRoot=document.querySelector('#modal-root');
let design=createDesign(),saved=[],screen='design',zoom=1,modal=null,modalDraft=null,opener=null,libraryIndex=0,libraryChoice=null,libraryPage=0,filters={search:'',quality:'all',color:'all',sort:'brand'},draftReadable=true,lastDeleted=null;
let warning='',toastTimer;
try{design=readDraft(localStorage);}catch(e){draftReadable=false;warning=e.message;}
try{saved=readSaved(localStorage);}catch(e){warning=e.message;}
function notify(message){const el=document.querySelector('#toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{el.hidden=true;},8000);}
function persist(){if(!draftReadable){notify('Utkastet kan inte skrivas över eftersom tidigare data inte kunde läsas. Exportera denna design via menyn.');return;}try{saveDraft(localStorage,design);}catch{notify('Dina ändringar visas men kunde inte sparas i webbläsaren. Exportera designen för att behålla en kopia.');}}
function render(){if(document.fullscreenElement?.classList.contains('workspace')){const temp=document.createElement('div');temp.innerHTML=Workspace(design,zoom);document.fullscreenElement.innerHTML=temp.querySelector('.workspace').innerHTML;return;}app.innerHTML=Header(screen==='saved')+(screen==='saved'?SavedDesigns(saved):Workspace(design,zoom));}
function focusSelector(selector){try{document.querySelector(selector)?.focus({preventScroll:true});}catch{}}
function refreshPreview(){const layer=document.querySelector('.zoom-layer');if(layer)layer.innerHTML=design.view==='sweater'?SweaterPreview(design):SwatchPreview(design);}
function openModal(type){opener=document.activeElement;modal=type;if(type==='sweater')modalDraft=structuredClone(design.sweater);modalRoot.innerHTML='<dialog class="dialog '+(type==='yarn'?'yarn-dialog':type==='sweater'?'sweater-dialog':'small-dialog')+'" aria-labelledby="dialog-title"><div class="dialog-content"></div></dialog>';updateModal();const dialog=modalRoot.querySelector('dialog');dialog.addEventListener('cancel',e=>{e.preventDefault();closeModal();});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});dialog.showModal();if(type==='save')dialog.querySelector('input')?.select();}
function updateModal(){const content=modalRoot.querySelector('.dialog-content');if(!content)return;
 if(modal==='sweater')content.innerHTML=SweaterCustomizationModal(modalDraft);
 if(modal==='yarn')content.innerHTML=YarnLibrary(filters,libraryChoice,libraryPage);
 if(modal==='save')content.innerHTML=`<div class="modal-heading"><h2 id="dialog-title">Save design</h2><button class="icon-button" data-action="close-modal" aria-label="Close save dialog">${icon('close')}</button></div><form id="save-form"><label class="name-field">Design name<input name="name" id="design-name" required maxlength="80" value="${esc(design.name)}" autocomplete="off"></label>${design.id?'<label class="check"><input id="save-copy" type="checkbox"> Save as a new copy</label><p class="form-note">Saving updates this design. Choose a new copy to keep both versions.</p>':'<p class="form-note">Saved locally in this browser.</p>'}<p class="form-error" role="alert"></p><div class="modal-footer"><button class="outline" type="button" data-action="close-modal">Cancel</button><button class="primary" type="submit">Save design</button></div></form>`;
 if(modal==='menu'||modal==='more')content.innerHTML=`<div class="modal-heading"><h2 id="dialog-title">${modal==='menu'?'Purl Studio':'Your design'}</h2><button class="icon-button" data-action="close-modal" aria-label="Close menu">${icon('close')}</button></div><div class="menu-list"><button data-action="export">Export design · JSON</button><label class="import-label">Import design · JSON<input type="file" id="import-design" accept=".json,application/json"></label><button data-action="new">Start a new design</button><a href="./sweater.html">Tidigare tröjbyggare & stickberäkningar ↗</a><a href="./swatch.html">Tidigare mönsterstudio ↗</a><a href="./yarn.html">Tidigare garnmixer ↗</a><a href="./journey.html">Tidigare stegvisa designflödet ↗</a></div><p class="form-note">Fas 1: fotografiska designreferenser och schematiska reservvyer. Ingen ny stickberäkning eller materialsimulering.</p>`;
 if(modal==='patterns')content.innerHTML=`<div class="modal-heading"><h2 id="dialog-title">Choose a pattern</h2><button class="icon-button" data-action="close-modal" aria-label="Close patterns">${icon('close')}</button></div>${PatternSelector(design)}`;
}
function closeModal(){modalRoot.querySelector('dialog')?.close();modalRoot.innerHTML='';modal=null;modalDraft=null;if(opener?.isConnected)opener.focus({preventScroll:true});}
function chooseYarn(index){libraryIndex=index;libraryChoice=design.material.strands[index]?.yarnId||null;libraryPage=0;filters={search:'',quality:'all',color:'all',sort:'brand'};openModal('yarn');}
function updatePatternSetting(key,value){const [group,field]=key.split('.');const next=structuredClone(design);next.pattern[group][field]=value;if(key==='checker.width')next.pattern.checker.height=value;if(!validDesign(next))return false;design=next;persist();return true;}
function onClick(event){const b=event.target.closest('button');if(!b||b.disabled)return;const a=b.dataset;
 if(a.sweaterField){modalDraft[a.sweaterField]=a.value;updateModal();focusSelector(`[data-sweater-field="${a.sweaterField}"][data-value="${a.value}"]`);return;}
 if(a.libraryYarn){libraryChoice=a.libraryYarn;updateModal();focusSelector(`[data-library-yarn="${a.libraryYarn}"]`);return;}
 if(a.yarnIndex!==undefined)return chooseYarn(+a.yarnIndex);
 if(a.removeYarn!==undefined){if(design.material.strands.length===1)return;const n=structuredClone(design);n.material.strands.splice(+a.removeYarn,1);design=n;persist();render();focusSelector('[data-action="add-strand"]');return;}
 if(a.pattern){design=setPattern(design,a.pattern);persist();if(modal==='patterns')closeModal();render();focusSelector(`[data-pattern="${a.pattern}"]`);return;}
 if(a.view){design={...design,view:a.view};zoom=1;persist();render();focusSelector(`[data-view="${a.view}"]`);return;}
 if(a.settingButton){if(updatePatternSetting(a.settingButton,a.value)){render();focusSelector(`[data-setting-button="${a.settingButton}"][data-value="${a.value}"]`);}return;}
 if(a.stepper){if(updatePatternSetting('stripes.size',design.pattern.stripes.size+Number(a.stepper))){render();focusSelector(`[data-stepper="${a.stepper}"]`);}return;}
 if(a.swatchSize){design={...design,swatch:{...design.swatch,size:Number(a.swatchSize)}};persist();render();focusSelector(`[data-swatch-size="${a.swatchSize}"]`);return;}
 if(a.sort){filters.sort=a.sort;libraryPage=0;updateModal();focusSelector(`[data-sort="${a.sort}"]`);return;}
 if(a.page!==undefined){libraryPage=+a.page;updateModal();focusSelector('.library-pagination button:not(:disabled)');return;}
 if(a.openDesign){const d=saved.find(d=>d.id===a.openDesign);if(!d)return;design=structuredClone(d);screen='design';zoom=1;persist();render();focusSelector('[data-action="sweater-modal"]');notify(`Opened “${d.name}”. Save to update it.`);return;}
 if(a.deleteDesign){try{lastDeleted=saved.find(d=>d.id===a.deleteDesign);saved=deleteDesign(localStorage,a.deleteDesign);if(design.id===a.deleteDesign){design={...design,id:null};persist();}render();notify('Design deleted.');const undo=document.createElement('button');undo.textContent='Undo';undo.dataset.action='undo-delete';document.querySelector('#toast').append(undo);focusSelector('[data-action="undo-delete"]');}catch(e){notify(e.message);}return;}
 switch(a.action){
 case 'design':screen='design';render();focusSelector('[data-action="design"]');break;
 case 'saved':try{saved=readSaved(localStorage);screen='saved';render();focusSelector('[data-action="saved"]');}catch(e){notify(e.message);}break;
 case 'sweater-modal':openModal('sweater');break;
 case 'confirm-sweater':design={...design,sweater:structuredClone(modalDraft)};closeModal();persist();render();focusSelector('[data-action="sweater-modal"]');break;
 case 'close-modal':closeModal();break;
 case 'add-strand':chooseYarn(design.material.strands.length);break;
 case 'confirm-yarn':design=setYarn(design,libraryIndex,libraryChoice);closeModal();persist();render();focusSelector(`[data-yarn-index="${libraryIndex}"]`);break;
 case 'clear-filters':filters={search:'',quality:'all',color:'all',sort:'brand'};libraryPage=0;updateModal();focusSelector('#yarn-search');break;
 case 'save':openModal('save');break;
 case 'menu':case 'more':openModal(a.action);break;
 case 'pattern-menu':openModal('patterns');break;
 case 'new':closeModal();design=createDesign();screen='design';zoom=1;persist();render();notify('New design. Your saved designs are unchanged.');break;
 case 'zoom-in':case 'zoom-out':zoom=Math.max(.75,Math.min(2,zoom+(a.action==='zoom-in'?.25:-.25)));render();focusSelector(`[data-action="${a.action}"]`);break;
 case 'fullscreen':{const el=document.querySelector('.workspace');if(document.fullscreenElement)document.exitFullscreen?.();else if(el.requestFullscreen)el.requestFullscreen().catch(()=>notify('Fullscreen is unavailable in this browser. Zoom still works.'));else notify('Fullscreen is unavailable in this browser.');break;}
 case 'export':{const url=URL.createObjectURL(new Blob([JSON.stringify(design,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='purl-studio-design.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;}
 case 'undo-delete':if(lastDeleted){try{saveDesign(localStorage,lastDeleted);saved=readSaved(localStorage);lastDeleted=null;render();notify('Design restored.');}catch(e){notify(e.message);}}break;
 }
}
document.addEventListener('click',onClick);
document.addEventListener('input',event=>{const el=event.target;
 if(el.dataset.setting){const key=el.dataset.setting;if(updatePatternSetting(key,Number(el.value))){document.querySelectorAll(`[data-setting="${key}"]`).forEach(other=>{if(other!==el)other.value=el.value;});document.querySelectorAll('[data-output]').forEach(out=>{const key=out.dataset.output;out.textContent=key.startsWith('checker')?`${design.pattern.checker.width} × ${design.pattern.checker.height} sts`:key==='diamonds.size'?`${design.pattern.diamonds.size*2} × ${design.pattern.diamonds.size*2} sts`:`${design.pattern.dots.spacing} sts`;});refreshPreview();}return;}
 if(el.dataset.patternColor!==undefined){const next=structuredClone(design);next.pattern.colors[+el.dataset.patternColor].hex=el.value;design=next;persist();refreshPreview();return;}
 if(el.id==='yarn-search'){const pos=el.selectionStart;filters.search=el.value;libraryPage=0;updateModal();const input=document.querySelector('#yarn-search');input.focus();try{input.setSelectionRange(pos,pos);}catch{};}
});
document.addEventListener('change',async event=>{const el=event.target;
 if(el.dataset.setting){const id=el.id;render();if(id)document.getElementById(id)?.focus({preventScroll:true});return;}
 if(el.dataset.patternColor!==undefined){render();focusSelector(`[data-pattern-color="${el.dataset.patternColor}"]`);return;}
 if(el.dataset.colorYarn!==undefined){const next=structuredClone(design);next.pattern.colors[+el.dataset.colorYarn].yarnIds=el.value?[el.value]:[];design=next;persist();return;}
 if(el.dataset.display){design={...design,swatch:{...design.swatch,[el.dataset.display]:el.checked}};persist();refreshPreview();return;}
 if(el.id==='yarn-quality'||el.id==='yarn-color'){filters[el.id==='yarn-quality'?'quality':'color']=el.value;libraryPage=0;updateModal();focusSelector('#'+el.id);return;}
 if(el.id==='import-design'){const file=el.files[0];if(!file)return;try{if(file.size>100000)throw new Error('Filen är för stor.');const candidate=JSON.parse(await file.text());if(!validDesign(candidate))throw new Error('Filen är inte en giltig fas 1-design.');design={...candidate,id:null};closeModal();screen='design';persist();render();notify('Design imported as a new draft.');}catch(e){notify(e.message);}}
});
document.addEventListener('submit',event=>{if(event.target.id!=='save-form')return;event.preventDefault();const name=document.querySelector('#design-name').value.trim();if(!name){document.querySelector('.form-error').textContent='Give your design a name.';return;}try{design=saveDesign(localStorage,{...design,name},{copy:Boolean(document.querySelector('#save-copy')?.checked)});persist();saved=readSaved(localStorage);closeModal();render();notify(`“${name}” saved.`);focusSelector('[data-action="save"]');}catch(e){document.querySelector('.form-error').textContent='Kunde inte spara. '+e.message;}});
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)render();});
render();if(warning)notify(warning);
