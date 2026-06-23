seedBase();

var current = 'home';
var editStudentId = null;
var editTeacherId = null;
var currentTeacherPhoto = '';

var nav = [
  ['الرئيسية','home'],
  ['إدارة الطلاب','students'],
  ['الطلاب المقبولون','acceptedStudents'],
  ['الطلاب الموقوفون','stoppedStudents'],
  ['إدارة المدرسين','teachers'],
  ['إدارة المواد','subjects'],
  ['إدارة المراحل','stages']
];

function drawSide(){
  var side = document.getElementById('side');
  side.innerHTML = '<h2>آفاق التعليمية</h2>';
  for(var i=0;i<nav.length;i++){
    var item = nav[i];
    var btn = document.createElement('button');
    btn.className = 'nav' + (current === item[1] ? ' active' : '');
    btn.innerHTML = '<span>' + item[0] + '</span><span>›</span>';
    btn.setAttribute('data-section', item[1]);
    btn.onclick = function(){ openSection(this.getAttribute('data-section')); };
    side.appendChild(btn);
  }
}

function panel(title, desc){
  return '<section class="panel"><h2>' + title + '</h2><p class="muted">' + (desc || '') + '</p>';
}

function openSection(section){
  current = section;
  drawSide();
  if(section === 'home') showHome();
  else if(section === 'students') showStudents('all');
  else if(section === 'acceptedStudents') showStudents('accepted');
  else if(section === 'stoppedStudents') showStudents('stopped');
  else if(section === 'teachers') showTeachers();
  else if(section === 'subjects') showSubjects();
  else if(section === 'stages') showStages();
}

function showHome(){
  var students = getData('students');
  var html = panel('مركز إدارة آفاق', 'الإصدار 3.4.1: إدارة الطلاب الكاملة بعد إصلاح خطأ JavaScript.');
  html += '<div class="stats">';
  html += '<div class="stat"><h3>كل الطلاب</h3><strong>' + students.length + '</strong></div>';
  html += '<div class="stat"><h3>المقبولون</h3><strong>' + students.filter(function(s){return s.status === 'مفعل';}).length + '</strong></div>';
  html += '<div class="stat"><h3>الموقوفون</h3><strong>' + students.filter(function(s){return s.status === 'موقوف';}).length + '</strong></div>';
  html += '<div class="stat"><h3>منتهي الاشتراك</h3><strong>' + students.filter(function(s){return isExpired(s.endDate);}).length + '</strong></div>';
  html += '</div></section>';
  document.getElementById('content').innerHTML = html;
}

function showStudents(mode){
  var title = mode === 'accepted' ? 'الطلاب المقبولون' : mode === 'stopped' ? 'الطلاب الموقوفون' : 'إدارة الطلاب الكاملة';
  var students = getData('students');
  if(mode === 'accepted') students = students.filter(function(s){return s.status === 'مفعل';});
  if(mode === 'stopped') students = students.filter(function(s){return s.status === 'موقوف';});

  var html = panel(title, 'بحث، تعديل بيانات الطالب، تجديد الاشتراك، إيقاف/تفعيل الاشتراك، وحذف الطالب.');
  html += '<div class="notice">يعرض هذا القسم الطلاب كبطاقات واضحة بدون تمرير أفقي.</div>';
  html += '<div class="searchbar">';
  html += '<input id="studentSearch" placeholder="بحث بالاسم أو الكود أو المرحلة أو الهاتف..." oninput="filterStudents()">';
  html += '<select id="studentStageFilter" onchange="filterStudents()"><option value="">كل المراحل</option>' + stageOptions('') + '</select>';
  html += '<button class="btn green" type="button" onclick="openStudentModal()">➕ إضافة طالب</button>';
  html += '</div><div id="studentsArea">' + studentsHtml(students) + '</div></section>';
  document.getElementById('content').innerHTML = html;
}

