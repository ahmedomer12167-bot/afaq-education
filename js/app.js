import { db, FB, DEFAULT_SETTINGS, ensureBaseData } from './firebase.js';

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const toast = (msg, ok=true) => { const t=$('#toast') || document.createElement('div'); t.id='toast'; t.className='toast show '+(ok?'ok':'bad'); t.textContent=msg; document.body.appendChild(t); setTimeout(()=>t.classList.remove('show'),2600); };
const fmtDate = (v) => v ? new Date(v).toLocaleDateString('ar-IQ') : '—';
const randCode = () => String(Math.floor(100000 + Math.random()*900000));

let settings = {...DEFAULT_SETTINGS};
let stages = [];

async function safe(call, fallback=null){ try { return await call(); } catch(e){ console.error(e); toast('تحقق من قواعد Firestore أو الاتصال بالإنترنت', false); return fallback; } }
async function loadSettings(){
  await safe(()=>ensureBaseData());
  const snap = await safe(()=>FB.getDoc(FB.doc(db,'system','settings')));
  settings = {...DEFAULT_SETTINGS, ...(snap?.exists()?snap.data():{})};
  localStorage.setItem('afaq_settings', JSON.stringify(settings));
  applySettings();
  return settings;
}
function localSettings(){ try{return {...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem('afaq_settings')||'{}')}}catch{return DEFAULT_SETTINGS} }
function applySettings(){
  $$('[data-platform-name]').forEach(e=>e.textContent=settings.platformName);
  $$('[data-welcome]').forEach(e=>e.textContent=settings.welcomeMessage);
  $$('[data-master-number]').forEach(e=>e.textContent=settings.masterNumber);
  $$('[data-footer]').forEach(e=>e.textContent=settings.footerMessage);
  const title = $('title'); if(title) title.textContent = settings.platformName;
}
async function loadStages(selectId){
  const snap = await safe(()=>FB.getDocs(FB.query(FB.collection(db,'stages'), FB.orderBy('order','asc'))));
  stages = snap?.docs?.map(d=>({id:d.id,...d.data()})) || [];
  if(!stages.length) stages = ['الأول متوسط','الثاني متوسط','الثالث متوسط','الرابع الإعدادي','الخامس الإعدادي','السادس الإعدادي'].map((name,i)=>({id:'local'+i,name,order:i+1}));
  const sel = selectId ? $(selectId) : null;
  if(sel) sel.innerHTML = '<option value="">اختر المرحلة</option>' + stages.map(s=>`<option value="${s.id}" data-name="${s.name}">${s.name}</option>`).join('');
  return stages;
}
function setTheme(mode){ document.documentElement.dataset.theme=mode; localStorage.setItem('afaq_theme',mode); }
function setupTheme(){ setTheme(localStorage.getItem('afaq_theme')||'dark'); $$('.theme-toggle').forEach(b=>b.onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark')); }

async function initHome(){
  setupTheme(); settings = localSettings(); applySettings(); await loadSettings(); await loadStages('#subStage');
  $('#adminLoginBtn')?.addEventListener('click', async()=>{
    const code = $('#adminCode').value.trim();
    await loadSettings();
    if(code === (settings.adminCode||'2026')){ localStorage.setItem('afaq_role','admin'); location.href='pages/admin.html'; }
    else toast('كود المدير غير صحيح', false);
  });
  $('#studentLoginBtn')?.addEventListener('click', async()=>{
    const code = $('#studentCode').value.trim();
    if(!code) return toast('اكتب كود الطالب', false);
    const q = FB.query(FB.collection(db,'students'), FB.where('code','==',code));
    const snap = await safe(()=>FB.getDocs(q));
    if(!snap || snap.empty) return toast('لم يتم العثور على الطالب أو لم تتم الموافقة بعد', false);
    const d = snap.docs[0];
    const st = {id:d.id,...d.data()};
    if(st.status !== 'active') return toast('اشتراك الطالب غير نشط', false);
    localStorage.setItem('afaq_role','student'); localStorage.setItem('afaq_student_id', st.id); location.href='pages/student.html';
  });
  $('#subscriptionForm')?.addEventListener('submit', async(e)=>{
    e.preventDefault();
    await loadSettings();
    if(settings.acceptRequests === false) return toast('استقبال الطلبات متوقف حاليًا', false);
    const sel = $('#subStage'); const stageId=sel.value; const stageName=sel.options[sel.selectedIndex]?.dataset.name || '';
    if(!stageId) return toast('اختر المرحلة أولًا', false);
    const data = {
      studentName: $('#subName').value.trim(), parentName: $('#subParent').value.trim(), phone: $('#subPhone').value.trim(),
      stageId, stageName, amount: Number($('#subAmount').value||0), masterNumber: settings.masterNumber,
      status:'pending', createdAt: FB.serverTimestamp()
    };
    await safe(()=>FB.addDoc(FB.collection(db,'subscriptionRequests'), data));
    e.target.reset(); await loadStages('#subStage'); applySettings(); toast('تم إرسال طلب الاشتراك بنجاح');
  });
}

function guard(role){ if(localStorage.getItem('afaq_role')!==role){ location.href='../index.html'; return false; } return true; }
function backHome(){ localStorage.removeItem('afaq_role'); localStorage.removeItem('afaq_student_id'); location.href='../index.html'; }

async function initAdmin(){
  if(!guard('admin')) return; setupTheme(); settings=localSettings(); applySettings(); await loadSettings(); await loadStages();
  $('.logout')?.addEventListener('click', backHome); $('.back-home')?.addEventListener('click',()=>location.href='../index.html');
  $$('.tab-btn').forEach(btn=>btn.onclick=()=>{ $$('.tab-btn').forEach(b=>b.classList.remove('active')); $$('.tab').forEach(t=>t.classList.remove('active')); btn.classList.add('active'); $('#'+btn.dataset.tab).classList.add('active'); });
  $('#platformName').value=settings.platformName; $('#welcomeMessage').value=settings.welcomeMessage; $('#footerMessage').value=settings.footerMessage; $('#masterNumber').value=settings.masterNumber; $('#adminCodeNew').value=settings.adminCode; $('#acceptRequests').checked=settings.acceptRequests!==false;
  $('#settingsForm').onsubmit=async(e)=>{ e.preventDefault(); settings={...settings, platformName:$('#platformName').value.trim(), welcomeMessage:$('#welcomeMessage').value.trim(), footerMessage:$('#footerMessage').value.trim(), masterNumber:$('#masterNumber').value.trim(), adminCode:$('#adminCodeNew').value.trim()||'2026', acceptRequests:$('#acceptRequests').checked}; await safe(()=>FB.setDoc(FB.doc(db,'system','settings'), settings, {merge:true})); localStorage.setItem('afaq_settings', JSON.stringify(settings)); applySettings(); toast('تم حفظ الإعدادات'); };
  $('#stageForm').onsubmit=async(e)=>{ e.preventDefault(); const name=$('#stageName').value.trim(); if(!name) return; await safe(()=>FB.addDoc(FB.collection(db,'stages'), {name, order:Date.now(), createdAt:FB.serverTimestamp()})); $('#stageName').value=''; toast('تمت إضافة المرحلة'); renderStages(); };
  renderStages(); listenRequests(); listenStudents();
}
async function renderStages(){
  const list=$('#stagesList'); if(!list) return; await loadStages();
  list.innerHTML = stages.map(s=>`<div class="mini-card"><b>${s.name}</b><div><button data-edit-stage="${s.id}" data-name="${s.name}">تعديل</button><button class="danger" data-del-stage="${s.id}">حذف</button></div></div>`).join('') || '<p>لا توجد مراحل.</p>';
  $$('[data-del-stage]').forEach(b=>b.onclick=async()=>{ if(confirm('حذف المرحلة؟')){ await safe(()=>FB.deleteDoc(FB.doc(db,'stages',b.dataset.delStage))); renderStages(); }});
  $$('[data-edit-stage]').forEach(b=>b.onclick=async()=>{ const name=prompt('اسم المرحلة الجديد', b.dataset.name); if(name){ await safe(()=>FB.updateDoc(FB.doc(db,'stages',b.dataset.editStage), {name})); renderStages(); }});
}
function listenRequests(){
  const box=$('#requestsList'); if(!box) return;
  FB.onSnapshot(FB.query(FB.collection(db,'subscriptionRequests'), FB.orderBy('createdAt','desc')), snap=>{
    const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
    box.innerHTML = rows.map(r=>`<div class="request-card"><div><h3>${r.studentName}</h3><p>${r.stageName} • ${r.phone}</p><p>ولي الأمر: ${r.parentName}</p><p>المبلغ: ${r.amount} • الحالة: ${r.status}</p></div><div class="actions">${r.status==='pending'?`<button data-accept="${r.id}">قبول</button><button class="danger" data-reject="${r.id}">رفض</button>`:''}</div></div>`).join('') || '<p>لا توجد طلبات.</p>';
    $$('[data-accept]').forEach(b=>b.onclick=()=>acceptRequest(b.dataset.accept));
    $$('[data-reject]').forEach(b=>b.onclick=()=>rejectRequest(b.dataset.reject));
  }, e=>{ console.error(e); box.innerHTML='<p>فشل تحميل الطلبات. تحقق من firestore.rules</p>'; });
}
async function acceptRequest(id){
  const start = prompt('تاريخ بداية الاشتراك YYYY-MM-DD', new Date().toISOString().slice(0,10)); if(!start) return;
  const end = prompt('تاريخ نهاية الاشتراك YYYY-MM-DD', new Date(Date.now()+30*864e5).toISOString().slice(0,10)); if(!end) return;
  const code = prompt('كود الطالب', randCode()); if(!code) return;
  const snap = await safe(()=>FB.getDoc(FB.doc(db,'subscriptionRequests',id))); if(!snap?.exists()) return;
  const r = snap.data();
  await safe(()=>FB.addDoc(FB.collection(db,'students'), {...r, code, startDate:start, endDate:end, status:'active', points:0, level:'🌱 مبتدئ', approvedAt:FB.serverTimestamp()}));
  await safe(()=>FB.updateDoc(FB.doc(db,'subscriptionRequests',id), {status:'accepted', studentCode:code, startDate:start, endDate:end}));
  toast('تم قبول الطالب. الكود: '+code);
}
async function rejectRequest(id){ await safe(()=>FB.updateDoc(FB.doc(db,'subscriptionRequests',id), {status:'rejected'})); toast('تم رفض الطلب'); }
function listenStudents(){
  const box=$('#studentsList'); if(!box) return;
  FB.onSnapshot(FB.query(FB.collection(db,'students'), FB.orderBy('approvedAt','desc')), snap=>{
    const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
    box.innerHTML= rows.map(s=>`<div class="mini-card"><div><b>${s.studentName}</b><p>${s.stageName} • كود: <b>${s.code}</b></p><p>${fmtDate(s.startDate)} - ${fmtDate(s.endDate)}</p></div><span class="pill">${s.status}</span></div>`).join('') || '<p>لا يوجد طلاب مقبولون.</p>';
  });
}

async function initStudent(){
  if(!guard('student')) return; setupTheme(); await loadSettings(); $('.logout')?.addEventListener('click', backHome); $('.back-home')?.addEventListener('click',()=>location.href='../index.html');
  const id=localStorage.getItem('afaq_student_id');
  FB.onSnapshot(FB.doc(db,'students',id), snap=>{
    if(!snap.exists()) return;
    const s={id:snap.id,...snap.data()};
    $('#studentName').textContent=s.studentName; $('#studentStage').textContent=s.stageName; $('#studentCodeView').textContent=s.code; $('#studentEnd').textContent=fmtDate(s.endDate); $('#studentLevel').textContent=s.level||'🌱 مبتدئ'; $('#studentPoints').textContent=s.points||0;
  });
}

const page = document.body.dataset.page;
if(page==='home') initHome();
if(page==='admin') initAdmin();
if(page==='student') initStudent();
