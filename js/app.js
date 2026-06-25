import { db } from './firebase.js';
import { bindAuth } from './auth.js';
import { bindAdminForms, listenRequests, listenStudents } from './admin.js';
import { showStudent } from './student.js';
import { collection, doc, addDoc, setDoc, getDoc, query, orderBy, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const ADMIN_DEFAULT = '2026';
export let settings = { platformName:'آفاق التعليمية', masterNumber:'', welcomeMessage:'مرحباً بك في منصة آفاق', footerMessage:'آفاق التعليمية', adminCode: ADMIN_DEFAULT };
const $ = s => document.querySelector(s);

window.openModal = id => document.getElementById(id).showModal();
window.closeModal = id => document.getElementById(id).close();
window.logout = () => { localStorage.removeItem('afaqRole'); localStorage.removeItem('afaqStudentCode'); location.reload(); };
window.showToast = msg => { const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); };

export function showAdmin(){
  localStorage.setItem('afaqRole','admin');
  $('#home').classList.add('hidden'); document.querySelector('.login-grid').classList.add('hidden'); $('#pricing').classList.add('hidden'); $('#features').classList.add('hidden'); $('#studentPanel').classList.add('hidden'); $('#adminPanel').classList.remove('hidden');
  listenRequests(); listenStudents();
}

async function initDefaults(){
  const sref = doc(db,'settings','main');
  const snap = await getDoc(sref);
  if(!snap.exists()){
    await setDoc(sref, settings);
    const names=['الأول متوسط','الثاني متوسط','الثالث متوسط','الرابع الإعدادي','الخامس الإعدادي','السادس الإعدادي'];
    for(let i=0;i<names.length;i++) await addDoc(collection(db,'stages'), {name:names[i], order:i+1, createdAt:serverTimestamp()});
  }
}

function listenSettings(){
  onSnapshot(doc(db,'settings','main'), snap=>{
    if(snap.exists()) settings = {...settings,...snap.data()};
    $('#siteName').textContent = settings.platformName || 'آفاق التعليمية';
    $('#welcomeText').textContent = settings.welcomeMessage || 'مرحباً بك';
    $('#footerText').textContent = settings.footerMessage || settings.platformName || 'آفاق التعليمية';
    $('#masterNumberText').textContent = settings.masterNumber || 'لم يتم تحديده بعد';
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

function bindPublicForms(){
  $('#subscriptionForm')?.addEventListener('submit', async e=>{
    e.preventDefault();
    const data=Object.fromEntries(new FormData(e.target).entries());
    await addDoc(collection(db,'subscriptionRequests'), {...data, masterNumber:settings.masterNumber||'', status:'pending', createdAt:serverTimestamp()});
    e.target.reset();
    $('#masterNumberText').textContent=settings.masterNumber||'لم يتم تحديده بعد';
    window.showToast('تم إرسال طلب الاشتراك بنجاح');
  });

  document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-tab]').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active'); $('#tab-'+btn.dataset.tab).classList.add('active');
  }));
  document.querySelectorAll('[data-scroll]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.scroll).scrollIntoView({behavior:'smooth'}));
  $('#themeBtn').onclick=()=>{document.body.classList.toggle('light'); $('#themeBtn').textContent=document.body.classList.contains('light')?'الوضع الداكن ☾':'الوضع النهاري ☀';};
}

await initDefaults();
listenSettings();
listenStages();
bindAuth(settings);
bindAdminForms();
bindPublicForms();
if(localStorage.getItem('afaqRole')==='admin') showAdmin();
if(localStorage.getItem('afaqRole')==='student') showStudent(localStorage.getItem('afaqStudentCode'));