function studentsHtml(list){
  var html = '<div class="card-grid">';
  if(!list.length) html += '<div class="empty">لا توجد بيانات طلاب.</div>';
  for(var i=0;i<list.length;i++){
    var s = list[i];
    var exp = isExpired(s.endDate);
    html += '<div class="data-card">';
    html += '<div class="student-avatar">🎓</div>';
    html += '<h3>' + s.name + '</h3>';
    html += '<p><span class="chip">' + s.stage + '</span></p>';
    html += '<p><span class="chip">الكود: ' + s.code + '</span></p>';
    html += '<p class="muted">الهاتف: ' + (s.phone || '—') + '</p>';
    html += '<p class="muted">ولي الأمر: ' + (s.parentName || '—') + '</p>';
    html += '<p><span class="status ' + (s.status === 'مفعل' ? 'show' : 'hide') + '">' + s.status + '</span> ';
    html += '<span class="status ' + (exp ? 'hide' : 'show') + '">' + (exp ? 'منتهي' : 'نشط') + '</span></p>';
    html += '<div class="actions">';
    html += '<a class="btn blue" href="student-details.html?id=' + s.id + '">معلومات</a>';
    html += '<button class="btn" type="button" onclick="openStudentModal(\'' + s.id + '\')">تعديل</button>';
    html += '<button class="btn green" type="button" onclick="renewStudent(\'' + s.id + '\')">تجديد</button>';
    html += '<button class="btn orange" type="button" onclick="toggleStudentStatus(\'' + s.id + '\')">' + (s.status === 'مفعل' ? 'إيقاف' : 'تفعيل') + '</button>';
    html += '<button class="btn red" type="button" onclick="deleteStudent(\'' + s.id + '\')">حذف</button>';
    html += '</div></div>';
  }
  html += '</div>';
  return html;
}

function filterStudents(){
  var q = (document.getElementById('studentSearch').value || '').trim().toLowerCase();
  var st = document.getElementById('studentStageFilter').value;
  var list = getData('students').filter(function(s){
    return (s.name + ' ' + s.code + ' ' + s.stage + ' ' + s.phone).toLowerCase().indexOf(q) !== -1 && (!st || s.stage === st);
  });
  document.getElementById('studentsArea').innerHTML = studentsHtml(list);
}

function openStudentModal(studentId){
  editStudentId = studentId || null;
  var s = editStudentId ? getData('students').find(function(x){ return x.id === editStudentId; }) : null;
  document.getElementById('studentTitle').textContent = s ? 'تعديل طالب' : 'إضافة طالب';
  document.getElementById('studentName').value = s ? s.name : '';
  document.getElementById('studentParent').value = s ? s.parentName : '';
  document.getElementById('studentStage').innerHTML = stageOptions(s ? s.stage : '');
  document.getElementById('studentPhone').value = s ? s.phone : '';
  document.getElementById('studentCode').value = s ? s.code : randomStudentCode();
  document.getElementById('studentStart').value = s ? s.startDate : today();
  document.getElementById('studentEnd').value = s ? s.endDate : addDays(today(), 30);
  document.getElementById('studentAmount').value = s ? s.amount : '';
  document.getElementById('studentStatus').value = s ? s.status : 'مفعل';
  document.getElementById('studentSubStatus').value = s ? s.subscriptionStatus : 'نشط';
  document.getElementById('studentNote').value = s ? s.note : '';
  document.getElementById('studentModal').classList.add('active');
}

document.getElementById('studentForm').onsubmit = function(e){
  e.preventDefault();
  var students = getData('students');
  var obj = {
    id: editStudentId || id(),
    name: document.getElementById('studentName').value.trim(),
    parentName: document.getElementById('studentParent').value.trim(),
    stage: document.getElementById('studentStage').value,
    phone: document.getElementById('studentPhone').value.trim(),
    code: document.getElementById('studentCode').value.trim(),
    startDate: document.getElementById('studentStart').value,
    endDate: document.getElementById('studentEnd').value,
    amount: document.getElementById('studentAmount').value,
    status: document.getElementById('studentStatus').value,
    subscriptionStatus: document.getElementById('studentSubStatus').value,
    note: document.getElementById('studentNote').value
  };

  if(!obj.name || !obj.code){
    alert('أكمل اسم الطالب والكود');
    return;
  }

  var dup = students.find(function(x){ return x.code === obj.code && x.id !== editStudentId; });
  if(dup){
    alert('كود الطالب مستخدم مسبقاً');
    return;
  }

  if(editStudentId){
    students = students.map(function(x){ return x.id === editStudentId ? obj : x; });
  }else{
    students.push(obj);
    var pays = getData('payments');
    pays.unshift({id:id(), studentId:obj.id, studentName:obj.name, amount:obj.amount, date:today(), type:'اشتراك جديد'});
    setData('payments', pays);
  }

  setData('students', students);
  document.getElementById('studentModal').classList.remove('active');
  showStudents('all');
};

