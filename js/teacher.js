seedBase();

var teacher = JSON.parse(sessionStorage.getItem('afaq_current_teacher') || 'null');
if(!teacher){
  alert('يجب تسجيل دخول المدرس أولاً');
  location.href = '../index.html';
}

var current = 'home';
var editType = '';
var editId = null;
var uploadedFile = null;

var nav = [
  ['الرئيسية','home'],
  ['طلابي','students'],
  ['طلبات الانضمام','joinRequests'],
  ['الدروس والملفات','lessons'],
  ['الواجبات','assignments'],
  ['الاختبارات','exams'],
  ['الحضور والغياب','attendance'],
  ['النتائج','results'],
  ['الإشعارات','notifications'],
  ['الرسائل','messages'],
  ['الملف الشخصي','profile']
];

function qs(x){ return document.getElementById(x); }

function byTeacher(arr){
  return arr.filter(function(x){
    return x.teacherId === teacher.id ||
      (x.teacherName === teacher.name && x.stage === teacher.stage && x.subject === teacher.subject);
  });
}

function baseItem(){
  return {
    id: editId || id(),
    teacherId: teacher.id,
    teacherName: teacher.name,
    stage: teacher.stage,
    subject: teacher.subject,
    subjectCode: teacher.subjectCode,
    createdAt: new Date().toLocaleString('ar-IQ')
  };
}

function panel(title, desc){
  return `<section class="panel"><div class="section-title"><div><h2>${title}</h2><p class="muted">${desc || ''}</p></div></div>`;
}

function drawSide(){
  teacherSide.innerHTML = `<h2>${teacher.subject}</h2>`;
  nav.forEach(function(n){
    var b = document.createElement('button');
    b.className = 'nav' + (current === n[1] ? ' active' : '');
    b.innerHTML = `<span>${n[0]}</span><span>›</span>`;
    b.onclick = function(){ openSection(n[1]); };
    teacherSide.appendChild(b);
  });
}

function openSection(section){
  current = section;
  drawSide();
  var routes = {
    home: showHome,
    students: showStudents,
    joinRequests: showJoinRequests,
    lessons: function(){ showList('lessons','lesson','الدروس والملفات','إضافة دروس وروابط وملفات PDF أو صور أو فيديو.','📚','➕ إضافة درس'); },
    assignments: function(){ showList('assignments','assignment','الواجبات','إضافة واجب مع موعد نهائي وحالة نشر.','📝','➕ إضافة واجب'); },
    exams: function(){ showList('exams','exam','الاختبارات','إنشاء اختبار مختلط بأنواع أسئلة متعددة.','🧪','➕ إضافة اختبار'); },
    attendance: function(){ showList('attendance','attendance','الحضور والغياب','إنشاء جلسة حضور وغياب بوقت نهائي.','✅','➕ جلسة حضور'); },
    results: function(){ showList('results','result','النتائج','إضافة وتعديل درجات الطلاب.','📊','➕ إضافة نتيجة'); },
    notifications: function(){ showList('notifications','notification','الإشعارات','إرسال إشعار لطلاب المادة.','🔔','➕ إرسال إشعار'); },
    messages: function(){ showList('messages','message','الرسائل','رسائل المدرس مع الطلاب والإدارة وأولياء الأمور.','💬','➕ رسالة'); },
    profile: showProfile
  };
  (routes[section] || showHome)();
}

function initHeader(){
  teacherInfo.textContent = `${teacher.name} / ${teacher.stage} / ${teacher.subject} / كود المادة: ${teacher.subjectCode}`;
  if(teacher.photo){
    teacherPhotoBox.outerHTML = `<img src="${teacher.photo}" alt="teacher">`;
  }
}

function showHome(){
  teacherContent.innerHTML =
    panel('الرئيسية','ملخص سريع لكل ما يخص مادتك فقط.') +
    `<div class="stats">
      <div class="stat"><h3>الطلاب</h3><strong>${getTeacherStudents().length}</strong></div>
      <div class="stat"><h3>الدروس</h3><strong>${byTeacher(getData('lessons')).length}</strong></div>
      <div class="stat"><h3>الواجبات</h3><strong>${byTeacher(getData('assignments')).length}</strong></div>
      <div class="stat"><h3>الاختبارات</h3><strong>${byTeacher(getData('exams')).length}</strong></div>
    </div>
    <div class="notice">كل البيانات مرتبطة تلقائياً بالمرحلة والمادة التي حددها المدير.</div></section>`;
}

