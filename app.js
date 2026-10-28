/* INNOVA Afiliaciones v2 — conserva la base local existente (IndexedDB). */
(() => {
'use strict';
const DB_NAME='innova-afiliaciones-db', DB_VERSION=2;
let db, deferredInstall=null;
const $=id=>document.getElementById(id);
const today=()=>new Date().toISOString().slice(0,10);
const monthNow=()=>today().slice(0,7);
const money=n=>new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(Number(n)||0);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2800)}
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains('people')){const s=d.createObjectStore('people',{keyPath:'id'});s.createIndex('document','document',{unique:true})}if(!d.objectStoreNames.contains('payments')){const s=d.createObjectStore('payments',{keyPath:'id'});s.createIndex('month','month');s.createIndex('personId','personId')}if(!d.objectStoreNames.contains('recruiters')){const s=d.createObjectStore('recruiters',{keyPath:'id'});s.createIndex('name','name')}};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
function all(store){return new Promise((resolve,reject)=>{const r=db.transaction(store,'readonly').objectStore(store).getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function put(store,obj){return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).put(obj);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
function del(store,id){return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
function clearStore(store){return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite');tx.objectStore(store).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
function uid(){return crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)}
function showTab(key){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===key));['dashboard','people','recruiters','payments','reports','backup'].forEach(k=>$(k+'Panel').classList.toggle('hidden',k!==key))}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
function getRecruiterName(id,recruiters){return recruiters.find(r=>r.id===id)?.name||'Sin reclutadora'}
function totalsFor(month,payments){const ps=payments.filter(p=>p.month===month);const income=ps.reduce((s,p)=>s+Number(p.amount||0),0);const box=ps.reduce((s,p)=>s+Number(p.boxCost||0),0);const commission=ps.reduce((s,p)=>s+Number(p.commission||0),0);return {ps,income,box,commission,profit:income-box-commission,boxPaid:ps.filter(p=>p.boxPaid).reduce((s,p)=>s+Number(p.boxCost||0),0),commissionPaid:ps.filter(p=>p.commissionPaid).reduce((s,p)=>s+Number(p.commission||0),0)}}
async function refresh(){
 const [people,payments,recruiters]=await Promise.all([all('people'),all('payments'),all('recruiters')]);
 const peopleMap=new Map(people.map(p=>[p.id,p]));
 $('totalCount').textContent=people.length;
 $('blockedCount').textContent=people.filter(p=>p.blocked||p.status==='Bloqueado').length;
 const m=$('dashMonth').value||monthNow();const t=totalsFor(m,payments);
 $('monthIncome').textContent=money(t.income);$('monthProfit').textContent=money(t.profit);
 $('dashCollected').textContent=money(t.income);$('dashBox').textContent=money(t.box);$('dashCommission').textContent=money(t.commission);$('dashProfit').textContent=money(t.profit);
 $('statusSummary').innerHTML=`<div class="summary-row"><span>Activos y no bloqueados</span><b>${people.filter(p=>p.status!=='Inactivo'&&!p.blocked&&p.status!=='Bloqueado').length}</b></div><div class="summary-row"><span>Bloqueados manualmente</span><b>${people.filter(p=>p.blocked||p.status==='Bloqueado').length}</b></div><div class="summary-row"><span>Inactivos</span><b>${people.filter(p=>p.status==='Inactivo').length}</b></div>`;
 const byRecruiter=recruiters.map(r=>({r,total:t.ps.filter(p=>p.recruiterId===r.id).reduce((s,p)=>s+Number(p.amount||0),0),count:new Set(t.ps.filter(p=>p.recruiterId===r.id).map(p=>p.personId)).size,comm:t.ps.filter(p=>p.recruiterId===r.id).reduce((s,p)=>s+Number(p.commission||0),0)})).filter(x=>x.count||x.total);
 $('recruiterSummary').innerHTML=byRecruiter.length?byRecruiter.map(x=>`<div class="summary-row"><span>${esc(x.r.name)} · ${x.count} afiliado(s)</span><b>${money(x.total)}<small> Comisión: ${money(x.comm)}</small></b></div>`).join(''):'<p class="muted">Sin pagos de reclutadoras en este mes.</p>';
 const q=$('searchInput').value.trim().toLocaleLowerCase('es');
 const shown=people.filter(p=>(p.name+' '+p.document+' '+(p.phone||'')).toLocaleLowerCase('es').includes(q)).sort((a,b)=>a.name.localeCompare(b.name,'es'));
 $('peopleList').innerHTML=shown.map(p=>{const blocked=!!p.blocked||p.status==='Bloqueado';return `<article class="person-card"><div class="avatar">${esc(p.name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase())}</div><div class="card-main"><strong>${esc(p.name)}</strong><p>Documento: ${esc(p.document)}</p><p>${esc(p.phone||'Sin teléfono')} · Cuota: ${money(p.fee)}</p><p>Reclutadora: ${esc(getRecruiterName(p.recruiterId,recruiters))}</p><span class="pill ${blocked?'blocked':p.status==='Inactivo'?'off':''}">${blocked?'BLOQUEADO':esc(p.status||'Activo')}</span>${blocked&&p.blockReason?`<p>Motivo: ${esc(p.blockReason)}</p>`:''}</div><div class="card-actions"><button class="mini" data-edit-person="${p.id}">Editar</button><button class="mini" data-toggle-block="${p.id}">${blocked?'Desbloquear':'Bloquear'}</button>${p.status==='Inactivo'?`<button class="mini" data-reactivate-person="${p.id}">Reactivar</button>`:`<button class="mini" data-baja-person="${p.id}">Dar de baja</button>`}<button class="mini" data-person-pay="${p.id}">Pago</button></div></article>`}).join('');
 $('emptyPeople').classList.toggle('hidden',shown.length>0);
 $('personRecruiter').innerHTML='<option value="">Sin reclutadora</option>'+recruiters.filter(r=>r.status!=='Inactiva').sort((a,b)=>a.name.localeCompare(b.name,'es')).map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('');
 $('paymentPerson').innerHTML='<option value="">Selecciona un afiliado</option>'+people.filter(p=>p.status!=='Inactivo').sort((a,b)=>a.name.localeCompare(b.name,'es')).map(p=>`<option value="${p.id}">${esc(p.name)} — ${esc(p.document)}${p.blocked?' [BLOQUEADO]':''}</option>`).join('');
 $('recruiterList').innerHTML=recruiters.sort((a,b)=>a.name.localeCompare(b.name,'es')).map(r=>{const assigned=people.filter(p=>p.recruiterId===r.id).length;const monthPayments=t.ps.filter(p=>p.recruiterId===r.id);return `<article class="person-card"><div class="avatar"><span>R</span></div><div class="card-main"><strong>${esc(r.name)}</strong><p>${esc(r.phone||'Sin teléfono')} · ${assigned} afiliado(s)</p><p>Comisión predeterminada: ${money(r.commission)}</p><span class="pill ${r.status==='Inactiva'?'off':''}">${esc(r.status||'Activa')}</span><p>Recaudo ${m}: ${money(monthPayments.reduce((s,p)=>s+Number(p.amount||0),0))} · Comisión: ${money(monthPayments.reduce((s,p)=>s+Number(p.commission||0),0))}</p></div><div class="card-actions"><button class="mini" data-edit-recruiter="${r.id}">Editar</button></div></article>`}).join('');
 $('emptyRecruiters').classList.toggle('hidden',recruiters.length>0);
 $('paymentList').innerHTML=payments.sort((a,b)=>(b.date||'').localeCompare(a.date||'')).map(p=>{const person=peopleMap.get(p.personId);return `<article class="payment-card">${p.photo?`<img class="receipt" src="${p.photo}" alt="Comprobante">`:'<div class="avatar">$</div>'}<div class="card-main"><strong>${esc(person?.name||'Afiliado eliminado')}</strong><p>${esc(p.month)} · Recaudo: ${esc(p.date)}</p><p>Recibido: <b>${money(p.amount)}</b> · Caja: ${money(p.boxCost)} · Comisión: ${money(p.commission)}</p><p>Paga: ${esc(p.payerName||'No indicado')} · Comprobante: ${esc(p.receiptDate||p.date||'Sin fecha')} ${esc(p.receiptTime||'')}</p>${p.receiptReference?`<p>Referencia: ${esc(p.receiptReference)}</p>`:''}<p>${p.boxPaid?'Caja pagada':'Caja pendiente'} · ${p.commissionPaid?'Comisión pagada':'Comisión pendiente'}</p>${p.notes?`<p>${esc(p.notes)}</p>`:''}</div><div class="card-actions"><button class="mini" data-delete-payment="${p.id}">Eliminar</button></div></article>`}).join('');
 $('emptyPayments').classList.toggle('hidden',payments.length>0);
 renderReport($('reportMonth').value||monthNow(),people,payments,recruiters);
}
function renderReport(month,people,payments,recruiters){const t=totalsFor(month,payments);$('rIncome').textContent=money(t.income);$('rBox').textContent=money(t.box);$('rCommission').textContent=money(t.commission);$('rProfit').textContent=money(t.profit);
 const max=Math.max(t.income,t.box,t.commission,Math.abs(t.profit),1);const bars=[['Ingresos',t.income],['Caja',t.box],['Comisiones',t.commission],['Ganancia',t.profit]];$('reportBars').innerHTML=bars.map(([label,value])=>`<div class="bar-row"><span>${label}</span><div class="bar-track"><div class="bar-fill ${label==='Ganancia'?'gold':''}" style="width:${Math.min(100,Math.abs(value)/max*100)}%"></div></div><b>${money(value)}</b></div>`).join('');
 const ps=payments.filter(p=>p.month===month);const pmap=new Map(people.map(p=>[p.id,p]));const grouped=new Map();
 ps.forEach(p=>{const person=pmap.get(p.personId);const key=p.recruiterId||person?.recruiterId||'none';if(!grouped.has(key))grouped.set(key,[]);grouped.get(key).push({p,person})});
 $('reportDetails').innerHTML=grouped.size?[...grouped.entries()].map(([rid,items])=>{const rec=getRecruiterName(rid,recruiters);const subtotal=items.reduce((s,x)=>s+Number(x.p.amount||0),0);return `<section class="report-group"><div class="report-group-head"><strong>${esc(rec)}</strong><b>${money(subtotal)}</b></div>${items.map(({p,person})=>`<div class="summary-row detail-row"><span>${esc(person?.name||'Afiliado eliminado')}<small>${esc(p.month)} · ${esc(person?.document||'')}</small></span><b>${money(p.amount)}<small>Caja ${money(p.boxCost)} · Comisión ${money(p.commission)}</small></b></div>`).join('')}</section>`}).join(''):'<p class="empty">No hay pagos registrados para este mes.</p>';
}
function resetPerson(){ $('personForm').reset();$('personId').value='';$('personDialogTitle').textContent='Nuevo afiliado';$('personStatus').value='Activo';$('personBlocked').checked=false;$('personFee').value='';$('personBoxCost').value='';$('personCommission').value=''}
async function openPerson(p){resetPerson();if(p){$('personDialogTitle').textContent='Editar afiliado';for(const [k,id] of Object.entries({id:'personId',name:'personName',document:'personDocument',phone:'personPhone',recruiterId:'personRecruiter',fee:'personFee',boxCost:'personBoxCost',commission:'personCommission',start:'personStart',status:'personStatus',notes:'personNotes',blockReason:'personBlockReason'}))$(id).value=p[k]??'';$('personBlocked').checked=!!p.blocked||p.status==='Bloqueado'}$('personDialog').showModal()}
$('newPersonBtn').addEventListener('click',()=>openPerson());
$('closePersonDialog').addEventListener('click',()=>$('personDialog').close());
$('personRecruiter').addEventListener('change',async()=>{if(Number($('personCommission').value)>0)return;const r=(await all('recruiters')).find(x=>x.id===$('personRecruiter').value);if(r)$('personCommission').value=Number(r.commission)||0});
$('personForm').addEventListener('submit',async e=>{e.preventDefault();const id=$('personId').value||uid();const status=$('personStatus').value;const p={id,name:$('personName').value.trim(),document:$('personDocument').value.trim(),phone:$('personPhone').value.trim(),recruiterId:$('personRecruiter').value,fee:Number($('personFee').value)||0,boxCost:Number($('personBoxCost').value)||0,commission:Number($('personCommission').value)||0,start:$('personStart').value,status,blocked:$('personBlocked').checked,blockReason:$('personBlockReason').value.trim(),notes:$('personNotes').value.trim(),updatedAt:new Date().toISOString()};if(!p.name||!p.document)return toast('Completa nombre y documento.');try{const people=await all('people');if(people.some(x=>x.document===p.document&&x.id!==id))return toast('Ya existe un afiliado con ese documento.');await put('people',p);$('personDialog').close();await refresh();toast('Afiliado guardado.')}catch(err){toast('No se pudo guardar: '+err.message)}});
$('peopleList').addEventListener('click',async e=>{const edit=e.target.closest('[data-edit-person]'),toggle=e.target.closest('[data-toggle-block]'),pay=e.target.closest('[data-person-pay]'),baja=e.target.closest('[data-baja-person]'),reactivate=e.target.closest('[data-reactivate-person]');const people=await all('people');if(edit){const p=people.find(x=>x.id===edit.dataset.editPerson);if(p)openPerson(p)}if(toggle){const p=people.find(x=>x.id===toggle.dataset.toggleBlock);if(p){p.blocked=!(p.blocked||p.status==='Bloqueado');if(!p.blocked)p.blockReason='';else if(!p.blockReason)p.blockReason='Bloqueo manual del administrador';await put('people',p);await refresh();toast(p.blocked?'Afiliado bloqueado manualmente.':'Afiliado desbloqueado.')}}if(baja){const p=people.find(x=>x.id===baja.dataset.bajaPerson);if(p&&confirm('¿Dar de baja a '+p.name+'? Se conservarán su ficha y todos sus pagos históricos.')){p.status='Inactivo';p.bajaAt=new Date().toISOString();p.bajaReason=prompt('Motivo de la baja (opcional):','')||'';await put('people',p);await refresh();toast('Afiliado dado de baja; historial conservado.')}}if(reactivate){const p=people.find(x=>x.id===reactivate.dataset.reactivatePerson);if(p&&confirm('¿Reactivar a '+p.name+'?')){p.status='Activo';p.bajaAt='';p.bajaReason='';await put('people',p);await refresh();toast('Afiliado reactivado.')}}if(pay){const p=people.find(x=>x.id===pay.dataset.personPay);if(p){$('paymentPerson').value=p.id;$('paymentAmount').value=p.fee||'';$('paymentBoxCost').value=p.boxCost||0;$('paymentCommission').value=p.commission||0;$('payerName').value=p.name;$('receiptDate').value=today();showTab('payments');$('paymentMonth').focus()}}});
$('searchInput').addEventListener('input',refresh);
function resetRecruiter(){ $('recruiterForm').reset();$('recruiterId').value='';$('recruiterDialogTitle').textContent='Nueva reclutadora';$('recruiterStatus').value='Activa';$('recruiterCommission').value='0'}
async function openRecruiter(r){resetRecruiter();if(r){$('recruiterDialogTitle').textContent='Editar reclutadora';for(const [k,id] of Object.entries({id:'recruiterId',name:'recruiterName',phone:'recruiterPhone',document:'recruiterDocument',commission:'recruiterCommission',status:'recruiterStatus',notes:'recruiterNotes'}))$(id).value=r[k]??''}$('recruiterDialog').showModal()}
$('newRecruiterBtn').addEventListener('click',()=>openRecruiter());
$('closeRecruiterDialog').addEventListener('click',()=>$('recruiterDialog').close());
$('recruiterForm').addEventListener('submit',async e=>{e.preventDefault();const r={id:$('recruiterId').value||uid(),name:$('recruiterName').value.trim(),phone:$('recruiterPhone').value.trim(),document:$('recruiterDocument').value.trim(),commission:Number($('recruiterCommission').value)||0,status:$('recruiterStatus').value,notes:$('recruiterNotes').value.trim(),updatedAt:new Date().toISOString()};if(!r.name)return toast('Escribe el nombre de la reclutadora.');await put('recruiters',r);$('recruiterDialog').close();await refresh();toast('Reclutadora guardada.')});
$('recruiterList').addEventListener('click',async e=>{const b=e.target.closest('[data-edit-recruiter]');if(b){const r=(await all('recruiters')).find(x=>x.id===b.dataset.editRecruiter);if(r)openRecruiter(r)}});
$('paymentDate').value=today();$('receiptDate').value=today();$('paymentMonth').value=monthNow();$('dashMonth').value=monthNow();$('reportMonth').value=monthNow();
$('paymentPerson').addEventListener('change',async()=>{const person=(await all('people')).find(p=>p.id===$('paymentPerson').value);if(person&&!$('payerName').value.trim())$('payerName').value=person.name;});
function extractReceiptFields(text){
 const lines=text.split(/\r?\n/).map(x=>x.replace(/\s+/g,' ').trim()).filter(Boolean);
 const cleanName=x=>x.replace(/^[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/,'').replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ .'-]+$/,'').trim();
 // Date in numeric or Spanish long format, e.g. "27 de octubre de 2026"
 let m=text.match(/\b([0-3]?\d)[\/.-]([01]?\d)[\/.-]((?:20)?\d{2})\b/);
 if(m){let y=m[3];if(y.length===2)y='20'+y;$('receiptDate').value=`${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`}
 else {
   m=text.match(/\b([0-3]?\d)\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+(20\d{2})/i);
   if(m){const months={enero:'01',febrero:'02',marzo:'03',abril:'04',mayo:'05',junio:'06',julio:'07',agosto:'08',septiembre:'09',setiembre:'09',octubre:'10',noviembre:'11',diciembre:'12'};$('receiptDate').value=`${m[3]}-${months[m[2].toLowerCase()]}-${m[1].padStart(2,'0')}`}
   else {m=text.match(/\b(20\d{2})-([01]\d)-([0-3]\d)\b/);if(m)$('receiptDate').value=`${m[1]}-${m[2]}-${m[3]}`}
 }
 m=text.match(/\b([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?\s*(?:(a|p)\s*\.?\s*m\.?)?/i);
 if(m){let h=Number(m[1]);if(m[3]&&m[3].toLowerCase()==='p'&&h<12)h+=12;if(m[3]&&m[3].toLowerCase()==='a'&&h===12)h=0;$('receiptTime').value=String(h).padStart(2,'0')+':'+m[2]}
 // The example receipt labels the payer as "De" on its own line.
 let idx=lines.findIndex(line=>/^de\s*[:\-]?$/i.test(line));
 if(idx>=0&&lines[idx+1]){const candidate=cleanName(lines[idx+1]);if(candidate.length>4&&/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(candidate))$('payerName').value=candidate}
 if(!$('payerName').value.trim()){
   const named=lines.find(line=>/(pagad[oa]\s+por|nombre\s+(del\s+)?pagador|titular|persona\s+que\s+paga|realizad[oa]\s+por|cliente)\s*[:\-]/i.test(line));
   if(named){const candidate=cleanName(named.replace(/^.*?(pagad[oa]\s+por|nombre\s+(del\s+)?pagador|titular|persona\s+que\s+paga|realizad[oa]\s+por|cliente)\s*[:\-]?\s*/i,''));if(candidate.length>3&&candidate.length<121)$('payerName').value=candidate}
 }
 // Amount below "¿Cuánto?" / "Cuanto?" and Colombian currency formatting.
 const amountIndex=lines.findIndex(line=>/cu[aá]nto/i.test(line));
 let amountLine=amountIndex>=0?lines.slice(amountIndex+1,amountIndex+3).find(line=>/\d/.test(line)):lines.find(line=>/\$\s*[\d.,]+/.test(line));
 if(amountLine){
   const am=amountLine.match(/\$?\s*([\d.]+(?:,\d{1,2})?)/);
   if(am){let n=am[1].replace(/\./g,'').replace(',','.');const value=Number(n);if(Number.isFinite(value)&&value>=0)$('paymentAmount').value=String(value)}
 }
 // Reference may appear on the next line after "Referencia".
 const refIdx=lines.findIndex(line=>/referencia/i.test(line));
 if(refIdx>=0&&lines[refIdx+1]){const candidate=lines[refIdx+1].replace(/[^A-Za-z0-9-]/g,'');if(candidate.length>=5)$('receiptReference').value=candidate}
 else {m=text.match(/referencia\s*[:\-]?\s*([A-Z0-9-]{5,})/i);if(m)$('receiptReference').value=m[1]}
}
async function makeOcrImages(file){
 const img=await createImageBitmap(file);
 const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
 // OCR the full image and a magnified crop of the lower transaction details.
 canvas.width=img.width;canvas.height=img.height;ctx.drawImage(img,0,0);
 const full=canvas;
 const crop=document.createElement('canvas');
 const sx=0, sy=Math.floor(img.height*0.42), sw=img.width, sh=Math.floor(img.height*0.38);
 crop.width=sw*2;crop.height=sh*2;
 const c=crop.getContext('2d');c.drawImage(img,sx,sy,sw,sh,0,0,crop.width,crop.height);
 const imageData=c.getImageData(0,0,crop.width,crop.height);
 for(let i=0;i<imageData.data.length;i+=4){
   const gray=(imageData.data[i]*0.299+imageData.data[i+1]*0.587+imageData.data[i+2]*0.114);
   const contrast=Math.max(0,Math.min(255,(gray-128)*1.45+128));
   imageData.data[i]=imageData.data[i+1]=imageData.data[i+2]=contrast;
 }
 c.putImageData(imageData,0,0);
 return {full,crop};
}
$('ocrBtn').addEventListener('click',async()=>{
 const file=$('paymentPhoto').files[0];
 if(!file){toast('Primero selecciona la foto del comprobante.');return}
 if(!window.Tesseract){$('ocrStatus').textContent='No se cargó el motor OCR. Conéctate a internet y recarga la app, o escribe los datos manualmente.';return}
 $('ocrBtn').disabled=true;$('ocrStatus').textContent='Mejorando imagen y leyendo el comprobante...';
 try{
  const images=await makeOcrImages(file);
  const logger=m=>{if(m.status==='recognizing text')$('ocrStatus').textContent='Reconociendo texto: '+Math.round((m.progress||0)*100)+'%'};
  const opts={logger, tessedit_pageseg_mode:6, preserve_interword_spaces:'1'};
  const fullResult=await Tesseract.recognize(images.full,'spa+eng',opts);
  const cropResult=await Tesseract.recognize(images.crop,'spa+eng',opts);
  const fullText=fullResult.data.text||'', cropText=cropResult.data.text||'';
  // Put the focused detail crop first so its clearer field labels are available to extraction.
  const text=(cropText.trim()?cropText.trim()+'\n\n--- Texto de la imagen completa ---\n'+fullText.trim():fullText).trim();
  $('ocrText').value=text;extractReceiptFields(cropText+'\n'+fullText);
  const detected=[];
  if($('payerName').value.trim())detected.push('nombre');
  if($('receiptDate').value)detected.push('fecha');
  if($('receiptTime').value)detected.push('hora');
  if($('paymentAmount').value)detected.push('valor');
  if($('receiptReference').value)detected.push('referencia');
  $('ocrStatus').textContent=detected.length?'Datos detectados: '+detected.join(', ')+'. Verifícalos antes de guardar.':'No se identificaron campos con confianza; completa los datos manualmente.';
  toast('Lectura terminada. Verifica los campos detectados.');
 }catch(err){console.error(err);$('ocrStatus').textContent='No se pudo leer la imagen. Prueba con una captura más nítida o introduce los datos manualmente.';toast('Falló el reconocimiento OCR.')}
 finally{$('ocrBtn').disabled=false}
});
function normalizeReference(value){return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
function findPaymentMatches(candidate, existing){
 const ref=normalizeReference(candidate.receiptReference);
 return existing.map(old=>{
   const oldRef=normalizeReference(old.receiptReference);
   const reasons=[];
   if(ref&&oldRef&&ref===oldRef)reasons.push('La referencia o número de operación coincide');
   const newDate=candidate.receiptDate||candidate.date||'', oldDate=old.receiptDate||old.date||'';
   const newTime=candidate.receiptTime||'', oldTime=old.receiptTime||'';
   if(newDate&&newTime&&oldDate&&oldTime&&newDate===oldDate&&newTime===oldTime)reasons.push('La fecha y la hora del comprobante coinciden');
   return reasons.length?{payment:old,reasons}:null;
 }).filter(Boolean);
}
function duplicatePaymentHtml(match, people){
 const old=match.payment, person=people.find(x=>x.id===old.personId);
 return `<article class="duplicate-match"><strong>${esc(person?.name||'Afiliado eliminado')}</strong><p>Quien pagó: ${esc(old.payerName||'No indicado')}</p><p>Valor: <b>${money(old.amount)}</b></p><p>Fecha y hora: ${esc(old.receiptDate||old.date||'Sin fecha')} ${esc(old.receiptTime||'Sin hora')}</p><p>Referencia: ${esc(old.receiptReference||'Sin referencia')}</p><p>Coincidencia: <b>${esc(match.reasons.join(' y '))}</b></p></article>`;
}
let pendingDuplicatePayment=null;
async function persistPayment(p){
 try{
  await put('payments',p);
  $('duplicateDialog').close();pendingDuplicatePayment=null;
  $('paymentForm').reset();$('paymentDate').value=today();$('receiptDate').value=today();$('paymentMonth').value=monthNow();$('boxPaid').checked=false;$('commissionPaid').checked=false;$('ocrStatus').textContent='Puedes intentar leer el comprobante con OCR cuando tengas internet.';
  await refresh();toast('Pago mensual guardado.');
 }catch(err){toast('No se pudo guardar. Puede faltar espacio en el teléfono.')}
}
$('cancelDuplicate').addEventListener('click',()=>{$('duplicateDialog').close();pendingDuplicatePayment=null;toast('Pago no guardado. Revisa los datos antes de intentarlo de nuevo.')});
$('saveDuplicateAnyway').addEventListener('click',async()=>{if(pendingDuplicatePayment)await persistPayment(pendingDuplicatePayment)});
$('paymentForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const personId=$('paymentPerson').value,month=$('paymentMonth').value,amount=Number($('paymentAmount').value);
 if(!personId||!month||amount<0)return toast('Revisa los datos del pago.');
 const person=(await all('people')).find(p=>p.id===personId);
 const file=$('paymentPhoto').files[0];let photo='';
 if(file){if(!file.type.startsWith('image/'))return toast('Selecciona una imagen válida.');if(file.size>5*1024*1024)return toast('La foto supera 5 MB. Reduce su tamaño e inténtalo de nuevo.');photo=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file)})}
 const p={id:uid(),personId,recruiterId:person?.recruiterId||'',month,amount,boxCost:Number($('paymentBoxCost').value)||0,commission:Number($('paymentCommission').value)||0,date:$('paymentDate').value,receiptDate:$('receiptDate').value||$('paymentDate').value,receiptTime:$('receiptTime').value,payerName:$('payerName').value.trim(),receiptReference:$('receiptReference').value.trim(),ocrText:$('ocrText').value.trim(),boxPaid:$('boxPaid').checked,commissionPaid:$('commissionPaid').checked,photo,notes:$('paymentNotes').value.trim(),createdAt:new Date().toISOString()};
 const [existing,people]=await Promise.all([all('payments'),all('people')]);
 const matches=findPaymentMatches(p,existing);
 if(matches.length){
   pendingDuplicatePayment=p;
   $('duplicateMatches').innerHTML=`<p><b>${matches.length}</b> coincidencia(s) encontrada(s). Pago que intentas registrar: <b>${money(p.amount)}</b>, ${esc(p.receiptDate)} ${esc(p.receiptTime||'sin hora')}, referencia ${esc(p.receiptReference||'sin referencia')}.</p>`+matches.map(m=>duplicatePaymentHtml(m,people)).join('');
   $('duplicateDialog').showModal();
   return;
 }
 await persistPayment(p);
});
$('paymentList').addEventListener('click',async e=>{const b=e.target.closest('[data-delete-payment]');if(b&&confirm('¿Eliminar este registro de pago y su comprobante?')){await del('payments',b.dataset.deletePayment);await refresh();toast('Pago eliminado.')}});
$('dashMonth').addEventListener('change',refresh);$('reportMonth').addEventListener('change',refresh);
function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
$('exportBtn').addEventListener('click',async()=>{const data={app:'INNOVA Afiliaciones',version:2,exportedAt:new Date().toISOString(),people:await all('people'),payments:await all('payments'),recruiters:await all('recruiters')};download('innova-copia-'+today()+'.json',JSON.stringify(data),'application/json');toast('Copia completa preparada.')});
$('importInput').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data.people)||!Array.isArray(data.payments))throw new Error('Formato de copia no válido');if(!confirm('Restaurar reemplazará los datos actuales. Exporta primero una copia. ¿Continuar?'))return;await clearStore('people');await clearStore('payments');await clearStore('recruiters');for(const p of data.people)await put('people',p);for(const p of data.payments)await put('payments',p);for(const r of (data.recruiters||[]))await put('recruiters',r);await refresh();toast('Copia restaurada.')}catch(err){toast('No se pudo importar: '+err.message)}finally{e.target.value=''}});
$('csvBtn').addEventListener('click',async()=>{const people=await all('people'),recruiters=await all('recruiters');const cols=['Nombre','Documento','Telefono','Reclutadora','Fecha afiliacion','Cuota mensual COP','Costo caja COP','Comision COP','Estado','Bloqueado','Observaciones'];const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const rows=[cols,...people.map(p=>[p.name,p.document,p.phone,getRecruiterName(p.recruiterId,recruiters),p.start,p.fee,p.boxCost,p.commission,p.status,p.blocked?'Sí':'No',p.notes])];download('innova-afiliados-'+today()+'.csv','\ufeff'+rows.map(r=>r.map(quote).join(';')).join('\r\n'),'text/csv;charset=utf-8')});
$('reportCsvBtn').addEventListener('click',async()=>{const month=$('reportMonth').value||monthNow(),[people,payments,recruiters]=await Promise.all([all('people'),all('payments'),all('recruiters')]);const cols=['Mes','Afiliado','Documento','Reclutadora','Ingresos COP','Caja COP','Comision COP','Ganancia estimada COP','Caja pagada','Comision pagada','Fecha recaudo'];const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const pmap=new Map(people.map(p=>[p.id,p]));const rows=[cols,...payments.filter(p=>p.month===month).map(p=>{const person=pmap.get(p.personId);return [month,person?.name||'Afiliado eliminado',person?.document||'',getRecruiterName(p.recruiterId||person?.recruiterId,recruiters),p.amount,p.boxCost,p.commission,Number(p.amount||0)-Number(p.boxCost||0)-Number(p.commission||0),p.boxPaid?'Sí':'No',p.commissionPaid?'Sí':'No',p.date]})];download('innova-reporte-'+month+'.csv','\ufeff'+rows.map(r=>r.map(quote).join(';')).join('\r\n'),'text/csv;charset=utf-8')});
$('clearBtn').addEventListener('click',async()=>{if(confirm('Esto borrará todos los afiliados, reclutadoras, pagos y fotos de este teléfono. ¿Seguro?')&&confirm('Última confirmación: exporta una copia antes de borrar. ¿Eliminar definitivamente?')){await clearStore('people');await clearStore('payments');await clearStore('recruiters');await refresh();toast('Datos locales eliminados.')}});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;$('installBtn').classList.remove('hidden')});
$('installBtn').addEventListener('click',async()=>{if(!deferredInstall){toast('En Chrome, abre el menú ⋮ y elige Instalar aplicación o Añadir a pantalla de inicio.');return}deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$('installBtn').classList.add('hidden')});
if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
(async()=>{try{db=await openDB();await refresh()}catch(e){alert('No se pudo iniciar el almacenamiento local. Abre la app desde GitHub Pages o un servidor local compatible.');console.error(e)}})();
})();