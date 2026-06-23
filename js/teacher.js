seedBase();

var teacher = JSON.parse(sessionStorage.getItem('afaq_current_teacher') || 'null');
if(!teacher){ alert('يجب تسجيل دخول المدرس أولاً'); location.href = '../index.html'; }

var current = 'home', editType = '', editId = null, uploadedFile = null;

var nav = [
  ['الرئيسية','home'], ['طلابي','students'], ['طلبات الانضمام','joinRequests'],
  ['الدروس والملفات','lessons'], ['الواجبات','assignments'], ['تصحيح الواجبات','assignmentReview'],
  ['الاختبارات','exams'], ['بنك الأسئلة','questionBank'], ['تصحيح المقالية','essayReview'],
  ['الحضور والغياب','attendance'], ['تقرير الحضور','attendanceReport'], ['النتائج','results'],
  ['تقويم المادة','calendar'], ['الإشعارات','notifications'], ['الرسائل','messages'], ['الملف الشخصي','profile']
];

function qs(x){ return document.getElementById(x); }
function byTeacher(arr){ return arr.filter(x => x.teacherId === teacher.id || (x.teacherName === teacher.name && x.stage === teacher.stage && x.subject === teacher.subject)); }
function baseItem(){ return {id: editId || id(), teacherId: teacher.id, teacherName: teacher.name, stage: teacher.stage, subject: teacher.subject, subjectCode: teacher.subjectCode, createdAt: new Date().toLocaleString('ar-IQ')}; }
function panel(title, desc){ return `<section class="panel"><div class="section-title"><div><h2>${title}</h2><p class="muted">${desc || ''}</p></div></div>`; }

function drawSide(){
  teacherSide.innerHTML = `<h2>${teacher.subject}</h2>`;
  nav.forEach(n => {
    var b = document.createElement('button');
    b.className = 'nav' + (current === n[1] ? ' active' : '');
    b.innerHTML = `<span>${n[0]}</span><span>›</span>`;
    b.onclick = () => openSection(n[1]);
    teacherSide.appendChild(b);
  });
}

function openSection(section){
  current = section; drawSide();
  var routes = {
    home: showHome, students: showStudents, joinRequests: showJoinRequests,
    lessons: () => showList('lessons','lesson','الدروس والملفات','إضافة دروس وروابط وملفات PDF أو صور أو فيديو.','📚','➕ إضافة درس'),
    assignments: () => showList('assignments','assignment','الواجبات','إضافة واجب مع موعد نهائي وحالة نشر.','📝','➕ إضافة واجب'),
    assignmentReview: showAssignmentReview,
    exams: showExams, questionBank: showQuestionBank, essayReview: showEssayReview,
    attendance: () => showList('attendance','attendance','الحضور والغياب','إنشاء جلسة حضور وغياب بوقت نهائي.','✅','➕ جلسة حضور'),
    attendanceReport: showAttendanceReport,
    results: () => showList('results','result','إضافة وتعديل درجات الطلاب.','📊','➕ إضافة نتيجة'),
    calendar: showCalendar,
    notifications: () => showList('notifications','notification','إرسال إشعار لطلاب المادة.','🔔','➕ إرسال إشعار'),
    messages: () => showList('messages','message','رسائل المدرس مع الطلاب والإدارة وأولياء الأمور.','💬','➕ رسالة'),
    profile: showProfile
  };
  (routes[section] || showHome)();
}

function initHeader(){
  teacherInfo.textContent = `${teacher.name} / ${teacher.stage} / ${teacher.subject} / كود المادة: ${teacher.subjectCode}`;
  if(teacher.photo){ teacherPhotoBox.outerHTML = `<img src="${teacher.photo}" alt="teacher">`; }
}

function getTeacherStudents(){
  var students = getData('students');
  var joins = getData('studentSubjects').filter(x => x.subject === teacher.subject && x.stage === teacher.stage && x.status === 'accepted').map(x => x.studentId);
  return students.filter(s => s.stage === teacher.stage && (joins.indexOf(s.id) !== -1 || !getData('studentSubjects').length));
}