function getTeacherStudents(){
  var students = getData('students');
  var joins = getData('studentSubjects').filter(function(x){
    return x.subject === teacher.subject && x.stage === teacher.stage && x.status === 'accepted';
  }).map(function(x){ return x.studentId; });

  return students.filter(function(s){
    return s.stage === teacher.stage && (joins.indexOf(s.id) !== -1 || !getData('studentSubjects').length);
  });
}

function showStudents(){
  teacherContent.innerHTML =
    panel('طلابي','طلاب المرحلة والمادة المرتبطون بهذا المدرس.') +
    `<div class="searchbar"><input id="studentSearch" placeholder="بحث عن طالب..." oninput="filterTeacherStudents()"></div>
     <div id="studentsArea">${teacherStudentsHtml(getTeacherStudents())}</div></section>`;
}

function teacherStudentsHtml(list){
  var html = '<div class="card-grid">';
  if(!list.length) html += '<div class="empty">لا يوجد طلاب مرتبطون بهذه المادة بعد.</div>';
  list.forEach(function(s){
    html += `<div class="data-card">
      <div class="student-avatar">🎓</div>
      <h3>${s.name}</h3>
      <p><span class="chip">${s.stage}</span></p>
      <p class="muted">الكود: ${s.code}</p>
      <p class="muted">الهاتف: ${s.phone || '—'}</p>
      <div class="actions">
        <button class="btn blue" onclick="studentDetails('${s.id}')">معلومات</button>
        <button class="btn green" onclick="openResultForStudent('${s.id}')">إضافة نتيجة</button>
      </div>
    </div>`;
  });
  return html + '</div>';
}

function filterTeacherStudents(){
  var q = (studentSearch.value || '').toLowerCase();
  studentsArea.innerHTML = teacherStudentsHtml(getTeacherStudents().filter(function(s){
    return (s.name + ' ' + s.code + ' ' + s.phone).toLowerCase().includes(q);
  }));
}

function studentDetails(idv){
  var s = getData('students').find(function(x){ return x.id === idv; });
  if(!s) return;
  var html = '<div class="details-grid">';
  ['name','parentName','stage','phone','code','status','subscriptionStatus','endDate'].forEach(function(k){
    html += `<div class="detail-box"><b>${k}</b>${s[k] || '—'}</div>`;
  });
  detailContent.innerHTML = html + '</div>';
  detailModal.classList.add('active');
}

function showJoinRequests(){
  var data = byTeacher(getData('studentSubjects')).filter(function(x){ return x.status === 'pending'; });
  var html = panel('طلبات الانضمام','طلبات الطلاب للدخول إلى مادة ' + teacher.subject + '.') + '<div class="card-grid">';
  if(!data.length) html += '<div class="empty">لا توجد طلبات انضمام حالياً.</div>';
  data.forEach(function(r){
    html += `<div class="data-card">
      <div class="icon-big">📥</div>
      <h3>${r.studentName}</h3>
      <p><span class="chip">${r.stage}</span></p>
      <p class="muted">كود المادة: ${r.subjectCode}</p>
      <div class="actions">
        <button class="btn green" onclick="approveJoin('${r.id}')">قبول</button>
        <button class="btn red" onclick="rejectJoin('${r.id}')">رفض</button>
      </div>
    </div>`;
  });
  teacherContent.innerHTML = html + '</div></section>';
}

function approveJoin(idv){
  setData('studentSubjects', getData('studentSubjects').map(function(x){
    if(x.id === idv) x.status = 'accepted';
    return x;
  }));
  showJoinRequests();
}

function rejectJoin(idv){
  setData('studentSubjects', getData('studentSubjects').map(function(x){
    if(x.id === idv) x.status = 'rejected';
    return x;
  }));
  showJoinRequests();
}

