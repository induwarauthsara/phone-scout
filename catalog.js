/* Phone Finder snapshot and local, stock-checked offers. */
(() => {
 'use strict';
 const chosen = new Set();
 let onlyDifferences = false;
 const fields = [
  ['announced','Announced'], ['region','Market / variant'], ['chipset','Chipset'], ['display','Display'],
  ['battery','Battery'], ['wired','Wired charging'], ['wireless','Wireless charging'],
  ['rear','Rear cameras'], ['zoom','Optical telephoto'], ['selfie','Selfie camera'],
  ['video','Rear video'], ['storage','Storage options'], ['ram','RAM options'],
  ['os','Operating system'], ['ip','Water / dust rating'], ['usb','USB'], ['weight','Weight']
 ];
 const maxStockAge = 36 * 3600 * 1000;
 function fresh(offer, now) {
  const age = now - Date.parse(offer.stock?.checkedAt);
  return ['in_stock','low_stock'].includes(offer.stock?.status) && age >= 0 && age <= maxStockAge;
 }
 window.renderPhoneCatalog = ({app,data,el,add,link,header,badge,date,money}) => {
  const snapshot = data.catalog;
  if (!snapshot) {
   header('PHONE FINDER','Finder & compare','Reload the dashboard to load the finder snapshot.');
   return;
  }
  const models = snapshot.models;
  const now = Date.now();
  const live = snapshot.offers.filter(o => fresh(o,now)).sort((a,b) => a.priceLkr-b.priceLkr);
  const offerMap = new Map();
  for (const o of live) {
   if (!offerMap.has(o.modelId)) offerMap.set(o.modelId,[]);
   offerMap.get(o.modelId).push(o);
  }
  for (const id of chosen) if (!models.some(m=>m.id===id)) chosen.delete(id);
  header('DAILY PHONE FINDER','Find and compare phones','Browse every phone in the latest captured finder list. Compare up to three phones and their verified local offers.',badge(models.length+' phones'));
  const meta = el('div','notice');
  add(meta,el('p','', 'Finder checked '+date(snapshot.checkedAt)+' · '+snapshot.reportedCount+' reported results · '+live.length+' current stock-checked local offers.'),
   link('Open this snapshot’s finder filters',snapshot.sourceUrl));
  if (snapshot.reportedCount>models.length) meta.append(el('p','','GSMArena reported more results than were captured. Coverage is partial.'));
  if (snapshot.coverage) meta.append(el('p','small',snapshot.coverage));
  app.append(meta);

  const edit = el('details','rule finder-settings'), panel = el('div','details-text');
  const editForm = el('form','toolbar');
  const sourceInput = el('input'); sourceInput.type='url'; sourceInput.required=true;
  sourceInput.setAttribute('aria-label','GSMArena Phone Finder URL');
  sourceInput.value=data.finder?.sourceUrl || snapshot.sourceUrl;
  const isLocal = location.origin === 'http://127.0.0.1:8787' || location.origin === 'http://localhost:8787';
  const save = el('button','',isLocal?'Save for the next daily check':'Download finder settings'); save.type='submit';
  const status=el('p','small'); status.setAttribute('role','status');
  const note = el('p','small',isLocal
   ? 'Paste a filtered GSMArena URL and save it. The next daily check will use this link; the displayed snapshot updates after that check.'
   : 'The hosted dashboard cannot edit your local workspace. Download the settings and replace data/finder.json in Phone Scout, or save from the local dashboard.');
  const showSetting=()=>{status.textContent=sourceInput.value===snapshot.sourceUrl
   ? 'The saved link matches this snapshot.'
   : 'The saved link and the current snapshot use different filters.';};
  showSetting();
  editForm.onsubmit=async event=>{
   event.preventDefault();
   save.disabled=true;
   try {
    const u=new URL(sourceInput.value.trim());
    if(u.origin!=='https://www.gsmarena.com'||u.username||u.password||!['/search.php3','/results.php3'].includes(u.pathname)||!u.search||u.href.length>3000)
     throw new Error('Use a filtered GSMArena Phone Finder or results link.');
    u.pathname='/results.php3'; u.hash='';
    if(isLocal){
     const r=await fetch('/api/finder',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sourceUrl:u.href})});
     const result=await r.json();
     if(!r.ok)throw new Error(result.error||'Could not save the finder link.');
     data.finder=result; sourceInput.value=result.sourceUrl;
     status.textContent='Saved. The next daily check will use the new link.';
    }else{
     const uri=URL.createObjectURL(new Blob([JSON.stringify({sourceUrl:u.href},null,2)+'\n'],{type:'application/json'}));
     const a=el('a');a.href=uri;a.download='finder.json';a.click();
     setTimeout(()=>URL.revokeObjectURL(uri),1000);
     status.textContent='Downloaded finder.json. Replace data/finder.json in your Phone Scout workspace to change the next daily check.';
    }
   }catch(error){status.textContent=error.message;}finally{save.disabled=false;}
  };
  add(editForm,sourceInput,save); add(panel,note,editForm,status); add(edit,el('summary','','Change the daily GSMArena link'),panel); app.append(edit);

  const compare=el('section','catalog-compare'), grid=el('div','model-grid catalog-grid'), toolbar=el('div','toolbar');
  const query=el('input'); query.type='search'; query.placeholder='Search phones or chipsets';
  query.setAttribute('aria-label','Search finder phones');
  const filter=el('select');filter.setAttribute('aria-label','Local availability');
  for(const [v,t] of [['all','All phones'],['stock','With verified local stock'],['budget','Local cash price within budget']]){
   const op=el('option','',t);op.value=v;filter.append(op);
  }
  const count=el('span','result-count');count.setAttribute('aria-live','polite');
  const message=el('p','small');message.setAttribute('role','status');
  const offersFor=m=>offerMap.get(m.id)||[];
  const toggle=(id,button)=>{
   if(chosen.has(id))chosen.delete(id);
   else if(chosen.size===3){message.textContent='Remove one phone before selecting another.';return;}
   else chosen.add(id);
   message.textContent='';
   drawCompare();
   for(const b of grid.querySelectorAll('button[data-phone]'))setPick(b,b.dataset.phone);
   if(button && !button.isConnected)compare.querySelector('select')?.focus();
  };
  const setPick=(b,id)=>{const picked=chosen.has(id);b.textContent=picked?'Remove from comparison':'Add to comparison';b.setAttribute('aria-pressed',String(picked));};
  function offerDetails(m){
   const stack=el('div','catalog-offers');
   const options=offersFor(m);
   if(!options.length){stack.append(el('p','small','No currently verified local stock.'));return stack;}
   for(const o of options){
    const row=el('div','catalog-offer');
    add(row,link(o.seller+' · '+money(o.priceLkr),o.url),el('p','small',o.location+' · '+o.variant+' · '+o.condition),
     badge(o.priceLkr>data.profile.budgetMax?'Above cash budget':'Within cash budget',o.priceLkr>data.profile.budgetMax?'amber':'neutral'),
     el('p','small',o.priceEvidence+' · '+o.stock.evidence+' · '+date(o.stock.checkedAt)));
    if(o.kokoTotalLkr)row.append(el('p','small','Advertised KOKO total: '+money(o.kokoTotalLkr)));
    stack.append(row);
   }
   return stack;
  }
  function drawCompare(){
   compare.replaceChildren();
   const picks=models.filter(m=>chosen.has(m.id)).sort((a,b)=>[...chosen].indexOf(a.id)-[...chosen].indexOf(b.id));
   const heading=el('div','section-top');
   add(heading,el('h2','','Compare phones'),badge(picks.length+' / 3 selected','neutral'));
   compare.append(heading);
   const controls=el('div','toolbar');
   const picker=el('select');picker.setAttribute('aria-label','Add phone to comparison');
   const placeholder=el('option','','Choose a phone to compare');placeholder.value='';picker.append(placeholder);
   for(const m of models.filter(p=>!chosen.has(p.id))){const op=el('option','',m.name);op.value=m.id;picker.append(op);}
   picker.disabled=chosen.size>=3;picker.onchange=()=>{if(picker.value)toggle(picker.value,picker);};
   add(controls,picker);
   if(picks.length){
    const clear=el('button','','Clear selection');clear.type='button';
    clear.onclick=()=>{chosen.clear();message.textContent='';drawCompare();for(const b of grid.querySelectorAll('button[data-phone]'))setPick(b,b.dataset.phone);compare.querySelector('select')?.focus();};
    add(controls,clear);
   }
   if(picks.length>1){
    const label=el('label','compare-toggle');const check=el('input');check.type='checkbox';check.checked=onlyDifferences;
    check.onchange=()=>{onlyDifferences=check.checked;drawCompare();compare.querySelector('input[type=checkbox]')?.focus();};
    add(label,check,el('span','','Differences only'));add(controls,label);
   }
   add(compare,controls);
   if(!picks.length){compare.append(el('p','sub','Select phones above or from the list below.'));return;}
   const wrap=el('div','comparison-scroll');wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','Phone specs and verified local prices');
   const table=el('table','comparison-table');const head=el('thead');const tr=el('tr');
   const col=el('th','','Specification');col.scope='col';tr.append(col);
   for(const m of picks){
    const th=el('th');th.scope='col';
    const remove=el('button','compare-remove','Remove');remove.type='button';remove.setAttribute('aria-label','Remove '+m.name+' from comparison');
    remove.onclick=()=>toggle(m.id,remove);
    add(th,link(m.name,m.url),remove);tr.append(th);
   }
   add(head,tr);table.append(head);
   const body=el('tbody');
   const row=(label,values)=>{const r=el('tr');const h=el('th','',label);h.scope='row';r.append(h);for(const v of values){const c=el('td');typeof v==='string'?c.textContent=v:c.append(v);r.append(c);}body.append(r);};
   for(const [key,label] of fields){
    const values=picks.map(m=>m.specs[key]||'Not verified');
    if(values.every(v=>v==='Not verified')||(picks.length>1&&onlyDifferences&&new Set(values).size===1))continue;
    row(label,values);
   }
   row('Verified local offers',picks.map(offerDetails));
   table.append(body);wrap.append(table);compare.append(wrap);
  }
  function drawGrid(){
   const needle=query.value.trim().toLowerCase();
   const filtered=models.filter(m=>(m.name+' '+(m.specs.chipset||'')).toLowerCase().includes(needle)&&
    (filter.value==='all'||offersFor(m).some(o=>filter.value==='stock'||o.priceLkr<=data.profile.budgetMax)));
   count.textContent=filtered.length+' of '+models.length+' phones';
   grid.replaceChildren();
   for(const m of filtered){
    const card=el('article','model-card catalog-card');
    add(card,el('h3','',m.name),el('p','',[m.specs.chipset,m.specs.battery,m.specs.zoom].filter(Boolean).join(' · ')));
    if(m.specs.zoom && /^\d+(?:\.\d+)?×/.test(m.specs.zoom) && parseFloat(m.specs.zoom)<3)card.append(badge('Below your 3× optical target','amber'));
    add(card,offerDetails(m));
    const actions=el('div','tags');
    const b=el('button');b.type='button';b.dataset.phone=m.id;b.onclick=()=>toggle(m.id,b);setPick(b,m.id);
    add(actions,b,link('Full specs',m.url));card.append(actions);grid.append(card);
   }
   if(!filtered.length)grid.append(el('p','sub','No phones match this view.'));
  }
  query.oninput=filter.onchange=drawGrid;
  add(toolbar,query,filter,count);add(app,compare,message,el('h2','','Finder matches'),toolbar,grid);
  drawCompare();drawGrid();
 };
})();
