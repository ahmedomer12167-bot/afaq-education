seedBase();
var current='home', editType='', editId=null, currentTeacherPhoto='';
var nav=[['الرئيسية','home'],['طلبات الاشتراك','requests'],['الطلاب','students'],['المدرسون','teachers'],['المواد','subjects'],['المراحل','stages'],['أولياء الأمور','parents'],['المدفوعات','payments'],['النتائج النهائية','finalGrades'],['الإشعارات','notifications'],['الرسائل','messages'],['لوحة الشرف','honor'],['المستويات','levels'],['النسخ الاحتياطي','backup'],['الإعدادات','settings'],['إعادة الضبط','reset'],['سجل النشاط','activity']];
function qs(x){return document.getElementById(x)}
function fileToSafeDataURL(file, cb){
  var reader = new FileReader();
  reader.onload = function(e){
    if(file.type && file.type.indexOf('image/') === 0){
      var img = new Image();
      img.onload = function(){
        var max = 700;
        var w = img.width, h = img.height;
        if(w > h && w > max){ h = Math.round(h * max / w); w = max; }
        else if(h >= w && h > max){ w = Math.round(w * max / h); h = max; }
        var canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        cb(canvas.toDataURL('image/jpeg',0.72));
      };
      img.onerror = function(){ cb(e.target.result); };
      img.src = e.target.result;
    }else{
      cb(e.target.result);
    }
  };
  reader.readAsDataURL(file);
}
function createAutoBackup(reason){
  var keys=['stages','subjects','teachers','students','parents','requests','payments','notifications','messages','honor','levels','settings','activity'];
  var data={reason:reason,date:new Date().toLocaleString('ar-IQ')};
  keys.forEach(function(k){data[k]=k==='settings'?getObj(k,{}):getData(k)});
  localStorage.setItem(P+'lastBackup', JSON.stringify(data));
}
function isStageLinked(stageName){
  var u=stageUsage(stageName);
  return u.total>0;
}
function isSubjectLinked(sub){
  return subjectUsage(sub.name, sub.code).total>0;
}
function updateStageMaterialSelects(){
  var stageField=qs('f_stage') || qs('f_grade');
  var subjectField=qs('f_subject');
  var codeField=qs('f_subjectCode');
  if(stageField && subjectField){
    subjectField.innerHTML=subjectOptions(subjectField.value, stageField.value);
    if(codeField) codeField.value=getSubjectCodeByName(subjectField.value);
    stageField.onchange=function(){
      subjectField.innerHTML=subjectOptions('', stageField.value);
      if(codeField) codeField.value=getSubjectCodeByName(subjectField.value);
    };
  }
  if(subjectField && codeField){
    subjectField.onchange=function(){ codeField.value=getSubjectCodeByName(subjectField.value); };
  }
}
function panel(t,d){return '<section class="panel"><h2>'+t+'</h2><p class="muted">'+(d||'')+'</p>'}
function drawSide(){var side=qs('side');side.innerHTML='<h2>آفاق التعليمية</h2>';nav.forEach(function(i){var b=document.createElement('button');b.className='nav'+(current===i[1]?' active':'');b.innerHTML='<span>'+i[0]+'</span><span>›</span>';b.onclick=function(){openSection(i[1])};side.appendChild(b)})}
function openSection(s){current=s;drawSide();var f={home:showHome,requests:showRequests,students:showStudents,teachers:showTeachers,subjects:showSubjects,stages:showStages,parents:showParents,payments:showPayments,finalGrades:showFinalGradesAdmin,notifications:showNotifications,messages:showMessages,honor:showHonor,levels:showLevels,backup:showBackup,settings:showSettings,reset:showReset,activity:showActivity}[s]||showHome;f()}
function actions(type,idv){return `<div class="actions"><button class="btn blue" onclick="details('${type}','${idv}')">معلومات</button><button class="btn" onclick="editItem('${type}','${idv}')">تعديل</button><button class="btn red" onclick="deleteItem('${type}','${idv}')">حذف</button></div>`}
function showHome(){var students=getData('students'),teachers=getData('teachers'),requests=getData('requests'),payments=getData('payments');var revenue=payments.reduce(function(t,p){return t+(Number(p.amount)||0)},0);qs('content').innerHTML=panel('لوحة المدير الكاملة','نسخة جامعة لكل أقسام المدير، بدون جداول طويلة أو تمرير أفقي.')+`<div class="stats"><div class="stat"><h3>الطلاب</h3><strong>${students.length}</strong></div><div class="stat"><h3>المدرسون</h3><strong>${teachers.length}</strong></div><div class="stat"><h3>طلبات جديدة</h3><strong>${requests.filter(r=>r.status==='new').length}</strong></div><div class="stat"><h3>الإيرادات</h3><strong>${revenue.toLocaleString('ar-IQ')}</strong></div></div></section>`}
function showRequests(){var data=getData('requests');var html=panel('طلبات الاشتراك','قبول، رفض، حذف، وتحويل الطلب إلى طالب مفعل مع سجل دفع.')+`<button class="btn green" onclick="editItem('request')">➕ إضافة طلب</button><div class="card-grid">`;if(!data.length)html+='<div class="empty">لا توجد طلبات</div>';data.forEach(function(r){html+=`<div class="data-card"><div class="student-avatar">📝</div><h3>${r.studentName||''}</h3><p><span class="chip">${r.grade||''}</span></p><p class="muted">ولي الأمر: ${r.parentName||'—'}</p><p class="muted">الهاتف: ${r.phone||'—'}</p><p><span class="status ${r.status==='new'?'hide':'show'}">${r.status==='new'?'بانتظار المراجعة':r.status}</span></p><div class="actions"><button class="btn green" onclick="approveSubscriptionRequest('${r.id}')">قبول</button><button class="btn orange" onclick="rejectSubscriptionRequest('${r.id}')">رفض</button><button class="btn red" onclick="deleteItem('request','${r.id}')">حذف</button></div></div>`});qs('content').innerHTML=html+'</div></section>'}
function approveSubscriptionRequest(idv){
  var r=getData('requests').find(function(x){return x.id===idv});
  if(!r)return;
  qs('acceptRequestId').value=idv;
  qs('acceptStudentCode').value=randomStudentCode();
  qs('acceptStart').value=today();
  qs('acceptEnd').value=addDays(today(),30);
  qs('acceptNote').value='';
  qs('acceptModal').classList.add('active');
}
qs('acceptForm').onsubmit=function(e){
  e.preventDefault();
  var idv=qs('acceptRequestId').value;
  var r=getData('requests').find(function(x){return x.id===idv});
  if(!r)return;
  createAutoBackup('قبل قبول اشتراك');
  var st={id:id(),name:r.studentName,parentName:r.parentName,stage:r.grade,phone:r.phone,code:qs('acceptStudentCode').value,startDate:qs('acceptStart').value,endDate:qs('acceptEnd').value,amount:r.amount,status:'مفعل',subscriptionStatus:'نشط',note:qs('acceptNote').value};
  var students=getData('students');students.push(st);setData('students',students);
  var parents=getData('parents');parents.push({id:id(),name:r.parentName,studentName:r.studentName,studentCode:st.code,phone:r.phone,code:st.code});setData('parents',parents);
  var pays=getData('payments');pays.unshift({id:id(),studentId:st.id,studentName:st.name,amount:r.amount,date:today(),type:'اشتراك جديد'});setData('payments',pays);
  setData('requests',getData('requests').map(function(x){return x.id===idv?Object.assign(x,{status:'accepted'}):x}));
  logAction('قبول اشتراك الطالب '+st.name);
  qs('acceptModal').classList.remove('active');
  showRequests();
}
function rejectSubscriptionRequest(idv){setData('requests',getData('requests').map(x=>x.id===idv?Object.assign(x,{status:'rejected'}):x));showRequests()}
function showStudents(){var list=getData('students');var html=panel('إدارة الطلاب','المقبولون، الموقوفون، البحث، التعديل، الاشتراك، التجديد والإيقاف.')+`<div class="searchbar"><input id="studentSearch" placeholder="بحث عن طالب..." oninput="filterStudents()"><select id="studentFilter" onchange="filterStudents()"><option value="">الكل</option><option>مفعل</option><option>موقوف</option></select><button class="btn green" onclick="editItem('student')">➕ إضافة طالب</button></div><div id="studentsArea">${studentsHtml(list)}</div></section>`;qs('content').innerHTML=html}
function studentsHtml(list){var html='<div class="card-grid">';if(!list.length)html+='<div class="empty">لا توجد بيانات</div>';list.forEach(function(s){var exp=isExpired(s.endDate);html+=`<div class="data-card"><div class="student-avatar">🎓</div><h3>${s.name||''}</h3><p><span class="chip">${s.stage||''}</span></p><p><span class="chip">كود: ${s.code||''}</span></p><p class="muted">ولي الأمر: ${s.parentName||'—'}</p><p><span class="status ${s.status==='مفعل'?'show':'hide'}">${s.status||''}</span> <span class="status ${exp?'hide':'show'}">${exp?'منتهي':'نشط'}</span></p><div class="actions"><button class="btn blue" onclick="details('student','${s.id}')">معلومات</button><button class="btn" onclick="editItem('student','${s.id}')">تعديل</button><button class="btn green" onclick="renewStudent('${s.id}')">تجديد</button><button class="btn orange" onclick="toggleStudent('${s.id}')">${s.status==='مفعل'?'إيقاف':'تفعيل'}</button><button class="btn red" onclick="deleteItem('student','${s.id}')">حذف</button></div></div>`});return html+'</div>'}
function filterStudents(){var q=(qs('studentSearch').value||'').toLowerCase(),f=qs('studentFilter').value;var arr=getData('students').filter(s=>(s.name+' '+s.code+' '+s.stage+' '+s.phone).toLowerCase().includes(q)&&(!f||s.status===f));qs('studentsArea').innerHTML=studentsHtml(arr)}
function renewStudent(idv){var days=prompt('عدد أيام التجديد','30');if(!days)return;var arr=getData('students').map(function(s){if(s.id===idv){s.endDate=addDays((s.endDate&&!isExpired(s.endDate))?s.endDate:today(),days);s.status='مفعل';s.subscriptionStatus='نشط'}return s});var s=arr.find(x=>x.id===idv);var p=getData('payments');p.unshift({id:id(),studentId:s.id,studentName:s.name,amount:s.amount||'',date:today(),type:'تجديد اشتراك'});setData('payments',p);setData('students',arr);showStudents()}
function toggleStudent(idv){setData('students',getData('students').map(function(s){if(s.id===idv){s.status=s.status==='مفعل'?'موقوف':'مفعل';s.subscriptionStatus=s.status==='مفعل'?'نشط':'موقوف'}return s}));showStudents()}
function showTeachers(){var data=getData('teachers');var html=panel('إدارة المدرسين','إضافة، تعديل، صورة المدرس، كود المدرس، وربط المادة والمرحلة.')+`<button class="btn green" onclick="editItem('teacher')">➕ إضافة مدرس</button><div class="card-grid">`;if(!data.length)html+='<div class="empty">لا توجد بيانات</div>';data.forEach(function(t){html+=`<div class="data-card">${t.photo?`<img class="teacher-photo" src="${t.photo}">`:'<div class="teacher-placeholder">👨‍🏫</div>'}<h3>${t.name||''}</h3><p><span class="chip">${t.stage||''}</span></p><p><span class="chip">${t.subject||''}</span></p><p><span class="status ${t.status==='مفعل'?'show':'hide'}">${t.status||''}</span></p><div class="actions"><button class="btn blue" onclick="details('teacher','${t.id}')">معلومات</button><button class="btn" onclick="editItem('teacher','${t.id}')">تعديل</button><button class="btn orange" onclick="toggleTeacher('${t.id}')">${t.status==='مفعل'?'إيقاف':'تفعيل'}</button><button class="btn red" onclick="deleteItem('teacher','${t.id}')">حذف</button></div></div>`});qs('content').innerHTML=html+'</div></section>'}
function toggleTeacher(idv){setData('teachers',getData('teachers').map(t=>{if(t.id===idv)t.status=t.status==='مفعل'?'موقوف':'مفعل';return t}));showTeachers()}
function showSubjects(){var data=getData('subjects').sort(sortByOrder);var html=panel('إدارة المواد','إضافة، تعديل، حذف، كود المادة، لون، أيقونة، وربط بمرحلة.')+`<button class="btn green" onclick="editItem('subject')">➕ إضافة مادة</button><div class="card-grid">`;data.forEach(s=>{html+=`<div class="data-card"><div class="icon-big">${s.icon||'📘'}</div><h3>${s.name}</h3><p><span class="chip">${s.code}</span></p><p class="muted">المرحلة: ${s.stage}</p><p class="muted">المدرس: ${s.teacher||'غير محدد'}</p>${actions('subject',s.id)}</div>`});qs('content').innerHTML=html+'</div></section>'}
function showStages(){var data=getData('stages').sort(sortByOrder);var html=panel('إدارة المراحل','إضافة، تعديل، حذف، ترتيب، إظهار/إخفاء.')+`<button class="btn green" onclick="editItem('stage')">➕ إضافة مرحلة</button><div class="card-grid">`;data.forEach(st=>{var u=stageUsage(st.name);html+=`<div class="data-card"><div class="icon-big">📚</div><h3>${st.name}</h3><p><span class="chip">ترتيب ${st.order}</span></p><p class="muted">مواد: ${u.subjects} | طلاب: ${u.students} | مدرسون: ${u.teachers}</p>${actions('stage',st.id)}</div>`});qs('content').innerHTML=html+'</div></section>'}
function showParents(){var data=getData('parents');var html=panel('أولياء الأمور','متابعة أولياء الأمور المرتبطين بالطلاب.')+`<button class="btn green" onclick="editItem('parent')">➕ إضافة ولي أمر</button><div class="card-grid">`;if(!data.length)html+='<div class="empty">لا توجد بيانات</div>';data.forEach(p=>html+=`<div class="data-card"><div class="student-avatar">👨‍👩‍👦</div><h3>${p.name||''}</h3><p class="muted">الطالب: ${p.studentName||'—'}</p><p><span class="chip">الكود: ${p.code||'—'}</span></p>${actions('parent',p.id)}</div>`);qs('content').innerHTML=html+'</div></section>'}
function showPayments(){var data=getData('payments');var rev=data.reduce((t,p)=>t+(Number(p.amount)||0),0);var html=panel('سجل المدفوعات','إجمالي الإيرادات: '+rev.toLocaleString('ar-IQ'))+'<div class="card-grid">';if(!data.length)html+='<div class="empty">لا توجد مدفوعات</div>';data.forEach(p=>html+=`<div class="data-card"><div class="icon-big">💳</div><h3>${p.studentName||''}</h3><p><span class="chip">${p.amount||0} د.ع</span></p><p class="muted">${p.type||''} - ${p.date||''}</p></div>`);qs('content').innerHTML=html+'</div></section>'}
function showFinalGradesAdmin(){var data=getData('finalGrades');var html=panel('النتائج النهائية','عرض الدرجات النهائية لكل الطلاب والمواد.')+'<div class="card-grid">';if(!data.length)html+='<div class="empty">لا توجد نتائج نهائية.</div>';data.forEach(function(g){html+='<div class="data-card"><div class="icon-big">🎯</div><h3>'+g.studentName+'</h3><p><span class="chip">'+g.subject+'</span></p><p class="final-grade">'+g.grade+' / '+g.finalScore+'</p></div>'});qs('content').innerHTML=html+'</div></section>'}
function showNotifications(){var data=getData('notifications');var html=panel('الإشعارات','إرسال إشعار عام أو لمرحلة أو مادة أو طالب.')+`<button class="btn green" onclick="editItem('notification')">➕ إشعار جديد</button> <button class="btn red" onclick="clearKey('notifications')">حذف الكل</button><div class="card-grid">`;if(!data.length)html+='<div class="empty">لا توجد إشعارات</div>';data.forEach(n=>html+=`<div class="data-card"><div class="icon-big">🔔</div><h3>${n.title||''}</h3><p><span class="chip">${n.target||''}</span></p><p class="muted">${n.body||''}</p>${actions('notification',n.id)}</div>`);qs('content').innerHTML=html+'</div></section>'}
function showMessages(){var data=getData('messages');var html=panel('الرسائل','الوارد، المرسل، الأرشيف، المحذوفات بشكل مبسط.')+`<button class="btn green" onclick="editItem('message')">➕ رسالة جديدة</button><div class="card-grid">`;if(!data.length)html+='<div class="empty">لا توجد رسائل</div>';data.forEach(m=>html+=`<div class="data-card"><div class="icon-big">💬</div><h3>${m.title||''}</h3><p><span class="chip">${m.box||''}</span></p><p class="muted">من: ${m.from||''} إلى: ${m.to||''}</p><p class="muted">${m.body||''}</p>${actions('message',m.id)}</div>`);qs('content').innerHTML=html+'</div></section>'}
function showHonor(){var data=getData('honor');var html=panel('لوحة الشرف','ترتيب الطلاب حسب النقاط والمستوى.')+`<button class="btn green" onclick="editItem('honor')">➕ إضافة ترتيب</button><div class="card-grid">`;if(!data.length)html+='<div class="empty">لا توجد بيانات</div>';data.sort((a,b)=>Number(b.points||0)-Number(a.points||0)).forEach((h,i)=>html+=`<div class="data-card"><div class="icon-big">🏆</div><h3>${i+1} - ${h.studentName||''}</h3><p><span class="chip">${h.points||0} نقطة</span></p><p class="muted">${h.level||''}</p>${actions('honor',h.id)}</div>`);qs('content').innerHTML=html+'</div></section>'}
function showLevels(){var data=getData('levels');var html=panel('المستويات','تعديل أسماء المستويات والنسب المطلوبة.')+`<button class="btn green" onclick="editItem('level')">➕ إضافة مستوى</button><div class="card-grid">`;data.forEach(l=>html+=`<div class="data-card"><div class="icon-big">⭐</div><h3>${l.name}</h3><p><span class="chip">${l.percent}%</span></p>${actions('level',l.id)}</div>`);qs('content').innerHTML=html+'</div></section>'}
function showBackup(){qs('content').innerHTML=panel('النسخ الاحتياطي','إنشاء، تنزيل، رفع، استعادة نسخة، واستعادة آخر نسخة تلقائية.')+`<div class="actions"><button class="btn green" onclick="downloadBackup()">تنزيل نسخة</button><button class="btn blue" onclick="restoreLastBackup()">استعادة آخر نسخة تلقائية</button><label class="file-button" for="restoreFile">رفع نسخة</label><input id="restoreFile" class="hidden" type="file" accept=".json" onchange="restoreBackup(this)"></div></section>`}
function downloadBackup(){var keys=['stages','subjects','teachers','students','parents','requests','payments','notifications','messages','honor','levels','settings'];var data={};keys.forEach(k=>data[k]=k==='settings'?getObj(k,{}):getData(k));var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='afaq-backup.json';a.click()}
function restoreBackup(input){var file=input.files[0];if(!file)return;var r=new FileReader();r.onload=function(e){var data=JSON.parse(e.target.result);Object.keys(data).forEach(k=>{if(k==='settings')setObj(k,data[k]);else setData(k,data[k])});alert('تمت الاستعادة');openSection('home')};r.readAsText(file)}
function showSettings(){var s=getObj('settings',{});qs('content').innerHTML=panel('إعدادات المنصة','اسم المنصة، الأكواد، الدفع، الفوتر، والمظهر.')+`<form id="settingsForm" class="formgrid"><div class="field"><label>اسم المنصة</label><input id="setName" value="${s.platformName||''}"></div><div class="field"><label>كود المدير</label><input id="setAdmin" value="${s.adminCode||''}"></div><div class="field"><label>رقم الماستر</label><input id="setMaster" value="${s.masterNumber||''}"></div><div class="field"><label>اسم صاحب البطاقة</label><input id="setOwner" value="${s.cardOwner||''}"></div><div class="field full"><label>الفوتر</label><input id="setFooter" value="${s.footer||''}"></div><button class="primary full">حفظ الإعدادات</button></form></section>`;qs('settingsForm').onsubmit=function(e){e.preventDefault();setObj('settings',{platformName:qs('setName').value,adminCode:qs('setAdmin').value,masterNumber:qs('setMaster').value,cardOwner:qs('setOwner').value,footer:qs('setFooter').value});alert('تم حفظ الإعدادات')}}
function showReset(){qs('content').innerHTML=panel('إعادة ضبط المنصة','عمليات خطرة مع تأكيد كتابي.')+`<div class="card-grid"><div class="data-card danger"><h3>حذف الطلاب</h3><button class="btn red" onclick="dangerClear('students')">تنفيذ</button></div><div class="data-card danger"><h3>حذف المدرسين</h3><button class="btn red" onclick="dangerClear('teachers')">تنفيذ</button></div><div class="data-card danger"><h3>حذف كل البيانات</h3><button class="btn red" onclick="fullReset()">تنفيذ</button></div></div></section>`}
function dangerClear(k){if(prompt('اكتب: أوافق على الحذف')==='أوافق على الحذف'){createAutoBackup('قبل حذف '+k);setData(k,[]);alert('تم الحذف وتم إنشاء نسخة احتياطية');openSection('reset')}}
function fullReset(){if(prompt('اكتب: أوافق على الحذف')==='أوافق على الحذف'){createAutoBackup('قبل إعادة ضبط المنصة');localStorage.removeItem(P+'seeded');seedBase();alert('تمت إعادة الضبط وتم إنشاء نسخة احتياطية');openSection('home')}}
function showActivity(){var data=getData('activity');var html=panel('سجل النشاط','سجل مختصر للعمليات المهمة.')+`<button class="btn red" onclick="clearKey('activity')">حذف الكل</button><div class="card-grid">`;if(!data.length)html+='<div class="empty">لا يوجد نشاط</div>';data.forEach(a=>html+=`<div class="data-card"><div class="icon-big">📌</div><h3>${a.text}</h3><p class="muted">${a.date}</p></div>`);qs('content').innerHTML=html+'</div></section>'}
function clearKey(k){if(confirm('حذف الكل؟')){setData(k,[]);openSection(current)}}
function details(type,idv){var map={student:'students',teacher:'teachers',subject:'subjects',stage:'stages',parent:'parents',notification:'notifications',message:'messages',honor:'honor',level:'levels',request:'requests'};var obj=getData(map[type]).find(x=>x.id===idv);if(!obj)return;var html='<div class="details-grid">';Object.keys(obj).forEach(k=>{if(k!=='photo')html+=`<div class="detail-box"><b>${k}</b>${obj[k]}</div>`});html+='</div>';qs('detailContent').innerHTML=(obj.photo?`<img class="detail-photo" src="${obj.photo}">`:'')+html;qs('detailModal').classList.add('active')}
function deleteItem(type,idv){
  var map={student:'students',teacher:'teachers',subject:'subjects',stage:'stages',parent:'parents',notification:'notifications',message:'messages',honor:'honor',level:'levels',request:'requests'};
  var k=map[type];
  var arr=getData(k);
  var obj=arr.find(function(x){return x.id===idv});
  if(type==='stage' && obj && isStageLinked(obj.name)){
    alert('لا يمكن حذف المرحلة لأنها مرتبطة بمواد أو طلاب أو مدرسين.');
    return;
  }
  if(type==='subject' && obj && isSubjectLinked(obj)){
    alert('لا يمكن حذف المادة لأنها مرتبطة بمدرس أو طلاب أو اختبارات.');
    return;
  }
  if(!confirm('حذف؟'))return;
  createAutoBackup('حذف '+type);
  setData(k,arr.filter(function(x){return x.id!==idv}));
  logAction('حذف عنصر من قسم '+type);
  openSection(current);
}
var schemas={
student:['name','parentName','stage','phone','code','startDate','endDate','amount','status'],
teacher:['name','stage','subject','teacherCode','subjectCode','phone','qualification','status','bio'],
subject:['name','code','stage','teacher','color','icon','order','status','visibility'],
stage:['name','order','status','visibility'],
parent:['name','studentName','studentCode','phone','code'],
request:['studentName','parentName','grade','phone','amount','status'],
notification:['title','target','body'],
message:['from','to','title','body','box'],
honor:['studentName','points','level'],
level:['name','percent']
};

