seedBase();
ensureArrays();

var parentUser = JSON.parse(sessionStorage.getItem('afaq_current_parent') || 'null');
if(!parentUser){
  alert('يجب تسجيل دخول ولي الأمر أولاً');
  location.href = '../index.html';
}

var student = getData('students').find(function(s){
  return s.code === parentUser.studentCode || s.code === parentUser.code || s.name === parentUser.studentName;
});

if(!student){
  alert('لم يتم العثور على الطالب المرتبط بولي الأمر');
  location.href = '../index.html';
}

var current = 'home';

var nav = [
  ['الرئيسية','home'],
  ['معلومات الطالب','studentInfo'],
  ['مستوى الطالب','level'],
  ['المواد المسجل بها','subjects'],
  ['النتائج','results'],
  ['النتائج النهائية','finalGrades'],
  ['الحضور والغياب','attendance'],
  ['التنبيهات','alerts'],
  ['الإشعارات','notifications'],
  ['التواصل','messages']
];

function qs(x){ return document.getElementById(x); }
function panel(title, desc){ return '<section class="panel"><h2>'+title+'</h2><p class="muted">'+(desc || '')+'</p>'; }

function acceptedSubjectLinks(){
  return getData('studentSubjects').filter(function(x){ return x.studentId === student.id && x.status === 'accepted'; });
}

function acceptedSubjects(){
  var codes = acceptedSubjectLinks().map(function(x){return x.subjectCode;});
  return getData('subjects').filter(function(s){ return s.stage === student.stage && codes.indexOf(s.code) !== -1; });
}

function parentNotifications(){ return getVisibleNotificationsForStudent(student); }
function unreadParentNotifications(){ return unreadNotificationsForStudent(student); }

function drawSide(){
  var unread = unreadParentNotifications();
  parentSide.innerHTML = '<h2>'+parentUser.name+'</h2>';
  nav.forEach(function(n){
    var b = document.createElement('button');
    b.className = 'nav' + (current === n[1] ? ' active' : '');
    var badge = n[1] === 'notifications' && unread ? '<span class="badge-count">'+unread+'</span>' : '';
    b.innerHTML = '<span>'+n[0]+badge+'</span><span>›</span>';
    b.onclick = function(){ openSection(n[1]); };
    parentSide.appendChild(b);
  });
}

function openSection(section){
  current = section;
  drawSide();
  var routes = {
    home: showHome,
    studentInfo: showStudentInfo,
    level: showLevel,
    subjects: showSubjects,
    results: showResults,
    finalGrades: showFinalGrades,
    attendance: showAttendance,
    alerts: showAlerts,
    notifications: showNotifications,
    messages: showMessages
  };
  (routes[section] || showHome)();
}

function showHome(){
  var pts = calcStudentPoints(student);
  var unread = unreadParentNotifications();
  var alerts = buildAlerts();
  parentContent.innerHTML = panel('الرئيسية','ملخص سريع لمتابعة الطالب.') +
  '<div class="stats"><div class="stat"><h3>النقاط</h3><strong>'+pts+'</strong></div><div class="stat"><h3>المستوى</h3><strong>'+levelFromPoints(pts)+'</strong></div><div class="stat"><h3>المواد</h3><strong>'+acceptedSubjects().length+'</strong></div><div class="stat"><h3>تنبيهات</h3><strong>'+alerts.length+'</strong></div></div>' +
  '<div class="'+(unread?'parent-alert':'parent-good')+'">'+(unread?'لديك إشعارات جديدة: '+unread:'لا توجد إشعارات جديدة')+'</div></section>';
}

