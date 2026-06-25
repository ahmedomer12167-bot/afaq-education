import { db } from './firebase.js';
import { bindAuth } from './auth.js';
import { bindAdminForms, listenRequests, listenStudents } from './admin.js';
import { showStudent } from './student.js';
import { collection, doc, addDoc, setDoc, getDoc, query, orderBy, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

export const state = {
  settings: { platformName:'آفاق التعليمية', masterNumber:'', welcomeMessage:'مرحباً بك في منصة آفاق', footerMessage:'آفاق التعليمية', adminCode:'2026' },
  firebaseReady: false
};

const $ = s => document.querySelector(s);
const hidePublic = () => { ['#home','.login-grid','#pricing','#features'].forEach(s=>$(s)?.classList.add('hidden')); };
const showPublic = () => { ['#home','.login-grid','#pricing','#features'].forEach(s=>$(s)?.classList.remove('hidden')); $('#adminPanel')?.classList.add('hidden'); $('#studentPanel')?.classList.add('hidden'); };

window.openModal = id => document.getElementById(id)?.showModal();
window.closeModal = id => document.getElementById(id)?.close();
window.showToast = msg => { const t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),3000); };
window.logout = () => { localStorage.removeItem('afaqRole'); localStorage.removeItem('afaqStudentCode'); showPublic(); window.showToast('تم تسجيل الخروج'); };

export function showAdmin(){
  localStorage.setItem('afaqRole','admin');
  hidePublic();
  $('#studentPanel')?.classList.add('hidden');
  $('#adminPanel')?.classList.remove('hidden');
  listenRequests();
  listenStudents();
}

async function initDefaults(){
  try{
    const sref = doc(db,'settings','main');
    const snap = await getDoc(sref);
    if(!snap.exists()){
      await setDoc(sref, state.settings);
      const names=['الأول متوسط','الثاني متوسط','الثالث متوسط','الرابع الإعدادي','الخامس الإعدادي','السادس الإعدادي'];
      for(let i=0;i<names.length;i++) await addDoc(collection(db,'stages'), {name:names[i], order:i+1, createdAt:serverTimestamp()});
    }
    state.firebaseReady = true;
  }catch(err){
    console.error(err);
    window.showToast('تنبيه: تحقق من تفعيل Firestore وقواعد القراءة والكتابة');
  }
}

function applySettings(){
  $('#siteName') && ($('#siteName').textContent = state.settings.platformName || 'آفاق التعليمية');
  $('#welcomeText') && ($('#welcomeText').textContent = state.settings.welcomeMessage || 'مرحباً بك');
  $('#footerText') && ($('#footerText').textContent = state.settings.footerMessage || state.settings.platformName || 'آفاق التعليمية');
  $('#masterNumberText') && ($('#masterNumberText').textContent = state.settings.masterNumber || 'لم يتم تحديده بعد');
}

function listenSettings(){
  applySettings();
  try{
    onSnapshot(doc(db,'settings','main'), snap=>{
      if(snap.exists()) state.settings = {...state.settings,...snap.data()};
      applySettings();
    }, err=>{ console.error(err); window.showToast('تعذر قراءة إعدادات Firebase'); });
  }catch(err){ console.error(err); }
}

function listenStages(){
  try{
    onSnapshot(query(collection(db,'stages'), orderBy('order','asc')), snap=>{
      const publicStages = $('#publicStages');
      const stagesList = $('#stagesList');
      if(publicStages) publicStages.innerHTML='<option value="">اختر المرحلة</option>';
      if(stagesList) stagesList.innerHTML='';
      snap.forEach(d=>{
        const st={id:d.id,...d.data()};
        publicStages?.insertAdjacentHTML('beforeend', `<option value="${st.name}">${st.name}</option>`);
        stagesList?.insertAdjacentHTML('beforeend', `<div class="card"><h4>${st.name}</h4><p>ترتيب الظهور: ${st.order||0}</p><div class="card-actions"><button class="danger" onclick="deleteStage('${st.id}')">حذف</button></div></div>`);
      });
      if(stagesList && !snap.size) stagesList.innerHTML='<p class="muted">لا توجد مراحل بعد.</p>';
    }, err=>{ console.error(err); window.showToast('تعذر تحميل المراحل من Firebase'); });
  }catch(err){ console.error(err); }
}

function bindPublicForms(){
  $('#subscriptionForm')?.addEventListener('submit', async e=>{
    e.preventDefault();
    try{
      const data=Object.fromEntries(new FormData(e.target).entries());
      await addDoc(collection(db,'subscriptionRequests'), {...data, masterNumber:state.settings.masterNumber||'', status:'pending', createdAt:serverTimestamp()});
      e.target.reset(); applySettings();
      window.showToast('تم إرسال طلب الاشتراك بنجاح');
    }catch(err){ console.error(err); window.showToast('فشل إرسال الطلب: تحقق من Firestore Rules'); }
  });

  document.querySelectorAll('[data-tab]').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-tab]').forEach(b=>b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    btn.classList.add('active');
    $('#tab-'+btn.dataset.tab)?.classList.add('active');
  }));

  document.querySelectorAll('[data-scroll]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.scroll)?.scrollIntoView({behavior:'smooth'}));

  const themeBtn = $('#themeBtn');
  const savedTheme = localStorage.getItem('afaqTheme');
  if(savedTheme==='light') document.body.classList.add('light');
  themeBtn && (themeBtn.textContent = document.body.classList.contains('light') ? 'الوضع الداكن ☾' : 'الوضع النهاري ☀');
  themeBtn?.addEventListener('click',()=>{
    document.body.classList.toggle('light');
    localStorage.setItem('afaqTheme', document.body.classList.contains('light') ? 'light' : 'dark');
    themeBtn.textContent=document.body.classList.contains('light')?'الوضع الداكن ☾':'الوضع النهاري ☀';
  });
}

bindPublicForms();
bindAuth();
bindAdminForms();
await initDefaults();
listenSettings();
listenStages();

if(localStorage.getItem('afaqRole')==='admin') showAdmin();
if(localStorage.getItem('afaqRole')==='student') showStudent(localStorage.getItem('afaqStudentCode'));