var stores={
student:'students',
teacher:'teachers',
subject:'subjects',
stage:'stages',
parent:'parents',
request:'requests',
notification:'notifications',
message:'messages',
honor:'honor',
level:'levels'
};

function optionList(values, selected){
  var html='';
  values.forEach(function(v){
    html += '<option value="'+v+'"'+(selected===v?' selected':'')+'>'+v+'</option>';
  });
  return html;
}

function studentNameOptions(selected){
  var arr=getData('students');
  var html='';
  arr.forEach(function(s){
    html += '<option value="'+s.name+'"'+(selected===s.name?' selected':'')+'>'+s.name+' - '+s.code+'</option>';
  });
  if(!html) html='<option value="">لا يوجد طلاب بعد</option>';
  return html;
}

function teacherNameOptions(selected){
  var arr=getData('teachers');
  var html='<option value="غير محدد">غير محدد</option>';
  arr.forEach(function(t){
    html += '<option value="'+t.name+'"'+(selected===t.name?' selected':'')+'>'+t.name+' - '+t.subject+'</option>';
  });
  return html;
}

function levelOptions(selected){
  var arr=getData('levels');
  var html='';
  arr.forEach(function(l){
    html += '<option value="'+l.name+'"'+(selected===l.name?' selected':'')+'>'+l.name+'</option>';
  });
  if(!html) html='<option value="مبتدئ">مبتدئ</option>';
  return html;
}