function showStudentInfo(){
  var exp = student.endDate && new Date(student.endDate).getTime() < Date.now();
  parentContent.innerHTML = panel('معلومات الطالب','بيانات الطالب والاشتراك.') +
  '<div class="details-grid">' +
  '<div class="detail-box"><b>اسم الطالب</b>'+student.name+'</div>' +
  '<div class="detail-box"><b>المرحلة</b>'+student.stage+'</div>' +
  '<div class="detail-box"><b>كود الطالب</b>'+student.code+'</div>' +
  '<div class="detail-box"><b>الهاتف</b>'+(student.phone || '—')+'</div>' +
  '<div class="detail-box"><b>حالة الحساب</b>'+(student.status || '—')+'</div>' +
  '<div class="detail-box"><b>حالة الاشتراك</b>'+(exp?'منتهي':(student.subscriptionStatus || '—'))+'</div>' +
  '<div class="detail-box"><b>بداية الاشتراك</b>'+(student.startDate || '—')+'</div>' +
  '<div class="detail-box"><b>نهاية الاشتراك</b>'+(student.endDate || '—')+'</div>' +
  '</div></section>';
}

function showLevel(){
  var points = calcStudentPoints(student);
  var board = buildHonorBoard(student.stage);
  var rank = board.findIndex(function(x){return x.studentId === student.id;}) + 1;
  var attempts = getData('examAttempts').filter(function(a){return a.studentId === student.id;}).length;
  var assignments = getData('assignmentSubmissions').filter(function(a){return a.studentId === student.id;}).length;
  var attendance = getData('attendanceRecords').filter(function(a){return a.studentId === student.id && a.status === 'حاضر';}).length;
  parentContent.innerHTML = panel('مستوى الطالب','النقاط والمستوى والترتيب.') +
  '<div class="level-card"><h3 class="level-title">'+levelFromPoints(points)+'</h3><div class="points-big">'+points+' نقطة</div><p><span class="chip">الترتيب: '+(rank || '—')+'</span><span class="chip">اختبارات: '+attempts+'</span><span class="chip">واجبات: '+assignments+'</span><span class="chip">حضور: '+attendance+'</span></p></div></section>';
}

function showSubjects(){
  var data = acceptedSubjects();
  var html = panel('المواد المسجل بها','المواد التي وافق عليها المدرسون فقط.') + '<div class="card-grid">';
  if(!data.length) html += '<div class="empty">لا توجد مواد مقبول بها بعد.</div>';
  data.forEach(function(s){
    var lessons = getData('lessons').filter(function(x){return x.subjectCode===s.code;}).slice(0,1)[0];
    var assignments = getData('assignments').filter(function(x){return x.subjectCode===s.code;}).slice(0,1)[0];
    var exams = getData('exams').filter(function(x){return x.subjectCode===s.code;}).slice(0,1)[0];
    html += '<div class="parent-subject"><div class="icon-big">'+(s.icon || '📘')+'</div><h3>'+s.name+'</h3><p class="muted">المدرس: '+(s.teacher || 'غير محدد')+'</p><p><span class="chip">آخر درس: '+(lessons?lessons.title:'—')+'</span></p><p><span class="chip">آخر واجب: '+(assignments?assignments.title:'—')+'</span></p><p><span class="chip">آخر اختبار: '+(exams?exams.title:'—')+'</span></p><button class="btn blue" onclick="messageTeacher(&quot;'+s.name+'&quot;,&quot;'+(s.teacher || 'المدرس')+'&quot;)">مراسلة المدرس</button></div>';
  });
  parentContent.innerHTML = html + '</div></section>';
}

