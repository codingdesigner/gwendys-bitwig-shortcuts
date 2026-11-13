'use strict';
const $=id=>document.getElementById(id),core=CatalogCore,storageKey='bitwig-catalog-v1';
let records=BITWIG_DATA.rows,current=[],snapshot='Screenshot catalog · user corrections November 13, 2026';
function node(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e}
try{const saved=JSON.parse(localStorage.getItem(storageKey)||'null');if(saved){records=core.parseCSV(saved.csv);snapshot=saved.label;$('message').textContent='Showing your imported snapshot. To use the expanded screenshot catalog, open How to update and choose Use original screenshot snapshot.'}}catch{$('message').textContent='Saved snapshot could not be read. Showing the original screenshot catalog.'}
function applyTheme(theme){const choice=theme==='original'?'original':'project';document.documentElement.dataset.theme=choice;$('theme').value=choice;}
let savedTheme='project';try{savedTheme=localStorage.getItem('bitwig-theme')||'project'}catch{}
applyTheme(savedTheme);
$('theme').onchange=()=>{applyTheme($('theme').value);try{localStorage.setItem('bitwig-theme',$('theme').value)}catch{}};
$('sheetLink').href=BITWIG_DATA.sheetURL;
const collapsedCategories=new Set();
const categoryOrder=[...new Set(BITWIG_DATA.rows.map(r=>r.Category))];
function orderedCategories(){return [...new Set(records.map(r=>r.Category))].sort((a,b)=>{const ai=categoryOrder.indexOf(a),bi=categoryOrder.indexOf(b);return (ai<0?999:ai)-(bi<0?999:bi)||a.localeCompare(b)})}
function categories(){const selected=$('category').value;$('category').replaceChildren(new Option('All categories',''));orderedCategories().forEach(c=>$('category').add(new Option(c,c)));if([...$('category').options].some(o=>o.value===selected))$('category').value=selected}
function renderAction(r){
 const row=node('article',undefined,'shortcut-row');
 row.append(node('h2',r.Action,'action'));
 const keyList=node('div',undefined,'key-list');keyList.setAttribute('aria-label','Shortcut alternatives');
 if(r.Keys){core.uniqueKeys(r.Keys).forEach((k,i)=>{if(i)keyList.append(node('span','or','key-or'));keyList.append(node('kbd',k))})}
 else keyList.append(node('span',r.Assignment==='Unassigned'?'No shortcut assigned':'Mapping not visible','unassigned'));
 row.append(keyList);
 const changedByUser=r.ID==='BW-407'&&r.Notes.includes('User removed');
 const state=node('div',undefined,'state-column');
 if(changedByUser)state.append(node('span','Mapping changed by you','review-badge'));
 if(r.Review==='Needs review')state.append(node('span','Transcription needs review','review-badge'));
 if(state.childNodes.length)row.append(state);
 const details=node('details',undefined,'record-details');
 details.append(node('summary','Details'),node('p','Override status: Unknown'));
 if(changedByUser)details.append(node('p','You removed the accidental è mapping. Audition tool is now 7 only.'));
 else if(r.Notes&&!r.Notes.startsWith('User verified punctuation/key transcription'))details.append(node('p',r.Notes));
 row.append(details);return row;
}