function renderChoiceField(type, field, value){
  value = value || defaultVal(type, field);
  var labelMap={
    name:'الاسم',
    parentName:'ولي الأمر',
    studentName:'اسم الطالب',
    studentCode:'كود الطالب',
    stage:'المرحلة',
    grade:'المرحلة',
    subject:'المادة',
    code:'الكود',
    teacherCode:'كود المدرس',
    subjectCode:'كود المادة',
    phone:'رقم الهاتف',
    startDate:'تاريخ البداية',
    endDate:'تاريخ الانتهاء',
    amount:'المبلغ',
    status:'الحالة',
    subscriptionStatus:'حالة الاشتراك',
    teacher:'المدرس',
    color:'لون المادة',
    icon:'أيقونة المادة',
    order:'الترتيب',
    visibility:'الظهور',
    qualification:'المؤهل العلمي',
    bio:'نبذة المدرس',
    title:'العنوان',
    target:'المستهدف',
    body:'النص',
    from:'المرسل',
    to:'المستلم',
    box:'صندوق الرسائل',
    points:'النقاط',
    level:'المستوى',
    percent:'النسبة'
  };
  var label=labelMap[field]||field;
  var html='<div class="field"><label>'+label+'</label>';

  if(field==='stage' || field==='grade'){
    html += '<select id="f_'+field+'">'+stageOptions(value)+'</select>';
  }else if(field==='subject'){
    html += '<select id="f_'+field+'">'+subjectOptions(value, '')+'</select>';
  }else if(field==='teacher'){
    html += '<select id="f_'+field+'">'+teacherNameOptions(value)+'</select>';
  }else if(field==='status'){
    var vals = type==='request' ? ['new','accepted','rejected'] : ['مفعل','موقوف'];
    html += '<select id="f_'+field+'">'+optionList(vals, value)+'</select>';
  }else if(field==='visibility'){
    html += '<select id="f_'+field+'">'+optionList(['ظاهر','مخفي'], value)+'</select>';
  }else if(field==='color'){
    html += '<select id="f_'+field+'">'+optionList(['بنفسجي','أزرق','أخضر','أحمر','برتقالي','وردي','رمادي'], value)+'</select>';
  }else if(field==='icon'){
    html += '<select id="f_'+field+'">'+optionList(['📘','🧬','⚗️','🔬','🧮','🌍','✍️','📖','🧠','⭐'], value)+'</select>';
  }else if(field==='target'){
    html += '<select id="f_'+field+'">'+optionList(['عام','مرحلة معينة','مادة معينة','طالب معين','مدرس معين'], value)+'</select>';
  }else if(field==='box'){
    html += '<select id="f_'+field+'">'+optionList(['الوارد','المرسل','الأرشيف','المحذوفات'], value)+'</select>';
  }else if(field==='level'){
    html += '<select id="f_'+field+'">'+levelOptions(value)+'</select>';
  }else if(field==='studentName'){
    html += '<select id="f_'+field+'">'+studentNameOptions(value)+'</select>';
  }else if(field==='order'){
    html += '<select id="f_'+field+'">'+optionList(['1','2','3','4','5','6','7','8','9','10'], String(value))+'</select>';
  }else if(field==='percent'){
    html += '<select id="f_'+field+'">'+optionList(['0','25','50','60','70','80','85','90','95','100'], String(value))+'</select>';
  }else if(field==='points'){
    html += '<select id="f_'+field+'">'+optionList(['0','10','20','30','40','50','75','100','150','200'], String(value))+'</select>';
  }else if(field==='startDate' || field==='endDate'){
    html += '<input id="f_'+field+'" type="date" value="'+value+'">';
  }else if(field==='amount'){
    html += '<select id="f_'+field+'">'+optionList(['0','10000','15000','20000','25000','30000','35000','40000','50000'], String(value))+'</select>';
  }else if(field==='body' || field==='bio'){
    html += '<textarea id="f_'+field+'">'+value+'</textarea>';
  }else{
    html += '<input id="f_'+field+'" value="'+value+'">';
  }

  html += '</div>';
  return html;
}

