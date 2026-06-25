import { db } from './firebase.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

const $ = s => document.querySelector(s);
const toast = msg => window.showToast?.(msg);

function hidePublic(){ ['#home','.login-grid','#pricing','#features','#adminPanel'].forEach(s=>$(s)?.classList.add('hidden')); }

export async function showStudent(code){
  try{
    const qy=query(collection(db,'students'), where('code','==',String(code).trim()));
    const snap=await getDocs(qy);
    if(snap.empty) return toast('الكود غير صحيح أو لم تتم الموافقة على الاشتراك بعد');
    const currentStudent={id:snap.docs[0].id,...snap.docs[0].data()};
    if(currentStudent.subscriptionStatus && currentStudent.subscriptionStatus !== 'active') return toast('اشتراكك غير نشط حالياً');
    localStorage.setItem('afaqRole','student');
    localStorage.setItem('afaqStudentCode',String(code).trim());
    hidePublic();
    $('#studentPanel')?.classList.remove('hidden');
    $('#studentInfo').innerHTML=`<h3>${currentStudent.fullName||'طالب'}</h3><p>المرحلة: ${currentStudent.stage||'غير محدد'}</p><p>كود الطالب: <b>${currentStudent.code||code}</b></p><p>ولي الأمر: ${currentStudent.parentName||''}</p><p>الهاتف: ${currentStudent.phone||''}</p><p>حالة الاشتراك: ${currentStudent.subscriptionStatus||'active'}</p><p>النقاط: ${currentStudent.points||0}</p><p>المستوى: ${currentStudent.level||'🌱 مبتدئ'}</p>`;
    toast('تم دخول الطالب');
  }catch(err){
    console.error(err);
    toast('فشل تسجيل دخول الطالب: تحقق من Firestore Rules');
  }
}