function showHome(){
  teacherContent.innerHTML = panel('الرئيسية','ملخص سريع لكل ما يخص مادتك فقط.') + `
  <div class="stats">
    <div class="stat"><h3>الطلاب</h3><strong>${getTeacherStudents().length}</strong></div>
    <div class="stat"><h3>الدروس</h3><strong>${byTeacher(getData('lessons')).length}</strong></div>
    <div class="stat"><h3>الواجبات</h3><strong>${byTeacher(getData('assignments')).length}</strong></div>
    <div class="stat"><h3>الاختبارات</h3><strong>${byTeacher(getData('exams')).length}</strong></div>
  </div><div class="notice">كل البيانات مرتبطة تلقائياً بالمرحلة والمادة التي حددها المدير.</div></section>`;
}

function showStudents(){
  teacherContent.innerHTML = panel('طلابي','طلاب المرحلة والمادة المرتبطون بهذا المدرس.') +
    `<div class="searchbar"><input id="studentSearch" placeholder="بحث عن طالب..." oninput="filterTeacherStudents()"></div><div id="studentsArea">${teacherStudentsHtml(getTeacherStudents())}</div></section>`;
}
function teacherStudentsHtml(list){
  var html = '<div class="card-grid">';
  if(!list.length) html += '<div class="empty">لا يوجد طلاب مرتبطون بهذه المادة بعد.</div>';
  list.forEach(s => {
    html += `<div class="data-card"><div class="student-avatar">🎓</div><h3>${s.name}</h3><p><span class="chip">${s.stage}</span></p><p class="muted">الكود: ${s.code}</p><p class="muted">الهاتف: ${s.phone || '—'}</p><div class="actions"><button class="btn blue" onclick="studentDetails('${s.id}')">معلومات</button><button class="btn green" onclick="openResultForStudent('${s.id}')">إضافة نتيجة</button></div></div>`;
  });
  return html + '</div>';
}
function filterTeacherStudents(){
  var q = (studentSearch.value || '').toLowerCase();
  studentsArea.innerHTML = teacherStudentsHtml(getTeacherStudents().filter(s => (s.name+' '+s.code+' '+s.phone).toLowerCase().includes(q)));
}
function studentDetails(idv){
  var s = getData('students').find(x => x.id === idv); if(!s) return;
  var html = '<div class="details-grid">';
  ['name','parentName','stage','phone','code','status','subscriptionStatus','endDate'].forEach(k => html += `<div class="detail-box"><b>${k}</b>${s[k] || '—'}</div>`);
  detailContent.innerHTML = html + '</div>'; detailModal.classList.add('active');
}

function showJoinRequests(){
  var data = byTeacher(getData('studentSubjects')).filter(x => x.status === 'pending');
  var html = panel('طلبات الانضمام','طلبات الطلاب للدخول إلى مادة '+teacher.subject+'.') + '<div class="card-grid">';
  if(!data.length) html += '<div class="empty">لا توجد طلبات انضمام حالياً.</div>';
  data.forEach(r => html += `<div class="data-card"><div class="icon-big">📥</div><h3>${r.studentName}</h3><p><span class="chip">${r.stage}</span></p><p class="muted">كود المادة: ${r.subjectCode}</p><div class="actions"><button class="btn green" onclick="approveJoin('${r.id}')">قبول</button><button class="btn red" onclick="rejectJoin('${r.id}')">رفض</button></div></div>`);
  teacherContent.innerHTML = html + '</div></section>';
}
function approveJoin(idv){ setData('studentSubjects', getData('studentSubjects').map(x => { if(x.id === idv) x.status = 'accepted'; return x; })); showJoinRequests(); }
function rejectJoin(idv){ setData('studentSubjects', getData('studentSubjects').map(x => { if(x.id === idv) x.status = 'rejected'; return x; })); showJoinRequests(); }