function defaultVal(type,f){
  if(f==='code'&&type==='student')return randomStudentCode();
  if(f==='teacherCode')return randomTeacherCode();
  if(f==='subjectCode')return '';
  if(f==='startDate')return today();
  if(f==='endDate')return addDays(today(),30);
  if(f==='status')return type==='request'?'new':'مفعل';
  if(f==='visibility')return 'ظاهر';
  if(f==='box')return 'الوارد';
  if(f==='order')return '1';
  if(f==='color')return 'بنفسجي';
  if(f==='icon')return '📘';
  if(f==='target')return 'عام';
  if(f==='level')return 'مبتدئ';
  if(f==='percent')return '0';
  if(f==='points')return '0';
  if(f==='amount')return '0';
  return '';
}

function editItem(type,idv){
  editType=type;
  editId=idv||null;
  var obj=editId?getData(stores[type]).find(function(x){return x.id===editId}):{};
  var html='';
  schemas[type].forEach(function(f){
    html += renderChoiceField(type, f, obj[f]);
  });

  if(type==='teacher'){
    html += '<div class="field full"><label>صورة المدرس</label><label class="file-button" for="teacherPhotoGeneric">📎 اختيار صورة من الجهاز</label><input id="teacherPhotoGeneric" class="hidden" type="file" accept="image/*"><img id="genericPreview" class="preview"></div>';
  }

  qs('genericTitle').textContent=editId?'تعديل':'إضافة';
  qs('genericFields').innerHTML=html;
  qs('genericModal').classList.add('active');

  if(type==='teacher'){
    currentTeacherPhoto=obj.photo||'';
    qs('genericPreview').src=currentTeacherPhoto;
    qs('genericPreview').style.display=currentTeacherPhoto?'block':'none';
    qs('teacherPhotoGeneric').onchange=function(){
      var file=this.files[0];
      if(!file)return;
      fileToSafeDataURL(file,function(data){
        currentTeacherPhoto=data;
        qs('genericPreview').src=currentTeacherPhoto;
        qs('genericPreview').style.display='block';
      });
    };
  }

  var stageField=qs('f_stage');
  var subjectField=qs('f_subject');
  var codeField=qs('f_subjectCode');
  if(stageField && subjectField){
    stageField.onchange=function(){
      subjectField.innerHTML=subjectOptions('', stageField.value);
      if(codeField) codeField.value=getSubjectCodeByName(subjectField.value);
    };
  }
  if(subjectField && codeField){
    subjectField.onchange=function(){
      codeField.value=getSubjectCodeByName(subjectField.value);
    };
  }
  updateStageMaterialSelects();
}

