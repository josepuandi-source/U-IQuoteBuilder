(function(){
/* U&I Quote Builder — app logic.
   Editable values live in assets/config.js and assets/courses.js. */
const C=window.QUOTE_CONFIG, COURSES=window.QUOTE_COURSES||[];
const STORE='uiq-builder-v1';
const NOTE=C.note;
const DEFAULT_SETTINGS=C.settings;

/* ---------- helpers ---------- */
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function parse(v){
  const s=String(v??'').trim(); if(!s) return {t:'blank'};
  const c=s.replace(/aud|php|\$|₱|,|\s/gi,'');
  if(/^-?\d+(\.\d+)?$/.test(c)) return {t:'num',n:parseFloat(c)};
  return {t:'text',s};
}
const num=v=>{const p=parse(v);return p.t==='num'?p.n:0};
const fmt=n=>(n<0?'-':'')+'$'+Math.abs(n).toLocaleString('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtP=n=>'₱'+n.toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const show=v=>{const p=parse(v);return p.t==='num'?fmt(p.n):p.t==='text'?p.s:'';};
const clone=o=>JSON.parse(JSON.stringify(o));

/* ---------- presets ---------- */
function presetItems(o,S){
  const off=o.mode==='OFFSHORE', dep=o.dependent;
  const it=[
    {key:'deposit',label:C.lines.deposit,amount:'',est:true},
    {key:'oshc',label:dep?C.lines.oshcCouple:C.lines.oshc,amount:dep?C.oshcCouple:C.oshcSingle,est:true},
    {key:'visa',label:C.lines.visa,amount:S.visa,est:false}
  ];
  if(dep) it.push({key:'depvisa',label:C.lines.depVisa,amount:S.depVisa,est:false});
  if(off){
    it.push({key:'sssf',label:C.lines.sssf,amount:dep?S.sssfDep:S.sssf,est:false});
    it.push({key:'ielts',label:C.lines.ielts,amount:'FREE',est:false});
  }
  return it;
}
function applyPreset(o,S,keepOld){
  const fresh=presetItems(o,S);
  if(keepOld){
    const old=o.items||[];
    fresh.forEach(f=>{const m=old.find(x=>x.key===f.key); if(m && (f.key==='deposit'||(f.key==='oshc'&&!/couple/i.test(m.label)===!o.dependent))) {f.amount=m.amount;f.est=m.est;}});
    old.filter(x=>!x.key).forEach(x=>fresh.push(x));
  }
  o.items=fresh;
  o.showPhp=o.mode==='OFFSHORE';
  o.pfc.travel=o.dependent?C.travel.couple:(o.mode==='OFFSHORE'?C.travel.offshore:C.travel.onshore);
}
function newOption(S){
  const o={mode:'OFFSHORE',dependent:false,duration:'',campus:'',school:'',course:'',intake:'',
    tuition:[{label:'',amount:''}],showTotal:true,items:[],showPhp:true,sssfDetail:true,
    pfc:{on:false,tuition:'',travel:C.travel.offshore}};
  applyPreset(o,S,false); return o;
}
function sampleQuote(S){
  const o=newOption(S);
  Object.assign(o,{duration:'2 years',campus:'Gold Coast',school:'Southern Cross University',course:'Master of Business Administration',intake:'February 2027',
    tuition:[{label:'Master of Business Administration (Total)',amount:'52,000'}]});
  o.items[0].amount='13,000'; o.items[1].amount='1,400';
  o.pfc={on:true,tuition:'26,000',travel:C.travel.offshore};
  return {student:'Maria',intro:true,all:true,active:0,options:[o],example:true};
}

/* ---------- state ---------- */
let S=clone(DEFAULT_SETTINGS), Q;
/* Saved staff settings are dropped when config.js `version` changes, so new fees reach everyone. */
try{const raw=localStorage.getItem(STORE); if(raw){const d=JSON.parse(raw); if(d.S&&d.v===C.version) S=Object.assign(clone(DEFAULT_SETTINGS),d.S); if(d.Q&&d.Q.options&&d.Q.options.length) Q=d.Q;}}catch(e){}
if(!Q) Q=sampleQuote(S);
const save=()=>{try{localStorage.setItem(STORE,JSON.stringify({v:C.version,S,Q}))}catch(e){}};
const cur=()=>Q.options[Q.active]||Q.options[0];
/* Courses staff save themselves. Kept in this browser under their own key, so they
   survive "New quote" and config version changes. Same shape as courses.js entries. */
const MY_STORE='uiq-my-courses-v1';
let MINE=[]; try{const m=JSON.parse(localStorage.getItem(MY_STORE)||'[]'); if(Array.isArray(m)) MINE=m;}catch(e){}
const saveMine=()=>{try{localStorage.setItem(MY_STORE,JSON.stringify(MINE))}catch(e){}};
const courseFrom=src=>{const [t,i]=String(src).split(':'); return t==='m'?MINE[+i]:COURSES[+i];};

/* ---------- row model (shared by HTML / text / PDF) ---------- */
function sssfLabel(o,it){
  if(it.key!=='sssf'||!o.sssfDetail) return it.label;
  const n=num(it.amount), half=n/2;
  return it.label+'\nThis fee covers:\n'+C.sssfCovers.map(x=>'• '+x).join('\n')+'\n\nPayment Schedule:\nAUD '+fmt(half)+' – '+C.sssfFirst+'\nAUD '+fmt(half)+' – '+C.sssfSecond;
}
function totals(o){
  const visa=o.items.reduce((a,i)=>a+num(i.amount),0);
  const tuit=o.tuition.reduce((a,i)=>a+num(i.amount),0);
  const pfcRows=[['Living Cost - Self (12 months)',num(S.living)]];
  if(o.dependent) pfcRows.push(['Living Cost - Dependent (12 months)',num(S.livingDep)]);
  pfcRows.push(['Tuition Cost (12 months)',num(o.pfc.tuition)],['Travel Cost',num(o.pfc.travel)]);
  const pfc=pfcRows.reduce((a,r)=>a+r[1],0);
  return {visa,tuit,pfcRows,pfc};
}
function rowsFor(o){
  const T=totals(o), rate=num(S.rate), R=[];
  const mode=o.mode+(o.dependent?' with Dependent':'');
  R.push({k:'meta',c:[mode,'Duration: '+o.duration],bold:true});
  R.push({k:'meta',c:['Campus Site: '+o.campus,'School Name: '+o.school]});
  R.push({k:'meta',c:['Course: '+o.course,'Intake: '+o.intake]});
  R.push({k:'head',c:['Expense Name','Amount']});
  const tRows=o.tuition.filter(t=>t.label||t.amount);
  tRows.forEach(t=>R.push({k:'row',c:[t.label,show(t.amount)]}));
  if(o.showTotal && tRows.filter(t=>parse(t.amount).t==='num').length>1) R.push({k:'sub',c:['TOTAL TUITION FEE',fmt(T.tuit)]});
  R.push({k:'section',c:['Quotation of Payment required to lodge student visa']});
  o.items.filter(i=>i.label||i.amount).forEach(i=>R.push({k:'row',c:[sssfLabel(o,i),show(i.amount)],est:i.est}));
  R.push({k:'total',c:['Total payment to be paid prior to visa lodgement',fmt(T.visa)]});
  if(o.showPhp) R.push({k:'php',c:['Conversion to Philippine Peso (1AUD ~ '+S.rate+')',fmtP(T.visa*rate)]});
  if(o.items.some(i=>i.est&&(i.label||i.amount))) R.push({k:'note',c:[NOTE]});
  let P=null;
  if(o.pfc.on){
    P=[{k:'head',c:['Proof of Financial Capacity','Amount']}];
    T.pfcRows.forEach(r=>P.push({k:'row',c:[r[0],fmt(r[1])]}));
    P.push({k:'total',c:['Total Proof of Financial Capacity Required',fmt(T.pfc)]});
    if(o.showPhp||o.mode==='OFFSHORE') P.push({k:'php',c:['Conversion to Philippine Peso (1AUD ~ '+S.rate+')',fmtP(T.pfc*rate)]});
  }
  return {R,P};
}
function missing(o){
  const m=[];
  if(!o.school) m.push('School'); if(!o.course) m.push('Course'); if(!o.duration) m.push('Duration'); if(!o.intake) m.push('Intake');
  if(!o.tuition.some(t=>t.amount)) m.push('Tuition fee');
  const d=o.items.find(i=>i.key==='deposit'); if(d&&!d.amount) m.push('Deposit');
  if(o.pfc.on&&!o.pfc.tuition) m.push('12-month tuition (financial capacity)');
  return m;
}

/* ---------- renderers ---------- */
const TD='border:1px solid #CFE3E0;padding:6px 10px;vertical-align:top;';
function tableHTML(rows){
  let h='<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#12110F;margin:0 0 14px">';
  rows.forEach(r=>{
    const red=r.est?'color:#c00000;':'';
    const lab=esc(r.c[0]).replace(/\n/g,'<br>');
    if(r.k==='section') h+=`<tr><td colspan="2" style="${TD}background:#E5F4F2;color:#00665F;font-weight:bold">${lab}</td></tr>`;
    else if(r.k==='note') h+=`<tr><td colspan="2" style="${TD}color:#c00000;font-style:italic;font-size:12px">${lab}</td></tr>`;
    else if(r.k==='head') h+=`<tr><td style="${TD}background:#007D74;color:#ffffff;font-weight:bold">${lab}</td><td style="${TD}background:#007D74;color:#ffffff;font-weight:bold;text-align:right">${esc(r.c[1])}</td></tr>`;
    else if(r.k==='meta') h+=`<tr><td style="${TD}background:#F2FAF9;${r.bold?'font-weight:bold;color:#007D74':''}">${lab}</td><td style="${TD}background:#F2FAF9">${esc(r.c[1])}</td></tr>`;
    else{
      const bg=r.k==='total'?'background:#D2EEEA;':r.k==='php'?'background:#F2FAF9;':'';
      const b=(r.k==='total'||r.k==='php'||r.k==='sub')?'font-weight:bold;':'';
      h+=`<tr><td style="${TD}${bg}${b}${red}">${lab}</td><td style="${TD}${bg}${b}${red}text-align:right;white-space:nowrap">${esc(r.c[1])}</td></tr>`;
    }
  });
  return h+'</table>';
}
function copy(k,multi){
  return C.email[k].replace(/\{name\}/g,Q.student||'there').replace(/\{options\}/g,multi?'options':'option')
    .replace(/\{these\}/g,multi?'these options':'this option').replace(/\{link\}/g,S.booking);
}
function optionsToRender(){return Q.all?Q.options:[cur()];}
const P_STYLE='font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#12110F;margin:0 0 12px;line-height:1.5';
function emailHTML(){
  const opts=optionsToRender(), multi=opts.length>1;
  let h='';
  if(Q.intro){
    h+=`<p style="${P_STYLE}">${esc(copy('greeting',multi))}</p>`;
    h+=`<p style="${P_STYLE}">${esc(copy('intro',multi))}</p>`;
  }
  opts.forEach((o,i)=>{
    const {R,P}=rowsFor(o);
    if(multi) h+=`<p style="${P_STYLE}font-weight:bold;font-size:15px;margin-top:18px">Option ${Q.options.indexOf(o)+1}: ${esc(o.course||'Course')}${o.school?' – '+esc(o.school):''}</p>`;
    h+=tableHTML(R); if(P) h+=tableHTML(P);
  });
  if(Q.intro){
    h+=`<p style="${P_STYLE}">${esc(copy('closing',multi)).replace(esc(S.booking),`<a href="${esc(S.booking)}" style="color:#007D74">${esc(S.booking)}</a>`)}</p>`;
  }
  return h;
}
function emailText(){
  const opts=optionsToRender(), multi=opts.length>1, L=[];
  if(Q.intro){L.push(copy('greeting',multi),'',copy('intro',multi),'');}
  opts.forEach(o=>{
    const {R,P}=rowsFor(o);
    if(multi) L.push('OPTION '+(Q.options.indexOf(o)+1)+': '+(o.course||'Course')+(o.school?' – '+o.school:''));
    [R,P].filter(Boolean).forEach(rows=>{
      rows.forEach(r=>{
        if(r.k==='meta') L.push(r.c[0]+' | '+r.c[1]);
        else if(r.k==='head') L.push('','— '+r.c[0]+' —');
        else if(r.k==='section') L.push('',r.c[0].toUpperCase());
        else if(r.k==='note') L.push('',r.c[0]);
        else L.push(r.c[0].split('\n')[0]+(r.est?' (estimate)':'')+': '+r.c[1]);
      });
    });
    L.push('');
  });
  if(Q.intro) L.push(copy('closing',multi));
  return L.join('\n');
}

/* ---------- form ---------- */
function tabsHTML(){
  return Q.options.map((o,i)=>`<button type="button" class="tab" role="tab" aria-selected="${i===Q.active}" data-act="tab" data-i="${i}">Option ${i+1}${o.school?' · '+esc(o.school.length>22?o.school.slice(0,21)+'…':o.school):''}</button>`).join('')
   +`<button type="button" class="small" data-act="add">+ Add option</button><button type="button" class="small" data-act="dup">Duplicate</button>`
   +(Q.options.length>1?`<button type="button" class="ghost small" data-act="del">Remove option</button>`:'');
}
const inp=(id,bind,val,cls='',ph='')=>`<input type="text" id="${id}" data-b="${bind}" value="${esc(val)}" class="${cls}" ${cls?'inputmode="decimal"':''} placeholder="${esc(ph)}">`;
function formHTML(){
  const o=cur(), a=Q.active, T=totals(o);
  const built=COURSES.map((c,i)=>`<option value="b:${i}">${esc(c.name)}</option>`).join('');
  const mine=MINE.map((c,i)=>`<option value="m:${i}">${esc(c.name)}</option>`).join('');
  const menu=MINE.length?(COURSES.length?`<optgroup label="U&amp;I courses">${built}</optgroup>`:'')+`<optgroup label="My saved courses">${mine}</optgroup>`:built;
  const loadedMine=o.mine&&MINE.some(c=>c.name===o.mine);
  const pick=`${(COURSES.length||MINE.length)?`<label class="f full">Load a saved course<select id="o${a}-load" data-act-load="1"><option value="">Choose a course to fill this option…</option>${menu}</select></label>`:''}
    <div class="inline full"><button type="button" class="small" data-act="save-course">Save as a course</button>${loadedMine?`<button type="button" class="ghost small" data-act="rm-course">Remove “${esc(o.mine)}” from my courses</button>`:''}</div>`;
  let h=`<fieldset><legend class="label">Course</legend><div class="fields">${pick}
    <label class="f">Student location<select id="o${a}-mode" data-b="mode" data-struct="mode"><option ${o.mode==='OFFSHORE'?'selected':''}>OFFSHORE</option><option ${o.mode==='ONSHORE'?'selected':''}>ONSHORE</option></select></label>
    <div class="f" style="justify-content:flex-end"><label class="check"><input type="checkbox" id="o${a}-dep" data-b="dependent" data-struct="mode" ${o.dependent?'checked':''}> With dependant (partner)</label></div>
    <label class="f full">School name${inp('o'+a+'-school','school',o.school,'','e.g. Southern Cross University')}</label>
    <label class="f full">Course${inp('o'+a+'-course','course',o.course,'','e.g. Master of Business Administration')}</label>
    <label class="f">Campus site${inp('o'+a+'-campus','campus',o.campus,'','e.g. Gold Coast')}</label>
    <label class="f">Duration${inp('o'+a+'-duration','duration',o.duration,'','e.g. 2 years / 104 weeks')}</label>
    <label class="f full">Intake${inp('o'+a+'-intake','intake',o.intake,'','e.g. February 2027')}</label>
  </div></fieldset>`;
  h+=`<fieldset><legend class="label">Tuition fees</legend><div class="rows">`;
  o.tuition.forEach((t,i)=>{h+=`<div class="row noest">${inp(`o${a}-t${i}-l`,`tuition.${i}.label`,t.label,'','Fee name, e.g. Annual tuition fee')}${inp(`o${a}-t${i}-a`,`tuition.${i}.amount`,t.amount,'num','0.00')}<button type="button" class="ghost" data-act="rm-t" data-i="${i}" aria-label="Remove fee row">✕</button></div>`;});
  h+=`</div><div class="inline" style="margin-top:8px"><button type="button" class="small" data-act="add-t">+ Fee row</button><label class="check"><input type="checkbox" id="o${a}-st" data-b="showTotal" ${o.showTotal?'checked':''}> Show total row</label></div>
  <p class="hint">Use a minus amount for scholarships (e.g. -23,568). Text like "TBA at Expo" or "$290/week" shows as typed and is left out of totals.</p></fieldset>`;
  h+=`<fieldset><legend class="label">Payable before visa lodgement</legend><div class="rows">`;
  o.items.forEach((it,i)=>{h+=`<div class="row">${inp(`o${a}-i${i}-l`,`items.${i}.label`,it.label)}${inp(`o${a}-i${i}-a`,`items.${i}.amount`,it.amount,'num','0.00')}<label class="est-toggle"><input type="checkbox" id="o${a}-i${i}-e" data-b="items.${i}.est" ${it.est?'checked':''}> Estimate</label><button type="button" class="ghost" data-act="rm-i" data-i="${i}" aria-label="Remove line">✕</button></div>`;});
  h+=`</div><div class="inline" style="margin-top:8px"><button type="button" class="small" data-act="add-i">+ Line</button><button type="button" class="small" data-act="reset">Reset to ${o.mode.toLowerCase()} preset</button>
    ${o.items.some(i=>i.key==='sssf')?`<label class="check"><input type="checkbox" id="o${a}-sd" data-b="sssfDetail" ${o.sssfDetail?'checked':''}> Show support fee breakdown</label>`:''}
    <label class="check"><input type="checkbox" id="o${a}-php" data-b="showPhp" ${o.showPhp?'checked':''}> Show PHP conversion</label></div>
    <div class="sumline"><span>Total before lodgement</span><span class="v" id="sum-visa">${fmt(T.visa)}</span></div>
    <p class="hint">Lines ticked "Estimate" print in red with the Letter of Offer note.</p></fieldset>`;
  h+=`<fieldset><legend class="label">Proof of financial capacity</legend>
    <label class="check"><input type="checkbox" id="o${a}-pfc" data-b="pfc.on" data-struct="1" ${o.pfc.on?'checked':''}> Include this table</label>`;
  if(o.pfc.on) h+=`<div class="fields" style="margin-top:10px">
      <label class="f">Tuition cost (12 months)${inp(`o${a}-pt`,'pfc.tuition',o.pfc.tuition,'num','0.00')}</label>
      <label class="f">Travel cost${inp(`o${a}-pv`,'pfc.travel',o.pfc.travel,'num','0.00')}</label>
    </div><div class="sumline"><span>Total required</span><span class="v" id="sum-pfc">${fmt(T.pfc)}</span></div>
    <p class="hint">Living costs come from Rates and standard fees${o.dependent?' (student + partner)':''}.</p>`;
  h+=`</fieldset>`;
  return h;
}

function renderForm(){$('#tabs').innerHTML=tabsHTML();$('#opt-form').innerHTML=formHTML();}
function renderPreview(){
  $('#paper').innerHTML=emailHTML();
  const m=missing(cur());
  $('#warn').innerHTML=(Q.example?'<span class="chip ok">Example data — replace before sending</span>':'')+(m.length?'<span>Option '+(Q.active+1)+' missing:</span>'+m.map(x=>`<span class="chip">${x}</span>`).join(''):'<span class="chip ok">Option '+(Q.active+1)+' complete</span>');
  const T=totals(cur()); const sv=$('#sum-visa'); if(sv) sv.textContent=fmt(T.visa); const sp=$('#sum-pfc'); if(sp) sp.textContent=fmt(T.pfc);
}
function renderAll(){
  $('#g-student').value=Q.student||''; $('#g-intro').checked=!!Q.intro; $('#g-all').checked=!!Q.all;
  Object.keys(DEFAULT_SETTINGS).forEach(k=>{const el=$('#s-'+k); if(el) el.value=S[k];});
  renderForm(); renderPreview(); save();
}

/* ---------- events ---------- */
function courseOf(o){
  const c={name:'',mode:o.mode,school:o.school,course:o.course,campus:o.campus,duration:o.duration,intake:o.intake,
    tuition:clone(o.tuition.filter(t=>t.label||t.amount))};
  const dep=o.items.find(x=>x.key==='deposit'); if(dep&&dep.amount) c.deposit=dep.amount;
  const os=o.items.find(x=>x.key==='oshc'); if(os&&os.amount&&!o.dependent) c.oshc=os.amount;
  if(o.pfc.on&&o.pfc.tuition) c.pfcTuition=o.pfc.tuition;
  return c;
}
function saveCourse(){
  const o=cur();
  if(!o.school&&!o.course){toast('Add a school or course name first.');return;}
  const suggest=o.mine||[o.school,o.course,o.campus].filter(Boolean).join(' · ');
  const name=(prompt('Name for this saved course (shown in the menu):',suggest)||'').trim(); if(!name) return;
  const c=courseOf(o); c.name=name;
  const at=MINE.findIndex(x=>x.name.toLowerCase()===name.toLowerCase());
  if(at>=0){ if(!confirm('“'+MINE[at].name+'” is already in your saved courses. Replace it?')) return; MINE[at]=c; }
  else MINE.push(c);
  MINE.sort((x,y)=>x.name.localeCompare(y.name));
  o.mine=name; saveMine(); renderForm(); save();
  toast((at>=0?'Updated ':'Saved ')+name+'. It is in the menu on this browser only.');
}
function removeCourse(){
  const o=cur(), at=MINE.findIndex(x=>x.name===o.mine); if(at<0) return;
  if(!confirm('Remove “'+o.mine+'” from your saved courses? The current quote is not changed.')) return;
  MINE.splice(at,1); saveMine(); toast('Removed '+o.mine+'.'); delete o.mine; renderForm(); save();
}
function loadCourse(src){
  const c=courseFrom(src); if(!c) return;
  const o=cur();
  if(String(src).startsWith('m:')) o.mine=c.name; else delete o.mine;
  o.mode=c.mode==='ONSHORE'?'ONSHORE':'OFFSHORE';
  ['school','course','campus','duration','intake'].forEach(k=>o[k]=c[k]||'');
  o.tuition=(c.tuition&&c.tuition.length)?clone(c.tuition):[{label:'',amount:''}];
  applyPreset(o,S,false);
  const dep=o.items.find(x=>x.key==='deposit'); if(dep&&c.deposit) dep.amount=c.deposit;
  const os=o.items.find(x=>x.key==='oshc'); if(os&&c.oshc&&!o.dependent) os.amount=c.oshc;
  o.pfc.on=!!c.pfcTuition; o.pfc.tuition=c.pfcTuition||'';
  Q.example=false; renderForm(); renderPreview(); save(); toast('Loaded '+c.name+'. Check the fees before sending.');
}
function setPath(obj,path,val){const ks=path.split('.');let t=obj;for(let i=0;i<ks.length-1;i++)t=t[ks[i]];t[ks[ks.length-1]]=val;}
document.addEventListener('input',e=>{
  const el=e.target, val=el.type==='checkbox'?el.checked:el.value;
  if(el.dataset.actLoad){ if(val!=='') loadCourse(val); return; }
  if(el.dataset.g){Q[el.dataset.g]=val;}
  else if(el.dataset.s){S[el.dataset.s]=val;}
  else if(el.dataset.b){
    Q.example=false;
    setPath(cur(),el.dataset.b,val);
    if(el.dataset.struct==='mode'){applyPreset(cur(),S,true);renderForm();}
    else if(el.dataset.struct){renderForm();}
    else if(el.dataset.b==='school'){$('#tabs').innerHTML=tabsHTML();}
  } else return;
  renderPreview(); save();
});
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-act]'); if(!b) return;
  const o=cur(), i=+b.dataset.i;
  switch(b.dataset.act){
    case 'tab': Q.active=i; break;
    case 'add': Q.options.push(newOption(S)); Q.active=Q.options.length-1; break;
    case 'dup': Q.options.splice(Q.active+1,0,clone(o)); Q.active++; break;
    case 'del': Q.options.splice(Q.active,1); Q.active=Math.max(0,Q.active-1); break;
    case 'add-t': o.tuition.push({label:'',amount:''}); break;
    case 'rm-t': o.tuition.splice(i,1); if(!o.tuition.length) o.tuition.push({label:'',amount:''}); break;
    case 'add-i': o.items.push({key:null,label:'',amount:'',est:false}); break;
    case 'rm-i': o.items.splice(i,1); break;
    case 'reset': applyPreset(o,S,true); break;
    case 'save-course': saveCourse(); return;
    case 'rm-course': removeCourse(); return;
    default: return;
  }
  Q.example=false; renderForm(); renderPreview(); save();
});