function showResults(){
  var results = getData('results').filter(function(r){return r.studentName === student.name;});
  var assignments = getData('assignmentSubmissions').filter(function(a){return a.studentId === student.id;});
  var html = panel('النتائج','نتائج الاختبارات والواجبات.') + '<h3>الاختبارات</h3><div class="card-grid">';
  if(!results.length) html += '<div class="empty">لا توجد نتائج اختبارات بعد.</div>';
  results.forEach(function(r){
    html += '<div class="data-card"><div class="icon-big">📊</div><h3>'+r.title+'</h3><p><span class="chip">'+r.subject+'</span></p><p class="final-grade">'+r.score+' / '+r.finalScore+'</p><p class="muted">'+(r.note || '')+'</p></div>';
  });
  html += '</div><h3>الواجبات</h3><div class="card-grid">';
  if(!assignments.length) html += '<div class="empty">لا توجد واجبات مصححة بعد.</div>';
  assignments.forEach(function(a){
    html += '<div class="data-card"><div class="icon-big">📝</div><h3>'+a.assignmentTitle+'</h3><p><span class="chip">'+a.subject+'</span></p><p class="muted">الحالة: '+(a.status || '—')+'</p><p class="final-grade">'+(a.grade || 'بانتظار التصحيح')+'</p></div>';
  });
  parentContent.innerHTML = html + '</div></section>';
}

function showFinalGrades(){
  var finals = getData('finalGrades').filter(function(g){return g.studentName === student.name;});
  var html = panel('النتائج النهائية','النتيجة النهائية لكل مادة.') + '<div class="card-grid">';
  if(!finals.length) html += '<div class="empty">لا توجد نتائج نهائية بعد.</div>';
  finals.forEach(function(g){
    html += '<div class="data-card"><div class="icon-big">🎯</div><h3>'+g.subject+'</h3><p class="final-grade">'+g.grade+' / '+g.finalScore+'</p><p class="muted">'+(g.note || '')+'</p></div>';
  });
  parentContent.innerHTML = html + '</div></section>';
}

function showAttendance(){
  var acceptedCodes = acceptedSubjects().map(function(s){return s.code;});
  var sessions = getData('attendance').filter(function(a){return acceptedCodes.indexOf(a.subjectCode)!==-1;});
  var records = getData('attendanceRecords').filter(function(r){return r.studentId === student.id;});
  var present = records.filter(function(r){return r.status === 'حاضر';}).length;
  var absent = Math.max(0, sessions.length - present);
  var html = panel('الحضور والغياب','متابعة التزام الطالب بالحضور.') +
  '<div class="stats"><div class="stat"><h3>الحضور</h3><strong>'+present+'</strong></div><div class="stat"><h3>الغياب</h3><strong>'+absent+'</strong></div><div class="stat"><h3>الجلسات</h3><strong>'+sessions.length+'</strong></div></div><div class="card-grid">';
  if(!sessions.length) html += '<div class="empty">لا توجد جلسات حضور بعد.</div>';
  sessions.forEach(function(s){
    var rec = records.find(function(r){return r.sessionId === s.id;});
    html += '<div class="data-card"><div class="icon-big">✅</div><h3>'+s.title+'</h3><p><span class="chip">'+s.subject+'</span></p><p class="muted">الحالة: '+(rec?rec.status:'غائب أو لم يسجل')+'</p></div>';
  });
  parentContent.innerHTML = html + '</div></section>';
}

function buildAlerts(){
  var alerts = [];
  if(student.endDate){
    var days = Math.ceil((new Date(student.endDate).getTime() - Date.now()) / (1000*60*60*24));
    if(days <= 7) alerts.push('اشتراك الطالب ينتهي قريباً');
    if(days < 0) alerts.push('اشتراك الطالب منتهي');
  }
  getData('assignments').forEach(function(a){
    var accepted = isStudentAcceptedInSubject(student, a.subjectCode);
    var submitted = getData('assignmentSubmissions').find(function(s){return s.assignmentId === a.id && s.studentId === student.id;});
    if(accepted && !submitted) alerts.push('واجب غير محلول: '+a.title);
  });
  getData('attendance').forEach(function(a){
    var accepted = isStudentAcceptedInSubject(student, a.subjectCode);
    var rec = getData('attendanceRecords').find(function(r){return r.sessionId === a.id && r.studentId === student.id;});
    var closed = a.deadline && new Date(a.deadline).getTime() < Date.now();
    if(accepted && closed && !rec) alerts.push('غياب عن حضور: '+a.title);
  });
  return alerts;
}