function renewStudent(sid){
  var days = prompt('عدد أيام التجديد:', '30');
  if(!days) return;
  var students = getData('students');
  students = students.map(function(s){
    if(s.id === sid){
      var base = s.endDate && !isExpired(s.endDate) ? s.endDate : today();
      s.endDate = addDays(base, days);
      s.subscriptionStatus = 'نشط';
      s.status = 'مفعل';
    }
    return s;
  });
  var s = students.find(function(x){ return x.id === sid; });
  var pays = getData('payments');
  pays.unshift({id:id(), studentId:s.id, studentName:s.name, amount:s.amount || '', date:today(), type:'تجديد اشتراك'});
  setData('payments', pays);
  setData('students', students);
  openSection(current);
}

function toggleStudentStatus(sid){
  var students = getData('students').map(function(s){
    if(s.id === sid){
      if(s.status === 'مفعل'){
        s.status = 'موقوف';
        s.subscriptionStatus = 'موقوف';
      }else{
        s.status = 'مفعل';
        s.subscriptionStatus = 'نشط';
      }
    }
    return s;
  });
  setData('students', students);
  openSection(current);
}

function deleteStudent(sid){
  if(confirm('هل تريد حذف الطالب؟')){
    setData('students', getData('students').filter(function(s){ return s.id !== sid; }));
    setData('studentSubjects', getData('studentSubjects').filter(function(x){ return x.studentId !== sid; }));
    openSection(current);
  }
}

function showTeachers(){
  var teachers = getData('teachers');
  var html = panel('إدارة المدرسين', 'عرض مختصر للمدرسين.');
  html += '<button class="btn green" type="button" onclick="openTeacherModal()">➕ إضافة مدرس</button><div class="card-grid">';
  if(!teachers.length) html += '<div class="empty">لا توجد حسابات مدرسين بعد.</div>';
  for(var i=0;i<teachers.length;i++){
    var t = teachers[i];
    html += '<div class="data-card">';
    html += t.photo ? '<img class="teacher-photo" src="' + t.photo + '">' : '<div class="teacher-placeholder">👨‍🏫</div>';
    html += '<h3>' + t.name + '</h3><p><span class="chip">' + t.stage + '</span></p><p><span class="chip">' + t.subject + '</span></p>';
    html += '<p><span class="status ' + (t.status === 'مفعل' ? 'show' : 'hide') + '">' + t.status + '</span></p>';
    html += '<div class="actions"><a class="btn blue" href="teacher-details.html?id=' + t.id + '">معلومات</a><button class="btn" type="button" onclick="openTeacherModal(\'' + t.id + '\')">تعديل</button></div>';
    html += '</div>';
  }
  html += '</div></section>';
  document.getElementById('content').innerHTML = html;
}

function showSubjects(){
  var subjects = getData('subjects').sort(sortByOrder);
  var html = panel('إدارة المواد', 'عرض المواد كبطاقات.');
  html += '<div class="card-grid">';
  for(var i=0;i<subjects.length;i++){
    var sub = subjects[i];
    html += '<div class="data-card"><div class="icon-big">' + (sub.icon || '📘') + '</div><h3>' + sub.name + '</h3>';
    html += '<p><span class="chip">الكود: ' + sub.code + '</span></p><p class="muted">المرحلة: ' + sub.stage + '</p><p class="muted">المدرس: ' + (sub.teacher || 'غير محدد') + '</p></div>';
  }
  html += '</div></section>';
  document.getElementById('content').innerHTML = html;
}