/* ---------- output actions ---------- */
let tt; function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,2600);}
function selectNode(n){const r=document.createRange();r.selectNodeContents(n);const s=getSelection();s.removeAllRanges();s.addRange(r);}
$('#btn-copy').addEventListener('click',()=>{
  const html=emailHTML(), text=emailText(), paper=$('#paper');
  const fallback=()=>{selectNode(paper);let ok=false;try{ok=document.execCommand('copy')}catch(_){}
    toast(ok?'Copied. Paste into your email.':'Quote selected. Press Ctrl+C (Cmd+C on Mac) to copy.'); if(ok) getSelection().removeAllRanges();};
  try{
    if(navigator.clipboard&&window.ClipboardItem){
      navigator.clipboard.write([new ClipboardItem({'text/html':new Blob([html],{type:'text/html'}),'text/plain':new Blob([text],{type:'text/plain'})})])
        .then(()=>toast('Copied. Paste into your email.')).catch(fallback);
    } else fallback();
  }catch(_){fallback();}
});
$('#btn-text').addEventListener('click',()=>{
  const text=emailText();
  const fb=()=>{const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(_){}ta.remove();toast(ok?'Plain text copied. Good for Messenger or Viber.':'Copy was blocked by the browser.');};
  try{navigator.clipboard.writeText(text).then(()=>toast('Plain text copied. Good for Messenger or Viber.')).catch(fb);}catch(_){fb();}
});
$('#btn-new').addEventListener('click',()=>{
  Q={student:'',intro:true,all:true,active:0,options:[newOption(S)],example:false};
  renderAll(); toast('Started a new quote.');
});