function deadlinePercent(deadline){
  if(!deadline) return 70;
  var end = new Date(deadline).getTime(), now = Date.now();
  if(end <= now) return 0;
  return Math.max(10, Math.min(100, Math.round((end-now)/(24*60*60*1000)*25)));
}
function showList(key,type,title,desc,icon,addText){
  var data = byTeacher(getData(key));
  var html = panel(title,desc) + `<button class="btn green" onclick="editItem('${type}')">${addText}</button><div class="card-grid">`;
  if(!data.length) html += '<div class="empty">لا توجد بيانات بعد.</div>';
  data.forEach(x => {
    html += `<div class="data-card"><div class="icon-big">${icon}</div><h3>${x.title || x.studentName || 'بدون عنوان'}</h3><p><span class="chip">${x.status || x.type || x.date || 'نشط'}</span></p><p class="muted">${x.description || x.body || x.note || ''}</p>`;
    if(x.deadline) html += `<div class="progress-wrap"><div class="progress-bar" style="width:${deadlinePercent(x.deadline)}%"></div></div><p class="muted">الموعد: ${x.deadline}</p>`;
    if(x.fileData) html += `<a class="file-link" href="${x.fileData}" download="${x.fileName || 'file'}">تحميل الملف</a>`;
    html += `<div class="actions"><button class="btn blue" onclick="details('${key}','${x.id}')">معلومات</button><button class="btn" onclick="editItem('${type}','${x.id}')">تعديل</button><button class="btn red" onclick="deleteTeacherItem('${key}','${x.id}')">حذف</button></div></div>`;
  });
  teacherContent.innerHTML = html + '</div></section>';
}

function showAssignmentReview(){
  var subs = byTeacher(getData('assignmentSubmissions'));
  var html = panel('تصحيح الواجبات','مراجعة حلول الطلاب وإعطاء درجة.') + '<div class="card-grid">';
  if(!subs.length) html += '<div class="empty">لا توجد حلول واجبات بعد.</div>';
  subs.forEach(s => html += `<div class="data-card"><div class="icon-big">📮</div><h3>${s.studentName}</h3><p><span class="chip">${s.assignmentTitle || 'واجب'}</span></p><p class="muted">${s.answer || '—'}</p><div class="actions"><button class="btn green" onclick="gradeAssignment('${s.id}')">تصحيح</button></div></div>`);
  teacherContent.innerHTML = html + '</div></section>';
}
function gradeAssignment(idv){ var grade = prompt('درجة الواجب:','100'); if(!grade) return; setData('assignmentSubmissions', getData('assignmentSubmissions').map(x => { if(x.id === idv){ x.grade=grade; x.status='مصَحح'; } return x; })); showAssignmentReview(); }

function showExams(){
  var data = byTeacher(getData('exams'));
  var html = panel('الاختبارات','إنشاء اختبار حقيقي بأسئلة متعددة ودرجات لكل سؤال.') + `<button class="btn green" onclick="editItem('exam')">➕ إنشاء اختبار</button><div class="card-grid">`;
  if(!data.length) html += '<div class="empty">لا توجد اختبارات بعد.</div>';
  data.forEach(ex => {
    var qsList = ex.questionsList || [];
    var total = qsList.reduce((t,q) => t + Number(q.score || 0), 0);
    html += `<div class="data-card"><div class="icon-big">🧪</div><h3>${ex.title}</h3><p><span class="chip">${ex.status}</span></p><p class="muted">عدد الأسئلة: ${qsList.length} / الدرجة: ${total}</p><div class="actions"><button class="btn blue" onclick="examDetails('${ex.id}')">الأسئلة</button><button class="btn" onclick="editItem('exam','${ex.id}')">تعديل</button><button class="btn red" onclick="deleteTeacherItem('exams','${ex.id}')">حذف</button></div></div>`;
  });
  teacherContent.innerHTML = html + '</div></section>';
}
function examDetails(idv){
  var ex = getData('exams').find(x => x.id === idv); if(!ex) return;
  var html = `<h3>${ex.title}</h3>`;
  (ex.questionsList || []).forEach((q,i) => {
    html += `<div class="q-card"><h4>${i+1}. ${q.text}</h4><p><span class="pill">${q.type}</span><span class="pill">${q.score} درجة</span></p>`;
    if(q.options) html += `<p class="muted">${q.options.replace(/\\n/g,' / ')}</p>`;
    html += `<span class="answer-badge">الإجابة: ${q.answer || 'تصحيح يدوي'}</span></div>`;
  });
  detailContent.innerHTML = html; detailModal.classList.add('active');
}