const modifierNames=['cmd','alt','ctrl','shift'];
const specialKeys=['Up','Down','Left','Right','Enter','Numpad Enter','Space','Tab','Escape','Backspace','Delete','Home','End','Page Up','Page Down',...Array.from({length:24},(_,i)=>'F'+(i+1)),...Array.from({length:10},(_,i)=>'Numpad '+i),'Numpad +','Numpad -','Numpad *','Numpad /','Numpad .','Stop','Play','Zoom In','Zoom Out'];
specialKeys.forEach(k=>$('specialKey').add(new Option(k,k)));
function clearShortcut(){$('keys').value='';$('specialKey').value='';modifierNames.forEach(m=>$('mod-'+m).checked=false)}
let visibleGroups=[],scrollPending=false;
function updateCurrentCategory(){
 scrollPending=false;if(!visibleGroups.length)return;
 const edge=$('categoryDock').getBoundingClientRect().bottom+14;
 // Use section ends so the gap before a heading belongs to the incoming section.
 const active=visibleGroups[core.activeSectionIndex(visibleGroups.map(group=>group.getBoundingClientRect().bottom),edge)];
 setCurrentCategory(active);
}
function setCurrentCategory(active){
 const name=active.dataset.category;
 if($('currentCategory').dataset.category!==name){
  $('currentCategory').dataset.category=name;$('currentCategory').textContent=name;
  $('currentCategory').style.setProperty('--track',active.style.getPropertyValue('--track'));
  for(const link of $('categoryJumps').children){if(link.dataset.category===name)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');}
 }
}
function scheduleCategoryUpdate(){if(!scrollPending){scrollPending=true;requestAnimationFrame(updateCurrentCategory)}}
function rebuildCategoryNavigation(){
 visibleGroups=[...$('groups').children];$('categoryDock').hidden=!visibleGroups.length;
 $('currentCategory').dataset.category='';$('categoryJumps').replaceChildren();
 visibleGroups.forEach(group=>{
  group.id='category-'+orderedCategories().indexOf(group.dataset.category);
  const link=node('a',group.dataset.category);link.href='#'+group.id;link.dataset.category=group.dataset.category;link.style.setProperty('--track',group.style.getPropertyValue('--track'));
  link.onclick=e=>{e.preventDefault();group.open=true;collapsedCategories.delete(group.dataset.category);
   setCurrentCategory(group);
   const heading=group.querySelector('summary');heading.focus({preventScroll:true});
   const top=window.scrollY+group.getBoundingClientRect().top-$('categoryDock').getBoundingClientRect().height-12;
   window.scrollTo({top:Math.max(0,top),behavior:'instant'});scheduleCategoryUpdate();
  };
  $('categoryJumps').append(link);group.addEventListener('toggle',scheduleCategoryUpdate);
 });scheduleCategoryUpdate();
}
window.addEventListener('scroll',scheduleCategoryUpdate,{passive:true});
window.addEventListener('resize',scheduleCategoryUpdate);
if(typeof ResizeObserver!=='undefined')new ResizeObserver(scheduleCategoryUpdate).observe($('groups'));
function render(){
 const query={search:$('search').value,baseKey:$('specialKey').value||$('keys').value.trim(),modifiers:modifierNames.filter(m=>$('mod-'+m).checked),category:$('category').value,assignment:$('assignment').value,review:$('review').checked};
 const modLabels={cmd:'Command',alt:'Option',ctrl:'Control',shift:'Shift'};
 $('keyPreview').textContent=query.baseKey||query.modifiers.length?'Matching: '+[...query.modifiers.map(m=>modLabels[m]),query.baseKey||'any key'].join(' + '):'Any shortcut';
 const filtered=core.filter(records,query),fragment=document.createDocumentFragment();current=[];
 const searching=Boolean(query.search||query.baseKey||query.modifiers.length||query.category||query.assignment||query.review);
 for(const category of orderedCategories()){
  const entries=filtered.filter(r=>r.Category===category);if(!entries.length)continue;current.push(...entries);
  const group=node('details',undefined,'category-group');group.dataset.category=category;group.style.setProperty('--track',['#cba7fa','#ffc583','#dce99b','#e39bdf','#8ce3d8','#9bbfff'][orderedCategories().indexOf(category)%6]);group.open=searching||!collapsedCategories.has(category);
  const heading=node('summary',undefined,'category-heading');heading.append(node('span',category),node('span',entries.length+' records','group-count'));
  heading.addEventListener('click',()=>{if(group.open)collapsedCategories.add(category);else collapsedCategories.delete(category)});
  group.append(heading);const list=node('div',undefined,'category-entries card-grid');
  const parents=records.filter(r=>r.Category===category&&r.Kind==='Group');
  const childIDs=new Set(entries.map(r=>r.ID));
  const display=records.filter(r=>r.Category===category&&!r['Parent ID']&&(childIDs.has(r.ID)||(r.Kind==='Group'&&entries.some(c=>c['Parent ID']===r.ID))));
  for(const r of display){
   if(r.Kind==='Group'){
    const children=entries.filter(c=>c['Parent ID']===r.ID);const nested=node('details',undefined,'category-group subgroup');nested.dataset.category=r.ID;nested.open=searching||!collapsedCategories.has(r.ID);
    const title=node('summary',undefined,'category-heading');title.append(node('span',r.Action),node('span',children.length+' actions','group-count'));title.onclick=()=>{if(nested.open)collapsedCategories.add(r.ID);else collapsedCategories.delete(r.ID)};nested.append(title);
    const childGrid=node('div',undefined,'card-grid');for(const child of children)childGrid.append(renderAction(child));nested.append(childGrid);
    if(!children.length)nested.append(node('p','No child actions match these filters.','subgroup-empty'));
    list.append(nested);
   }else list.append(renderAction(r));
  }
  for(const r of entries.filter(r=>r['Parent ID']&&!parents.some(p=>p.ID===r['Parent ID'])))list.append(renderAction(r));
  group.append(list);fragment.append(group);
 }
 $('groups').replaceChildren(fragment);rebuildCategoryNavigation();$('empty').hidden=current.length>0;const a=current.filter(r=>r.Kind==='Action').length,g=current.length-a;
 $('count').textContent=`${current.length} of ${records.length} records · ${a} action${a===1?'':'s'}${g?` + ${g} groups`:''}`;$('snapshot').textContent=snapshot+' · Manual refresh from Google Sheets';$('exportBtn').disabled=current.length===0;
}
function setAllGroups(open){document.querySelectorAll('.category-group').forEach(group=>{group.open=open;if(open)collapsedCategories.delete(group.dataset.category);else collapsedCategories.add(group.dataset.category)})}
$('expandAll').onclick=()=>setAllGroups(true);$('collapseAll').onclick=()=>setAllGroups(false);
function reset(){$('search').value='';clearShortcut();$('category').value='';$('assignment').value='';$('review').checked=false;render()}
$('search').addEventListener('input',render);$('keys').addEventListener('input',()=>{$('specialKey').value='';render()});$('specialKey').onchange=()=>{$('keys').value='';render()};modifierNames.forEach(m=>$('mod-'+m).onchange=render);$('clearShortcut').onclick=()=>{clearShortcut();render()};['category','assignment','review'].forEach(id=>$(id).addEventListener('change',render));$('reset').onclick=reset;$('emptyReset').onclick=()=>{reset();$('search').focus()};
$('helpBtn').onclick=()=>{const open=$('guide').hidden;$('guide').hidden=!open;$('helpBtn').setAttribute('aria-expanded',String(open))};
$('importBtn').onclick=()=>$('file').click();$('file').onchange=async()=>{const f=$('file').files[0];if(!f)return;try{if(f.size>2*1024*1024)throw Error('Please use a CSV smaller than 2 MB.');const csv=await f.text(),next=core.parseCSV(csv);const label='Imported '+f.name+' · '+new Date().toLocaleString();let saved=true;try{localStorage.setItem(storageKey,JSON.stringify({csv,label}))}catch{saved=false}records=next;snapshot=label;categories();reset();$('message').textContent=`Loaded ${next.length} records. `+(saved?'Saved in this browser.':'Available this session only; browser storage is unavailable.')}catch(e){$('message').textContent=e.message+' Your current catalog is unchanged.'}finally{$('file').value=''}};
$('exportBtn').onclick=()=>{const blob=new Blob(['\uFEFF'+core.csv(current)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=node('a');a.href=url;a.download='bitwig-shortcuts-filtered.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('restoreBtn').onclick=()=>{if(!confirm('Replace this browser’s imported snapshot with the original screenshot catalog? Google Sheets will not change.'))return;try{localStorage.removeItem(storageKey)}catch{}records=BITWIG_DATA.rows;snapshot='Screenshot catalog · user corrections November 13, 2026';categories();reset();$('message').textContent='Original snapshot restored in this browser.'};
document.addEventListener('keydown',e=>{const editing=e.target.matches('input,select,textarea,[contenteditable]');if(e.key==='/'&&!editing&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();$('search').focus()}if(e.key==='Escape'&&['search','keys'].includes(e.target.id)){e.preventDefault();e.target.value='';render()}});
categories();render();