qs('genericForm').onsubmit=function(e){
  e.preventDefault();
  var obj={id:editId||id()};
  schemas[editType].forEach(function(f){
    obj[f]=qs('f_'+f).value;
  });
  if(editType==='teacher') obj.photo=currentTeacherPhoto;

  var k=stores[editType];
  var arr=getData(k);

  if(editId) arr=arr.map(function(x){return x.id===editId?obj:x});
  else arr.push(obj);

  setData(k,arr);

  if(editType==='teacher'){
    setData('subjects',getData('subjects').map(function(s){
      return s.name===obj.subject ? Object.assign({},s,{teacher:obj.name}) : s;
    }));
  }

  qs('genericModal').classList.remove('active');
  openSection(current);
};

drawSide();openSection('home');

function restoreLastBackup(){
  var raw=localStorage.getItem(P+'lastBackup');
  if(!raw){alert('لا توجد نسخة تلقائية محفوظة');return;}
  if(!confirm('استعادة آخر نسخة تلقائية؟'))return;
  var data=JSON.parse(raw);
  Object.keys(data).forEach(function(k){
    if(k==='reason'||k==='date')return;
    if(k==='settings')setObj(k,data[k]); else setData(k,data[k]);
  });
  alert('تمت استعادة آخر نسخة تلقائية');
  openSection('home');
}