function buildPDF(){
  const {jsPDF}=window.jspdf; const doc=new jsPDF({unit:'pt',format:'a4'});
  const W=doc.internal.pageSize.getWidth(), M=40, clean=s=>String(s).replace(/₱/g,'PHP ');
  doc.setFont('helvetica','bold');doc.setFontSize(16);doc.setFillColor(0,125,116);doc.rect(0,0,W,8,'F');doc.setTextColor(0,125,116);doc.text(C.pdfTitle,M,52);
  doc.setFont('helvetica','normal');doc.setFontSize(10);doc.setTextColor(90,100,115);
  doc.text(C.org,M,68);
  const d=new Date().toLocaleDateString('en-AU',{day:'2-digit',month:'short',year:'numeric'});
  doc.text((Q.student?'Prepared for '+Q.student+'   ·   ':'')+d,W-M,68,{align:'right'});
  let y=86; const opts=optionsToRender(), multi=opts.length>1;
  const toBody=rows=>rows.map(r=>{
    const red=r.est?[192,0,0]:[18,17,15];
    if(r.k==='section') return [{content:r.c[0],colSpan:2,styles:{fillColor:[229,244,242],textColor:[0,102,95],fontStyle:'bold'}}];
    if(r.k==='note') return [{content:r.c[0],colSpan:2,styles:{textColor:[192,0,0],fontStyle:'italic',fontSize:8.5}}];
    if(r.k==='head') return [{content:r.c[0],styles:{fillColor:[0,125,116],textColor:255,fontStyle:'bold'}},{content:r.c[1],styles:{fillColor:[0,125,116],textColor:255,fontStyle:'bold',halign:'right'}}];
    if(r.k==='meta') return [{content:r.c[0],styles:{fillColor:[242,250,249],fontStyle:r.bold?'bold':'normal',textColor:r.bold?[0,125,116]:[18,17,15]}},{content:r.c[1],styles:{fillColor:[242,250,249]}}];
    const bold=['total','php','sub'].includes(r.k)?'bold':'normal', fill=r.k==='total'?[210,238,234]:r.k==='php'?[242,250,249]:false;
    return [{content:clean(r.c[0]),styles:{fontStyle:bold,textColor:red,fillColor:fill}},{content:clean(r.c[1]),styles:{fontStyle:bold,textColor:red,fillColor:fill,halign:'right'}}];
  });
  opts.forEach(o=>{
    const {R,P}=rowsFor(o);
    if(multi){ if(y>700){doc.addPage();y=50;} doc.setFont('helvetica','bold');doc.setFontSize(11.5);doc.setTextColor(27,36,48);
      doc.text('Option '+(Q.options.indexOf(o)+1)+': '+(o.course||'Course'),M,y+6); y+=16; }
    [R,P].filter(Boolean).forEach(rows=>{
      doc.autoTable({startY:y,margin:{left:M,right:M},theme:'grid',body:toBody(rows),
        styles:{font:'helvetica',fontSize:9.5,cellPadding:5,lineColor:[207,227,224],lineWidth:.6,textColor:[27,36,48],valign:'top'},
        columnStyles:{0:{cellWidth:'auto'},1:{cellWidth:130}}});
      y=doc.lastAutoTable.finalY+14;
    });
    y+=6;
  });
  return doc;
}
$('#btn-pdf').addEventListener('click',async()=>{
  if(!window.jspdf||!window.jspdf.jsPDF){toast('The PDF tool did not load. Check your connection and reload.');return;}
  const doc=buildPDF();
  const o=cur(); const name=['Quotation',Q.student,(Q.all&&Q.options.length>1)?'options':o.school].filter(Boolean).join(' - ').replace(/[\\/:*?"<>|]/g,'')+'.pdf';
  let dl=null; try{ if(window.claude&&window.claude.use) dl=await window.claude.use('downloads'); }catch(_){}
  if(dl){
    try{await dl.save({filename:name,data:doc.output('blob')});toast('PDF saved.');}
    catch(err){ if(err&&err.code==='declined') return; if(err&&err.code==='rate_limited'){toast('A save prompt is already open.');return;} toast('Saving is not available here.'); }
  } else { try{doc.save(name);toast('PDF downloaded.');}catch(_){toast('Saving is not available here.');} }
});

renderAll();
})();
