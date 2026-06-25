import { db } from './firebase.js';
import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const ADMIN_DEFAULT = '2026';
let settings = { platformName:'آفاق التعليمية', masterNumber:'', welcomeMessage:'مرحباً بك في منصة آفاق', footerMessage:'آفاق التعليمية', adminCode: ADMIN_DEFAULT };
let currentStudent = null;

const $ = s => document.querySelector(s);
window.openModal = id => document.getElementById(id).showModal();
window.closeModal = id => document.getElementById(id).close();
window.logout = () => { localStorage.removeItem('afaqRole'); localStorage.removeItem('afaqStudentCode'); location.reload(); };
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }
function makeCode(){ return String(Math.floor(100000 + Math.random()*900000)); }
function fmtDate(v){ try{return v?.toDate? v.toDate().toLocaleDateString('ar-IQ'): (v||'غير محدد')}catch{return 'غير محدد'} }

async function initDefaults(){
  const sref = doc(db,'settings','main');
  const snap = await getDoc(sref);
  if(!snap.exists()){
    await setDoc(sref, settings);
    await addDoc(collection(db,'stages'), {name:'الأول متوسط', order:1, createdAt:serverTimestamp()});
    await addDoc(collection(db,'stages'), {name:'الثاني متوسط', order:2, createdAt:serverTimestamp()});
    await addDoc(collection(db,'stages'), {name:'الثالث متوسط', order:3, createdAt:serverTimestamp()});
    await addDoc(collection(db,'stages'), {name:'الرابع الإعدادي', order:4, createdAt:serverTimestamp()});
    await addDoc(collection(db,'stages'), {name:'الخامس الإعدادي', order:5, createdAt:serverTimestamp()});
    await addDoc(collection(db,'stages'), {name:'السادس الإعدادي', order:6, createdAt:serverTimestamp()});
  }
}

function listenSettings(){
  onSnapshot(doc(db,'settings','main'), snap=>{
    if(snap.exists()) settings = {...settings,...snap.data()};
    $('#siteName').textContent = settings.platformName || 'آفاق التعليمية';
    $('#welcomeText').textContent = settings.welcomeMessage || 'مرحباً بك';
    $('#footerText').textContent = settings.footerMessage || settings.platformName || 'آفاق التعليمية';
    $('#masterNumber').value = settings.masterNumber || 'لم يتم تحديده بعد';
  });
}

function listenStages(){
  onSnapshot(query(collection(db,'stages'), orderBy('order','asc')), snap=>{
    const publicStages = $('#publicStages'); publicStages.innerHTML='<option value="">اختر المرحلة</option>';
    const stagesList = $('#stagesList'); stagesList.innerHTML='';
    snap.forEach(d=>{
      const st={id:d.id,...d.data()};
      publicStages.insertAdjacentHTML('beforeend', `<option>${st.name}</option>`);
      stagesList?.insertAdjacentHTML('beforeend', `<div class="card"><h4>${st.name}</h4><p>ترتيب الظهور: ${st.order||0}</p><div class="card-actions"><button class="danger" onclick="deleteStage('${st.id}')">حذف</button></div></div>`);
    });
  });
}

function listenRequests(){
  const el=$('#requestsList'); if(!el) return;
  onSnapshot(query(collection(db,'subscriptionRequests'), orderBy('createdAt','desc')), snap=>{
    el.innerHTML='';
    snap.forEach(d=>{
      const r={id:d.id,...d.data()};
      el.insertAdjacentHTML('beforeend', `<div class="card"><h4>${r.fullName}</h4><p>ولي الأمر: ${r.parentName}</p><p>الهاتف: ${r.phone}</p><p>المرحلة: ${r.stage}</p><p>المبلغ: ${r.paidAmount}</p><p>الحالة: ${r.status}</p><div class="card-actions">${r.status==='pending'?`<button class="ok" onclick="approveRequest('${r.id}')">قبول وإنشاء كود</button><button class="danger" onclick="rejectRequest('${r.id}')">رفض</button>`:''}</div></div>`);
    });
    if(!snap.size) el.innerHTML='<p class="muted">لا توجد طلبات حالياً.</p>';
  });
}

function listenStudents(){
  const el=$('#studentsList'); if(!el) return;
  onSnapshot(query(collection(db,'students'), orderBy('createdAt','desc')), snap=>{
    el.innerHTML='';
    snap.forEach(d=>{ const s={id:d.id,...d.data()}; el.insertAdjacentHTML('beforeend', `<div class="card"><h4>${s.fullName}</h4><p>الكود: <b>${s.code}</b></p><p>المرحلة: ${s.stage}</p><p>الهاتف: ${s.phone}</p><p>بداية الاشتراك: ${fmtDate(s.startDate)}</p><p>النهاية: ${s.endDate||'حسب تحديد المدير'}</p><p>الحالة: ${s.subscriptionStatus}</p><div class="card-actions"><button class="danger" onclick="deleteStudent('${s.id}')">حذف</button></div></div>`)});
    if(!snap.size) el.innerHTML='<p class="muted">لا يوجد طلاب مقبولون بعد.</p>';
  });
}

