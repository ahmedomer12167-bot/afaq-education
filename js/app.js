import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import { getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, onSnapshot, query, where, orderBy, serverTimestamp, Timestamp, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyBPW5fh4PgyQD0iJfPqWlmiPvm9gWuZj5w",
  authDomain: "afaq-educational-platform.firebaseapp.com",
  projectId: "afaq-educational-platform",
  storageBucket: "afaq-educational-platform.firebasestorage.app",
  messagingSenderId: "978120767901",
  appId: "1:978120767901:web:882f31723a2656c07f9774"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let state={settings:{},stages:[],students:[],requests:[],lessons:[],tests:[],assignments:[],attendance:[],notifications:[],finals:[],messages:[],currentStudent:null,unsubs:[]};
const ADMIN_DEFAULT_CODE="2026";
const tabsAdmin=["الرئيسية","طلبات الاشتراك","الطلاب","المراحل","الدروس","الاختبارات","الواجبات","الحضور","الإشعارات","النتائج","الدرجة النهائية","المتميزين","الإحصائيات","الصيانة","الإعدادات"];
const tabsStudent=["الرئيسية","معلوماتي","الدروس","الاختبارات","الواجبات","الحضور","الإشعارات","النتائج","الدرجة النهائية","المتميزين","تواصل"];

function toast(t){const d=document.createElement('div');d.className='toast';d.textContent=t;$('#toast').appendChild(d);setTimeout(()=>d.remove(),3500)}
function uid(){return Math.random().toString(36).slice(2,8).toUpperCase()}
function dateVal(v){ if(!v) return ''; return v.toDate? v.toDate().toLocaleString('ar-IQ') : new Date(v).toLocaleString('ar-IQ') }
function stageOptions(sel=''){return state.stages.map(s=>`<option ${s.name===sel?'selected':''}>${s.name}</option>`).join('')}
function safe(s=''){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
async function uploadFile(file,path){ if(!file) return ''; const r=ref(storage,path+'/'+Date.now()+'-'+file.name); await uploadBytes(r,file); return await getDownloadURL(r); }
async function compressImage(file){return file}

async function seed(){
  const st=await getDoc(doc(db,'settings','main'));
  if(!st.exists()) await setDoc(doc(db,'settings','main'),{platformName:'آفاق التعليمية',welcome:'مرحباً بك في منصة الأحياء',footer:'آفاق التعليمية',masterNumber:'0000 0000 0000 0000',adminCode:ADMIN_DEFAULT_CODE,requestsOpen:true,acceptMsg:'تم قبول اشتراكك',rejectMsg:'تم رفض الطلب',expireMsg:'انتهى الاشتراك'});
  const ss=await getDocs(collection(db,'stages'));
  if(ss.empty){ for(const [i,n] of ['الأول متوسط','الثاني متوسط','الثالث متوسط','الرابع الإعدادي','الخامس الإعدادي','السادس الإعدادي'].entries()) await addDoc(collection(db,'stages'),{name:n,order:i}); }
}
function listenAll(){state.unsubs.forEach(u=>u()); state.unsubs=[];
 [['settings','settings'],['stages','stages'],['students','students'],['subscriptionRequests','requests'],['lessons','lessons'],['tests','tests'],['assignments','assignments'],['attendance','attendance'],['notifications','notifications'],['finalGrades','finals'],['messages','messages']].forEach(([col,key])=>{
 const q=key==='stages'?query(collection(db,col),orderBy('order')):collection(db,col);
 state.unsubs.push(onSnapshot(q,s=>{state[key]=s.docs.map(d=>({id:d.id,...d.data()})); if(key==='settings')state.settings=state.settings.find?.(x=>x.id==='main')||{}; refresh();}));
 });
}
function refresh(){
 const set=state.settings||{}; $('#brandName').textContent=set.platformName||'آفاق التعليمية'; $('#welcomeText').textContent=set.welcome||'مرحباً بك'; $('#reqMaster').value=set.masterNumber||''; $('#reqStage').innerHTML=stageOptions();
 $('#statStudents').textContent=state.students.length; $('#statLessons').textContent=state.lessons.length; $('#statTests').textContent=state.tests.length;
 if(!$('#adminPanel').classList.contains('hidden')) renderAdmin(window.adminTab||'الرئيسية');
 if(state.currentStudent) { const fresh=state.students.find(x=>x.id===state.currentStudent.id); if(fresh) state.currentStudent=fresh; renderStudent(window.studentTab||'الرئيسية'); }
}
function showHome(){['#adminPanel','#studentPanel'].forEach(x=>$(x).classList.add('hidden')); $('.hero').classList.remove('hidden'); $('.login-grid').classList.remove('hidden'); $('.mini-features').classList.remove('hidden')}
function showAdmin(){ $('.hero').classList.add('hidden'); $('.login-grid').classList.add('hidden'); $('.mini-features').classList.add('hidden'); $('#studentPanel').classList.add('hidden'); $('#adminPanel').classList.remove('hidden'); renderAdminTabs(); renderAdmin('الرئيسية') }
function showStudent(){ $('.hero').classList.add('hidden'); $('.login-grid').classList.add('hidden'); $('.mini-features').classList.add('hidden'); $('#adminPanel').classList.add('hidden'); $('#studentPanel').classList.remove('hidden'); renderStudentTabs(); renderStudent('الرئيسية') }
function renderAdminTabs(){ $('#adminTabs').innerHTML=tabsAdmin.map(t=>`<button class="${(window.adminTab||'الرئيسية')===t?'active':''}" data-atab="${t}">${t}</button>`).join(''); $$('[data-atab]').forEach(b=>b.onclick=()=>renderAdmin(b.dataset.atab)); }
function renderStudentTabs(){ $('#studentTabs').innerHTML=tabsStudent.map(t=>`<button class="${(window.studentTab||'الرئيسية')===t?'active':''}" data-stab="${t}">${t}</button>`).join(''); $$('[data-stab]').forEach(b=>b.onclick=()=>renderStudent(b.dataset.stab)); }

function renderAdmin(tab){window.adminTab=tab; renderAdminTabs(); const c=$('#adminContent');
 const activeStudents=state.students.filter(s=>s.status==='active');
 if(tab==='الرئيسية') c.innerHTML=`<div class="cards"><div class="card"><h3>الطلاب</h3><b>${activeStudents.length}</b></div><div class="card"><h3>طلبات جديدة</h3><b>${state.requests.filter(r=>r.status==='new').length}</b></div><div class="card"><h3>الدروس</h3><b>${state.lessons.length}</b></div><div class="card"><h3>الاختبارات</h3><b>${state.tests.length}</b></div></div>`;
 if(tab==='طلبات الاشتراك') c.innerHTML=`<div class="pack-list">${state.requests.map(r=>`<div class="pack"><h3>${safe(r.name)}</h3><p>ولي الأمر: ${safe(r.parent)}<br>الهاتف: ${safe(r.phone)}<br>المرحلة: ${safe(r.stage)}<br>المبلغ: ${safe(r.amount)}<br>الحالة: ${safe(r.status||'new')}</p><div class="actions"><button class="ok" data-accept="${r.id}">قبول وإنشاء كود</button><button class="danger" data-reject="${r.id}">رفض</button><button class="danger" data-del="subscriptionRequests/${r.id}">حذف</button></div></div>`).join('')||'<div class="card">لا توجد طلبات</div>'}</div>`;
 if(tab==='الطلاب') c.innerHTML=`<div class="pack-list">${state.students.map(s=>`<div class="pack"><h3>${safe(s.name)}</h3><span class="badge">${safe(s.stage)}</span><span class="badge">كود: ${safe(s.code)}</span><p>ولي الأمر: ${safe(s.parent)}<br>الهاتف: ${safe(s.phone)}<br>الاشتراك: ${safe(s.status)}<br>من ${safe(s.startDate||'')} إلى ${safe(s.endDate||'')}</p><div class="actions"><button data-profile="${s.id}">معلومات الطالب</button><button class="warn" data-toggle-student="${s.id}">${s.status==='active'?'إيقاف':'تفعيل'}</button><button class="danger" data-del="students/${s.id}">حذف</button></div></div>`).join('')}</div>`;
 if(tab==='المراحل') c.innerHTML=`<div class="card"><h3>إضافة مرحلة</h3><div class="form-grid"><input id="stageName" placeholder="اسم المرحلة"><input id="stageOrder" type="number" placeholder="ترتيب الظهور"></div><button id="addStage">إضافة</button></div><div class="pack-list">${state.stages.map(s=>`<div class="pack"><h3>${safe(s.name)}</h3><p>الترتيب: ${s.order}</p><button class="danger" data-del="stages/${s.id}">حذف</button></div>`).join('')}</div>`;
 if(tab==='الدروس') c.innerHTML=formContent('lesson','درس')+packs(state.lessons,'lessons');
 if(tab==='الاختبارات') c.innerHTML=testForm()+packs(state.tests,'tests');
 if(tab==='الواجبات') c.innerHTML=assignmentForm()+packs(state.assignments,'assignments');
 if(tab==='الحضور') c.innerHTML=attendanceForm()+packs(state.attendance,'attendance');
 if(tab==='الإشعارات') c.innerHTML=notificationForm()+packs(state.notifications,'notifications');
 if(tab==='النتائج') c.innerHTML=resultsAdmin();
 if(tab==='الدرجة النهائية') c.innerHTML=finalForm()+packs(state.finals,'finalGrades');
 if(tab==='المتميزين') c.innerHTML=leaderboardHTML();
 if(tab==='الإحصائيات') c.innerHTML=statsHTML();
 if(tab==='الصيانة') c.innerHTML=maintenanceHTML();
 if(tab==='الإعدادات') c.innerHTML=settingsHTML();
 bindAdminActions();
}
function formContent(){return `<div class="card"><h3>إضافة درس</h3><div class="form-grid"><input id="lessonTitle" placeholder="عنوان الدرس"><select id="lessonStage">${stageOptions()}</select><input id="lessonVideo" placeholder="رابط فيديو اختياري"><input id="lessonDate" type="datetime-local"><input id="lessonFile" type="file"></div><textarea id="lessonDesc" placeholder="وصف مختصر"></textarea><button id="addLesson">نشر الدرس</button></div>`}
function testForm(){return `<div class="card"><h3>إنشاء اختبار</h3><div class="form-grid"><input id="testTitle" placeholder="عنوان الاختبار"><select id="testStage">${stageOptions()}</select><input id="testDuration" type="number" placeholder="المدة بالدقائق"><input id="testOpen" type="datetime-local"><input id="testClose" type="datetime-local"><input id="testTotal" type="number" placeholder="الدرجة النهائية"><select id="testStatus"><option>منشور</option><option>مخفي</option></select><input id="testFile" type="file"></div><textarea id="testDesc" placeholder="وصف مختصر"></textarea><textarea id="testQuestions" placeholder="الأسئلة بصيغة JSON اختيارية. مثال: [{&quot;type&quot;:&quot;mcq&quot;,&quot;text&quot;:&quot;...&quot;,&quot;options&quot;:[&quot;أ&quot;,&quot;ب&quot;],&quot;answer&quot;:&quot;أ&quot;,&quot;score&quot;:5}]"></textarea><button id="addTest">نشر الاختبار</button></div>`}
function assignmentForm(){return `<div class="card"><h3>إضافة واجب</h3><div class="form-grid"><input id="assTitle" placeholder="عنوان الواجب"><select id="assStage">${stageOptions()}</select><input id="assOpen" type="datetime-local"><input id="assClose" type="datetime-local"><input id="assTotal" type="number" placeholder="الدرجة الكلية"><input id="assFile" type="file"></div><textarea id="assDesc" placeholder="وصف الواجب"></textarea><button id="addAss">نشر الواجب</button></div>`}
function attendanceForm(){return `<div class="card"><h3>فتح حضور</h3><div class="form-grid"><input id="attTitle" placeholder="عنوان المحاضرة"><select id="attStage">${stageOptions()}</select><input id="attMinutes" type="number" placeholder="مدة التسجيل بالدقائق"></div><button id="addAtt">فتح الحضور الآن</button></div>`}
function notificationForm(){return `<div class="card"><h3>إرسال إشعار</h3><div class="form-grid"><input id="notTitle" placeholder="عنوان الإشعار"><select id="notStage"><option>الجميع</option>${stageOptions()}</select><select id="notType"><option>عام</option><option>درس</option><option>اختبار</option><option>واجب</option><option>حضور</option></select></div><textarea id="notText" placeholder="نص الإشعار"></textarea><button id="addNot">إرسال</button></div>`}
function packs(arr,col){return `<div class="pack-list">${arr.map(x=>`<div class="pack"><h3>${safe(x.title||x.name||x.stage)}</h3><span class="badge">${safe(x.stage||x.type||'')}</span><p>${safe(x.desc||x.text||'')}<br>${x.closeAt?'الإغلاق: '+safe(x.closeAt):''}</p><div class="actions">${x.fileUrl?`<a target="_blank" href="${x.fileUrl}"><button>فتح الملف</button></a>`:''}<button class="danger" data-del="${col}/${x.id}">حذف</button></div></div>`).join('')||'<div class="card">لا توجد بيانات</div>'}</div>`}
function resultsAdmin(){return `<div class="pack-list">${state.students.map(s=>`<div class="pack"><h3>${safe(s.name)}</h3><p>المرحلة: ${safe(s.stage)}<br>النقاط: ${s.points||0}<br>المستوى: ${level(s.points||0)}<br>متوسط الدرجات: ${avgStudent(s.id)}%</p></div>`).join('')}</div>`}
function finalForm(){return `<div class="card"><h3>اعتماد درجة نهائية</h3><div class="form-grid"><select id="finalStudent">${state.students.map(s=>`<option value="${s.id}">${safe(s.name)} - ${safe(s.stage)}</option>`)}</select><input id="finalGrade" type="number" placeholder="الدرجة النهائية"><input id="finalNote" placeholder="ملاحظات اختيارية"></div><button id="addFinal">اعتماد الدرجة</button></div>`}
function settingsHTML(){const s=state.settings;return `<div class="card"><h3>إعدادات المنصة والحساب</h3><div class="form-grid"><input id="setName" value="${safe(s.platformName||'')}" placeholder="اسم المنصة"><input id="setWelcome" value="${safe(s.welcome||'')}" placeholder="رسالة الترحيب"><input id="setFooter" value="${safe(s.footer||'')}" placeholder="رسالة الفوتر"><input id="setMaster" value="${safe(s.masterNumber||'')}" placeholder="رقم الماستر"><input id="setAdminCode" value="${safe(s.adminCode||ADMIN_DEFAULT_CODE)}" placeholder="كود المدير"><select id="setOpen"><option ${s.requestsOpen?'selected':''} value="true">استقبال الطلبات مفعل</option><option ${!s.requestsOpen?'selected':''} value="false">استقبال الطلبات متوقف</option></select></div><button id="saveSettings">حفظ الإعدادات</button></div>`}
function maintenanceHTML(){return `<div class="cards"><div class="card"><h3>نسخة احتياطية</h3><button id="backup">تحميل نسخة JSON</button></div>${[['notifications','الإشعارات'],['tests','الاختبارات'],['assignments','الواجبات'],['attendance','الحضور'],['lessons','الدروس'],['subscriptionRequests','طلبات الاشتراك']].map(x=>`<div class="card"><h3>حذف ${x[1]}</h3><button class="danger" data-clear="${x[0]}">حذف الكل</button></div>`).join('')}<div class="card"><h3>إعادة ضبط كاملة</h3><button class="danger" id="resetAll">إعادة ضبط المنصة</button></div></div>`}
function statsHTML(){let revenue=state.requests.filter(r=>r.status==='accepted').reduce((a,b)=>a+(+b.amount||0),0);return `<div class="cards"><div class="card"><h3>الطلاب المشتركين</h3><b>${state.students.length}</b></div><div class="card"><h3>طلبات جديدة</h3><b>${state.requests.filter(r=>r.status==='new').length}</b></div><div class="card"><h3>إجمالي الإيرادات</h3><b>${revenue}</b></div><div class="card"><h3>نسبة الحضور</h3><b>${attendanceRate()}%</b></div></div>`}
function leaderboardHTML(stage=''){let arr=[...state.students].filter(s=>!stage||s.stage===stage).sort((a,b)=>(b.points||0)-(a.points||0));return `<div class="pack-list">${arr.map((s,i)=>`<div class="pack"><h3>#${i+1} ${safe(s.name)}</h3><p>المرحلة: ${safe(s.stage)}<br>المستوى: ${level(s.points||0)}<br>النقاط: ${s.points||0}<br>نسبة الإنجاز: ${Math.min(100,Math.round((s.points||0)/10))}%</p></div>`).join('')}</div>`}
function bindAdminActions(){
 $$('[data-del]').forEach(b=>b.onclick=async()=>{if(confirm('تأكيد الحذف؟')){const [c,id]=b.dataset.del.split('/');await deleteDoc(doc(db,c,id));toast('تم الحذف')}});
 $$('[data-clear]').forEach(b=>b.onclick=async()=>{if(confirm('تأكيد حذف الكل؟')) await clearCol(b.dataset.clear)});
 $$('[data-accept]').forEach(b=>b.onclick=async()=>acceptRequest(b.dataset.accept)); $$('[data-reject]').forEach(b=>b.onclick=async()=>{await updateDoc(doc(db,'subscriptionRequests',b.dataset.reject),{status:'rejected'});toast('تم الرفض')});
 $$('[data-toggle-student]').forEach(b=>b.onclick=async()=>{let s=state.students.find(x=>x.id===b.dataset.toggleStudent);await updateDoc(doc(db,'students',s.id),{status:s.status==='active'?'stopped':'active'});});
 const a=(id,fn)=>{let el=$('#'+id); if(el) el.onclick=fn};
 a('addStage',async()=>{await addDoc(collection(db,'stages'),{name:$('#stageName').value,order:+$('#stageOrder').value||state.stages.length});toast('تمت إضافة المرحلة')});
 a('addLesson',async()=>{const file=await uploadFile($('#lessonFile').files[0],'lessons');await addDoc(collection(db,'lessons'),{title:$('#lessonTitle').value,stage:$('#lessonStage').value,desc:$('#lessonDesc').value,video:$('#lessonVideo').value,fileUrl:file,publishAt:$('#lessonDate').value,createdAt:serverTimestamp()});await autoNotify($('#lessonStage').value,'درس','درس جديد',$('#lessonTitle').value);toast('تم نشر الدرس')});
 a('addTest',async()=>{let qs=[];try{qs=$('#testQuestions').value?JSON.parse($('#testQuestions').value):[]}catch(e){toast('صيغة الأسئلة غير صحيحة');return}const file=await uploadFile($('#testFile').files[0],'tests');await addDoc(collection(db,'tests'),{title:$('#testTitle').value,stage:$('#testStage').value,desc:$('#testDesc').value,duration:+$('#testDuration').value,total:+$('#testTotal').value,status:$('#testStatus').value,openAt:$('#testOpen').value,closeAt:$('#testClose').value,questions:qs,fileUrl:file,createdAt:serverTimestamp()});await autoNotify($('#testStage').value,'اختبار','اختبار جديد',$('#testTitle').value);toast('تم نشر الاختبار')});
 a('addAss',async()=>{const file=await uploadFile($('#assFile').files[0],'assignments');await addDoc(collection(db,'assignments'),{title:$('#assTitle').value,stage:$('#assStage').value,desc:$('#assDesc').value,total:+$('#assTotal').value,openAt:$('#assOpen').value,closeAt:$('#assClose').value,fileUrl:file,createdAt:serverTimestamp()});await autoNotify($('#assStage').value,'واجب','واجب جديد',$('#assTitle').value);toast('تم نشر الواجب')});
 a('addAtt',async()=>{let end=new Date(Date.now()+(+$('#attMinutes').value||10)*60000).toISOString();await addDoc(collection(db,'attendance'),{title:$('#attTitle').value,stage:$('#attStage').value,endAt:end,present:[],createdAt:serverTimestamp()});await autoNotify($('#attStage').value,'حضور','تم فتح الحضور',$('#attTitle').value);toast('تم فتح الحضور')});
 a('addNot',async()=>{await addDoc(collection(db,'notifications'),{title:$('#notTitle').value,text:$('#notText').value,stage:$('#notStage').value,type:$('#notType').value,createdAt:serverTimestamp(),readBy:[]});toast('تم إرسال الإشعار')});
 a('addFinal',async()=>{let s=state.students.find(x=>x.id===$('#finalStudent').value);await addDoc(collection(db,'finalGrades'),{studentId:s.id,name:s.name,stage:s.stage,grade:+$('#finalGrade').value,note:$('#finalNote').value,approvedAt:new Date().toISOString()});toast('تم اعتماد الدرجة')});
 a('saveSettings',async()=>{await setDoc(doc(db,'settings','main'),{platformName:$('#setName').value,welcome:$('#setWelcome').value,footer:$('#setFooter').value,masterNumber:$('#setMaster').value,adminCode:$('#setAdminCode').value,requestsOpen:$('#setOpen').value==='true'},{merge:true});toast('تم الحفظ')});
 a('backup',()=>downloadJSON()); a('resetAll',async()=>{if(confirm('تحذير: سيتم حذف أغلب بيانات المنصة. هل أنت متأكد؟')) for(const c of ['notifications','tests','assignments','attendance','lessons','subscriptionRequests','students','finalGrades','messages']) await clearCol(c);});
}
async function acceptRequest(id){let r=state.requests.find(x=>x.id===id), code='ST-'+uid();let start=new Date(), end=new Date();end.setMonth(end.getMonth()+1);await addDoc(collection(db,'students'),{name:r.name,parent:r.parent,phone:r.phone,stage:r.stage,code,status:'active',startDate:start.toISOString().slice(0,10),endDate:end.toISOString().slice(0,10),points:0,createdAt:serverTimestamp()});await updateDoc(doc(db,'subscriptionRequests',id),{status:'accepted',studentCode:code});await addDoc(collection(db,'notifications'),{title:'قبول الاشتراك',text:(state.settings.acceptMsg||'تم قبول اشتراكك')+' - كودك: '+code,stage:r.stage,type:'عام',createdAt:serverTimestamp(),readBy:[]});toast('تم القبول وإنشاء الكود: '+code)}
async function autoNotify(stage,type,title,text){await addDoc(collection(db,'notifications'),{title,text,stage,type,createdAt:serverTimestamp(),readBy:[]})}
async function clearCol(c){const snap=await getDocs(collection(db,c)); const batch=writeBatch(db); snap.docs.forEach(d=>batch.delete(d.ref)); await batch.commit(); toast('تم الحذف')}
function downloadJSON(){const data=JSON.stringify(state,null,2);let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:'application/json'}));a.download='afaq-backup.json';a.click()}
function level(p){return p>=1000?'👑 نخبة الأحياء':p>=700?'🥇 متفوق':p>=450?'🏅 متميز':p>=250?'⭐ متقدم':p>=100?'📘 مجتهد':'🌱 مبتدئ'}
function avgStudent(){return 0} function attendanceRate(){let all=state.attendance.length*state.students.length;if(!all)return 0;let p=state.attendance.reduce((a,b)=>a+(b.present?.length||0),0);return Math.round(p/all*100)}