function showStages(){
  var stages = getData('stages').sort(sortByOrder);
  var html = panel('إدارة المراحل', 'عرض المراحل كبطاقات.');
  html += '<div class="card-grid">';
  for(var i=0;i<stages.length;i++){
    var st = stages[i];
    var u = stageUsage(st.name);
    html += '<div class="data-card"><div class="icon-big">📚</div><h3>' + st.name + '</h3><p class="muted">مواد: ' + u.subjects + ' | طلاب: ' + u.students + ' | مدرسون: ' + u.teachers + '</p></div>';
  }
  html += '</div></section>';
  document.getElementById('content').innerHTML = html;
}

function openTeacherModal(teacherId){
  editTeacherId = teacherId || null;
  var t = editTeacherId ? getData('teachers').find(function(x){ return x.id === editTeacherId; }) : null;
  document.getElementById('teacherTitle').textContent = t ? 'تعديل مدرس' : 'إضافة مدرس';
  document.getElementById('teacherName').value = t ? t.name : '';
  document.getElementById('teacherStage').innerHTML = stageOptions(t ? t.stage : '');
  document.getElementById('teacherSubject').innerHTML = subjectOptions(t ? t.subject : '', document.getElementById('teacherStage').value);
  document.getElementById('teacherCode').value = t ? t.teacherCode : randomTeacherCode();
  document.getElementById('teacherSubjectCode').value = t ? t.subjectCode : getSubjectCodeByName(document.getElementById('teacherSubject').value);
  document.getElementById('teacherPhone').value = t ? t.phone : '';
  document.getElementById('teacherQualification').value = t ? t.qualification : '';
  document.getElementById('teacherBio').value = t ? t.bio : '';
  document.getElementById('teacherStatus').value = t ? t.status : 'مفعل';
  currentTeacherPhoto = t ? t.photo : '';
  document.getElementById('teacherPreview').style.display = currentTeacherPhoto ? 'block' : 'none';
  document.getElementById('teacherPreview').src = currentTeacherPhoto || '';
  document.getElementById('teacherModal').classList.add('active');
}

document.getElementById('teacherStage').onchange = function(){
  document.getElementById('teacherSubject').innerHTML = subjectOptions('', this.value);
  document.getElementById('teacherSubjectCode').value = getSubjectCodeByName(document.getElementById('teacherSubject').value);
};

document.getElementById('teacherSubject').onchange = function(){
  document.getElementById('teacherSubjectCode').value = getSubjectCodeByName(this.value);
};

document.getElementById('teacherPhoto').onchange = function(){
  var file = this.files[0];
  if(!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    currentTeacherPhoto = e.target.result;
    document.getElementById('teacherPreview').src = currentTeacherPhoto;
    document.getElementById('teacherPreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
};

document.getElementById('teacherForm').onsubmit = function(e){
  e.preventDefault();
  var teachers = getData('teachers');
  var obj = {
    id: editTeacherId || id(),
    name: document.getElementById('teacherName').value.trim(),
    stage: document.getElementById('teacherStage').value,
    subject: document.getElementById('teacherSubject').value,
    teacherCode: document.getElementById('teacherCode').value.trim(),
    subjectCode: document.getElementById('teacherSubjectCode').value.trim(),
    phone: document.getElementById('teacherPhone').value.trim(),
    qualification: document.getElementById('teacherQualification').value.trim(),
    bio: document.getElementById('teacherBio').value.trim(),
    status: document.getElementById('teacherStatus').value,
    photo: currentTeacherPhoto
  };
  if(editTeacherId) teachers = teachers.map(function(x){ return x.id === editTeacherId ? obj : x; });
  else teachers.push(obj);
  setData('teachers', teachers);
  setData('subjects', getData('subjects').map(function(s){ return s.name === obj.subject ? Object.assign({}, s, {teacher: obj.name}) : s; }));
  document.getElementById('teacherModal').classList.remove('active');
  showTeachers();
};

drawSide();
openSection('home');