function showList(key,type,title,desc,icon,addText){
  var data = byTeacher(getData(key));
  var html = panel(title,desc) + `<button class="btn green" onclick="editItem('${type}')">${addText}</button><div class="card-grid">`;
  if(!data.length) html += '<div class="empty">لا توجد بيانات بعد.</div>';
  data.forEach(function(x){
    html += `<div class="data-card">
      <div class="icon-big">${icon}</div>
      <h3>${x.title || x.studentName || 'بدون عنوان'}</h3>
      <p><span class="chip">${x.status || x.type || x.date || 'نشط'}</span></p>
      <p class="muted">${x.description || x.body || x.note || ''}</p>`;
    if(x.fileData) html += `<a class="file-link" href="${x.fileData}" download="${x.fileName || 'file'}">تحميل الملف</a>`;
    html += `<div class="actions">
      <button class="btn blue" onclick="details('${key}','${x.id}')">معلومات</button>
      <button class="btn" onclick="editItem('${type}','${x.id}')">تعديل</button>
      <button class="btn red" onclick="deleteTeacherItem('${key}','${x.id}')">حذف</button>
    </div></div>`;
  });
  teacherContent.innerHTML = html + '</div></section>';
}

function showProfile(){
  teacherContent.innerHTML =
    panel('الملف الشخصي','بيانات المدرس المحددة من لوحة المدير.') +
    (teacher.photo ? `<img class="detail-photo" src="${teacher.photo}">` : '<div class="teacher-placeholder">👨‍🏫</div>') +
    `<div class="details-grid">
      <div class="detail-box"><b>الاسم</b>${teacher.name}</div>
      <div class="detail-box"><b>المرحلة</b>${teacher.stage}</div>
      <div class="detail-box"><b>المادة</b>${teacher.subject}</div>
      <div class="detail-box"><b>كود المدرس</b>${teacher.teacherCode}</div>
      <div class="detail-box"><b>كود المادة</b>${teacher.subjectCode}</div>
      <div class="detail-box"><b>الهاتف</b>${teacher.phone || '—'}</div>
      <div class="detail-box"><b>المؤهل</b>${teacher.qualification || '—'}</div>
      <div class="detail-box"><b>النبذة</b>${teacher.bio || '—'}</div>
    </div></section>`;
}

var schemas = {
  lesson:['title','type','description','link','status'],
  assignment:['title','description','deadline','score','status'],
  exam:['title','duration','status','questions'],
  attendance:['title','date','deadline','status'],
  result:['studentName','title','score','finalScore','note'],
  notification:['title','target','body','status'],
  message:['to','title','body','box']
};

var stores = {
  lesson:'lessons',
  assignment:'assignments',
  exam:'exams',
  attendance:'attendance',
  result:'results',
  notification:'notifications',
  message:'messages'
};

function options(vals, selected){
  return vals.map(function(v){
    return `<option value="${v}"${selected === v ? ' selected' : ''}>${v}</option>`;
  }).join('');
}

function defaultVal(type,f){
  if(f === 'status') return 'منشور';
  if(f === 'target') return 'طلاب المادة';
  if(f === 'box') return 'المرسل';
  if(f === 'duration') return '30';
  if(f === 'score' || f === 'finalScore') return '100';
  if(f === 'type') return 'ملف PDF';
  return '';
}