window.addEventListener('storage',function(e){if(e.key&&e.key.indexOf(P)===0){try{openSection(current)}catch(err){}}});


// ===== v6.1.2 Subscription request cleanup fix =====
function removeSubscriptionRequestEverywhere(requestId, studentName, phone){
  var keys = ['subscriptionRequests','subscriptionsRequests','requests','pendingSubscriptions'];
  keys.forEach(function(k){
    var arr = getData(k);
    if(Array.isArray(arr) && arr.length){
      arr = arr.filter(function(x){
        return x.id !== requestId && !(studentName && (x.name === studentName || x.studentName === studentName) && (!phone || x.phone === phone));
      });
      setData(k, arr);
    }
  });
}

function approveSubscriptionRequest(requestId){
  var req = getData('subscriptionRequests').find(function(x){return x.id===requestId;}) ||
            getData('requests').find(function(x){return x.id===requestId;}) ||
            getData('pendingSubscriptions').find(function(x){return x.id===requestId;});

  if(!req){ alert('لم يتم العثور على الطلب'); return; }

  var studentName = req.name || req.studentName || '';
  var studentCode = prompt('أدخل كود الطالب:', req.studentCode || req.code || ('ST-' + Math.floor(1000 + Math.random()*9000)));
  if(!studentCode) return;

  var startDate = prompt('تاريخ بداية الاشتراك:', req.startDate || new Date().toISOString().slice(0,10)) || '';
  var endDate = prompt('تاريخ انتهاء الاشتراك:', req.endDate || '') || '';

  var students = getData('students');
  var existing = students.find(function(s){
    return s.name===studentName || s.code===studentCode;
  });

  var studentObj = {
    id: existing ? existing.id : id(),
    name: studentName,
    parentName: req.parentName || req.parent || '',
    stage: req.stage || req.grade || '',
    phone: req.phone || '',
    code: studentCode,
    parentCode: studentCode,
    status: 'نشط',
    subscriptionStatus: 'نشط',
    startDate: startDate,
    endDate: endDate,
    amount: req.amount || req.paid || '',
    note: req.note || ''
  };

  if(existing){
    students = students.map(function(s){
      return s.id===existing.id ? Object.assign({}, s, studentObj) : s;
    });
  }else{
    students.unshift(studentObj);
  }
  setData('students', students);

  var subs = getData('subscriptions');
  subs.unshift({
    id:id(),
    studentId: studentObj.id,
    studentName: studentObj.name,
    parentName: studentObj.parentName,
    stage: studentObj.stage,
    phone: studentObj.phone,
    amount: studentObj.amount,
    status:'نشط',
    startDate:startDate,
    endDate:endDate,
    createdAt:new Date().toLocaleString('ar-IQ')
  });
  setData('subscriptions', subs);

  removeSubscriptionRequestEverywhere(requestId, studentObj.name, studentObj.phone);
  touchSync('students');
  touchSync('subscriptionRequests');

  alert('تم قبول الطلب وتحويله إلى طالب مفعل، وتم حذف الطلب من قائمة طلبات الاشتراك.');

  if(typeof showSubscriptionRequests === 'function') showSubscriptionRequests();
  else if(typeof openSection === 'function') openSection(current);
}

