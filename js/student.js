import { db } from './firebase.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

function $(s){ return document.querySelector(s); }
function toast(msg){ window.showToast?.(msg); }

export async function showStudent(code){
  const qy=query(collection(db,'students'), where('code','==',code));
  const snap=await getDocs(qy);
  if(snap.empty) return toast('الكود غير صحيح أو غير مفعل');
  const currentStudent={id:snap.docs[0].id,...snap.docs[0].data()};
  localStorage.setItem('afaqRole','student');
  localStorage.setItem('afaqStudentCode',code);
  $('#home').classList.add('hidden'); document.querySelector('.login-grid').classList.add('hidden'); $('#pricing').classList.add('hidden'); $('#features').classList.add('hidden'); $('#adminPanel').classList.add('hidden'); $('#studentPanel').classList.remove('hidden');
  $('#studentInfo').innerHTML=`<h3>${currentStudent.fullName}</h3><p>المرحلة: ${currentStudent.stage}</p><p>كود الطالب: <b>${currentStudent.code}</b></p><p>ولي الأمر: ${currentStudent.parentName}</p><p>الهاتف: ${currentStudent.phone}</p><p>حالة الاشتراك: ${currentStudent.subscriptionStatus}</p><p>النقاط: ${currentStudent.points||0}</p><p>المستوى: ${currentStudent.level||'🌱 مبتدئ'}</p>`;
}
