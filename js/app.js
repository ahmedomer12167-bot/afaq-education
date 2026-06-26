import { db, fb } from './firebase.js';

const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const ADMIN_SESSION = 'afaq_admin_ok';
const STUDENT_SESSION = 'afaq_student_id';
const defaultSettings = {
  platformName: 'آفاق التعليمية',
  welcomeMessage: 'تعلم، اختبر، تابع نتائجك واشتراكك من مكان واحد بتصميم حديث ومزامنة مباشرة.',
  footerMessage: 'آفاق التعليمية © جميع الحقوق محفوظة',
  masterNumber: 'ضع رقم الماستر من لوحة المدير',
  adminCode: '2026',
  requestsOpen: true
};
let settings = {...defaultSettings};
let stagesCache = [];

function msg(el, text, ok=true){ if(el){ el.textContent=text; el.style.color = ok ? '#7cf6a5' : '#ff9a9a'; } }
function fmtDate(v){ if(!v) return '-'; try{ if(v.toDate) return v.toDate().toLocaleDateString('ar-IQ'); return new Date(v).toLocaleDateString('ar-IQ'); }catch{return '-'} }
function randomCode(){ return Math.floor(100000 + Math.random()*900000).toString(); }
async function ensureSettings(){
  const ref = fb.doc(db,'settings','platform');
  const snap = await fb.getDoc(ref);
  if(!snap.exists()) await fb.setDoc(ref, defaultSettings);
}
function listenSettings(){
  fb.onSnapshot(fb.doc(db,'settings','platform'), snap=>{
    settings = {...defaultSettings, ...(snap.data()||{})};
    $('#homeBrand') && ($('#homeBrand').textContent=settings.platformName);
    $('#heroTitle') && ($('#heroTitle').textContent=settings.platformName);
    $('#welcomeText') && ($('#welcomeText').textContent=settings.welcomeMessage);
    $('#footerText') && ($('#footerText').textContent=settings.footerMessage);
    $('#masterView') && ($('#masterView').value=settings.masterNumber || 'غير محدد');
    const f = $('#settingsForm');
    if(f){ f.platformName.value=settings.platformName; f.welcomeMessage.value=settings.welcomeMessage; f.footerMessage.value=settings.footerMessage; f.masterNumber.value=settings.masterNumber; f.adminCode.value=settings.adminCode; }
  }, e=>console.error(e));
}
function setupTheme(){
  const saved = localStorage.getItem('afaq_theme') || 'dark';
  document.documentElement.dataset.theme = saved;
  const btn = $('#themeBtn');
  if(btn){ btn.textContent = saved === 'light' ? '🌙 الوضع الليلي' : '☀️ الوضع النهاري'; btn.onclick=()=>{ const next=document.documentElement.dataset.theme==='light'?'dark':'light'; document.documentElement.dataset.theme=next; localStorage.setItem('afaq_theme',next); btn.textContent=next==='light'?'🌙 الوضع الليلي':'☀️ الوضع النهاري'; }; }
}
function setupMenus(){
  $$('[data-open]').forEach(b=> b.onclick=()=>{ $$('.section').forEach(s=>s.classList.remove('active')); const sec = $('#'+b.dataset.open); sec && sec.classList.add('active'); window.scrollTo({top:0,behavior:'smooth'}); });
}
function listenStages(renderHome=false){
  const q = fb.query(fb.collection(db,'stages'), fb.orderBy('order','asc'));
  fb.onSnapshot(q, snap=>{
    stagesCache = snap.docs.map(d=>({id:d.id,...d.data()}));
    const sel = $('#stageSelect');
    if(sel){ sel.innerHTML='<option value="">اختر المرحلة الدراسية</option>'+stagesCache.map(s=>`<option value="${s.id}">${s.name}</option>`).join(''); }
    const list = $('#stagesList');
    if(list){ list.innerHTML = stagesCache.length? stagesCache.map(s=>`<div class="pack"><b>${s.name}</b><span class="small">ترتيب الظهور: ${s.order||0}</span><div class="row"><button class="btn secondary" data-edit-stage="${s.id}">تعديل</button><button class="btn danger" data-del-stage="${s.id}">حذف</button></div></div>`).join(''):'<div class="empty">لا توجد مراحل بعد</div>'; }
    $('#statStages') && ($('#statStages').textContent=stagesCache.length);
  });
}
function stageName(id){ return (stagesCache.find(s=>s.id===id)||{}).name || 'مرحلة محذوفة'; }
async function initHome(){
  await ensureSettings(); listenSettings(); listenStages(true);
  $('#subForm')?.addEventListener('submit', async e=>{
    e.preventDefault(); const f=e.target;
    if(!settings.requestsOpen) return msg($('#subMsg'),'استقبال الطلبات متوقف حالياً',false);
    if(!f.stageId.value) return msg($('#subMsg'),'اختر المرحلة أولاً',false);
    try{
      await fb.addDoc(fb.collection(db,'subscriptionRequests'),{
        studentName:f.studentName.value.trim(), parentName:f.parentName.value.trim(), phone:f.phone.value.trim(),
        stageId:f.stageId.value, stageName:stageName(f.stageId.value), amount:Number(f.amount.value||0), masterNumber:settings.masterNumber,
        status:'pending', createdAt:fb.serverTimestamp()
      });
      f.reset(); $('#masterView').value=settings.masterNumber || 'غير محدد'; msg($('#subMsg'),'تم إرسال الطلب بنجاح، انتظر موافقة المدير.');
    }catch(err){ console.error(err); msg($('#subMsg'),'فشل إرسال الطلب. تأكد من قواعد Firebase.',false); }
  });
  $('#studentLogin')?.addEventListener('submit', async e=>{
    e.preventDefault(); const code=e.target.code.value.trim();
    try{
      const q = fb.query(fb.collection(db,'students'));
      fb.onSnapshot(q, snap=>{
        const st = snap.docs.map(d=>({id:d.id,...d.data()})).find(s=>s.code===code);
        if(st && st.status==='active'){ localStorage.setItem(STUDENT_SESSION, st.id); location.href='pages/student.html'; }
        else msg($('#studentLoginMsg'),'الكود غير صحيح أو الاشتراك غير مفعل.',false);
      },()=> msg($('#studentLoginMsg'),'تعذر الاتصال بقاعدة البيانات.',false));
    }catch{ msg($('#studentLoginMsg'),'حدث خطأ في الدخول.',false); }
  });
}
async function initAdmin(){
  await ensureSettings(); listenSettings(); setupMenus(); listenStages();
  if(localStorage.getItem(ADMIN_SESSION)==='1') showAdmin();
  $('#adminLogin')?.addEventListener('submit', e=>{ e.preventDefault(); const code=e.target.code.value.trim(); if(code===(settings.adminCode||'2026')){localStorage.setItem(ADMIN_SESSION,'1'); showAdmin();} else msg($('#adminLoginMsg'),'كود المدير غير صحيح',false); });
  $('#adminLogout')?.addEventListener('click',()=>{localStorage.removeItem(ADMIN_SESSION); location.reload();});
  $('#settingsForm')?.addEventListener('submit', async e=>{ e.preventDefault(); const f=e.target; try{ await fb.setDoc(fb.doc(db,'settings','platform'), { platformName:f.platformName.value.trim()||defaultSettings.platformName, welcomeMessage:f.welcomeMessage.value.trim(), footerMessage:f.footerMessage.value.trim(), masterNumber:f.masterNumber.value.trim(), adminCode:f.adminCode.value.trim()||'2026', requestsOpen:true }, {merge:true}); msg($('#settingsMsg'),'تم حفظ الإعدادات بنجاح'); }catch(err){ console.error(err); msg($('#settingsMsg'),'فشل الحفظ. تأكد من firestore.rules',false); } });
  $('#stageForm')?.addEventListener('submit', async e=>{ e.preventDefault(); const f=e.target; try{ await fb.addDoc(fb.collection(db,'stages'), {name:f.stageName.value.trim(), order:Date.now(), createdAt:fb.serverTimestamp()}); f.reset(); msg($('#stageMsg'),'تمت إضافة المرحلة'); }catch(err){ console.error(err); msg($('#stageMsg'),'فشل إضافة المرحلة. تأكد من قواعد Firebase',false); } });
  $('#stagesList')?.addEventListener('click', async e=>{ const del=e.target.dataset.delStage, edit=e.target.dataset.editStage; if(del && confirm('حذف المرحلة؟')) await fb.deleteDoc(fb.doc(db,'stages',del)); if(edit){ const old=stagesCache.find(s=>s.id===edit); const name=prompt('اسم المرحلة الجديد', old?.name||''); if(name) await fb.updateDoc(fb.doc(db,'stages',edit),{name}); } });
  listenRequests(); listenStudents();
}
function showAdmin(){ $('#loginScreen').style.display='none'; $('#adminPanel').style.display='grid'; }
function listenRequests(){
  fb.onSnapshot(fb.query(fb.collection(db,'subscriptionRequests'), fb.orderBy('createdAt','desc')), snap=>{
    const reqs=snap.docs.map(d=>({id:d.id,...d.data()}));
    $('#statPending') && ($('#statPending').textContent=reqs.filter(r=>r.status==='pending').length);
    const list=$('#requestsList'); if(!list) return;
    list.innerHTML=reqs.length? reqs.map(r=>`<div class="pack"><b>${r.studentName}</b><span>المرحلة: ${r.stageName||stageName(r.stageId)}</span><span>ولي الأمر: ${r.parentName}</span><span>الهاتف: ${r.phone}</span><span>المبلغ: ${r.amount}</span><span>الحالة: <b class="badge ${r.status==='rejected'?'bad':r.status==='approved'?'':'warn'}">${r.status}</b></span><div class="row">${r.status==='pending'?`<button class="btn" data-approve="${r.id}">قبول</button><button class="btn danger" data-reject="${r.id}">رفض</button>`:''}</div></div>`).join(''):'<div class="empty">لا توجد طلبات</div>';
  });
  $('#requestsList')?.addEventListener('click', async e=>{
    const approve=e.target.dataset.approve, reject=e.target.dataset.reject;
    if(reject){ await fb.updateDoc(fb.doc(db,'subscriptionRequests',reject),{status:'rejected'}); return; }
    if(approve){
      const reqSnap=await fb.getDoc(fb.doc(db,'subscriptionRequests',approve)); const r={id:approve,...reqSnap.data()};
      const code=prompt('اكتب كود الطالب أو اتركه فارغاً لإنشاء كود تلقائي', randomCode()) || randomCode();
      const start=prompt('تاريخ بداية الاشتراك YYYY-MM-DD', new Date().toISOString().slice(0,10));
      const end=prompt('تاريخ نهاية الاشتراك YYYY-MM-DD', new Date(Date.now()+30*86400000).toISOString().slice(0,10));
      const studentRef=await fb.addDoc(fb.collection(db,'students'),{ studentName:r.studentName,parentName:r.parentName,phone:r.phone,stageId:r.stageId,stageName:r.stageName,amount:r.amount,code,startDate:start,endDate:end,status:'active',points:0,level:'🌱 مبتدئ',createdAt:fb.serverTimestamp() });
      await fb.updateDoc(fb.doc(db,'subscriptionRequests',approve),{status:'approved',studentId:studentRef.id,code,startDate:start,endDate:end});
      alert('تم قبول الطالب. كود الدخول: '+code);
    }
  });
}
function listenStudents(){
  fb.onSnapshot(fb.query(fb.collection(db,'students'), fb.orderBy('createdAt','desc')), snap=>{
    const arr=snap.docs.map(d=>({id:d.id,...d.data()})); $('#statStudents') && ($('#statStudents').textContent=arr.length);
    const list=$('#studentsList'); if(!list) return;
    list.innerHTML=arr.length? arr.map(s=>`<div class="pack"><b>${s.studentName}</b><span>الكود: ${s.code}</span><span>المرحلة: ${s.stageName}</span><span>الهاتف: ${s.phone}</span><span>الاشتراك: ${s.startDate} → ${s.endDate}</span><span class="badge">${s.status}</span></div>`).join(''):'<div class="empty">لا يوجد طلاب مقبولون</div>';
  });
}
async function initStudent(){ setupMenus(); const id=localStorage.getItem(STUDENT_SESSION); if(!id){ location.href='../index.html'; return; } $('#studentLogout')?.addEventListener('click',()=>{localStorage.removeItem(STUDENT_SESSION); location.href='../index.html';}); fb.onSnapshot(fb.doc(db,'students',id), snap=>{ if(!snap.exists()){localStorage.removeItem(STUDENT_SESSION); location.href='../index.html'; return;} const s={id,...snap.data()}; renderStudent(s); }); }
function renderStudent(s){ const profile=$('#studentProfile'); if(profile) profile.innerHTML=`<div class="pack"><b>${s.studentName}</b><span>كود الطالب: ${s.code}</span><span>المرحلة: ${s.stageName}</span><span>ولي الأمر: ${s.parentName}</span><span>الهاتف: ${s.phone}</span><span>النقاط: ${s.points||0}</span><span>المستوى: ${s.level||'🌱 مبتدئ'}</span></div>`; const sub=$('#studentSubscription'); if(sub) sub.innerHTML=`<div class="pack"><b>حالة الاشتراك</b><span class="badge">${s.status}</span><span>البداية: ${s.startDate||'-'}</span><span>النهاية: ${s.endDate||'-'}</span><span>المبلغ: ${s.amount||0}</span></div>`; }

setupTheme();
const page=document.body.dataset.page;
if(page==='admin') initAdmin(); else if(page==='student') initStudent(); else initHome();
if('serviceWorker' in navigator){ navigator.serviceWorker.register('./sw.js').catch(()=>{}); }