function rejectSubscriptionRequest(requestId){
  var req = getData('subscriptionRequests').find(function(x){return x.id===requestId;}) ||
            getData('requests').find(function(x){return x.id===requestId;}) ||
            getData('pendingSubscriptions').find(function(x){return x.id===requestId;});

  if(!req){ alert('لم يتم العثور على الطلب'); return; }

  var rejected = getData('rejectedSubscriptions');
  rejected.unshift(Object.assign({}, req, {
    status:'مرفوض',
    rejectedAt:new Date().toLocaleString('ar-IQ')
  }));
  setData('rejectedSubscriptions', rejected);

  removeSubscriptionRequestEverywhere(requestId, req.name || req.studentName, req.phone || '');
  touchSync('subscriptionRequests');

  alert('تم رفض الطلب ونقله إلى المرفوضين.');

  if(typeof showSubscriptionRequests === 'function') showSubscriptionRequests();
  else if(typeof openSection === 'function') openSection(current);
}

function deleteSubscriptionRequest(requestId){
  if(!confirm('هل تريد حذف طلب الاشتراك؟')) return;

  var req = getData('subscriptionRequests').find(function(x){return x.id===requestId;}) ||
            getData('requests').find(function(x){return x.id===requestId;}) ||
            getData('pendingSubscriptions').find(function(x){return x.id===requestId;});

  removeSubscriptionRequestEverywhere(requestId, req && (req.name || req.studentName), req && req.phone);
  touchSync('subscriptionRequests');

  if(typeof showSubscriptionRequests === 'function') showSubscriptionRequests();
  else if(typeof openSection === 'function') openSection(current);
}

function normalizeSubscriptionRequestStatus(){
  var arr = getData('subscriptionRequests');
  var students = getData('students');
  arr = arr.filter(function(r){
    return !students.find(function(s){
      return (s.name === r.name || s.name === r.studentName) && (s.phone === r.phone || !r.phone);
    });
  });
  setData('subscriptionRequests', arr);
}
normalizeSubscriptionRequestStatus();