function showQuestionBank(){
  var data = byTeacher(getData('questionBank'));
  var html = panel('بنك الأسئلة','حفظ الأسئلة وإعادة استخدامها في الاختبارات.') + `<button class="btn green" onclick="openQuestionModal()">➕ إضافة سؤال</button><div class="card-grid">`;
  if(!data.length) html += '<div class="empty">لا توجد أسئلة في البنك.</div>';
  data.forEach(q => html += `<div class="data-card"><div class="icon-big">❓</div><h3>${q.text}</h3><p><span class="chip">${q.type}</span><span class="chip">${q.score} درجة</span></p><p class="muted">الإجابة: ${q.answer || '—'}</p><div class="actions"><button class="btn red" onclick="deleteTeacherItem('questionBank','${q.id}')">حذف</button></div></div>`);
  teacherContent.innerHTML = html + '</div></section>';
}
function openQuestionModal(){ qType.value='اختيار من متعدد'; qScore.value='5'; qText.value=''; qOptions.value=''; qAnswer.value=''; questionModal.classList.add('active'); }
questionForm.onsubmit = function(e){
  e.preventDefault();
  var q = baseItem();
  q.type=qType.value; q.score=qScore.value; q.text=qText.value; q.options=qOptions.value; q.answer=qAnswer.value;
  var arr=getData('questionBank'); arr.unshift(q); setData('questionBank',arr);
  questionModal.classList.remove('active'); showQuestionBank();
};

function showEssayReview(){
  var essays = byTeacher(getData('essayAnswers'));
  var html = panel('تصحيح المقالية','تصحيح الأسئلة المقالية يدوياً.') + '<div class="card-grid">';
  if(!essays.length) html += '<div class="empty">لا توجد إجابات مقالية بعد.</div>';
  essays.forEach(e => html += `<div class="data-card"><div class="icon-big">✍️</div><h3>${e.studentName}</h3><p class="muted">${e.answer || '—'}</p><p><span class="chip">${e.grade ? 'مصَحح' : 'بانتظار التصحيح'}</span></p><button class="btn green" onclick="gradeEssay('${e.id}')">إدخال درجة</button></div>`);
  teacherContent.innerHTML = html + '</div></section>';
}
function gradeEssay(idv){ var g=prompt('درجة السؤال المقالي:','10'); if(!g)return; setData('essayAnswers', getData('essayAnswers').map(x => { if(x.id===idv)x.grade=g; return x; })); showEssayReview(); }

function showAttendanceReport(){
  var sessions = byTeacher(getData('attendance'));
  var students = getTeacherStudents();
  var html = panel('تقرير الحضور','تقرير مبسط للحضور والغياب حسب الجلسات.') + '<div class="card-grid">';
  students.forEach(s => {
    var present = getData('attendanceRecords').filter(r => r.studentId===s.id && r.subject===teacher.subject && r.status==='حاضر').length;
    var absent = Math.max(0, sessions.length - present);
    html += `<div class="data-card"><div class="student-avatar">🎓</div><h3>${s.name}</h3><p><span class="chip">حضور: ${present}</span></p><p><span class="chip">غياب: ${absent}</span></p></div>`;
  });
  if(!students.length) html += '<div class="empty">لا يوجد طلاب للتقرير.</div>';
  teacherContent.innerHTML = html + '</div></section>';
}