function renderStudent(tab){window.studentTab=tab; renderStudentTabs(); const s=state.currentStudent; $('#studentTitle').textContent='لوحة '+s.name; $('#studentSub').textContent=s.stage+' | '+level(s.points||0); const c=$('#studentContent');
 const byStage=arr=>arr.filter(x=>x.stage===s.stage||x.stage==='الجميع');
 if(tab==='الرئيسية') c.innerHTML=`<div class="cards"><div class="card"><h3>النقاط</h3><b>${s.points||0}</b></div><div class="card"><h3>المستوى</h3><b>${level(s.points||0)}</b></div><div class="card"><h3>الاشتراك</h3><b>${safe(s.status)}</b></div><div class="card"><h3>ينتهي في</h3><b>${safe(s.endDate||'')}</b></div></div>`;
 if(tab==='معلوماتي') c.innerHTML=`<div class="pack"><h3>${safe(s.name)}</h3><p>كود الطالب: ${safe(s.code)}<br>المرحلة: ${safe(s.stage)}<br>ولي الأمر: ${safe(s.parent)}<br>الهاتف: ${safe(s.phone)}<br>من ${safe(s.startDate)} إلى ${safe(s.endDate)}<br>النقاط: ${s.points||0}<br>المستوى: ${level(s.points||0)}</p><button onclick="window.print()">طباعة / PDF</button></div>`;
 if(tab==='الدروس') c.innerHTML=studentPacks(byStage(state.lessons),'درس');
 if(tab==='الاختبارات') c.innerHTML=studentPacks(byStage(state.tests).filter(t=>t.status==='منشور'),'اختبار',true);
 if(tab==='الواجبات') c.innerHTML=studentPacks(byStage(state.assignments),'واجب',false,true);
 if(tab==='الحضور') c.innerHTML=studentAttendance(byStage(state.attendance));
 if(tab==='الإشعارات') c.innerHTML=studentPacks(byStage(state.notifications),'إشعار');
 if(tab==='النتائج') c.innerHTML=`<div class="card">سيتم عرض نتائج الاختبارات والواجبات بعد التصحيح والاعتماد.</div>`;
 if(tab==='الدرجة النهائية') c.innerHTML=studentPacks(state.finals.filter(f=>f.studentId===s.id),'درجة نهائية');
 if(tab==='المتميزين') c.innerHTML=leaderboardHTML(s.stage);
 if(tab==='تواصل') c.innerHTML=`<div class="card"><h3>تواصل مع المدير</h3><textarea id="msgText" placeholder="اكتب رسالتك"></textarea><button id="sendMsg">إرسال</button></div><div class="pack-list">${state.messages.filter(m=>m.studentId===s.id).map(m=>`<div class="pack"><h3>${safe(m.from)}</h3><p>${safe(m.text)}</p></div>`).join('')}</div>`;
 let send=$('#sendMsg'); if(send) send.onclick=async()=>{await addDoc(collection(db,'messages'),{studentId:s.id,studentName:s.name,from:'الطالب',text:$('#msgText').value,createdAt:serverTimestamp()});toast('تم إرسال الرسالة')}
 $$('[data-attend]').forEach(b=>b.onclick=async()=>{let a=state.attendance.find(x=>x.id===b.dataset.attend); if(new Date(a.endAt)<new Date()){toast('انتهى وقت الحضور');return} if(a.present?.includes(s.id)){toast('تم تسجيلك سابقاً');return} await updateDoc(doc(db,'attendance',a.id),{present:[...(a.present||[]),s.id]}); await updateDoc(doc(db,'students',s.id),{points:(s.points||0)+10});toast('تم تسجيل الحضور')});
}
function studentPacks(arr,type,test=false,ass=false){return `<div class="pack-list">${arr.map(x=>`<div class="pack"><h3>${safe(x.title||x.name)}</h3><span class="badge">${type}</span><p>${safe(x.desc||x.text||'')}<br>${x.closeAt?'ينتهي: '+safe(x.closeAt):''}</p>${x.closeAt?timerHTML(x.closeAt):''}<div class="actions">${x.fileUrl?`<a target="_blank" href="${x.fileUrl}"><button>فتح الملف</button></a>`:''}${test?`<button data-start-test="${x.id}">فتح الاختبار</button>`:''}${ass?`<input type="file"><button>إرسال الواجب</button>`:''}</div></div>`).join('')||'<div class="card">لا توجد بيانات لمرحلتك</div>'}</div>`}
function studentAttendance(arr){return `<div class="pack-list">${arr.map(a=>`<div class="pack"><h3>${safe(a.title)}</h3><p>ينتهي: ${dateVal(a.endAt)}<br>الحالة: ${a.present?.includes(state.currentStudent.id)?'حاضر':'لم يسجل بعد'}</p>${timerHTML(a.endAt)}<button data-attend="${a.id}">تسجيل الحضور</button></div>`).join('')||'<div class="card">لا يوجد حضور مفتوح</div>'}</div>`}
function timerHTML(end){let total=Math.max(0,new Date(end)-new Date());let pct=Math.min(100,Math.max(0,total/(24*3600000)*100));return `<div class="timer"><i style="width:${pct}%"></i></div>`}

