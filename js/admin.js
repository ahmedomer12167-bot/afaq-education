import { db } from './firebase.js';
import { state } from './app.js';
import { collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, query, orderBy, onSnapshot, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const $ = s => document.querySelector(s);
const toast = msg => window.showToast?.(msg);
const makeCode = () => String(Math.floor(100000 + Math.random()*900000));
const fmtDate = v => { try{return v?.toDate ? v.toDate().toLocaleDateString('ar-IQ') : (v||'غير محدد')}catch{return 'غير محدد'} };
let reqUnsub=null, stuUnsub=null;

export function listenRequests(){
  const el=$('#requestsList'); if(!el) return;
  if(reqUnsub) return;
  reqUnsub = onSnapshot(query(collection(db,'subscriptionRequests'), orderBy('createdAt','desc')), snap=>{
    el.innerHTML='';
    snap.forEach(d=>{
      const r={id:d.id,...d.data()};
      el.insertAdjacentHTML('beforeend', `<div class="card"><h4>${r.fullName||''}</h4><p>ولي الأمر: ${r.parentName||''}</p><p>الهاتف: ${r.phone||''}</p><p>المرحلة: ${r.stage||''}</p><p>المبلغ: ${r.paidAmount||''}</p><p>رقم الماستر الظاهر للطالب: ${r.masterNumber || 'غير محدد'}</p><p>الحالة: ${r.status||'pending'}</p><div class="card-actions">${(r.status||'pending')==='pending'?`<button class="ok" onclick="approveRequest('${r.id}')">قبول وإنشاء كود</button><button class="danger" onclick="rejectRequest('${r.id}')">رفض</button>`:''}</div></div>`);
    });
    if(!snap.size) el.innerHTML='<p class="muted">لا توجد طلبات حالياً.</p>';
  }, err=>{ console.error(err); el.innerHTML='<p class="muted">تعذر تحميل الطلبات. تحقق من قواعد Firestore.</p>'; });
}

export function listenStudents(){
  const el=$('#studentsList'); if(!el) return;
  if(stuUnsub) return;
  stuUnsub = onSnapshot(query(collection(db,'students'), orderBy('createdAt','desc')), snap=>{
    el.innerHTML='';
    snap.forEach(d=>{ const s={id:d.id,...d.data()}; el.insertAdjacentHTML('beforeend', `<div class="card"><h4>${s.fullName||''}</h4><p>الكود: <b>${s.code||''}</b></p><p>المرحلة: ${s.stage||''}</p><p>الهاتف: ${s.phone||''}</p><p>بداية الاشتراك: ${fmtDate(s.startDate)}</p><p>النهاية: ${s.endDate||'يحدد لاحقاً'}</p><p>الحالة: ${s.subscriptionStatus||'active'}</p><div class="card-actions"><button class="danger" onclick="deleteStudent('${s.id}')">حذف</button></div></div>`) });
    if(!snap.size) el.innerHTML='<p class="muted">لا يوجد طلاب مقبولون بعد.</p>';
  }, err=>{ console.error(err); el.innerHTML='<p class="muted">تعذر تحميل الطلاب. تحقق من قواعد Firestore.</p>'; });
}

export function bindAdminForms(){
  $('#stageForm')?.addEventListener('submit', async e=>{
    e.preventDefault();
    try{
      const name=String(new FormData(e.target).get('stageName')||'').trim();
      if(!name) return;
      await addDoc(collection(db,'stages'), {name, order:Date.now(), createdAt:serverTimestamp()});
      e.target.reset(); toast('تمت إضافة المرحلة');
    }catch(err){ console.error(err); toast('فشل إضافة المرحلة'); }
  });

  $('#settingsForm')?.addEventListener('submit', async e=>{
    e.preventDefault();
    try{
      const data=Object.fromEntries(new FormData(e.target).entries());
      Object.keys(data).forEach(k=>{ if(!String(data[k]).trim()) delete data[k]; });
      await setDoc(doc(db,'settings','main'), data, {merge:true});
      Object.assign(state.settings, data);
      toast('تم حفظ الإعدادات');
    }catch(err){ console.error(err); toast('فشل حفظ الإعدادات'); }
  });
}

window.approveRequest = async id => {
  try{
    const ref=doc(db,'subscriptionRequests',id); const snap=await getDoc(ref); if(!snap.exists()) return;
    const r=snap.data(); const code=makeCode();
    await addDoc(collection(db,'students'), {fullName:r.fullName,parentName:r.parentName,phone:r.phone,stage:r.stage,paidAmount:r.paidAmount,code,subscriptionStatus:'active',points:0,level:'🌱 مبتدئ',startDate:serverTimestamp(),endDate:'يحدد من إعدادات الاشتراك',createdAt:serverTimestamp()});
    await updateDoc(ref,{status:'approved', studentCode:code, approvedAt:serverTimestamp()});
    toast('تم قبول الطالب. الكود: '+code);
  }catch(err){ console.error(err); toast('فشل قبول الطالب'); }
};
window.rejectRequest = async id => updateDoc(doc(db,'subscriptionRequests',id),{status:'rejected', rejectedAt:serverTimestamp()}).then(()=>toast('تم رفض الطلب')).catch(()=>toast('فشل الرفض'));
window.deleteStage = async id => { if(confirm('حذف المرحلة؟')) await deleteDoc(doc(db,'stages',id)); };
window.deleteStudent = async id => { if(confirm('حذف الطالب؟')) await deleteDoc(doc(db,'students',id)); };