function showCalendar(){
  var items = [].concat(byTeacher(getData('assignments')), byTeacher(getData('exams')), byTeacher(getData('attendance')));
  var html = panel('تقويم المادة','مواعيد الواجبات والاختبارات والحضور.') + '<div class="card-grid">';
  if(!items.length) html += '<div class="empty">لا توجد مواعيد بعد.</div>';
  items.forEach(x => html += `<div class="calendar-day"><h3>${x.title}</h3><p><span class="chip">${x.deadline || x.date || 'بدون موعد'}</span></p><p class="muted">${x.status || ''}</p></div>`);
  teacherContent.innerHTML = html + '</div></section>';
}

function showProfile(){
  teacherContent.innerHTML = panel('الملف الشخصي','بيانات المدرس المحددة من لوحة المدير.') + (teacher.photo ? `<img class="detail-photo" src="${teacher.photo}">` : '<div class="teacher-placeholder">👨‍🏫</div>') + `<div class="details-grid"><div class="detail-box"><b>الاسم</b>${teacher.name}</div><div class="detail-box"><b>المرحلة</b>${teacher.stage}</div><div class="detail-box"><b>المادة</b>${teacher.subject}</div><div class="detail-box"><b>كود المدرس</b>${teacher.teacherCode}</div><div class="detail-box"><b>كود المادة</b>${teacher.subjectCode}</div><div class="detail-box"><b>الهاتف</b>${teacher.phone || '—'}</div><div class="detail-box"><b>المؤهل</b>${teacher.qualification || '—'}</div><div class="detail-box"><b>النبذة</b>${teacher.bio || '—'}</div></div></section>`;
}