$('#themeBtn').onclick=()=>{document.body.classList.toggle('light');$('#themeBtn').textContent=document.body.classList.contains('light')?'الوضع الداكن 🌙':'الوضع النهاري ☀️'};
$$('[data-scroll]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.scroll).scrollIntoView({behavior:'smooth'}));
$('#openRequest').onclick=()=>{ if(state.settings.requestsOpen===false){toast('استقبال الطلبات متوقف حالياً');return} $('#requestModal').classList.add('show')};
$$('[data-close]').forEach(b=>b.onclick=()=>$('#'+b.dataset.close).classList.remove('show'));
$('#sendRequest').onclick=async()=>{await addDoc(collection(db,'subscriptionRequests'),{name:$('#reqName').value,parent:$('#reqParent').value,phone:$('#reqPhone').value,stage:$('#reqStage').value,amount:+$('#reqAmount').value,masterNumber:$('#reqMaster').value,status:'new',createdAt:serverTimestamp()});$('#requestModal').classList.remove('show');toast('تم إرسال طلب الاشتراك')};
$('#adminLogin').onclick=()=>{if($('#adminCode').value===(state.settings.adminCode||ADMIN_DEFAULT_CODE)) showAdmin(); else toast('كود المدير غير صحيح')};
$('#studentLogin').onclick=()=>{let s=state.students.find(x=>x.code===$('#studentCode').value.trim()); if(!s){toast('كود الطالب غير صحيح');return} if(s.status!=='active'){toast('اشتراكك غير نشط');return} state.currentStudent=s; showStudent()};
$('#adminLogout').onclick=showHome; $('#studentLogout').onclick=()=>{state.currentStudent=null;showHome()};

await seed(); listenAll();