function showAlerts(){
  var alerts = buildAlerts();
  var html = panel('التنبيهات','تنبيهات مهمة تخص الطالب.') + '<div class="mini-list">';
  if(!alerts.length) html += '<div class="parent-good">لا توجد تنبيهات حالياً.</div>';
  alerts.forEach(function(a){ html += '<div class="parent-alert">⚠️ '+a+'</div>'; });
  parentContent.innerHTML = html + '</div></section>';
}

function showNotifications(){
  var data = parentNotifications();
  var html = panel('الإشعارات','تختفي الشارة بعد فتح هذا القسم.') + '<div class="card-grid">';
  if(!data.length) html += '<div class="empty">لا توجد إشعارات.</div>';
  data.forEach(function(n){
    var unread = !(n.readBy && n.readBy.indexOf(student.id)!==-1);
    html += '<div class="data-card '+(unread?'unread-card':'')+'"><div class="icon-big">🔔</div><h3>'+(unread?'<span class="small-dot"></span>':'')+n.title+'</h3><p><span class="chip">'+(n.subject || n.target || 'عام')+'</span></p><p class="muted">'+(n.body || '')+'</p></div>';
  });
  markStudentNotificationsRead(student);
  parentContent.innerHTML = html + '</div></section>';
  drawSide();
}

function showMessages(){
  var all = getData('messages').filter(function(m){ return m.from === parentUser.name || m.to === parentUser.name || m.studentName === student.name || m.to === 'الإدارة'; });
  var html = panel('التواصل','مراسلة المدرسين والإدارة الخاصة بالطالب.') + '<div class="actions"><button class="btn green" onclick="messageAdmin()">رسالة إلى الإدارة</button></div><div class="card-grid">';
  if(!all.length) html += '<div class="empty">لا توجد رسائل بعد.</div>';
  all.forEach(function(m){
    html += '<div class="message-box"><h3>'+m.title+'</h3><p class="muted">من: '+m.from+' / إلى: '+m.to+'</p><p>'+m.body+'</p><p><span class="chip">'+(m.box || 'المرسل')+'</span></p></div>';
  });
  parentContent.innerHTML = html + '</div></section>';
}

function messageTeacher(subject, teacherName){
  modalTitle.textContent = 'رسالة إلى مدرس '+subject;
  formFields.innerHTML = '<div class="field"><label>إلى</label><input id="msgTo" value="'+teacherName+'"></div><div class="field"><label>العنوان</label><input id="msgTitle" value="استفسار بخصوص '+subject+'"></div><div class="field full"><label>الرسالة</label><textarea id="msgBody"></textarea></div>';
  parentModal.classList.add('active');
}

function messageAdmin(){
  modalTitle.textContent = 'رسالة إلى الإدارة';
  formFields.innerHTML = '<div class="field"><label>إلى</label><input id="msgTo" value="الإدارة"></div><div class="field"><label>العنوان</label><input id="msgTitle" value="استفسار من ولي الأمر"></div><div class="field full"><label>الرسالة</label><textarea id="msgBody"></textarea></div>';
  parentModal.classList.add('active');
}

parentForm.onsubmit = function(e){
  e.preventDefault();
  var arr = getData('messages');
  arr.unshift({id:id(),from:parentUser.name,to:qs('msgTo').value,title:qs('msgTitle').value,body:qs('msgBody').value,box:'المرسل',studentId:student.id,studentName:student.name,createdAt:new Date().toLocaleString('ar-IQ')});
  setData('messages', arr);
  parentModal.classList.remove('active');
  showMessages();
};

window.addEventListener('storage', function(e){
  if(e.key && e.key.indexOf(P) === 0){
    try{ drawSide(); openSection(current); }catch(err){}
  }
});

parentInfo.textContent = parentUser.name + ' / الطالب: ' + student.name;
drawSide();
openSection('home');