var schemas = {lesson:['title','type','description','link','status'], assignment:['title','description','deadline','score','status'], exam:['title','duration','status','questionsBuilder'], attendance:['title','date','deadline','status'], result:['studentName','title','score','finalScore','note'], notification:['title','target','body','status'], message:['to','title','body','box']};
var stores = {lesson:'lessons', assignment:'assignments', exam:'exams', attendance:'attendance', result:'results', notification:'notifications', message:'messages'};
function options(vals,selected){ return vals.map(v => `<option value="${v}"${selected===v?' selected':''}>${v}</option>`).join(''); }
function defaultVal(type,f){ if(f==='status')return'منشور'; if(f==='target')return'طلاب المادة'; if(f==='box')return'المرسل'; if(f==='duration')return'30'; if(f==='score'||f==='finalScore')return'100'; if(f==='type')return'ملف PDF'; return''; }
function questionBankOptions(){ var opts = byTeacher(getData('questionBank')).map(q => `<label class="pill"><input type="checkbox" class="bankPick" value="${q.id}"> ${q.type} - ${q.text} (${q.score})</label>`).join(''); return opts || '<p class="muted">لا توجد أسئلة في البنك. أضف أسئلة من قسم بنك الأسئلة.</p>'; }
function renderField(type,f,val){
  val = val || defaultVal(type,f);
  var labels = {title:'العنوان',type:'النوع',description:'الوصف',link:'رابط',status:'الحالة',deadline:'الموعد النهائي',score:'درجة الواجب',duration:'مدة الاختبار بالدقائق',questionsBuilder:'اختيار أسئلة من بنك الأسئلة',date:'التاريخ',studentName:'اسم الطالب',finalScore:'الدرجة النهائية',note:'ملاحظات',target:'المستهدف',body:'النص',to:'إلى',box:'الصندوق'};
  var full = (f==='description'||f==='questionsBuilder'||f==='body'||f==='note') ? 'full' : '';
  var html = `<div class="field ${full}"><label>${labels[f] || f}</label>`;
  if(f==='status') html += `<select id="f_${f}">${options(['منشور','مخفي','مفتوح','مغلق','نشط'],val)}</select>`;
  else if(f==='type') html += `<select id="f_${f}">${options(['ملف PDF','فيديو','صورة','رابط','شرح نصي'],val)}</select>`;
  else if(f==='studentName') html += `<select id="f_${f}">${getTeacherStudents().map(s => `<option value="${s.name}"${val===s.name?' selected':''}>${s.name} - ${s.code}</option>`).join('')}</select>`;
  else if(f==='target') html += `<select id="f_${f}">${options(['طلاب المادة','طالب معين','ولي أمر','الإدارة'],val)}</select>`;
  else if(f==='box') html += `<select id="f_${f}">${options(['الوارد','المرسل','الأرشيف','المحذوفات'],val)}</select>`;
  else if(f==='deadline'||f==='date') html += `<input type="datetime-local" id="f_${f}" value="${val}">`;
  else if(f==='questionsBuilder') html += `<div class="bank-row">${questionBankOptions()}</div>`;
  else if(f==='description'||f==='body'||f==='note') html += `<textarea id="f_${f}">${val}</textarea>`;
  else html += `<input id="f_${f}" value="${val}">`;
  return html + '</div>';
}
function editItem(type,idv){
  editType=type; editId=idv||null; uploadedFile=null;
  var store=stores[type];
  var obj=editId ? getData(store).find(x => x.id===editId) : {};
  var html=''; schemas[type].forEach(f => html += renderField(type,f,obj[f]));
  if(['lesson','assignment'].indexOf(type)!==-1) html += `<div class="field full"><label>إرفاق ملف من الجهاز</label><label class="file-button" for="uploadFile">📎 اختيار ملف</label><input id="uploadFile" class="hidden" type="file"><p class="muted" id="fileInfo">${obj.fileName || 'لم يتم اختيار ملف'}</p></div>`;
  modalTitle.textContent = editId ? 'تعديل' : 'إضافة';
  formFields.innerHTML = html; teacherModal.classList.add('active');
  if(type==='exam' && obj.questionsList){ setTimeout(() => obj.questionsList.forEach(q => { var c=document.querySelector('.bankPick[value="'+q.id+'"]'); if(c)c.checked=true; }), 20); }
  if(qs('uploadFile')) qs('uploadFile').onchange = function(){ var file=this.files[0]; if(!file)return; var r=new FileReader(); r.onload=function(e){ uploadedFile={fileName:file.name,fileData:e.target.result}; fileInfo.textContent=file.name; }; r.readAsDataURL(file); };
}
teacherForm.onsubmit = function(e){
  e.preventDefault();
  var obj=baseItem(); schemas[editType].forEach(f => { if(f!=='questionsBuilder') obj[f]=qs('f_'+f).value; });
  var store=stores[editType];
  if(editType==='exam'){ var ids=[].slice.call(document.querySelectorAll('.bankPick:checked')).map(c => c.value); obj.questionsList=byTeacher(getData('questionBank')).filter(q => ids.indexOf(q.id)!==-1); }
  if(uploadedFile){ obj.fileName=uploadedFile.fileName; obj.fileData=uploadedFile.fileData; }
  else if(editId){ var old=getData(store).find(x => x.id===editId); if(old){ obj.fileName=old.fileName; obj.fileData=old.fileData; obj.questionsList=obj.questionsList || old.questionsList; } }
  var arr=getData(store); if(editId) arr=arr.map(x => x.id===editId ? obj : x); else arr.unshift(obj);
  setData(store,arr); teacherModal.classList.remove('active'); openSection(current);
};
function deleteTeacherItem(key,idv){ if(!confirm('حذف؟'))return; setData(key,getData(key).filter(x => x.id!==idv)); openSection(current); }
function details(key,idv){
  var obj=getData(key).find(x => x.id===idv); if(!obj)return;
  var html='<div class="details-grid">'; Object.keys(obj).forEach(k => { if(k!=='fileData'&&k!=='questionsList') html += `<div class="detail-box"><b>${k}</b>${obj[k] || '—'}</div>`; }); html+='</div>';
  if(obj.fileData) html += `<a class="file-link" href="${obj.fileData}" download="${obj.fileName || 'file'}">تحميل الملف المرفق</a>`;
  detailContent.innerHTML=html; detailModal.classList.add('active');
}
function openResultForStudent(idv){ var s=getData('students').find(x => x.id===idv); openSection('results'); setTimeout(function(){ editItem('result'); qs('f_studentName').value=s.name; },50); }

initHeader(); drawSide(); openSection('home');