function renderField(type,f,val){
  val = val || defaultVal(type,f);
  var labels = {title:'العنوان',type:'النوع',description:'الوصف',link:'رابط',status:'الحالة',deadline:'الموعد النهائي',score:'درجة الواجب',duration:'مدة الاختبار بالدقائق',questions:'الأسئلة',date:'التاريخ',studentName:'اسم الطالب',finalScore:'الدرجة النهائية',note:'ملاحظات',target:'المستهدف',body:'النص',to:'إلى',box:'الصندوق'};
  var html = `<div class="field ${(f==='description'||f==='questions'||f==='body'||f==='note')?'full':''}"><label>${labels[f] || f}</label>`;
  if(f === 'status') html += `<select id="f_${f}">${options(['منشور','مخفي','مفتوح','مغلق','نشط'],val)}</select>`;
  else if(f === 'type') html += `<select id="f_${f}">${options(['ملف PDF','فيديو','صورة','رابط','شرح نصي'],val)}</select>`;
  else if(f === 'studentName') html += `<select id="f_${f}">${getTeacherStudents().map(function(s){return `<option value="${s.name}"${val===s.name?' selected':''}>${s.name} - ${s.code}</option>`}).join('')}</select>`;
  else if(f === 'target') html += `<select id="f_${f}">${options(['طلاب المادة','طالب معين','ولي أمر','الإدارة'],val)}</select>`;
  else if(f === 'box') html += `<select id="f_${f}">${options(['الوارد','المرسل','الأرشيف','المحذوفات'],val)}</select>`;
  else if(f === 'deadline' || f === 'date') html += `<input type="datetime-local" id="f_${f}" value="${val}">`;
  else if(f === 'questions') html += `<textarea id="f_${f}" placeholder="اكتب كل سؤال بسطر، ويمكن تحديد نوعه: اختيار / صح وخطأ / فراغ / مقالي">${val}</textarea>`;
  else if(f === 'description' || f === 'body' || f === 'note') html += `<textarea id="f_${f}">${val}</textarea>`;
  else html += `<input id="f_${f}" value="${val}">`;
  return html + '</div>';
}

function editItem(type,idv){
  editType = type;
  editId = idv || null;
  uploadedFile = null;
  var store = stores[type];
  var obj = editId ? getData(store).find(function(x){ return x.id === editId; }) : {};
  var html = '';
  schemas[type].forEach(function(f){ html += renderField(type,f,obj[f]); });
  if(['lesson','assignment'].indexOf(type) !== -1){
    html += `<div class="field full"><label>إرفاق ملف من الجهاز</label><label class="file-button" for="uploadFile">📎 اختيار ملف</label><input id="uploadFile" class="hidden" type="file"><p class="muted" id="fileInfo">${obj.fileName || 'لم يتم اختيار ملف'}</p></div>`;
  }
  modalTitle.textContent = editId ? 'تعديل' : 'إضافة';
  formFields.innerHTML = html;
  teacherModal.classList.add('active');
  if(qs('uploadFile')){
    qs('uploadFile').onchange = function(){
      var file = this.files[0];
      if(!file) return;
      var r = new FileReader();
      r.onload = function(e){
        uploadedFile = {fileName:file.name, fileData:e.target.result};
        fileInfo.textContent = file.name;
      };
      r.readAsDataURL(file);
    };
  }
}

teacherForm.onsubmit = function(e){
  e.preventDefault();
  var obj = baseItem();
  schemas[editType].forEach(function(f){ obj[f] = qs('f_'+f).value; });
  var store = stores[editType];
  if(uploadedFile){
    obj.fileName = uploadedFile.fileName;
    obj.fileData = uploadedFile.fileData;
  }else if(editId){
    var old = getData(store).find(function(x){ return x.id === editId; });
    if(old){
      obj.fileName = old.fileName;
      obj.fileData = old.fileData;
    }
  }
  var arr = getData(store);
  if(editId) arr = arr.map(function(x){ return x.id === editId ? obj : x; });
  else arr.unshift(obj);
  setData(store, arr);
  teacherModal.classList.remove('active');
  openSection(current);
};

function deleteTeacherItem(key,idv){
  if(!confirm('حذف؟')) return;
  setData(key, getData(key).filter(function(x){ return x.id !== idv; }));
  openSection(current);
}

function details(key,idv){
  var obj = getData(key).find(function(x){ return x.id === idv; });
  if(!obj) return;
  var html = '<div class="details-grid">';
  Object.keys(obj).forEach(function(k){
    if(k !== 'fileData') html += `<div class="detail-box"><b>${k}</b>${obj[k] || '—'}</div>`;
  });
  html += '</div>';
  if(obj.fileData) html += `<a class="file-link" href="${obj.fileData}" download="${obj.fileName || 'file'}">تحميل الملف المرفق</a>`;
  detailContent.innerHTML = html;
  detailModal.classList.add('active');
}

function openResultForStudent(idv){
  var s = getData('students').find(function(x){ return x.id === idv; });
  openSection('results');
  setTimeout(function(){
    editItem('result');
    qs('f_studentName').value = s.name;
  },50);
}

initHeader();
drawSide();
openSection('home');