async function showStudent(code){
  const qy=query(collection(db,'students'), where('code','==',code));
  const snap=await getDocs(qy);
  if(snap.empty) return toast('الكود غير صحيح أو غير مفعل');
  currentStudent={id:snap.docs[0].id,...snap.docs[0].data()};
  localStorage.setItem('afaqRole','student'); localStorage.setItem('afaqStudentCode',code);
  $('#home').classList.add('hidden'); document.querySelector('.login-grid').classList.add('hidden'); $('#pricing').classList.add('hidden'); $('#features').classList.add('hidden'); $('#adminPanel').classList.add('hidden'); $('#studentPanel').classList.remove('hidden');
  $('#studentInfo').innerHTML=`<h3>${currentStudent.fullName}</h3><p>المرحلة: ${currentStudent.stage}</p><p>كود الطالب: <b>${currentStudent.code}</b></p><p>ولي الأمر: ${currentStudent.parentName}</p><p>الهاتف: ${currentStudent.phone}</p><p>حالة الاشتراك: ${currentStudent.subscriptionStatus}</p><p>النقاط: ${currentStudent.points||0}</p><p>المستوى: ${currentStudent.level||'🌱 مبتدئ'}</p>`;
}

function showAdmin(){
  localStorage.setItem('afaqRole','admin');
  $('#home').classList.add('hidden'); document.querySelector('.login-grid').classList.add('hidden'); $('#pricing').classList.add('hidden'); $('#features').classList.add('hidden'); $('#studentPanel').classList.add('hidden'); $('#adminPanel').classList.remove('hidden');
  listenRequests(); listenStudents();
}

$('#subscriptionForm').addEventListener('submit', async e=>{
  e.preventDefault();
  const data=Object.fromEntries(new FormData(e.target).entries());
  await addDoc(collection(db,'subscriptionRequests'), {...data, masterNumber:settings.masterNumber||'', status:'pending', createdAt:serverTimestamp()});
  e.target.reset(); $('#masterNumber').value=settings.masterNumber||''; toast('تم إرسال طلب الاشتراك بنجاح');
});

$('#adminLoginForm').addEventListener('submit', e=>{e.preventDefault(); const code=new FormData(e.target).get('code'); if(code===(settings.adminCode||ADMIN_DEFAULT)){ closeModal('adminLoginModal'); showAdmin(); } else toast('كود المدير غير صحيح');});
$('#studentLoginForm').addEventListener('submit', e=>{e.preventDefault(); const code=new FormData(e.target).get('code'); closeModal('studentLoginModal'); showStudent(code);});
$('#stageForm').addEventListener('submit', async e=>{e.preventDefault(); const name=new FormData(e.target).get('stageName'); await addDoc(collection(db,'stages'), {name, order:Date.now(), createdAt:serverTimestamp()}); e.target.reset(); toast('تمت إضافة المرحلة');});
$('#settingsForm').addEventListener('submit', async e=>{e.preventDefault(); const data=Object.fromEntries(new FormData(e.target).entries()); Object.keys(data).forEach(k=>{if(!data[k]) delete data[k]}); await setDoc(doc(db,'settings','main'), data, {merge:true}); toast('تم حفظ الإعدادات');});

window.approveRequest = async id => {
  const ref=doc(db,'subscriptionRequests',id); const snap=await getDoc(ref); if(!snap.exists()) return;
  const r=snap.data(); const code=makeCode();
  await addDoc(collection(db,'students'), {fullName:r.fullName,parentName:r.parentName,phone:r.phone,stage:r.stage,paidAmount:r.paidAmount,code,subscriptionStatus:'active',points:0,level:'🌱 مبتدئ',startDate:serverTimestamp(),endDate:'يحدد من إعدادات الاشتراك',createdAt:serverTimestamp()});
  await updateDoc(ref,{status:'approved', studentCode:code, approvedAt:serverTimestamp()});
  toast('تم قبول الطالب. الكود: '+code);
};
window.rejectRequest = async id => { await updateDoc(doc(db,'subscriptionRequests',id),{status:'rejected', rejectedAt:serverTimestamp()}); toast('تم رفض الطلب'); };
window.deleteStage = async id => { if(confirm('حذف المرحلة؟')) await deleteDoc(doc(db,'stages',id)); };
window.deleteStudent = async id => { if(confirm('حذف الطالب؟')) await deleteDoc(doc(db,'students',id)); };

document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('[data-tab]').forEach(b=>b.classList.remove('active'));document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));btn.classList.add('active');$('#tab-'+btn.dataset.tab).classList.add('active');}));
document.querySelectorAll('[data-scroll]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.scroll).scrollIntoView({behavior:'smooth'}));
$('#themeBtn').onclick=()=>{document.body.classList.toggle('light'); $('#themeBtn').textContent=document.body.classList.contains('light')?'الوضع الداكن ☾':'الوضع النهاري ☀';};

await initDefaults(); listenSettings(); listenStages();
if(localStorage.getItem('afaqRole')==='admin') showAdmin();
if(localStorage.getItem('afaqRole')==='student') showStudent(localStorage.getItem('afaqStudentCode'));
