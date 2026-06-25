
import * as A from "./core.js";import {guard,shell,panel,card,formModal,showNotifications,updateBadge,statBox} from "./dashboard.js";
const user=guard("admin");
const nav=[
{id:"home",title:"الرئيسية",icon:"🏠"},{id:"stages",title:"المراحل",icon:"🏫"},{id:"subjects",title:"المواد",icon:"📚"},{id:"teachers",title:"المدرسون",icon:"👨‍🏫"},{id:"students",title:"الطلاب",icon:"🎓"},{id:"requests",title:"طلبات الاشتراك",icon:"📝"},{id:"profiles",title:"ملفات الطلاب",icon:"📁"},{id:"teacherProfiles",title:"ملفات المدرسين",icon:"🧑‍🏫"},{id:"leaderboard",title:"لوحة الشرف",icon:"🏆"},{id:"reports",title:"التقارير",icon:"📊"},{id:"search",title:"البحث الشامل",icon:"🔎"},{id:"backup",title:"النسخ الاحتياطي",icon:"💾"},{id:"calendar",title:"التقويم",icon:"📅"},{id:"maintenance",title:"الصيانة",icon:"🛠️"},{id:"notifications",title:"الإشعارات",icon:"🔔"},{id:"settings",title:"الإعدادات",icon:"⚙️"}];
let draw=shell("لوحة المدير الكاملة v10","admin",user,nav),current="home";
window.openSection=async id=>{current=id;draw(id);updateBadge("admin",user);
({home,stages,subjects,teachers,students,requests,profiles,teacherProfiles,leaderboard,reports,search,backup,settings}[id]||(()=>{}))();
if(id==="calendar")calendar();if(id==="maintenance")maintenance();if(id==="notifications"){await showNotifications("admin",user);updateBadge("admin",user)}}
function home(){
let students=A.getData("students"),teachers=A.getData("teachers"),subs=A.getData("subscriptions"),subjects=A.getData("subjects"),reqs=A.getData("subscriptionRequests");
let activeSubs=subs.filter(x=>x.subscriptionStatus==="نشط"||x.status==="نشط").length;
let income=subs.reduce((t,x)=>t+Number(String(x.amount||0).replace(/[^0-9.]/g,"")),0);
content.innerHTML=panel("لوحة القيادة الاحترافية","واجهة متزامنة لحظياً مع جميع أقسام منصة آفاق")+
`<div class="stats">${statBox("إجمالي الطلاب",students.length)}${statBox("المدرسون",teachers.length)}${statBox("المواد الدراسية",subjects.length)}${statBox("الإيرادات",income.toLocaleString("ar-IQ")+" د.ع")}${statBox("طلبات جديدة",reqs.length)}</div>
<div class="card-grid">
<div class="data-card"><h3>نمو عدد الطلاب</h3><div class="exam-progress"><span style="width:${Math.min(100,students.length*8)}%"></span></div><p class="muted">مؤشر حي حسب عدد الطلاب</p></div>
<div class="data-card"><h3>توزيع الاشتراكات</h3><p><span class="chip">نشطة ${activeSubs}</span><span class="chip">بانتظار ${reqs.length}</span></p><div class="exam-progress"><span style="width:${subs.length?Math.round(activeSubs/subs.length*100):0}%"></span></div></div>
<div class="data-card"><h3>أحدث النشاطات</h3>${A.getData("notifications").slice(0,5).map(n=>`<p>🔔 ${n.title||"إشعار"} <span class="muted">${n.createdAt||""}</span></p>`).join("")||'<div class="empty">لا توجد نشاطات</div>'}</div>
<div class="data-card"><h3>التنبيهات المهمة</h3><p>⚠️ طلبات اشتراك: ${reqs.length}</p><p>✍️ اختبارات تنتظر التصحيح: ${A.getData("examAttempts").filter(x=>x.status==="بانتظار التصحيح اليدوي").length}</p><p>📝 واجبات تنتظر التصحيح: ${A.getData("assignmentSubmissions").filter(x=>x.status!=="مصحح").length}</p></div>
</div>
<div class="card-grid"><button class="primary" onclick="openSection('students')">طالب جديد</button><button class="green" onclick="openSection('teachers')">مدرس جديد</button><button class="blue" onclick="openSection('subjects')">مادة جديدة</button><button class="orange" onclick="openSection('reports')">التقارير</button><button onclick="openSection('backup')">نسخة احتياطية</button><button onclick="openSection('settings')">الإعدادات</button></div>`;
}
function stages(){let arr=A.stages();content.innerHTML=panel("إدارة المراحل")+`<button class="green" id="add">إضافة مرحلة</button><div class="card-grid">${arr.map(s=>card(s.name,`<span class="chip">${s.status}</span><span class="chip">${s.visibility}</span>`,`<button onclick="editStage('${s.id}')">تعديل</button><button class="red" onclick="del('stages','${s.id}')">حذف</button>`)).join("")}</div>`;add.onclick=()=>editStage()}
window.editStage=idv=>{let o=A.getData("stages").find(x=>x.id===idv)||{};formModal(idv?"تعديل مرحلة":"إضافة مرحلة",[{name:"name",label:"اسم المرحلة",required:1},{name:"status",label:"الحالة",type:"select",options:["مفعلة","موقوفة"]},{name:"visibility",label:"الظهور",type:"select",options:["ظاهر","مخفي"]}],async d=>{idv?await A.updateItem("stages",idv,d):await A.addItem("stages",d);stages()},o)}
function subjects(){let arr=A.getData("subjects");content.innerHTML=panel("إدارة المواد")+`<button class="green" id="add">إضافة مادة</button><div class="card-grid">${arr.map(s=>card(s.name,`<p>${s.stage}</p><span class="chip">${s.code}</span><span class="chip">${s.teacher||"بدون مدرس"}</span>`,`<button onclick="editSubject('${s.id}')">تعديل</button><button class="red" onclick="del('subjects','${s.id}')">حذف</button>`)).join("")}</div>`;add.onclick=()=>editSubject()}
window.editSubject=idv=>{let o=A.getData("subjects").find(x=>x.id===idv)||{};formModal(idv?"تعديل مادة":"إضافة مادة",[{name:"name",label:"اسم المادة",required:1},{name:"stage",label:"المرحلة",type:"select",options:A.stages().map(x=>x.name)},{name:"code",label:"كود المادة",required:1},{name:"icon",label:"الأيقونة"},{name:"status",label:"الحالة",type:"select",options:["مفعلة","موقوفة"]},{name:"visibility",label:"الظهور",type:"select",options:["ظاهر","مخفي"]}],async d=>{idv?await A.updateItem("subjects",idv,d):await A.addItem("subjects",d);subjects()},o)}
function teachers(){let arr=A.getData("teachers");content.innerHTML=panel("إدارة المدرسين")+`<button class="green" id="add">إضافة مدرس</button><div class="card-grid">${arr.map(t=>card(t.name,`${t.photo?`<img class="profile-img" src="${t.photo}">`:""}<p>${t.stage} / ${t.subject}</p><span class="chip">كود المدرس: ${t.teacherCode}</span><span class="chip">كود المادة: ${t.subjectCode}</span>`,`<button onclick="editTeacher('${t.id}')">تعديل</button><button class="red" onclick="del('teachers','${t.id}')">حذف</button>`)).join("")}</div>`;add.onclick=()=>editTeacher()}
window.editTeacher=idv=>{let o=A.getData("teachers").find(x=>x.id===idv)||{};formModal(idv?"تعديل مدرس":"إضافة مدرس",[{name:"name",label:"اسم المدرس",required:1},{name:"stage",label:"المرحلة",type:"select",options:A.stages().map(x=>x.name)},{name:"subject",label:"المادة",type:"select",options:A.getData("subjects").map(x=>x.name)},{name:"teacherCode",label:"كود المدرس",required:1},{name:"subjectCode",label:"كود المادة"},{name:"phone",label:"الهاتف"},{name:"status",label:"الحالة",type:"select",options:["مفعل","موقوف"]},{name:"bio",label:"نبذة",type:"textarea"}],async d=>{if(!d.subjectCode)d.subjectCode=A.subjectCode(d.subject,d.stage);let sub=A.getData("subjects").find(s=>A.eq(s.name,d.subject)&&A.eq(s.stage,d.stage)); if(sub)await A.updateItem("subjects",sub.id,{teacher:d.name,code:d.subjectCode}); idv?await A.updateItem("teachers",idv,d):await A.addItem("teachers",d);teachers()},o)}
function students(){let arr=A.getData("students");content.innerHTML=panel("إدارة الطلاب")+`<div class="card-grid">${arr.map(s=>card(s.name,`${s.photo?`<img class="profile-img" src="${s.photo}">`:""}<p>${s.stage}</p><span class="chip">الكود: ${s.code}</span><span class="chip">${s.subscriptionStatus}</span>`,`<button onclick="editStudent('${s.id}')">تعديل</button><button onclick="studentDetails('${s.id}')">ملف كامل</button><button class="red" onclick="del('students','${s.id}')">حذف</button>`)).join("")||'<div class="empty">لا يوجد طلاب</div>'}</div>`}
window.editStudent=idv=>{let o=A.getData("students").find(x=>x.id===idv)||{};formModal("تعديل طالب",[{name:"name",label:"اسم الطالب"},{name:"parentName",label:"ولي الأمر"},{name:"stage",label:"المرحلة",type:"select",options:A.stages().map(x=>x.name)},{name:"code",label:"كود الطالب"},{name:"phone",label:"الهاتف"},{name:"status",label:"الحالة",type:"select",options:["مفعل","موقوف"]},{name:"subscriptionStatus",label:"الاشتراك",type:"select",options:["نشط","موقوف","منتهي"]}],async d=>{await A.updateItem("students",idv,d);students()},o)}
function requests(){let arr=A.getData("subscriptionRequests");content.innerHTML=panel("طلبات الاشتراك")+`<div class="card-grid">${arr.map(r=>card(r.name||r.studentName,`<p>${r.stage}</p><p>ولي الأمر: ${r.parentName}</p><p>الهاتف: ${r.phone||""}</p><p>رقم الماستر: ${r.masterNumber||A.settings().masterNumber||""}</p>`,`<button class="green" onclick="approve('${r.id}')">قبول</button><button class="red" onclick="del('subscriptionRequests','${r.id}')">حذف</button>`)).join("")||'<div class="empty">لا توجد طلبات</div>'}</div>`}
window.approve=async idv=>{
 let c=prompt("اكتب كود الطالب");
 if(!c)return;
 let startDate=prompt("تاريخ بداية الاشتراك",A.today())||A.today();
 let endDate=prompt("تاريخ انتهاء الاشتراك","")||"";
 let st=await A.approveSubscriptionFixed(idv,c,{startDate,endDate});
 if(!st)return alert("لم يتم العثور على الطلب");
 alert("تم تفعيل الطالب بالكود: "+st.code);
 requests();
}
function profiles(){content.innerHTML=panel("ملفات الطلاب الكاملة")+`<div class="card-grid">${A.getData("students").map(s=>{let p=A.studentProfile(s);return card(s.name,`<div class="profile-grid"><div class="profile-box">النقاط: ${p.points}</div><div class="profile-box">المستوى: ${p.level}</div><div class="profile-box">المواد: ${p.subjects.length}</div><div class="profile-box">اختبارات: ${p.exams.length}</div><div class="profile-box">واجبات: ${p.assignments.length}</div><div class="profile-box">حضور: ${p.attendance.length}</div></div>`) }).join("")}</div>`}
window.studentDetails=id=>{let s=A.getData("students").find(x=>x.id===id);let p=A.studentProfile(s);content.innerHTML=panel("ملف الطالب: "+s.name)+`<div class="profile-grid"><div class="profile-box">المرحلة: ${s.stage}</div><div class="profile-box">الكود: ${s.code}</div><div class="profile-box">ولي الأمر: ${s.parentName||""}</div><div class="profile-box">النقاط: ${p.points}</div><div class="profile-box">المستوى: ${p.level}</div></div>`}
function teacherProfiles(){content.innerHTML=panel("ملفات المدرسين")+`<div class="card-grid">${A.getData("teachers").map(t=>{let p=A.teacherProfile(t);return card(t.name,`<p>${t.stage} / ${t.subject}</p><div class="profile-grid"><div class="profile-box">طلاب: ${p.students.length}</div><div class="profile-box">دروس: ${p.lessons.length}</div><div class="profile-box">واجبات: ${p.assignments.length}</div><div class="profile-box">اختبارات: ${p.exams.length}</div></div>`) }).join("")}</div>`}
function leaderboard(){let arr=A.leaderboard();content.innerHTML=panel("لوحة الشرف والنقاط")+`<div class="card-grid">${arr.map((s,i)=>`<div class="data-card rank-card"><div class="rank-no">#${i+1}</div><h3>${s.name}</h3><p>${s.stage}</p><span class="chip">${s.level}</span><span class="chip">${s.points} نقطة</span></div>`).join("")||'<div class="empty">لا توجد بيانات</div>'}</div>`}
function reports(){let students=A.getData("students");content.innerHTML=panel("التقارير والتصدير")+`<div class="report-actions"><button class="green" onclick="exportStudents()">تصدير الطلاب Excel/CSV</button><button onclick="printStudents()">طباعة PDF</button><button onclick="exportSubs()">تصدير الاشتراكات</button></div>`}
window.exportStudents=()=>A.exportCsv("students.csv",A.getData("students"));window.exportSubs=()=>A.exportCsv("subscriptions.csv",A.getData("subscriptions"));window.printStudents=()=>A.printReport("تقرير الطلاب",`<table><tr><th>الاسم</th><th>المرحلة</th><th>الكود</th></tr>${A.getData("students").map(s=>`<tr><td>${s.name}</td><td>${s.stage}</td><td>${s.code}</td></tr>`).join("")}</table>`);
function search(){content.innerHTML=panel("البحث الشامل")+`<input id="q" placeholder="ابحث عن طالب / مدرس / مادة / اشتراك..."><div id="res"></div>`;q.oninput=()=>{res.innerHTML=A.globalSearch(q.value).map(r=>`<div class="search-result"><b>${r.label}: ${r.title}</b><p class="muted">${r.item.stage||""} ${r.item.subject||""} ${r.item.code||r.item.teacherCode||""}</p></div>`).join("")}}
function backup(){content.innerHTML=panel("النسخ الاحتياطي والاستعادة")+`<button class="green" onclick="doBackup()">إنشاء نسخة احتياطية</button><button class="orange" onclick="doRestore()">استعادة آخر نسخة</button><div class="danger-zone"><b>تنبيه:</b> الاستعادة تستبدل البيانات الحالية.</div>`}
window.doBackup=async()=>{await A.backupNow();alert("تم إنشاء نسخة احتياطية داخل المتصفح")};window.doRestore=async()=>{if(confirm("استعادة؟")){let ok=await A.restoreBackup();alert(ok?"تمت الاستعادة":"لا توجد نسخة")}}
function settings(){
let s=A.settings();
content.innerHTML=panel("إعدادات المنصة")+`<form id="setForm">
<div class="field"><label>اسم المنصة</label><input name="platformName" value="${s.platformName||""}"></div>
<div class="field"><label>كود المدير</label><input name="adminCode" value="${s.adminCode||"1234"}"></div>
<div class="field"><label>رقم الماستر الثابت للاشتراك</label><input name="masterNumber" value="${s.masterNumber||""}" placeholder="مثال: 0780XXXXXXX"></div>
<div class="field"><label>اسم صاحب الماستر</label><input name="masterOwner" value="${s.masterOwner||""}"></div>
<div class="field"><label>الفوتر</label><input name="footer" value="${s.footer||""}"></div>
<button class="primary">حفظ</button></form>`;
setForm.onsubmit=async e=>{
 e.preventDefault();
 await A.saveSettings({platformName:setForm.platformName.value,adminCode:setForm.adminCode.value,masterNumber:setForm.masterNumber.value,masterOwner:setForm.masterOwner.value,footer:setForm.footer.value});
 alert("تم الحفظ");
}
}
function maintenance(){
content.innerHTML=panel("الصيانة","أدوات آمنة لإدارة بيانات المنصة")+`<div class="danger-zone"><b>منطقة حساسة</b><p>استخدم النسخ الاحتياطي قبل أي عملية حذف.</p></div><div class="card-grid"><button class="orange" onclick="A.backupNow().then(()=>alert('تم إنشاء نسخة'))">إنشاء نسخة قبل الصيانة</button><button class="red" onclick="clearStore('notifications')">تفريغ الإشعارات</button><button class="red" onclick="clearStore('messages')">تفريغ الرسائل</button><button class="red" onclick="clearStore('activityLog')">تفريغ السجل</button></div>`;
}
window.clearStore=async k=>{if(confirm("هل أنت متأكد من التفريغ؟")){await A.setData(k,[]);alert("تم التفريغ")}};

window.del=async(k,idv)=>{if(confirm("حذف؟")){await A.deleteItem(k,idv);openSection(current)}}
A.onSync(()=>A.scheduleRender(()=>openSection(current),300));openSection("home");
